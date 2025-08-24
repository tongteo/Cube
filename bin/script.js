const solveButton = document.getElementById('solve-button');
const scrambleButton = document.getElementById('scramble-button');
const scrambleInput = document.getElementById('scramble-input');
const solutionOutput = document.getElementById('solution-output');
const nextMoveButton = document.getElementById('next-move-button');
const playPauseButton = document.getElementById('play-pause-button');

let scene, camera, renderer, controls, cubeGroup;
const CUBIE_SIZE = 1;
const CUBIE_SPACING = 0.05;
const ROTATION_SPEED = 0.15;

// State
let isRotating = false;
let moveQueue = [];
let solutionQueue = [];
let currentSolutionStep = 0;

// Colors (User requested scheme)
const COLORS = {
    yellow: 0xffff00, // Top
    white: 0xffffff,   // Bottom
    green: 0x00ff00,   // Front
    blue: 0x0000ff,    // Back
    red: 0xff0000,     // Left
    orange: 0xffa500, // Right
    black: 0x1a1a1a
};

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f2f5);

    const container = document.querySelector('.cube-container');
    camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(5, 6, 7);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(10, 20, 5);
    scene.add(directionalLight);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    createRubiksCube();
    animate();
}

function createRubiksCube() {
    cubeGroup = new THREE.Group();
    const cubieGeometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);

    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                if (x === 0 && y === 0 && z === 0) continue;

                const materials = [
                    new THREE.MeshStandardMaterial({ color: (x === 1) ? COLORS.orange : COLORS.black }), // Right
                    new THREE.MeshStandardMaterial({ color: (x === -1) ? COLORS.red : COLORS.black }),    // Left
                    new THREE.MeshStandardMaterial({ color: (y === 1) ? COLORS.yellow : COLORS.black }), // Top
                    new THREE.MeshStandardMaterial({ color: (y === -1) ? COLORS.white : COLORS.black }),  // Bottom
                    new THREE.MeshStandardMaterial({ color: (z === 1) ? COLORS.green : COLORS.black }),   // Front
                    new THREE.MeshStandardMaterial({ color: (z === -1) ? COLORS.blue : COLORS.black })   // Back
                ];

                const cubie = new THREE.Mesh(cubieGeometry, materials);
                const offset = CUBIE_SIZE + CUBIE_SPACING;
                cubie.position.set(x * offset, y * offset, z * offset);
                cubeGroup.add(cubie);
            }
        }
    }
    scene.add(cubeGroup);
}

function parseMoves(moveString) {
    const moves = moveString.trim().split(/\s+/);
    return moves.map(move => {
        let face = move.charAt(0).toUpperCase();
        let isPrime = move.includes("'");
        let isDouble = move.includes("2");
        return { face, isPrime, isDouble };
    });
}

function addToMoveQueue(moves) {
    moveQueue.push(...moves);
    if (!isRotating) {
        processMoveQueue();
    }
}

function processMoveQueue() {
    if (moveQueue.length === 0) {
        isRotating = false;
        return;
    }
    isRotating = true;
    const move = moveQueue.shift();
    const { face, isPrime, isDouble } = move;

    const angle = (Math.PI / 2) * (isPrime ? -1 : 1);
    rotateFace(face, angle, () => {
        if (isDouble) {
            rotateFace(face, angle, processMoveQueue);
        } else {
            processMoveQueue();
        }
    });
}

function rotateFace(face, angle, callback) {
    const axis = new THREE.Vector3();
    const planeConstant = (CUBIE_SIZE + CUBIE_SPACING) / 2;
    const cubiesToRotate = [];

    switch (face) {
        case 'U': axis.set(0, -1, 0); cubiesToRotate.push(...cubeGroup.children.filter(c => c.position.y > planeConstant)); break;
        case 'D': axis.set(0, 1, 0); cubiesToRotate.push(...cubeGroup.children.filter(c => c.position.y < -planeConstant)); break;
        case 'L': axis.set(1, 0, 0); cubiesToRotate.push(...cubeGroup.children.filter(c => c.position.x < -planeConstant)); break;
        case 'R': axis.set(-1, 0, 0); cubiesToRotate.push(...cubeGroup.children.filter(c => c.position.x > planeConstant)); break;
        case 'F': axis.set(0, 0, -1); cubiesToRotate.push(...cubeGroup.children.filter(c => c.position.z > planeConstant)); break;
        case 'B': axis.set(0, 0, 1); cubiesToRotate.push(...cubeGroup.children.filter(c => c.position.z < -planeConstant)); break;
        default: callback(); return;
    }

    const pivot = new THREE.Group();
    scene.add(pivot);
    cubiesToRotate.forEach(cubie => pivot.add(cubie));

    let currentAngle = 0;
    function animateRotation() {
        const angleToRotate = Math.sign(angle) * ROTATION_SPEED;
        pivot.rotateOnWorldAxis(axis, angleToRotate);
        currentAngle += angleToRotate;

        if (Math.abs(currentAngle) >= Math.abs(angle)) {
            // Snap to the final angle to avoid floating point errors
            pivot.rotateOnWorldAxis(axis, angle - currentAngle);
            pivot.updateMatrixWorld();

            cubiesToRotate.forEach(cubie => {
                cubeGroup.attach(cubie); // This is the correct way to re-parent
            });

            scene.remove(pivot);
            callback();
        } else {
            requestAnimationFrame(animateRotation);
        }
    }
    animateRotation();
}

function getCubeStateString() {
    // THIS IS A COMPLEX FUNCTION TO BE IMPLEMENTED
    // It needs to read the colors of all 54 stickers and format them
    // into the string that the C solver expects.
    // For now, we'll use a placeholder.
    console.warn("getCubeStateString() is not implemented. Using placeholder scramble.");
    return scrambleInput.value || "R U R' U' F' U F"; // Return input or a default
}

// --- Event Listeners ---
scrambleButton.addEventListener('click', () => {
    const scrambleText = scrambleInput.value;
    if (scrambleText && !isRotating) {
        const moves = parseMoves(scrambleText);
        addToMoveQueue(moves);
    }
});

solveButton.addEventListener('click', () => {
    if (isRotating) return;
    const stateString = getCubeStateString();
    solutionOutput.textContent = "Solving...";

    // Defer execution to allow UI to update
    setTimeout(() => {
        const solution = Module.ccall(
            'solve_cube_wasm',
            'string',
            ['string'],
            [stateString]
        );
        solutionOutput.textContent = solution;
        solutionQueue = parseMoves(solution.split('\n').slice(1).join(' ')); // Basic parsing
        currentSolutionStep = 0;
        nextMoveButton.disabled = false;
        playPauseButton.disabled = false;
    }, 50);
});

nextMoveButton.addEventListener('click', () => {
    if (currentSolutionStep < solutionQueue.length && !isRotating) {
        addToMoveQueue([solutionQueue[currentSolutionStep]]);
        currentSolutionStep++;
    }
});

// --- Init ---
Module.onRuntimeInitialized = () => {
    [solveButton, scrambleButton].forEach(b => b.disabled = false);
    console.log('WASM Module Initialized');
};

const orbitControlsScript = document.createElement('script');
orbitControlsScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
orbitControlsScript.onload = init;
document.head.appendChild(orbitControlsScript);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}