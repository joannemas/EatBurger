import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { addSelectableParts, isSelected, updateButtonVisibility } from './selection.js';
import { distortionPass } from './script.js';
import { gsap } from 'gsap';


const textureLoader = new THREE.TextureLoader();
const mtlLoader = new MTLLoader();

export let burger = null; // Stocke le modèle
export let plate = null; // Stocke le modèle de l'assiette
let explosionParticles = [];

let isVibrating = false;
let vibrationDuration = 1.5;
let vibrationTime = 0;

let backgroundColorChange = false;
let changeColorDuration = 0.5;
let colorTime = 0;
let initialColor = new THREE.Color(0xF5F5DC);
let finalColor = new THREE.Color(0x7d3400);

// Charger le burger
// export function loadBurger(scene) {
//     console.log("Chargement du burger...");

//     mtlLoader.load('assets/model.mtl', (materials) => {
//         materials.preload();

//         const objLoader = new OBJLoader();
//         objLoader.setMaterials(materials);
//         objLoader.load('assets/burger/model.obj',
//             (obj) => {
//                 console.log("OBJ chargé !");
//                 obj.traverse((child) => {
//                     if (child.isMesh) {
//                         textureLoader.load('assets/burger/RGB_b05470a11c724f65ad21a14908f6fc69_cheeseburger_difuse.png',
//                             (texture) => {
//                                 child.material.map = texture;
//                                 child.material.needsUpdate = true;
//                             },
//                             undefined,
//                             (error) => console.error("Erreur texture:", error)
//                         );
//                     }
//                 });

//                 obj.scale.set(0.5, 0.5, 0.5);
//                 obj.position.set(0, -1.5, 0);
//                 obj.rotation.set(-Math.PI / 2, 0, 0);
//                 scene.add(obj);

//                 burger = obj; // Met à jour la variable globale
//                 console.log("Burger ajouté !");
                
//                 floatEffect();
//             },
//             undefined,
//             (error) => console.error("Erreur OBJ:", error)
//         );
//     });
// }

export const burgerParts = {
    pain: [],
    steak: [],
    fromage: [],
    salade: [],
    sesame: [],
    ketchup: [],
    mayonnaise: [],
    tomate: [],
    cornichon: []
};

export function loadBurger(scene) {
    console.log("Chargement du burger...");

    const loader = new GLTFLoader();
    loader.load(
        'assets/burger3/Burger3DModel.glb',
        (gltf) => {
            console.log("GLB chargé !");
            
            const obj = gltf.scene;
            obj.scale.set(0.012, 0.012, 0.012);
            //obj.position.set(0, 0.3, 0);

            scene.add(obj);
            addSelectableParts(obj);
            burger = obj;
            console.log("Burger ajouté !");
            const elementsBurger = {};
            obj.traverse((child) => {
                if (child.isMesh) {
                    elementsBurger[child.name] = child;
                }
            });

            Object.keys(burgerParts).forEach(key => burgerParts[key] = []);
            
            obj.traverse((child) => {
                if (child.isMesh) {
                    const name = child.name.toLowerCase();
            
                    if (name.includes("cube001_material003")) {
                        burgerParts.pain.push(child); // Pain du haut
                    } else if (name.includes("cube002_material003")) {
                        burgerParts.pain.push(child); // Pain du bas
                    } else if (name.includes("cube_material001")) {
                        burgerParts.steak.push(child); // Steak
                    } else if (name.includes("grid001_material005")) {
                        burgerParts.salade.push(child); // Salade
                    } else if (name.includes("grid_material002")) {
                        burgerParts.fromage.push(child); // Fromage
                    } else if (name.includes("sphere") && name.includes("010")) {
                        burgerParts.sesame.push(child); // Sésames
                    } else if (name.includes("sphere") && name.includes("038")) {
                        burgerParts.cornichon.push(child);
                    } else if (name.includes("sphere") && name.includes("040")) {
                        burgerParts.cornichon.push(child);
                    } else if (name.includes("cube") && name.includes("023")) {
                        burgerParts.ketchup.push(child);
                    } else if (name.includes("cube") && name.includes("025")) {
                        burgerParts.mayonnaise.push(child); // 
                    } else if (name.includes("cube003_material015") || name.includes("cube007_material015") || name.includes("cube008_material015")) {
                        burgerParts.cornichon.push(child);
                    } else if (name.includes("cube003_material014") || name.includes("cube007_material014") || name.includes("cube008_material014")) {
                        burgerParts.cornichon.push(child);
                    } else if (name.includes("sphere") && name.includes("material041")) {
                        burgerParts.cornichon.push(child);
                    } else if (name.includes("cube005_material030") || name.includes("cube006_material031") || name.includes("cube004_material006_0")) {
                        burgerParts.tomate.push(child);                
                    } else {
                        console.log(`Non classé : ${name}`);
                    }
                }
            });

            floatEffect();

            const light = new THREE.PointLight(0xffff, 4, 0);
            light.position.set(0, 0, 0);
            scene.add(light);
        },
        undefined,
        (error) => console.error("Erreur GLB:", error)
    );

    loader.load('assets/plate/plate.glb', function (gltf) {
        plate = gltf.scene;
        
        plate.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshPhysicalMaterial({
                    color: 0xbbbbbb,  
                    roughness: 0.3,   
                    metalness: 0.0,   
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.1 
                });
            }
        });

        plate.scale.set(5, 5, 5);
        plate.position.set(0, -3, 0);     
        plate.rotation.z = Math.PI * 0.05;   
        scene.add(plate);

        console.log("Assiette ajoutée !");
    
    }, undefined, function (error) {
        console.error('Erreur lors du chargement de plate.glb :', error);
    });
}

// Effet de flottement
function floatEffect() {
    if (!burger) return;

    const floatSpeed = 0.005;
    let floatDirection = 1;

    function animateFloat() {
        if (burger) {
            
            burger.position.y += floatSpeed * floatDirection;
            if (burger.position.y > 0.1 || burger.position.y < -0.2) {
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

    if (isSelected == true) {
        return;
    }

    console.log("Explosion du burger !");

    if (distortionPass) {
        distortionPass.uniforms.intensity.value = 5.0;

        gsap.to(distortionPass.uniforms.intensity, {
            value: 0.0,
            duration: 1.5,
            ease: "power2.out"
        });
    }

    Object.values(burgerParts).forEach(partArray => {
        partArray.forEach(originalPart => {
            const clone = originalPart.clone();
            scene.add(clone);

            clone.scale.set(0.3, 0.3, 0.3);
            clone.position.copy(originalPart.position);

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3
            );

            explosionParticles.push({
                particle: clone,
                velocity: velocity,
                lifetime: 2,
                explodedTime: Date.now()
            });
        });
    });

    scene.remove(burger);
    burger = null;
}


// Animation des particules de l'explosion
export function updateExplosionParticles(scene, deltaTime) {
    for (let i = explosionParticles.length - 1; i >= 0; i--) {
        const particleData = explosionParticles[i];

        particleData.particle.position.addScaledVector(particleData.velocity, deltaTime);

        const elapsedTime = (Date.now() - particleData.explodedTime) / 1000;
        if (elapsedTime > particleData.lifetime) {
            scene.remove(particleData.particle);
            particleData.particle.geometry.dispose();
            particleData.particle.material.dispose();
            explosionParticles.splice(i, 1);
        }
    }
}

// Vibration du burger
export function startVibration() {
    if (isSelected == true) {
        return;
    }
    isVibrating = true;
    vibrationTime = 0;
}

export function vibrationEffect(burger, deltaTime, scene) {
    if (isVibrating && burger) {
        scene.remove(plate);
        const title = document.getElementsByClassName('title')[0];
        title.style.display = 'none';

        vibrationTime += deltaTime;

        burger.position.x += (Math.random() - 0.5) * 0.05;
        burger.position.y += (Math.random() - 0.5) * 0.05;
        burger.position.z += (Math.random() - 0.5) * 0.05;

        if (vibrationTime >= vibrationDuration) {
            isVibrating = false;
            explodeBurger(scene);
        }
    }
}

// Changement de couleur de fond
export function startColorChange() {
    if (isSelected == true) {
        return;
    }
    backgroundColorChange = true;
    colorTime = 0;
}

export function updateBackgroundColor(scene, deltaTime) {
    if (backgroundColorChange) {
        colorTime += deltaTime;
        let t = Math.min(colorTime / changeColorDuration, 1);

        const newColor = initialColor.clone().lerp(finalColor, t);
        scene.background.set(newColor);
        if (t === 1) {
            backgroundColorChange = false;
        }
    }
}