#include "ObrWrapper.h"
#include <emscripten/bind.h>
#include <iostream>
#include <cmath>

using namespace emscripten;

ObrWrapper::ObrWrapper() : m_audioElementIndex(0) {}

ObrWrapper::~ObrWrapper() {}

void ObrWrapper::init(int sampleRate, int bufferSize) {
    m_renderer = std::make_unique<obr::ObrImpl>(bufferSize, sampleRate);
    
    // Add a single Mono Object
    auto status = m_renderer->AddAudioElement(obr::AudioElementType::kObjectMono, obr::BinauralFilterProfile::kAmbient);
    if (!status.ok()) {
        std::cerr << "Failed to add audio element: " << status.ToString() << std::endl;
    }
    
    // Track index is 0 since we just added one
    m_audioElementIndex = 0;
    
    std::cout << "ObrWrapper initialized. SampleRate: " << sampleRate << " BufferSize: " << bufferSize << std::endl;
}

void ObrWrapper::processAudioBlock(uintptr_t inputBufferRaw, int numSamples, float x, float y, float z, uintptr_t outputLeftRaw, uintptr_t outputRightRaw) {
    float* inputBuffer = reinterpret_cast<float*>(inputBufferRaw);
    float* outputLeft = reinterpret_cast<float*>(outputLeftRaw);
    float* outputRight = reinterpret_cast<float*>(outputRightRaw);

    if (!m_renderer) return;

    // Convert XYZ to Azimuth, Elevation, Distance
    // Three.js convention: Y is up, X is right, Z is backward (out of screen)
    float distance = std::sqrt(x*x + y*y + z*z);
    
    // Default forward if distance is too small
    float azimuth = 0.0f;
    float elevation = 0.0f;
    
    if (distance > 0.001f) {
        azimuth = std::atan2(-x, -z) * 180.0f / M_PI; // degrees
        elevation = std::asin(y / distance) * 180.0f / M_PI; // degrees
    }

    m_renderer->UpdateObjectPosition(m_audioElementIndex, azimuth, elevation, distance);

    // Create OBR AudioBuffers
    obr::AudioBuffer input_audio_buffer(1, numSamples);
    for (int i = 0; i < numSamples; ++i) {
        input_audio_buffer[0][i] = inputBuffer[i];
    }

    obr::AudioBuffer output_audio_buffer(2, numSamples);

    m_renderer->Process(input_audio_buffer, &output_audio_buffer);

    // Copy back to output pointers
    for (int i = 0; i < numSamples; ++i) {
        outputLeft[i] = output_audio_buffer[0][i];
        outputRight[i] = output_audio_buffer[1][i];
    }
}

EMSCRIPTEN_BINDINGS(obr_module) {
    class_<ObrWrapper>("ObrWrapper")
        .constructor<>()
        .function("init", &ObrWrapper::init)
        .function("processAudioBlock", &ObrWrapper::processAudioBlock, allow_raw_pointers());
}