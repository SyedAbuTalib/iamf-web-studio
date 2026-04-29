# IAMF Web Studio (Zero-Build / No-NPM Architecture)

This is a web-based Spatial Audio Digital Audio Workstation (DAW) utilizing pure Vanilla JavaScript (ES6 Modules), pure Three.js via CDN, native Web Audio API, and a C++ WebAssembly module.

## Project Structure
- `index.html`: Main UI layout and Import Maps for Three.js.
- `src/`: Vanilla JavaScript source files.
- `cpp/`: C++ source for the Audio Renderer.
- `public/wasm/`: Compiled WebAssembly module (needs to be built).

## How to Build the WASM Module
You need Emscripten installed (`emsdk`).
```bash
cd cpp
mkdir build
cd build
emcmake cmake ..
make
```
This will generate `obr_module.js` and `obr_module.wasm` in the `public/wasm/` directory.

## How to Run
Due to CORS policies with ES6 modules and WebAssembly, you must run a local web server to serve the files. **Do not just open `index.html` in the browser directly.**

From the root of the project (`iamf-web-studio/`), run:
```bash
python3 -m http.server 8000
```
Then navigate to `http://localhost:8000` in your web browser.

## Features
- **Zero-Build Architecture:** No `node_modules`, no `npm install`, no Webpack/Vite. Just pure ES6 modules and Import Maps.
- **Real-Time Spatial Audio:** Integrates Google's Open Binaural Renderer (OBR) compiled to WebAssembly to spatialize mono audio stems into 3D binaural headphone mixes.
- **3D Visualization:** Uses `Three.js` (loaded via CDN) to represent audio stems as interactive spheres floating in a 3D grid.
- **Live Recording:** Capture your spatialized audio performance in real-time and export it as an audio file (`.webm`/`.mp4`).
- **IAMF Metadata Export:** Generate and download a JSON configuration containing the spatial coordinates (Azimuth, Elevation) for each audio source to be used with the native `iamf-tools` encoder.

## Usage
1. Click **Choose Files** to upload one or more mono audio stems (e.g., `.wav`, `.mp3`).
2. Put on headphones.
3. Click and drag the colored spheres in the 3D room. You will hear the audio pan and move around your head in real-time.
4. Click **Start Recording** to capture a live mix, then click **Stop Recording** to download the resulting audio file.
5. Click **Export IAMF Config** to download the exact 3D coordinates of your stems as a JSON file.

## Roadmap / Future Features
- **Native `iamf-tools` Integration:** Build a companion script (Python/Shell) that takes the exported JSON coordinates and uses the official `iamf-tools` Bazel project to encode the audio into a final binary `.mp4`/`.iamf` file.
- **Transport Controls:** Add Play, Pause, Stop, and Rewind buttons to control the Web Audio playback loop.
- **Multi-Track Volume Control:** Add individual gain sliders for each uploaded stem.
- **Stereo and Multi-Channel Support:** Expand the `AudioManager` and WebAssembly bridge to support stereo files or 5.1/7.1 beds, rather than forcing all inputs to mono point sources.
- **Save/Load Project State:** Allow users to save their 3D arrangement and reload it in a future session.