solver: ./src/solver.c ./src/solver_library.c ./src/utils.c ./src/cube.c ./src/cross.c ./src/f2l.c ./src/lastlayer.c
	gcc  -o ./bin/solver ./src/solver.c ./src/solver_library.c ./src/utils.c ./src/cube.c ./src/cross.c ./src/f2l.c ./src/lastlayer.c

wasm: ./src/solver_library.c ./src/utils.c ./src/cube.c ./src/cross.c ./src/f2l.c ./src/lastlayer.c ./src/wasm_interface.c
	emcc -o ./bin/solver.js ./src/solver_library.c ./src/utils.c ./src/cube.c ./src/cross.c ./src/f2l.c ./src/lastlayer.c ./src/wasm_interface.c --preload-file data -s EXPORTED_FUNCTIONS="['_solve_scramble_wasm', '_solve_from_state_wasm']" -s EXTRA_EXPORTED_RUNTIME_METHODS="['ccall']"

clean:
	rm -f bin/*
