import { Visualizer3D } from './ui/Visualizer3D.js';
import { DOMController } from './ui/DOMController.js';
import { AudioManager } from './audio/AudioManager.js';
import { WasmBridge } from './audio/WasmBridge.js';

async function init() {
    const statusEl = document.getElementById('status');
    statusEl.textContent = "Status: Initializing WASM...";

    const wasmBridge = new WasmBridge();
    await wasmBridge.init();

    const audioManager = new AudioManager(wasmBridge);
    const visualizer = new Visualizer3D();
    const domController = new DOMController(audioManager, visualizer);

    // Wire visualizer position updates to audio manager
    visualizer.onPositionUpdate = (trackId, x, y, z) => {
        audioManager.updatePosition(trackId, x, y, z);
    };

    statusEl.textContent = "Status: Ready. Upload audio to begin.";
}

document.addEventListener('DOMContentLoaded', () => {
    init().catch(err => {
        console.error("Initialization failed:", err);
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = "Status: Error starting app - " + err.message;
        }
    });
});