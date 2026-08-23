// ============================================================
// CUSTOMER CHURN — ADVANCED 3D BACKGROUND
// Moving churn graph + particles + data waves + glowing nodes
// ============================================================

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0, 1, 18);


// ============================================================
// RENDERER
// ============================================================

const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.width = "100%";
renderer.domElement.style.height = "100%";
renderer.domElement.style.zIndex = "-1";
renderer.domElement.style.pointerEvents = "none";

document.body.prepend(renderer.domElement);


// ============================================================
// LIGHTING
// ============================================================

const ambientLight = new THREE.AmbientLight(
    0x4f8cff,
    1.4
);

scene.add(ambientLight);

const blueLight = new THREE.PointLight(
    0x3b82f6,
    5,
    40
);

blueLight.position.set(
    5,
    5,
    8
);

scene.add(blueLight);

const purpleLight = new THREE.PointLight(
    0x8b5cf6,
    4,
    40
);

purpleLight.position.set(
    -7,
    -2,
    5
);

scene.add(purpleLight);


// ============================================================
// MAIN GRAPH GROUP
// ============================================================

const graphGroup = new THREE.Group();

scene.add(graphGroup);


// ============================================================
// CUSTOMER CHURN DATA
// ============================================================

const points = [
    [-9, -2.5, 0],
    [-7, -0.2, 0],
    [-5, -1.2, 0],
    [-3, 2.0, 0],
    [-1, 0.6, 0],
    [1, 3.0, 0],
    [3, 1.1, 0],
    [5, 3.7, 0],
    [7, 1.8, 0],
    [9, 4.2, 0]
];


// ============================================================
// MAIN CHURN GRAPH
// ============================================================

const lineGeometry =
    new THREE.BufferGeometry();

const lineVertices = [];

points.forEach(point => {

    lineVertices.push(
        point[0],
        point[1],
        point[2]
    );

});

lineGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
        lineVertices,
        3
    )
);

const lineMaterial =
    new THREE.LineBasicMaterial({

        color: 0x3b82f6,

        transparent: true,

        opacity: 0.65

    });

const graphLine =
    new THREE.Line(
        lineGeometry,
        lineMaterial
    );

graphGroup.add(graphLine);


// ============================================================
// GLOWING CUSTOMER NODES
// ============================================================

points.forEach((point, index) => {

    const geometry =
        new THREE.SphereGeometry(
            index > 6 ? 0.20 : 0.14,
            24,
            24
        );

    const material =
        new THREE.MeshBasicMaterial({

            color:
                index > 6
                    ? 0xef4444
                    : 0x60a5fa,

            transparent: true,

            opacity: 0.85

        });

    const node =
        new THREE.Mesh(
            geometry,
            material
        );

    node.position.set(
        point[0],
        point[1],
        point[2]
    );

    node.userData.originalScale = 1;

    graphGroup.add(node);

});


// ============================================================
// EXTRA GLOWING RISK POINTS
// ============================================================

const riskPoints = [];

for (let i = 0; i < 25; i++) {

    const geometry =
        new THREE.SphereGeometry(
            0.08 + Math.random() * 0.08,
            12,
            12
        );

    const material =
        new THREE.MeshBasicMaterial({

            color:
                Math.random() > 0.45
                    ? 0xef4444
                    : 0x8b5cf6,

            transparent: true,

            opacity: 0.7

        });

    const point =
        new THREE.Mesh(
            geometry,
            material
        );

    point.position.set(

        (Math.random() - 0.5) * 18,

        (Math.random() - 0.5) * 8,

        (Math.random() - 0.5) * 3

    );

    graphGroup.add(point);

    riskPoints.push(point);
}


// ============================================================
// SECONDARY CHURN GRAPH
// ============================================================

const secondaryPoints = [];

for (let i = 0; i < 35; i++) {

    const x = -9 + i * 0.53;

    const y =
        Math.sin(x * 0.8) * 0.9 +
        Math.cos(x * 0.35) * 0.5 -
        2.2;

    secondaryPoints.push(
        new THREE.Vector3(
            x,
            y,
            -1
        )
    );

}

const secondaryGeometry =
    new THREE.BufferGeometry()
        .setFromPoints(
            secondaryPoints
        );

const secondaryMaterial =
    new THREE.LineBasicMaterial({

        color: 0x8b5cf6,

        transparent: true,

        opacity: 0.38

    });

const secondaryLine =
    new THREE.Line(
        secondaryGeometry,
        secondaryMaterial
    );

graphGroup.add(
    secondaryLine
);


// ============================================================
// GRID
// ============================================================

const grid =
    new THREE.GridHelper(
        22,
        30,
        0x3b82f6,
        0x172554
    );

grid.rotation.x = 0;

grid.position.y = -4;

grid.material.transparent = true;

grid.material.opacity = 0.18;

scene.add(grid);


// ============================================================
// FLOATING DATA PARTICLES
// ============================================================

const particleCount = 260;

const particleGeometry =
    new THREE.BufferGeometry();

const particlePositions = [];

for (
    let i = 0;
    i < particleCount;
    i++
) {

    particlePositions.push(

        (Math.random() - 0.5) * 35,

        (Math.random() - 0.5) * 20,

        (Math.random() - 0.5) * 12

    );

}

particleGeometry.setAttribute(

    "position",

    new THREE.Float32BufferAttribute(
        particlePositions,
        3
    )

);

const particleMaterial =
    new THREE.PointsMaterial({

        color: 0x60a5fa,

        size: 0.055,

        transparent: true,

        opacity: 0.55

    });

const particles =
    new THREE.Points(
        particleGeometry,
        particleMaterial
    );

scene.add(particles);


// ============================================================
// DATA WAVE
// ============================================================

const wavePoints = [];

for (let i = 0; i < 80; i++) {

    const x =
        -12 + i * 0.3;

    const y =
        Math.sin(x * 0.55) * 0.8;

    const z =
        -3 +
        Math.cos(x * 0.3) * 0.5;

    wavePoints.push(
        new THREE.Vector3(
            x,
            y,
            z
        )
    );

}

const waveGeometry =
    new THREE.BufferGeometry()
        .setFromPoints(
            wavePoints
        );

const waveMaterial =
    new THREE.LineBasicMaterial({

        color: 0x22c55e,

        transparent: true,

        opacity: 0.20

    });

const wave =
    new THREE.Line(
        waveGeometry,
        waveMaterial
    );

scene.add(wave);


// ============================================================
// MOUSE MOVEMENT
// ============================================================

let mouseX = 0;

let mouseY = 0;

document.addEventListener(
    "mousemove",
    function (event) {

        mouseX =
            event.clientX /
            window.innerWidth -
            0.5;

        mouseY =
            event.clientY /
            window.innerHeight -
            0.5;

    }
);


// ============================================================
// ANIMATION
// ============================================================

const clock =
    new THREE.Clock();

function animate() {

    requestAnimationFrame(
        animate
    );

    const time =
        clock.getElapsedTime();


    // --------------------------------------------------------
    // Main graph floating movement
    // --------------------------------------------------------

    graphGroup.position.y =
        Math.sin(
            time * 0.45
        ) * 0.65;

    graphGroup.position.x =
        Math.sin(
            time * 0.20
        ) * 0.8;


    // --------------------------------------------------------
    // 3D perspective movement
    // --------------------------------------------------------

    graphGroup.rotation.x =
        Math.sin(
            time * 0.18
        ) * 0.10;

    graphGroup.rotation.y =
        Math.sin(
            time * 0.14
        ) * 0.16;


    // --------------------------------------------------------
    // Pulsing risk nodes
    // --------------------------------------------------------

    riskPoints.forEach(
        (point, index) => {

            const pulse =
                1 +
                Math.sin(
                    time * 2 +
                    index
                ) * 0.35;

            point.scale.set(
                pulse,
                pulse,
                pulse
            );

        }
    );


    // --------------------------------------------------------
    // Floating particles
    // --------------------------------------------------------

    particles.rotation.y =
        time * 0.012;

    particles.rotation.x =
        Math.sin(
            time * 0.08
        ) * 0.08;


    // --------------------------------------------------------
    // Data wave movement
    // --------------------------------------------------------

    wave.position.y =
        Math.sin(
            time * 0.7
        ) * 0.6;

    wave.rotation.y =
        Math.sin(
            time * 0.18
        ) * 0.12;


    // --------------------------------------------------------
    // Moving grid
    // --------------------------------------------------------

    grid.position.z =
        Math.sin(
            time * 0.15
        ) * 1.5;


    // --------------------------------------------------------
    // Camera follows mouse
    // --------------------------------------------------------

    camera.position.x +=
        (
            mouseX * 2 -
            camera.position.x
        ) * 0.025;

    camera.position.y +=
        (
            -mouseY * 1.5 +
            1 -
            camera.position.y
        ) * 0.025;

    camera.lookAt(
        0,
        0,
        0
    );


    // --------------------------------------------------------
    // Render
    // --------------------------------------------------------

    renderer.render(
        scene,
        camera
    );

}

animate();


// ============================================================
// RESPONSIVE
// ============================================================

window.addEventListener(
    "resize",
    function () {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }
);