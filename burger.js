import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

const textureLoader = new THREE.TextureLoader();
const mtlLoader = new MTLLoader();

export let burger = null; // Stocke le modèle
let explosionParticles = [];

// Charger le burger
export function loadBurger(scene) {
    console.log("Chargement du burger...");

    mtlLoader.load('assets/model.mtl', (materials) => {
        materials.preload();

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load('assets/burger/model.obj',
            (obj) => {
                console.log("OBJ chargé !");
                obj.traverse((child) => {
                    if (child.isMesh) {
                        textureLoader.load('assets/burger/RGB_b05470a11c724f65ad21a14908f6fc69_cheeseburger_difuse.png',
                            (texture) => {
                                child.material.map = texture;
                                child.material.needsUpdate = true;
                            },
                            undefined,
                            (error) => console.error("Erreur texture:", error)
                        );
                    }
                });

                obj.scale.set(0.5, 0.5, 0.5);
                obj.position.set(0, -1.5, 0);
                obj.rotation.set(-Math.PI / 2, 0, 0);
                scene.add(obj);

                burger = obj; // Met à jour la variable globale
                console.log("Burger ajouté !");
                
                floatEffect();
            },
            undefined,
            (error) => console.error("Erreur OBJ:", error)
        );
    });
}

// Effet de flottement
function floatEffect() {
    if (!burger) return;

    const floatSpeed = 0.002;
    let floatDirection = 1;

    function animateFloat() {
        if (burger) {
            burger.position.y += floatSpeed * floatDirection;
            if (burger.position.y > -1.3 || burger.position.y < -1.6) {
                floatDirection *= -1;
            }
        }
        requestAnimationFrame(animateFloat);
    }

    animateFloat();
}

// Explosion du burger
export function explodeBurger(scene) {
    if (!burger) {
        console.log("Aucun burger à exploser !");
        return;
    }

    console.log("Explosion du burger !");
    
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
                const explosionMaterial = new THREE.MeshPhongMaterial({ color: randomColor, emissive: randomColor, shininess: 100 });
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
                    lifetime: Math.random() * 3 + 1  // Temps avant disparition
                });
            });
        }
    });

    scene.remove(burger);
    burger = null;
}


// Animation des particules de l'explosion
export function updateExplosionParticles(deltaTime) {
    explosionParticles.forEach((particleData, index) => {
        particleData.particle.position.addScaledVector(particleData.velocity, deltaTime);
        particleData.lifetime -= deltaTime;

        if (particleData.lifetime <= 0) {
            particleData.particle.geometry.dispose();
            particleData.particle.material.dispose();
            particleData.particle.parent.remove(particleData.particle);
            explosionParticles.splice(index, 1);
        }
    });
}
