const solveButton = document.getElementById('solve-button');
const scrambleButton = document.getElementById('scramble-button');
const resetButton = document.getElementById('reset-button');
const scrambleInput = document.getElementById('scramble-input');
const solutionOutput = document.getElementById('solution-output');
const nextMoveButton = document.getElementById('next-move-button');
const prevMoveButton = document.getElementById('prev-move-button');
const playPauseButton = document.getElementById('play-pause-button');

let scene, camera, renderer, controls, cubeGroup;
const CUBIE_SIZE = 1;
const CUBIE_SPACING = 0.05;
const ROTATION_SPEED = 0.15;

// State
let isRotating = false;
let moveQueue = [];
let solutionMoves = [];
let currentMoveIndex = 0;
let isPlaying = false;
let playInterval;

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
    if (cubeGroup) {
        scene.remove(cubeGroup);
    }
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
    const individualMoves = moveString.trim().split(/\s+/);
    const flatQueue = [];

    individualMoves.forEach(move => {
        if (!move) return;

        const base = move.charAt(0);
        const isPrime = move.includes("'");
        const isDouble = move.includes("2");
        const moveCount = isDouble ? 2 : 1;

        for (let i = 0; i < moveCount; i++) {
            let simpleMoves = [];
            switch (base) {
                case 'r': simpleMoves.push({ face: 'R' }, { face: 'M', isPrime: true }); break;
                case 'l': simpleMoves.push({ face: 'L' }, { face: 'M' }); break;
                case 'u': simpleMoves.push({ face: 'U' }, { face: 'E', isPrime: true }); break;
                case 'd': simpleMoves.push({ face: 'D' }, { face: 'E' }); break;
                case 'f': simpleMoves.push({ face: 'F' }, { face: 'S' }); break;
                case 'b': simpleMoves.push({ face: 'B' }, { face: 'S', isPrime: true }); break;
                case 'x': simpleMoves.push({ face: 'R' }, { face: 'M', isPrime: true }, { face: 'L', isPrime: true }); break;
                case 'y': simpleMoves.push({ face: 'U' }, { face: 'E', isPrime: true }, { face: 'D', isPrime: true }); break;
                case 'z': simpleMoves.push({ face: 'F' }, { face: 'S' }, { face: 'B', isPrime: true }); break;
                default: simpleMoves.push({ face: base }); break;
            }

            if (isPrime) {
                simpleMoves.forEach(m => m.isPrime = !m.isPrime);
            }
            flatQueue.push(...simpleMoves);
        }
    });
    return flatQueue;
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
        updatePlaybackButtons();
        if (isPlaying && currentMoveIndex === solutionMoves.length) {
            pausePlayback();
        }
        return;
    }
    isRotating = true;
    updatePlaybackButtons();
    const move = moveQueue.shift();
    const angle = (Math.PI / 2) * (move.isPrime ? -1 : 1);
    rotateFace(move.face, angle, processMoveQueue);
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
        case 'M': axis.set(1, 0, 0); cubiesToRotate.push(...cubeGroup.children.filter(c => Math.abs(c.position.x) < 0.1)); break;
        case 'E': axis.set(0, 1, 0); cubiesToRotate.push(...cubeGroup.children.filter(c => Math.abs(c.position.y) < 0.1)); break;
        case 'S': axis.set(0, 0, -1); cubiesToRotate.push(...cubeGroup.children.filter(c => Math.abs(c.position.z) < 0.1)); break;
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
            pivot.rotateOnWorldAxis(axis, angle - currentAngle);
            pivot.updateMatrixWorld();
            cubiesToRotate.forEach(cubie => { cubeGroup.attach(cubie); });
            scene.remove(pivot);
            callback();
        } else {
            requestAnimationFrame(animateRotation);
        }
    }
    animateRotation();
}

function getCubeStateString() {
    const colorMap = {
        ['00ff00']: '0', ['ffa500']: '1', ['0000ff']: '2', ['ff0000']: '3', ['ffff00']: '4', ['ffffff']: '5'
    };
    let stateString = '';
    const faces = [
        { name: 'F', axis: 'z', dir: 1 }, { name: 'R', axis: 'x', dir: 1 }, { name: 'B', axis: 'z', dir: -1 },
        { name: 'L', axis: 'x', dir: -1 }, { name: 'U', axis: 'y', dir: 1 }, { name: 'D', axis: 'y', dir: -1 },
    ];
    const raycaster = new THREE.Raycaster();
    const offset = CUBIE_SIZE + CUBIE_SPACING;

    for (const face of faces) {
        let faceStickers = Array(9).fill('?');
        for (let v_idx = 0; v_idx < 3; v_idx++) {
            for (let u_idx = 0; u_idx < 3; u_idx++) {
                const u = u_idx - 1, v = 1 - v_idx;
                const origin = new THREE.Vector3();
                origin[face.axis] = face.dir * offset * 1.5;
                if (face.name === 'F') { origin.x = u * offset; origin.y = v * offset; }
                if (face.name === 'B') { origin.x = -u * offset; origin.y = v * offset; }
                if (face.name === 'R') { origin.z = -u * offset; origin.y = v * offset; }
                if (face.name === 'L') { origin.z = u * offset; origin.y = v * offset; }
                if (face.name === 'U') { origin.x = u * offset; origin.z = -v * offset; }
                if (face.name === 'D') { origin.x = u * offset; origin.z = v * offset; }
                const direction = new THREE.Vector3();
                direction[face.axis] = -face.dir;
                raycaster.set(origin, direction);
                const intersects = raycaster.intersectObjects(cubeGroup.children);
                if (intersects.length > 0) {
                    const colorHex = intersects[0].object.material[intersects[0].face.materialIndex].color.getHexString();
                    faceStickers[v_idx * 3 + u_idx] = colorMap[colorHex] || '?';
                }
            }
        }
        stateString += faceStickers.join('');
    }
    return stateString;
}

function updatePlaybackButtons() {
    prevMoveButton.disabled = isRotating || currentMoveIndex === 0;
    nextMoveButton.disabled = isRotating || currentMoveIndex === solutionMoves.length;
    playPauseButton.disabled = isRotating || solutionMoves.length === 0;
}

function playNextMove() {
    if (isRotating || currentMoveIndex >= solutionMoves.length) return;
    const move = solutionMoves[currentMoveIndex];
    addToMoveQueue(parseMoves(move));
    currentMoveIndex++;
    updatePlaybackButtons();
}

function playPrevMove() {
    if (isRotating || currentMoveIndex <= 0) return;
    currentMoveIndex--;
    const move = solutionMoves[currentMoveIndex];
    let inverseMove = move;
    if (move.includes("'")) {
        inverseMove = move.replace("'", "");
    } else if (move.includes("2")) {
        // Inverse of a double move is the same double move
    } else {
        inverseMove = move + "'";
    }
    addToMoveQueue(parseMoves(inverseMove));
    updatePlaybackButtons();
}

function startPlayback() {
    isPlaying = true;
    playPauseButton.textContent = 'Pause';
    playInterval = setInterval(() => {
        if (!isRotating) {
            if (currentMoveIndex < solutionMoves.length) {
                playNextMove();
            } else {
                pausePlayback();
            }
        }
    }, 800); // Adjust delay as needed
}

function pausePlayback() {
    isPlaying = false;
    playPauseButton.textContent = 'Play';
    clearInterval(playInterval);
}

// --- Event Listeners ---
scrambleButton.addEventListener('click', () => {
    if (isRotating) return;
    const moves = parseMoves(scrambleInput.value);
    addToMoveQueue(moves);
});

resetButton.addEventListener('click', () => {
    if (isRotating) return;
    moveQueue = [];
    solutionMoves = [];
    currentMoveIndex = 0;
    solutionOutput.textContent = '';
    pausePlayback();
    updatePlaybackButtons();
    createRubiksCube();
});

solveButton.addEventListener('click', () => {
    if (isRotating) return;
    solutionOutput.textContent = "Reading cube state...";
    setTimeout(() => {
        const stateString = getCubeStateString();
        console.log("State string sent to solver:", stateString);
        if (stateString.includes('?')) {
            solutionOutput.textContent = "Error reading cube state."; return;
        }
        solutionOutput.textContent = "Solving...";
        setTimeout(() => {
            const solution = Module.ccall('solve_from_state_wasm', 'string', ['string'], [stateString]);
            solutionOutput.textContent = solution;

            const cleanedSolution = solution.replace(/\((.*?)\)/g, ' $1 ');
            const parts = cleanedSolution.split(/\s+/);
            const validMoveRegex = /^[RLUDFBMESrludfbxyz](2'|2|')?$/;
            solutionMoves = parts.filter(part => validMoveRegex.test(part));

            currentMoveIndex = 0;
            isPlaying = false;
            updatePlaybackButtons();
        }, 50);
    }, 50);
});

nextMoveButton.addEventListener('click', playNextMove);
prevMoveButton.addEventListener('click', playPrevMove);

playPauseButton.addEventListener('click', () => {
    if (isPlaying) {
        pausePlayback();
    } else {
        startPlayback();
    }
});


// --- Init ---
Module.onRuntimeInitialized = () => {
    [solveButton, scrambleButton, resetButton].forEach(b => b.disabled = false);
    updatePlaybackButtons();
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