## Compiling webassembly code

To build wasm code you should have Docker installed.

Once you have done it the wasm code can be build by running

```bash
make wasm
```
This command uses `docker run nodeca/pica-toolchain` to pull the
toolchain from Docker Hub and run compiler and linker from the 
container.

The local version of the toolchain image could be updated by running

```bash
docker pull nodeca/pica-toolchain
```

If you want for some reason rebuild the image, it could be done by
running

```bash
make build-toolchain
```

The newly build toolchain could also be published to Docker Hub by
running

```bash
make publish-toolchain
```

Alternatively, if you want to avoid using Docker, it is possible to
build the toolchain on a Debian-based system using `toolchain/setup.sh`
script and then build wasm code by running

```bash
make wasm WASM_RUN=""
```
so that `make` would use the toolchain from `PATH`.

There is also `wasm-emsk` target in the Makefile that uses `emcc`, but
note that  `emsdk` DOES NOT supports natively some 64bit operations
and may not work. Also there are some minor interface differences,
see commented code in `mathlib.js` file and Makefile source.
