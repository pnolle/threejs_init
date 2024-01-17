import "./style.css";
import * as THREE from "three";
import { FlyControls } from "three/examples/jsm/controls/FlyControls";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

// create basic scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 200);
camera.up = new THREE.Vector3(0, 1, 0);
camera.position.set(-0.7, 2.3, 0.2);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#bg"),
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// create bloom postprocessing
const params = {
  threshold: 0.951,
  strength: 0.381,
  radius: 0.3,
  exposure: 1,
};

const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = params.threshold;
bloomPass.strength = params.strength;
bloomPass.radius = params.radius;

const outputPass = new OutputPass();

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);
composer.addPass(outputPass);

// create bloom postprocessing gui
const gui = new GUI();
const bloomFolder = gui.addFolder("bloom");
bloomFolder.add(params, "threshold", 0.0, 1.0).onChange(function (value) {
  bloomPass.threshold = Number(value);
});
bloomFolder.add(params, "strength", 0.0, 3.0).onChange(function (value) {
  bloomPass.strength = Number(value);
});
gui
  .add(params, "radius", 0.0, 1.0)
  .step(0.01)
  .onChange(function (value) {
    bloomPass.radius = Number(value);
  });
const toneMappingFolder = gui.addFolder("tone mapping");
toneMappingFolder.add(params, "exposure", 0.1, 2).onChange(function (value) {
  renderer.toneMappingExposure = Math.pow(value, 4.0);
});

// create window resize listener
window.addEventListener("resize", onWindowResize);

// create point light
const pointLight = new THREE.PointLight(0xffffff);

// make pointLight brighter
pointLight.intensity = 2000;
pointLight.position.set(20, 20, 20);

// create ambient light
const ambientLight = new THREE.AmbientLight(0xffffff);
ambientLight.intensity = 0.1;
scene.add(pointLight, ambientLight);

// add stars
const addStar = () => {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(100));

  star.position.set(x, y, z);
  scene.add(star);
};

Array(200).fill().forEach(addStar);

// add background context
// const spaceTexture = new THREE.TextureLoader().load('astronomy.jpg');
// scene.background = spaceTexture;

// add moon
const moonTexture = new THREE.TextureLoader().load("moon.jpg");
const moonNormalTexture = new THREE.TextureLoader().load("moon_normal.jpg");

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(3, 32, 32),
  new THREE.MeshStandardMaterial({
    map: moonTexture,
    normalMap: moonNormalTexture,
  })
);
moon.position.y = 5;
moon.position.x = -10;
scene.add(moon);

// add 3d models
let modelHochhaus;
const gltfHochhaus = new GLTFLoader();
gltfHochhaus.load(
  // './models/SheMovedHere/BickendorferHochhaus_blocksOnly.glb',
  "./models/SheMovedHere/BickendorferHochhaus_noSnip.glb",
  (gltf) => {
    modelHochhaus = gltf.scene;
    modelHochhaus.scale.set(0.2, 0.2, 0.2);
    scene.add(modelHochhaus);
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  (error) => {
    console.log("An error happened");
    console.log(error);
  }
);

let modelReady = false;
let modelSnipSign;
let animationMixerSnipSign;
let snipSignNeonLight;
const gltfSnipSign = new GLTFLoader();
gltfSnipSign.load(
  "./models/SheMovedHere/SnipSign_neon.gltf",
  (gltf) => {
    modelSnipSign = gltf.scene;
    modelSnipSign.scale.set(0.2, 0.2, 0.2);

    animationMixerSnipSign = new THREE.AnimationMixer(gltf.scene);
    const animationAction = animationMixerSnipSign.clipAction(gltf.animations[0]);
    animationAction.play();

    const snipSignNeonSignParts = modelSnipSign.children.filter((c) => c.name == 'SnipSign_Neon');
    const snipSignNeonSign = snipSignNeonSignParts.length > 0 ? snipSignNeonSignParts[0] : null;
    const snipSignNeonLights = snipSignNeonSign.children.filter((c) => c.name == 'Curve027');
    snipSignNeonLight = snipSignNeonLights.length > 0 ? snipSignNeonLights[0] : null;
    console.warn(snipSignNeonLight, snipSignNeonLight.isMesh);
    if (snipSignNeonLight.isMesh) {
      snipSignNeonLight.material = new THREE.MeshStandardMaterial({
        color: 0xfa00ff,
        emissive: 0xfa00ff,
        emissiveIntensity: 2.5,
        emissiveMap: snipSignNeonLight.material.emissiveMap,
        map: snipSignNeonLight.material.map,
        transparent: false,
        opacity: 1,
      });
    }

    scene.add(modelSnipSign);
    modelReady = true;

    // camera.lookAt(modelSnipSign.position);
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  (error) => {
    console.log("An error happened");
    console.log(error);
  }
);

// create helpers
const pointLightHelper = new THREE.PointLightHelper(pointLight);
const gridHelper = new THREE.GridHelper(200, 50);
scene.add(pointLightHelper, gridHelper);

// create controls and vars
let pointLightYMovementUp = true;
let cameraYMovementUp = true;

let autoAnimateCam = false;
const autoAnimateCamBtn = document.querySelector("#autoAnimateCamBtn");
autoAnimateCamBtn.addEventListener("click", () => {
  autoAnimateCam = !autoAnimateCam;
});

let flyControls = false;
let controls;
if (flyControls) {
  // Fly controls tutorial: https://medium.com/geekculture/how-to-control-three-js-camera-like-a-pro-a8575a717a2
  controls = new FlyControls(camera, renderer.domElement);
  controls.movementSpeed = 100;
  controls.rollSpeed = Math.PI / 24;
  controls.autoForward = false;
  controls.dragToLook = true;
} else {
  controls = new OrbitControls(camera, renderer.domElement);
  // controls.target.set(0.347046656502451,1.0215543959331892,-0.5282734533055251);
  controls.target.set(0.05, 0.5, -0.5);
  // controls.target.set(0,0,0);
  controls.update();
}

const clock = new THREE.Clock();

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

let previousTarget = JSON.stringify(controls.target);
let quaternion = camera.quaternion;
let previousQuaternion = JSON.stringify(camera.getWorldQuaternion(quaternion));

let snipSignNeonLightFlicker = Math.random() * 3;
let flickerDuration = 0;
let flickerStateOn = true;

const snipSignNeonLightFlickerUpdate = (delta) => {
  flickerDuration += delta;
  // console.log('snipSignNeonLightFlickerUpdate', flickerStateOn, flickerDuration, snipSignNeonLightFlicker);
  if (flickerDuration > snipSignNeonLightFlicker) {
    if (flickerStateOn) {
      snipSignNeonLight.material.emissiveIntensity = 0;
      snipSignNeonLightFlicker = Math.random();
      flickerDuration = 0;
    }
    else {
      snipSignNeonLight.material.emissiveIntensity = 2.5;
      snipSignNeonLightFlicker = Math.random() * 3;
      flickerDuration = 0;
    }
    flickerStateOn = !flickerStateOn;
  }
}

function animate() {
  requestAnimationFrame(animate);

  if (modelReady) {
    const delta = clock.getDelta()
    animationMixerSnipSign.update(delta / 2);
    snipSignNeonLightFlickerUpdate(delta);
  }

  pointLight.position.y += pointLightYMovementUp ? 0.5 : -0.5;
  if (pointLight.position.y > 100) {
    pointLightYMovementUp = false;
  } else if (pointLight.position.y < -100) {
    pointLightYMovementUp = true;
  }

  if (autoAnimateCam) {
    camera.position.y += cameraYMovementUp ? 0.2 : -0.2;
    camera.lookAt(0, 0, 0);
    if (camera.position.y > 100) {
      cameraYMovementUp = false;
    } else if (camera.position.y < -100) {
      cameraYMovementUp = true;
    }
  } else {
    controls.update();
  }

  let quaternion = camera.quaternion;

  const thisQuaternion = JSON.stringify(camera.getWorldQuaternion(quaternion));
  if (previousQuaternion !== thisQuaternion) {
    previousQuaternion = thisQuaternion;
    console.log(thisQuaternion);
  }

  const thisTarget = JSON.stringify(controls.target);
  if (previousTarget !== thisTarget) {
    previousTarget = thisTarget;
    console.log(thisTarget);
  }

  // renderer.render(scene, camera);
  composer.render();
}

animate();
