import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

export class Visualizer3D {
    constructor() {
        this.canvas = document.getElementById('three-canvas');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);

        try {
            this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, failIfMajorPerformanceCaveat: false });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.webglSupported = true;
        } catch (e) {
            console.warn("WebGL not supported, rendering will be disabled.", e);
            this.webglSupported = false;
            // Draw a fallback message on the canvas using 2D context instead
            const ctx = this.canvas.getContext('2d');
            if (ctx) {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
                ctx.fillStyle = '#222';
                ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                ctx.fillStyle = '#fff';
                ctx.font = '20px sans-serif';
                ctx.fillText('WebGL not supported in this environment.', 50, 50);
            }
        }

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 10, 10);
        this.scene.add(dirLight);

        // Room Grid
        const gridHelper = new THREE.GridHelper(20, 20);
        this.scene.add(gridHelper);

        // Axes Helper (Red=X, Green=Y, Blue=Z)
        const axesHelper = new THREE.AxesHelper( 5 );
        this.scene.add( axesHelper );

        // "Front" Indicator (Negative Z is forward in Three.js)
        const frontGeometry = new THREE.BoxGeometry(2, 0.1, 0.5);
        const frontMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const frontBox = new THREE.Mesh(frontGeometry, frontMaterial);
        frontBox.position.set(0, 0.05, -10); // Place it at the front edge of the grid
        this.scene.add(frontBox);

        // Controls
        if (this.webglSupported) {
            this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
            this.audioNodes = []; // Array of meshes
            this.dragControls = new DragControls(this.audioNodes, this.camera, this.renderer.domElement);
            this.setupDragControls();
        } else {
            this.audioNodes = [];
        }
        
        this.onPositionUpdate = null; // Callback

        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        this.animate();
    }

    setupDragControls() {
        if (!this.webglSupported) return;

        this.dragControls.addEventListener('dragstart', () => {
            this.orbitControls.enabled = false;
        });

        this.dragControls.addEventListener('drag', (event) => {
            const mesh = event.object;
            if (this.onPositionUpdate) {
                // Normalize positions somewhat or send raw 3D world coords
                this.onPositionUpdate(mesh.userData.trackId, mesh.position.x, mesh.position.y, mesh.position.z);
            }
        });

        this.dragControls.addEventListener('dragend', () => {
            this.orbitControls.enabled = true;
        });
    }

    addAudioNode(trackId, name) {
        let position = { x: (Math.random() - 0.5) * 5, y: 1, z: (Math.random() - 0.5) * 5 };

        if (this.webglSupported) {
            const geometry = new THREE.SphereGeometry(0.5, 32, 32);
            const material = new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff });
            const sphere = new THREE.Mesh(geometry, material);
            
            sphere.position.set(position.x, position.y, position.z);
            sphere.userData = { trackId, name };
            
            this.scene.add(sphere);
            this.audioNodes.push(sphere);
        } else {
             // Mock node for export if no WebGL
             this.audioNodes.push({
                 userData: { trackId, name },
                 position: { ...position, clone: () => ({ ...position }) }
             });
        }

        // Trigger initial position update
        if (this.onPositionUpdate) {
            this.onPositionUpdate(trackId, position.x, position.y, position.z);
        }
    }

    getAudioNodes() {
        return this.audioNodes.map(mesh => ({
            trackId: mesh.userData.trackId,
            name: mesh.userData.name,
            position: mesh.position.clone()
        }));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        if (this.webglSupported) {
            this.orbitControls.update();
            this.renderer.render(this.scene, this.camera);
        }
    }
}