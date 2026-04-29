export class AudioManager {
    constructor(wasmBridge) {
        this.wasmBridge = wasmBridge;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Setup Master Bus and Recording Stream Destination
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        
        this.streamDestination = this.audioContext.createMediaStreamDestination();
        this.masterGain.connect(this.streamDestination);

        this.tracks = new Map();
        this.nextTrackId = 1;
    }

    getRecordingStream() {
        return this.streamDestination.stream;
    }

    async loadAudioFile(file) {
        // Resume context on user interaction
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

        const trackId = this.nextTrackId++;
        
        // For zero-build, we use ScriptProcessorNode (deprecated but widely supported without separate files)
        // or a simple processor if Web Audio is preferred. Since we need to feed WASM per chunk:
        const bufferSize = 4096;
        const scriptNode = this.audioContext.createScriptProcessor(bufferSize, audioBuffer.numberOfChannels, 2);

        // Dummy source to drive the script processor
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = true;

        const trackState = {
            id: trackId,
            x: 0, y: 0, z: 0,
            source,
            scriptNode,
            gainNode: this.audioContext.createGain()
        };

        this.tracks.set(trackId, trackState);

        let blockCount = 0;

        scriptNode.onaudioprocess = (audioProcessingEvent) => {
            const inputBuffer = audioProcessingEvent.inputBuffer;
            const outputBuffer = audioProcessingEvent.outputBuffer;
            
            // Assume mono input for spatialization
            const inputData = inputBuffer.getChannelData(0);
            
            // Process via WASM Bridge
            const outputArray = this.wasmBridge.process(
                inputData, 
                inputData.length, 
                trackState.x, 
                trackState.y, 
                trackState.z
            );

            // Output has left and right interleaved or separate. Let's assume WASM returns Float32Array [left..., right...]
            const outL = outputBuffer.getChannelData(0);
            const outR = outputBuffer.getChannelData(1);
            
            if (outputArray) {
                const half = inputData.length;
                let maxVal = 0;
                for (let i = 0; i < half; i++) {
                    outL[i] = outputArray[i];
                    outR[i] = outputArray[i + half];
                    if (Math.abs(outputArray[i]) > maxVal) maxVal = Math.abs(outputArray[i]);
                }
                if (blockCount++ % 100 === 0) {
                    console.log(`Audio Block ${blockCount} - Max Output Amp: ${maxVal.toFixed(4)}`);
                }
            } else {
                // Passthrough if WASM fails
                for (let i = 0; i < inputData.length; i++) {
                    outL[i] = inputData[i];
                    outR[i] = inputData[i];
                }
            }
        };

        source.connect(scriptNode);
        scriptNode.connect(trackState.gainNode);
        trackState.gainNode.connect(this.masterGain);
        
        source.start();

        return trackId;
    }

    updatePosition(trackId, x, y, z) {
        const track = this.tracks.get(trackId);
        if (track) {
            track.x = x;
            track.y = y;
            track.z = z;
        }
    }
}