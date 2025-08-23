solver: ./src/solver.c ./src/solver_library.c ./src/utils.c ./src/cube.c ./src/cross.c ./src/f2l.c ./src/lastlayer.c
	gcc  -o ./bin/solver ./src/solver.c ./src/solver_library.c ./src/utils.c ./src/cube.c ./src/cross.c ./src/f2l.c ./src/lastlayer.c
clean:
	rm -f bin/*
