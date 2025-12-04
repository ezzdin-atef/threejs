import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Timer } from "three/addons/misc/Timer.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import GUI from "lil-gui";

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const matcapTexture = textureLoader.load("/textures/matcaps/1.png");
matcapTexture.colorSpace = THREE.SRGBColorSpace;

/**
 * Fonts
 */
const fontLoader = new FontLoader();

fontLoader.load("/fonts/droid_sans_regular.typeface.json", (font) => {
  const textParams = {
    text: "Hello World",
    size: 0.5,
    depth: 0.2,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 5,
  };

  const textMaterial = new THREE.MeshMatcapMaterial({
    matcap: matcapTexture,
  });

  let textGeometry = new TextGeometry(textParams.text, {
    font: font,
    ...textParams,
  });
  textGeometry.center();
  const text = new THREE.Mesh(textGeometry, textMaterial);
  scene.add(text);

  // Function to regenerate geometry when parameters change
  const regenerateGeometry = () => {
    textGeometry.dispose();
    textGeometry = new TextGeometry(textParams.text, {
      font: font,
      ...textParams,
    });
    textGeometry.center();
    text.geometry = textGeometry;
  };

  // GUI controls
  gui
    .add(textParams, "depth")
    .min(0)
    .max(0.5)
    .step(0.001)
    .onChange(regenerateGeometry);

  gui
    .add(textParams, "bevelEnabled")
    .name("Bevel Enabled")
    .onChange(regenerateGeometry);
  gui
    .add(textParams, "bevelThickness")
    .min(0)
    .max(0.5)
    .step(0.001)
    .onChange(regenerateGeometry);
  gui
    .add(textParams, "bevelSize")
    .min(0)
    .max(0.5)
    .step(0.001)
    .onChange(regenerateGeometry);
  gui
    .add(textParams, "bevelOffset")
    .min(0)
    .max(0.5)
    .step(0.001)
    .onChange(regenerateGeometry);
  gui
    .add(textParams, "bevelSegments")
    .min(0)
    .max(10)
    .step(1)
    .onChange(regenerateGeometry);
  gui
    .add(textParams, "curveSegments")
    .min(0)
    .max(20)
    .step(1)
    .onChange(regenerateGeometry);
  gui
    .add(textParams, "size")
    .min(0.1)
    .max(2)
    .step(0.01)
    .onChange(regenerateGeometry);

  gui.add(textParams, "text").name("Text").onChange(regenerateGeometry);
});

const donutGeometry = new THREE.TorusGeometry(0.3, 0.2, 20, 45);
const donutMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTexture });

for (let i = 0; i < 100; i++) {
  const donut = new THREE.Mesh(donutGeometry, donutMaterial);
  donut.position.x = (Math.random() - 0.5) * 20;
  donut.position.y = (Math.random() - 0.5) * 20;
  donut.position.z = (Math.random() - 0.5) * 20;
  donut.rotation.x = Math.random() * Math.PI;
  donut.rotation.y = Math.random() * Math.PI;
  const scale = Math.random();
  donut.scale.set(scale, scale, scale);
  scene.add(donut);
}

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 5;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const timer = new Timer();

const tick = () => {
  // Timer
  timer.update();
  const elapsedTime = timer.getElapsed();

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
