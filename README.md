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