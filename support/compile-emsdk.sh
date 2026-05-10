#!/bin/bash

set -e -x

emcc src/mm_resize/convolve.c -v -O3 -s WASM=1 -s SIDE_MODULE=1 -o src/mm_resize/convolve.wasm
./support/wasm_wrap.js src/mm_resize/convolve.wasm src/mm_resize/convolve_wasm_base64.ts

emcc src/mm_unsharp_mask/unsharp_mask.c -v -O3 -s WASM=1 -s SIDE_MODULE=1 -o src/mm_unsharp_mask/unsharp_mask.wasm
./support/wasm_wrap.js src/mm_unsharp_mask/unsharp_mask.wasm src/mm_unsharp_mask/unsharp_mask_wasm_base64.ts
