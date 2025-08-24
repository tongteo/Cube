#include <emscripten.h>
#include "cubesolver.h"
#include <stdbool.h>

EMSCRIPTEN_KEEPALIVE
const char* solve_cube_wasm(char* scramble) {
    static bool wasm_setup_done = false;
    if (!wasm_setup_done) {
        if (setup("/data")) {
            wasm_setup_done = true;
        }
    }
    return solve_scramble(scramble);
}
