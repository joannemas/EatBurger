import * as THREE from 'three';
import { applyHeatShader, scene } from './script';

// Raycaster et souris
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedPart = null;
let hoveredPart = null;
import gsap from 'gsap';

const selectableParts = {};

export let isSelected = false;

selectableParts.painHaut = null;
selectableParts.painBas = null;
selectableParts.steak = null;
selectableParts.salade = null;
selectableParts.fromage = null;

const positions = {
    burgerLeft: new THREE.Vector3(-12, 0, 0),
    ingredientCenter: new THREE.Vector3(0, 0.5, 0),
};
let burgerGroup = new THREE.Group();

// add objets sélectionnables
export function addSelectableParts(obj) {
    burgerGroup = obj;

    obj.traverse((child) => {
        if (child.isMesh) {
            const name = child.name.toLowerCase();
                        
            if (name.includes("cube001_material003")) {
                selectableParts.painHaut = child;
            } else if (name.includes("cube002_material003")) {
                selectableParts.painBas = child;
            } else if (name.includes("cube_material001")) {
                selectableParts.steak = child;
            } else if (name.includes("grid001_material005")) {
                selectableParts.salade = child;
            } else if (name.includes("grid_material002")) {
                selectableParts.fromage = child;
            }

            child.userData.originalPosition = child.position.clone(); 
            child.userData.originalScale = child.scale.clone();
        }
    });
    
}

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('click', () => {
    if (hoveredPart) {
        selectIngredient(hoveredPart, scene);
        console.log(hoveredPart);
    }
    else {
        resetScene(scene, burgerGroup);
        buttonContainer.style.display = "none";

    }
});

let originalPart = null;
const buttonContainer = document.getElementById("choice-buttons");


function selectIngredient(part) {

    isSelected = true;
    console.log(isSelected);
    updateButtonVisibility();

    
    if (selectedPart) {
        resetIngredient(selectedPart);
    }

    originalPart = part;

    // Cloner l'ingrédient sélectionné
    const clone = part.clone();
    scene.add(clone);

    // shader de chaleur
    const clonedMaterial = new THREE.ShaderMaterial({
        uniforms: {
            "time": { value: 0.0 },
            "baseColor": { value: part.material.color }
        },
        vertexShader: `
            varying vec2 vUv;
            varying float vDistortion;
            uniform float time;
    
            void main() {
                vUv = uv;
                vDistortion = sin(uv.x * 10.0 + time * 6.0) * 0.1;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                mvPosition.z += vDistortion;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 baseColor;
            varying vec2 vUv;
            varying float vDistortion;
    
            void main() {
                vec3 heatColor = mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 0.0), vDistortion);
                vec3 finalColor = mix(baseColor.rgb, heatColor, 0.3);
    
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `
    });
    
    clone.material = clonedMaterial;
    scene.add(clone);
    
    function animateHeat() {
        clonedMaterial.uniforms.time.value += 0.02;
        requestAnimationFrame(animateHeat);
    }
    animateHeat();
    

    if (part.material.map) {
        clonedMaterial.uniforms.tDiffuse.value = part.material.map;
    }

    clone.material = clonedMaterial;

    clone.position.copy(part.getWorldPosition(new THREE.Vector3())); // Même position que l'original
    clone.scale.copy(part.scale); // Même échelle que l'original

    selectedPart = clone;

    gsap.to(clone.position, { 
        x: 0, 
        y: 0, 
        z: 0,
        duration: 1, 
        ease: "power2.out"
    });

    gsap.to(clone.scale, { 
        x: 1.5, 
        y: 1.5, 
        z: 1.5, 
        duration: 1 
    });

    // Burger à gauche
    gsap.to(burgerGroup.position, { 
        x: positions.burgerLeft.x, 
        duration: 1, 
        ease: "power2.out" 
    });

    showIngredientInfo(part.name);
    showChoiceButtons();

}



function resetIngredient(part) {
    if (!part) return;

    scene.remove(part);
    gsap.to(burgerGroup.position, { x: 0, duration: 1 });

    gsap.to("#infoBox", { opacity: 0, duration: 0.5, onComplete: () => {
        document.getElementById("infoBox").style.display = "none";
    }});

    selectedPart = null;
    isSelected = false;
}


function showIngredientInfo(name) {
    const infoBox = document.getElementById('infoBox');
    
    const ingredientText = {
        Cube001_Material003_0: "Top bun - Soft and golden!",
        Cube002_Material003_0: "Bottom bun - Perfect support for your burger!",
        Cube_Material001_0: "Steak - A juicy delight!",
        Grid001_Material005_0: "Lettuce - A touch of freshness!",
        Grid_Material002_0: "Cheese - Melts perfectly!"
    };

    const key = name;

    const text = ingredientText[key] || "Something delicious!";

    infoBox.innerText = text;
    infoBox.style.opacity = 0;
    infoBox.style.display = 'block';

    gsap.to(infoBox, {
        opacity: 1,
        x: 40,
        duration: 0.5,
        ease: "power2.out"
    });
}


export function updateHover(scene, camera) {
    raycaster.setFromCamera(mouse, camera);
    
    const allParts = Object.values(selectableParts).filter(part => part !== null);
    const intersects = raycaster.intersectObjects(allParts, true);
    
    if (intersects.length > 0) {
        const firstHit = intersects[0].object;
        if (hoveredPart !== firstHit) {
            if (hoveredPart) hoveredPart.material.emissive.set(0x000000);
            hoveredPart = firstHit;
            hoveredPart.material.emissive.set(0xffaa00);
        }
    } else {
        if (hoveredPart) hoveredPart.material.emissive.set(0x000000);
        hoveredPart = null;
    }
}

function resetScene(scene, burgerGroup) {
    if (selectedPart) {
        gsap.to(selectedPart.scale, { x: 1, y: 1, z: 1, duration: 0.5 });

        gsap.to(selectedPart.scale, { 
            x: selectedPart.userData.originalScale.x, 
            y: selectedPart.userData.originalScale.y, 
            z: selectedPart.userData.originalScale.z, 
            duration: 0.5 
        });        

        burgerGroup.add(selectedPart);

        selectedPart = null;
        isSelected = false;
        console.log(isSelected);
        updateButtonVisibility();
    }

    gsap.to(burgerGroup.position, { x: 0, duration: 1 });

    gsap.to("#infoBox", { opacity: 0, duration: 0.5, onComplete: () => {
        document.getElementById("infoBox").style.display = "none";
    }});
}

export function updateButtonVisibility() {
    const explosionButton = document.getElementsByClassName('eat-button')[0];
    if (explosionButton ) {
        explosionButton.style.display = isSelected ? "none" : "block";
    }
}

function showChoiceButtons() {
    const buttonContainer = document.getElementById("choice-buttons");

    if (!buttonContainer) return;

    buttonContainer.innerHTML = `
        <button id="keep-btn">Keep</button>
        <button id="remove-btn">Remove</button>
    `;

    document.getElementById("keep-btn").addEventListener("click", () => {
        hideChoiceButtons();
    });

    document.getElementById("remove-btn").addEventListener("click", () => {
        if (originalPart) {
            originalPart.visible = false;
        }
        hideChoiceButtons();
    });

    buttonContainer.style.display = "block";
}

function hideChoiceButtons() {
    if (buttonContainer) {
        buttonContainer.style.display = "none";
    }
}
