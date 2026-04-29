export class WasmBridge {
    constructor() {
        this.module = null;
        this.obrInstance = null;
    }

    async init() {
        try {
            // Dynamically import the ES module output from Emscripten
            const wasmModule = await import('../../public/wasm/obr_module.js');
            // The default export of emscripten ES6 module is a factory function
            this.module = await wasmModule.default();
            
            // Assume ObrWrapper class is exposed via embind
            this.obrInstance = new this.module.ObrWrapper();
            
            // 44100 Hz, 4096 buffer size
            this.obrInstance.init(44100, 4096);
            console.log("WASM OBR Initialized");
        } catch (err) {
            console.error("Failed to load WASM module, using dummy processing.", err);
            throw err; // Re-throw to catch it in main.js
        }
    }

    process(inputArray, numSamples, x, y, z) {
        if (!this.module || !this.obrInstance) {
            return null; // Fallback handled in AudioManager
        }

        // Allocate memory in WASM heap
        const bytesPerFloat = 4;
        const inputPtr = this.module._malloc(numSamples * bytesPerFloat);
        const outputLeftPtr = this.module._malloc(numSamples * bytesPerFloat);
        const outputRightPtr = this.module._malloc(numSamples * bytesPerFloat);

        // Copy input to WASM memory
        this.module.HEAPF32.set(inputArray, inputPtr / bytesPerFloat);

        // Call C++ process method
        this.obrInstance.processAudioBlock(inputPtr, numSamples, x, y, z, outputLeftPtr, outputRightPtr);

        // Read output from WASM memory safely using subarray
        const outputLeft = this.module.HEAPF32.subarray(outputLeftPtr / bytesPerFloat, (outputLeftPtr / bytesPerFloat) + numSamples);
        const outputRight = this.module.HEAPF32.subarray(outputRightPtr / bytesPerFloat, (outputRightPtr / bytesPerFloat) + numSamples);
        
        // Combine into one array [left..., right...]
        const result = new Float32Array(numSamples * 2);
        result.set(outputLeft, 0);
        result.set(outputRight, numSamples);

        // Free memory
        this.module._free(inputPtr);
        this.module._free(outputLeftPtr);
        this.module._free(outputRightPtr);

        return result;
    }
}