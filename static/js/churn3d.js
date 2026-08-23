// ============================================================
// CUSTOMER CHURN — INTERACTIVE 3D MODEL
// Drag = rotate
// Scroll = zoom
// Right mouse = pan
// ============================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x020617);


// ------------------------------------------------------------
// CAMERA
// ------------------------------------------------------------

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(7, 6, 9);


// ------------------------------------------------------------
// RENDERER
// ------------------------------------------------------------

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.outputColorSpace = THREE.SRGBColorSpace;


// ------------------------------------------------------------
// ADD CANVAS TO PAGE
// ------------------------------------------------------------

const container =
    document.getElementById("churn3d-container");

if (!container) {
    console.error(
        "3D container #churn3d-container not found."
    );
} else {

    container.appendChild(
        renderer.domElement
    );

}

renderer.domElement.style.width = "100%";
renderer.domElement.style.height = "100%";
renderer.domElement.style.display = "block";


// ------------------------------------------------------------
// LIGHTING
// ------------------------------------------------------------

const ambientLight = new THREE.AmbientLight(
    0xffffff,
    1.5
);

scene.add(ambientLight);


const blueLight = new THREE.PointLight(
    0x3b82f6,
    4,
    30
);

blueLight.position.set(
    5,
    6,
    5
);

scene.add(blueLight);


const purpleLight = new THREE.PointLight(
    0x8b5cf6,
    3,
    30
);

purpleLight.position.set(
    -5,
    3,
    -4
);

scene.add(purpleLight);


// ------------------------------------------------------------
// 3D GROUP
// ------------------------------------------------------------

const churnGroup = new THREE.Group();

scene.add(churnGroup);


// ------------------------------------------------------------
// DATA POINTS
// ------------------------------------------------------------

const churnPoints = [];


// Create customer data points
for (let i = 0; i < 120; i++) {

    const x = (Math.random() - 0.5) * 10;

    const z = (Math.random() - 0.5) * 8;

    const churnRisk =
        Math.random() +
        (x + 5) / 20;


    const y =
        Math.sin(x * 0.7) * 0.7 +
        Math.cos(z * 0.5) * 0.5 +
        churnRisk * 1.5;


    const isChurn =
        churnRisk > 0.75;


    const geometry =
        new THREE.SphereGeometry(
            isChurn ? 0.10 : 0.07,
            16,
            16
        );


    const material =
        new THREE.MeshStandardMaterial({

            color:
                isChurn
                    ? 0xef4444
                    : 0x22c55e,

            emissive:
                isChurn
                    ? 0x7f1d1d
                    : 0x14532d,

            emissiveIntensity: 0.8,

            metalness: 0.2,

            roughness: 0.35
        });


    const point =
        new THREE.Mesh(
            geometry,
            material
        );


    point.position.set(
        x,
        y,
        z
    );


    churnGroup.add(point);

    churnPoints.push(point);
}


// ------------------------------------------------------------
// 3D GRID
// ------------------------------------------------------------

const gridHelper =
    new THREE.GridHelper(
        12,
        20,
        0x3b82f6,
        0x1e3a8a
    );

gridHelper.position.y = -1.5;

gridHelper.material.transparent = true;

gridHelper.material.opacity = 0.25;

churnGroup.add(gridHelper);


// ------------------------------------------------------------
// AXIS-LIKE DATA LINES
// ------------------------------------------------------------

const lineMaterial =
    new THREE.LineBasicMaterial({

        color: 0x60a5fa,

        transparent: true,

        opacity: 0.25
    });


for (let i = 0; i < 8; i++) {

    const points = [];

    for (let j = 0; j < 20; j++) {

        const x = -5 + j * 0.5;

        const y =
            Math.sin(x * 0.8 + i) * 0.4 +
            i * 0.35 -
            1;

        const z =
            -4 + i;

        points.push(
            new THREE.Vector3(
                x,
                y,
                z
            )
        );
    }


    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints(points);


    const line =
        new THREE.Line(
            geometry,
            lineMaterial
        );


    churnGroup.add(line);
}


// ------------------------------------------------------------
// ORBIT CONTROLS
// ------------------------------------------------------------

const controls =
    new THREE.OrbitControls(
        camera,
        renderer.domElement
    );

controls.enableDamping = true;

controls.dampingFactor = 0.05;

controls.enableZoom = true;

controls.enablePan = true;

controls.minDistance = 4;

controls.maxDistance = 25;

controls.target.set(
    0,
    0,
    0
);


// ------------------------------------------------------------
// ANIMATION
// ------------------------------------------------------------

function animate() {

    requestAnimationFrame(
        animate
    );


    controls.update();


    // Very slow automatic movement
    churnGroup.rotation.y += 0.0015;


    renderer.render(
        scene,
        camera
    );
}


animate();


// ------------------------------------------------------------
// RESPONSIVE
// ------------------------------------------------------------

window.addEventListener(
    "resize",
    () => {

        const container =
            document.getElementById(
                "churn3d-container"
            );

        if (!container) return;


        const width =
            container.clientWidth;

        const height =
            container.clientHeight;


        camera.aspect =
            width / height;

        camera.updateProjectionMatrix();


        renderer.setSize(
            width,
            height
        );

    }
);