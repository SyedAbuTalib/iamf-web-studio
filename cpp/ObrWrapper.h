#ifndef OBR_WRAPPER_H
#define OBR_WRAPPER_H

#include <cstdint>
#include <memory>
#include "obr/renderer/obr_impl.h"
#include "obr/renderer/audio_element_type.h"

class ObrWrapper {
public:
    ObrWrapper();
    ~ObrWrapper();

    void init(int sampleRate, int bufferSize);
    void processAudioBlock(uintptr_t inputBufferRaw, int numSamples, float x, float y, float z, uintptr_t outputLeftRaw, uintptr_t outputRightRaw);

private:
    std::unique_ptr<obr::ObrImpl> m_renderer;
    size_t m_audioElementIndex;
};

#endif // OBR_WRAPPER_H