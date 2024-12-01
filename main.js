import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { gsap } from 'gsap';

// Configuration
const colors = [
    '#696d7d',
    '#6F9283',
    '#8D9F87',
    '#CDC6A5',
    '#F0DCCA'
];

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 100);

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#three-canvas'),
    alpha: true,
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Fonction pour générer une coordonnée Y aléatoire dans une zone donnée
function randomYInZone(zone) {
    const zoneHeight = window.innerHeight / 3; // Divise l'écran en 3 zones
    const minY = (zone * zoneHeight) - (window.innerHeight / 2);
    const maxY = ((zone + 1) * zoneHeight) - (window.innerHeight / 2);
    return minY + Math.random() * (maxY - minY);
}

// Génération des trajectoires possibles
function generateTrajectories() {
    const trajectories = [];
    const startX = -250; // Plus loin hors écran
    const endX = 250;
    
    // Trajectoires horizontales dans différentes zones
    for (let zone = 0; zone < 3; zone++) {
        // Gauche vers droite
        trajectories.push({
            start: { x: startX, y: randomYInZone(zone) },
            end: { x: endX, y: randomYInZone(zone) }
        });
        
        // Droite vers gauche
        trajectories.push({
            start: { x: endX, y: randomYInZone(zone) },
            end: { x: startX, y: randomYInZone(zone) }
        });
    }
    
    // Quelques trajectoires diagonales
    trajectories.push(
        // Diagonale haute gauche vers droite
        {
            start: { x: startX, y: randomYInZone(0) },
            end: { x: endX, y: randomYInZone(1) }
        },
        // Diagonale haute droite vers gauche
        {
            start: { x: endX, y: randomYInZone(0) },
            end: { x: startX, y: randomYInZone(1) }
        },
        // Diagonale basse gauche vers droite
        {
            start: { x: startX, y: randomYInZone(2) },
            end: { x: endX, y: randomYInZone(1) }
        },
        // Diagonale basse droite vers gauche
        {
            start: { x: endX, y: randomYInZone(2) },
            end: { x: startX, y: randomYInZone(1) }
        }
    );
    
    // Quelques trajectoires verticales ou presque
    trajectories.push(
        // Haut vers bas
        {
            start: { x: -100 + Math.random() * 200, y: -window.innerHeight / 2 },
            end: { x: -50 + Math.random() * 100, y: window.innerHeight / 2 }
        },
        // Bas vers haut
        {
            start: { x: -100 + Math.random() * 200, y: window.innerHeight / 2 },
            end: { x: -50 + Math.random() * 100, y: -window.innerHeight / 2 }
        }
    );
    
    return trajectories;
}

// Potatoes array
const potatoes = [];

// Génération des trajectoires
const trajectories = generateTrajectories();

// Setup loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// Load potatoes
loader.load('models/patates.gltf', 
    (gltf) => {
        console.log('GLTF loaded successfully');
        
        for (let i = 1; i <= 12; i++) {
            const potatoName = `patate${i}`;
            const originalPotato = gltf.scene.getObjectByName(potatoName);
            
            if (originalPotato) {
                console.log(`Found potato: ${potatoName}`);
                
                // Clone and setup potato
                const potato = originalPotato.clone();
                potato.scale.set(1000, 1000, 1000); // Échelle augmentée à 1000
                
                // Choisir une trajectoire aléatoire
                const trajectoryIndex = Math.floor(Math.random() * trajectories.length);
                const trajectory = trajectories[trajectoryIndex];
                
                // Position initiale
                potato.position.set(
                    trajectory.start.x,
                    trajectory.start.y,
                    0
                );
                
                // Vitesse de rotation augmentée et continue
                potato.userData.rotationSpeed = {
                    x: (Math.random() - 0.5) * 0.02,
                    y: (Math.random() - 0.5) * 0.02,
                    z: (Math.random() - 0.5) * 0.02
                };
                
                // Données de trajectoire
                potato.userData.trajectory = trajectory;
                potato.userData.scrollOffset = (i - 1) / 11; // Décalage progressif
                
                scene.add(potato);
                potatoes.push(potato);
            }
        }
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.error('Error loading GLTF:', error);
    }
);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Rotation lente des patates
    potatoes.forEach(potato => {
        if (potato.userData.rotationSpeed) {
            potato.rotation.x += potato.userData.rotationSpeed.x;
            potato.rotation.y += potato.userData.rotationSpeed.y;
            potato.rotation.z += potato.userData.rotationSpeed.z;
        }
    });
    
    renderer.render(scene, camera);
}

animate();

// Scroll handler
function handleScroll() {
    const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    
    // Animation des citations et vérification de leur visibilité
    const quotes = document.querySelectorAll('.quote');
    let isAnyQuoteVisible = false;
    
    quotes.forEach(quote => {
        const rect = quote.getBoundingClientRect();
        // Une citation est visible si elle est dans la vue
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            quote.classList.add('visible');
            isAnyQuoteVisible = true;
        } else {
            quote.classList.remove('visible');
        }
    });

    // Gestion du titre principal
    const mainTitle = document.querySelector('h1');
    
    if (!isAnyQuoteVisible) {
        // Si aucune citation n'est visible, on montre le titre
        mainTitle.style.opacity = '1';
    } else {
        // Si une citation est visible, on cache le titre
        mainTitle.style.opacity = '0';
    }

    // Gestion de la classe scrolled indépendamment
    if (window.scrollY > 100) {
        mainTitle.classList.add('scrolled');
    } else {
        mainTitle.classList.remove('scrolled');
    }

    // Transition de couleur de fond
    const colorIndex = Math.floor(scrollPercent * (colors.length - 1));
    const nextColorIndex = Math.min(colorIndex + 1, colors.length - 1);
    const colorProgress = (scrollPercent * (colors.length - 1)) % 1;
    
    const currentColor = new THREE.Color(colors[colorIndex]);
    const nextColor = new THREE.Color(colors[nextColorIndex]);
    const interpolatedColor = currentColor.lerp(nextColor, colorProgress);
    
    document.body.style.backgroundColor = `#${interpolatedColor.getHexString()}`;
    
    // Animation des patates
    potatoes.forEach((potato) => {
        const trajectory = potato.userData.trajectory;
        const offset = potato.userData.scrollOffset;
        
        // Calcul de la progression avec décalage
        let progress = (scrollPercent - offset) * 1.5; // Facteur 1.5 pour un mouvement plus rapide
        progress = Math.max(0, Math.min(1, progress)); // Limiter entre 0 et 1
        
        // Position interpolée
        const x = trajectory.start.x + (trajectory.end.x - trajectory.start.x) * progress;
        const y = trajectory.start.y + (trajectory.end.y - trajectory.start.y) * progress;
        
        // Animation fluide avec GSAP
        gsap.to(potato.position, {
            x: x,
            y: y,
            duration: 0.75,
            ease: "power1.out"
        });
    });
}

// Event listeners
window.addEventListener('scroll', handleScroll);
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
