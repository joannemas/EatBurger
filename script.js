import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { loadBurger, explodeBurger, updateExplosionParticles, vibrationEffect, startVibration, startColorChange, updateBackgroundColor } from './burger.js';
import { burger } from './burger.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xF5F5DC);

// Caméra
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 4);
light.position.set(2, 5, 5);
scene.add(light, new THREE.AmbientLight(0x404040));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Charger le burger
loadBurger(scene);

let hasExploded = false;
document.addEventListener('keydown', (event) => {
    if (event.key === 'e' && !hasExploded) {
        //explodeBurger(scene);
        startVibration();
        startColorChange();
        hasExploded = true;
        document.getElementsByClassName('eat-button')[0].style.display = 'none';
    }
});

// Animation
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    const deltaTime = 0.06;

    if (burger) {
        burger.rotation.z += 0.01;
        const deltaTime = 1 / 60;
        vibrationEffect(burger, deltaTime, scene);
        updateBackgroundColor(scene, deltaTime);
    }

    updateExplosionParticles(deltaTime);
    renderer.render(scene, camera);
}
animate();

// Adapter la scène à la fenêtre
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
