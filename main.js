import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

const scene = new THREE.Scene();
const backgroundColor = new THREE.Color(0xF5F5DC);
scene.background = backgroundColor;
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 5);
light.position.set(2, 5, 5);
const helper = new THREE.DirectionalLightHelper(light, 6, 0xff0000);
scene.add(helper);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const textureLoader = new THREE.TextureLoader();
const mtlLoader = new MTLLoader();

let burger;
let explosionParticles = [];

// Modèle 3D de burger
mtlLoader.load('assets/model.mtl', (materials) => {
    materials.preload();
    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.load('assets/model.obj', (obj) => {
        burger = obj;
        burger.traverse((child) => {
            if (child.isMesh) {
                child.material.map = textureLoader.load('assets/RGB_b05470a11c724f65ad21a14908f6fc69_cheeseburger_difuse.png');
            }
        });
        burger.scale.set(0.5, 0.5, 0.5);
        burger.position.set(0, -1.5, 0); // Ne pas modif
        burger.rotation.set(-Math.PI / 2, 0, 0);
        scene.add(burger);
    });
});

function explodeBurger() {
    if (!burger) return;

    burger.traverse((child) => {
        if (child.isMesh) {
            const geometry = child.geometry;
            const vertices = [];
            for (let i = 0; i < geometry.attributes.position.count; i++) {
                const vertex = new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, i);
                vertices.push(vertex);
            }

            const limitedVertices = vertices.slice(0, 50);
            const colors = [0xff0000, 0x00ff00, 0xFFA500, 0xFFA500, 0xffff00, 0xA52A2A, 0xA52A2A, 0xA52A2A];

            limitedVertices.forEach(vertex => {
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                const explosionMaterial = new THREE.MeshStandardMaterial({ color: randomColor });
                const smallCubeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
                const smallCube = new THREE.Mesh(smallCubeGeometry, explosionMaterial);
                
                scene.add(smallCube);

                // Vitesse
                const velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                );

                explosionParticles.push({
                    particle: smallCube,
                    velocity: velocity,
                    lifetime: Math.random() * 2 + 1  // Temps avant disparition
                });
            });
        }
    });

    scene.remove(burger);
}


function animateParticles() {
    explosionParticles.forEach((particleObj, index) => {
        const particle = particleObj.particle;
        const velocity = particleObj.velocity;

        particle.position.add(velocity);
        velocity.multiplyScalar(0.98);

        if (particleObj.lifetime <= 0) {
            scene.remove(particle);
            explosionParticles.splice(index, 1);  // Retirer la particule du tableau
        } else {
            particleObj.lifetime -= 0.02;
        }
    });
}

let hasExploded = false;
document.addEventListener('keydown', (event) => {
    if (event.key === 'e' && !hasExploded) {
        explodeBurger();
        hasExploded = true;
        document.getElementsByClassName('eat-button')[0].style.display = 'none';
    }
});

function animate() {
    requestAnimationFrame(animate);
    animateParticles();

    if (burger) {
        burger.rotation.z += 0.01;
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
