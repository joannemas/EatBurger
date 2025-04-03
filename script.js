import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { loadBurger, explodeBurger, updateExplosionParticles, vibrationEffect, startVibration, startColorChange, updateBackgroundColor } from './burger.js';
import { burger } from './burger.js';
import { updateHover } from './selection.js';
import { isSelected } from './selection.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0xF5F5DC);

// Caméra
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(2, 5, 5);
scene.add(light, new THREE.AmbientLight(0xF5F5DC));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.update();

export let distortionPass;
const composer = new EffectComposer(renderer);
composer.setSize(window.innerWidth, window.innerHeight);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);


function initPostProcessing() {
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Bloom effect
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.2, 0.2, 0.15
    );
    composer.addPass(bloomPass);

    // Shader de distorsion
    const distortionShader = {
        uniforms: {
            "tDiffuse": { value: null },
            "time": { value: 0.0 },
            "intensity": { value: 0.0 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float time;
            uniform float intensity;
            varying vec2 vUv;

            void main() {
                vec2 uv = vUv;
                float distortion = sin(uv.y * 10.0 + time * 5.0) * 0.01 * intensity;
                uv.x += distortion;
                vec4 color = texture2D(tDiffuse, uv);
                gl_FragColor = color;
            }
        `
    };

    distortionPass = new ShaderPass(distortionShader);
    composer.addPass(distortionPass);
}

initPostProcessing();

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
        if (distortionPass) {
            distortionPass.uniforms.time.value += deltaTime / 1000;
        }
    }

    composer.render();
    updateHover(scene, camera);
}
animate();

// Adapter la scène à la fenêtre
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Shader de chaleur
export function applyHeatShader(ingredient) {
    const heatMaterial = new THREE.ShaderMaterial({
        uniforms: heatShader.uniforms,
        vertexShader: heatShader.vertexShader,
        fragmentShader: heatShader.fragmentShader
    });

    ingredient.material = heatMaterial;
    ingredient.material.needsUpdate = true;

    function animateHeat() {
        heatMaterial.uniforms.time.value += 0.1;
        requestAnimationFrame(animateHeat);
    }

    animateHeat();
}