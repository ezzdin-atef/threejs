import * as CANNON from "cannon-es";
import * as THREE from "three";

/**
 * Base
 */
const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();
scene.background = new THREE.Color("#87ceeb");

/**
 * Sounds
 */
const hitSound = new Audio("/sounds/hit.mp3");

const playHitSound = (collision) => {
  const impactStrength = collision.contact.getImpactVelocityAlongNormal();

  if (impactStrength > 1.5) {
    hitSound.volume = Math.min(impactStrength / 10, 1);
    hitSound.currentTime = 0;
    hitSound.play();
  }
};

/**
 * Physics
 */
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Default material
const defaultMaterial = new CANNON.Material("default");
world.defaultContactMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  { friction: 0.3, restitution: 0.3 },
);

// Floor
const floorBody = new CANNON.Body();
floorBody.mass = 0;
floorBody.addShape(new CANNON.Plane());
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);
world.addBody(floorBody);

/**
 * Floor
 */
const arenaSize = 50;

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(arenaSize, arenaSize),
  new THREE.MeshStandardMaterial({ color: "#6b8e5a" }),
);
floor.receiveShadow = true;
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

/**
 * Walls (so the car and the boxes can't fall off the floor)
 */
const wallMaterial = new THREE.MeshStandardMaterial({ color: "#444444" });

const createWall = (width, depth, x, z) => {
  // Three.js mesh
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, 2, depth),
    wallMaterial,
  );
  mesh.position.set(x, 1, z);
  scene.add(mesh);

  // Cannon.js body (mass 0 = never moves)
  const body = new CANNON.Body({ mass: 0, material: defaultMaterial });
  body.addShape(new CANNON.Box(new CANNON.Vec3(width * 0.5, 1, depth * 0.5)));
  body.position.set(x, 1, z);
  world.addBody(body);
};

const half = arenaSize * 0.5;
createWall(arenaSize, 1, 0, -half);
createWall(arenaSize, 1, 0, half);
createWall(1, arenaSize, -half, 0);
createWall(1, arenaSize, half, 0);

/**
 * Boxes (random position, random size, the car can hit them)
 */
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxes = [];

const createBox = (size, position) => {
  // Three.js mesh
  const mesh = new THREE.Mesh(
    boxGeometry,
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.7, 0.55),
    }),
  );
  mesh.scale.set(size, size, size);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  // Cannon.js body
  const body = new CANNON.Body({
    mass: size, // bigger box = heavier
    shape: new CANNON.Box(new CANNON.Vec3(size * 0.5, size * 0.5, size * 0.5)),
    material: defaultMaterial,
  });
  body.position.set(position.x, position.y, position.z);
  body.addEventListener("collide", playHitSound);
  world.addBody(body);

  boxes.push({ mesh, body });
};

// Put n boxes in random places
const n = 500;
for (let i = 0; i < n; i++) {
  createBox(0.6 + Math.random() * 0.8, {
    x: (Math.random() - 0.5) * (arenaSize - 4),
    y: 1,
    z: (Math.random() - 0.5) * (arenaSize - 4),
  });
}

/**
 * Car
 */
// Three.js: a group holding the body, the cabin and the nose
const car = new THREE.Group();

const carBody = new THREE.Mesh(
  new THREE.BoxGeometry(1, 0.5, 2),
  new THREE.MeshStandardMaterial({ color: "#e63946" }),
);
carBody.castShadow = true;
car.add(carBody);

const carCabin = new THREE.Mesh(
  new THREE.BoxGeometry(0.8, 0.4, 0.9),
  new THREE.MeshStandardMaterial({ color: "#f1faee" }),
);
carCabin.position.set(0, 0.45, -0.1);
carCabin.castShadow = true;
car.add(carCabin);

// Yellow nose so we can see where the car is facing (the front is +z)
const carNose = new THREE.Mesh(
  new THREE.BoxGeometry(0.8, 0.2, 0.2),
  new THREE.MeshStandardMaterial({ color: "#ffd166" }),
);
carNose.position.set(0, 0, 1);
car.add(carNose);

scene.add(car);

// Cannon.js
const carPhysics = new CANNON.Body({
  mass: 5,
  shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.25, 1)),
  material: defaultMaterial,
  position: new CANNON.Vec3(0, 0.5, 0),
});
carPhysics.fixedRotation = true; // the car never tips over
carPhysics.updateMassProperties();
carPhysics.addEventListener("collide", playHitSound);
world.addBody(carPhysics);

// Car state
let carAngle = 0; // which way the car is facing
let carSpeed = 0; // how fast it goes forward (negative = reverse)

/**
 * Keyboard (arrow keys)
 */
const keys = { up: false, down: false, left: false, right: false };

const setKey = (event, isPressed) => {
  if (event.key === "ArrowUp") keys.up = isPressed;
  if (event.key === "ArrowDown") keys.down = isPressed;
  if (event.key === "ArrowLeft") keys.left = isPressed;
  if (event.key === "ArrowRight") keys.right = isPressed;
};

window.addEventListener("keydown", (event) => setKey(event, true));
window.addEventListener("keyup", (event) => setKey(event, false));

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 40;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.bottom = -20;
directionalLight.position.set(10, 15, 10);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  60,
  sizes.width / sizes.height,
  0.1,
  100,
);
scene.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
let oldElapsedTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;

  // Speed up / slow down with up and down arrows
  if (keys.up) carSpeed += 120 * deltaTime;
  else if (keys.down) carSpeed -= 120 * deltaTime;
  else carSpeed *= 0.97; // no key: slowly stop

  carSpeed = Math.max(-5, Math.min(30, carSpeed)); // speed limits

  // Turn with left and right arrows
  if (keys.left) carAngle += 2 * deltaTime;
  if (keys.right) carAngle -= 2 * deltaTime;

  // Move the car in the direction it is facing
  carPhysics.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), carAngle);
  carPhysics.velocity.x = Math.sin(carAngle) * carSpeed;
  carPhysics.velocity.z = Math.cos(carAngle) * carSpeed;

  // Update physics
  world.step(1 / 60, deltaTime, 3);

  // Copy the physics position to the meshes
  car.position.copy(carPhysics.position);
  car.quaternion.copy(carPhysics.quaternion);

  for (const box of boxes) {
    box.mesh.position.copy(box.body.position);
    box.mesh.quaternion.copy(box.body.quaternion);
  }

  // Camera follows the car from behind
  camera.position.x = car.position.x - Math.sin(carAngle) * 6;
  camera.position.y = 4;
  camera.position.z = car.position.z - Math.cos(carAngle) * 6;
  camera.lookAt(car.position);

  // Render
  renderer.render(scene, camera);

  window.requestAnimationFrame(tick);
};

tick();
