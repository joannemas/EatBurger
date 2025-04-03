import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { loadBurger, explodeBurger, updateExplosionParticles, vibrationEffect, startVibration, startColorChange, updateBackgroundColor } from './burger.js';
import { burger } from './burger.js';
import { updateHover } from './selection.js';
import { isSelected } from './selection.js';

export const scene = new THREE.Scene();
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
controls.update();

// Charger le burger
loadBurger(scene);

let hasExploded = false;
document.addEventListener('keydown', (event) => {
    if (event.key === 'e' && !hasExploded) {
        if (isSelected) {
            console.log("L'explosion est bloquée par la sélection");
            return;
        }
        
        startVibration();
        startColorChange();
        hasExploded = true;

        const eatButton = document.getElementsByClassName('eat-button')[0];
        if (eatButton) {
            eatButton.style.display = 'none';
        }
    }
});


// Animation
let lastTime = 0;
function animate(time) {
    requestAnimationFrame(animate);

    const deltaTime = time - lastTime;
    lastTime = time;
    
    if (deltaTime < 1000 / 60) return;

    controls.update();
    updateBackgroundColor(scene, deltaTime / 1000);
    if (burger) {
        burger.rotation.y += 0.01;
        vibrationEffect(burger, deltaTime / 1000, scene);
    }

    if (hasExploded) {
        updateExplosionParticles(scene, deltaTime / 100);
    }

    renderer.render(scene, camera);
    updateHover(scene, camera);
}
animate();

// Adapter la scène à la fenêtre
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
