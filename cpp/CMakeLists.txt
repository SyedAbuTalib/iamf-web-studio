cmake_minimum_required(VERSION 3.28)
project(ObrWasmModule)

set(CMAKE_CXX_STANDARD 20)

# Make sure we're using Emscripten
if (NOT EMSCRIPTEN)
    message(FATAL_ERROR "This project requires Emscripten to compile to WebAssembly.")
endif()

# Fetch and build Google OBR directly from GitHub
include(FetchContent)
FetchContent_Declare(
    obr
    GIT_REPOSITORY https://github.com/google/obr.git
    GIT_TAG main
)
FetchContent_MakeAvailable(obr)

add_executable(obr_module ObrWrapper.cpp)

# Link against the obr target built by FetchContent
target_link_libraries(obr_module PRIVATE obr)

# Include directories from OBR (FetchContent populates obr_SOURCE_DIR)
target_include_directories(obr_module PRIVATE ${obr_SOURCE_DIR})

# Emscripten specific linker flags
set_target_properties(obr_module PROPERTIES LINK_FLAGS "\
    -lembind \
    -s EXPORT_ES6=1 \
    -s MODULARIZE=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s EXPORTED_FUNCTIONS=\"['_malloc', '_free']\" \
    -s EXPORTED_RUNTIME_METHODS=\"['ccall', 'cwrap', 'HEAPF32']\" \
")

# Copy the output to the public/wasm directory
set_target_properties(obr_module PROPERTIES 
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_SOURCE_DIR}/../public/wasm"
)