#include <emscripten.h>
#include "cubesolver.h"
#include <stdbool.h>
#include <string.h>

// Keep the original scramble solver for convenience
EMSCRIPTEN_KEEPALIVE
const char* solve_scramble_wasm(char* scramble) {
    static bool wasm_setup_done = false;
    if (!wasm_setup_done) {
        if (setup("/data")) {
            wasm_setup_done = true;
        }
    }
    return solve_scramble(scramble);
}

// Add a new function to solve from a state string
EMSCRIPTEN_KEEPALIVE
const char* solve_from_state_wasm(char* state_string) {
    static bool wasm_setup_done = false;
    if (!wasm_setup_done) {
        if (setup("/data")) {
            wasm_setup_done = true;
        }
    }

    int cube[6][9];
    // The C solver expects the order: F, R, B, L, U, D
    // The JS code will now provide the state string in this exact order.
    char f[10], r[10], b[10], l[10], u[10], d[10];
    strncpy(f, state_string, 9); f[9] = '\0';
    strncpy(r, state_string + 9, 9); r[9] = '\0';
    strncpy(b, state_string + 18, 9); b[9] = '\0';
    strncpy(l, state_string + 27, 9); l[9] = '\0';
    strncpy(u, state_string + 36, 9); u[9] = '\0';
    strncpy(d, state_string + 45, 9); d[9] = '\0';

    color_cube(cube, f, r, b, l, u, d);
    return solve(cube);
}
