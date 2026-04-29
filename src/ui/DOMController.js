export class DOMController {
    constructor(audioManager, visualizer) {
        this.audioManager = audioManager;
        this.visualizer = visualizer;
        
        this.fileInput = document.getElementById('audio-upload');
        this.exportBtn = document.getElementById('export-btn');
        this.recordBtn = document.getElementById('record-btn');
        this.statusEl = document.getElementById('status');
        
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.fileInput.addEventListener('change', async (e) => {
            const files = e.target.files;
            if (files.length === 0) return;

            this.statusEl.textContent = `Status: Processing ${files.length} file(s)...`;

            for (const file of files) {
                try {
                    const trackId = await this.audioManager.loadAudioFile(file);
                    this.visualizer.addAudioNode(trackId, file.name);
                } catch (err) {
                    console.error("Error loading file", file.name, err);
                }
            }

            this.statusEl.textContent = "Status: Audio playing.";
        });

        this.recordBtn.addEventListener('click', () => {
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        });

        this.exportBtn.addEventListener('click', () => {
            const metadata = this.generateIAMFMetadata();
            this.downloadJSON(metadata, 'iamf_config.json');
        });
    }

    generateIAMFMetadata() {
        const nodes = this.visualizer.getAudioNodes();
        const config = {
            version: "1.0",
            tracks: nodes.map(node => ({
                id: node.trackId,
                name: node.name,
                position: {
                    x: node.position.x,
                    y: node.position.y,
                    z: node.position.z
                }
            }))
        };
        return config;
    }

    downloadJSON(data, filename) {
        const json = JSON.stringify(data, null, 2);
        console.log("Exporting IAMF Payload:", json);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    startRecording() {
        if (!this.audioManager) return;
        const stream = this.audioManager.getRecordingStream();
        
        const options = { mimeType: 'audio/webm' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'audio/mp4'; // fallback for Safari
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
             options.mimeType = ''; // Let browser choose default
        }

        try {
            this.mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            console.error("Exception while creating MediaRecorder:", e);
            this.statusEl.textContent = "Status: Recording not supported.";
            return;
        }

        this.recordedChunks = [];
        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.recordedChunks.push(e.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder.mimeType || 'audio/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            // Generate filename extension based on mimetype
            let ext = '.webm';
            if (this.mediaRecorder.mimeType.includes('mp4')) ext = '.mp4';
            else if (this.mediaRecorder.mimeType.includes('ogg')) ext = '.ogg';
            else if (this.mediaRecorder.mimeType.includes('wav')) ext = '.wav';
            
            a.download = 'binaural_mix' + ext;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
            
            this.statusEl.textContent = "Status: Recording saved.";
        };

        this.mediaRecorder.start();
        this.isRecording = true;
        this.recordBtn.textContent = '⏹ Stop Recording';
        this.recordBtn.style.backgroundColor = '#ff4444';
        this.statusEl.textContent = "Status: Recording audio...";
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.recordBtn.textContent = '🔴 Start Recording';
            this.recordBtn.style.backgroundColor = '#8b0000';
        }
    }
}