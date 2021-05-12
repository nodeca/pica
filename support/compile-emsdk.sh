#!/bin/bash

set -e -x

emcc lib/mm_resize/convolve.c -v -O3 -s WASM=1 -s SIDE_MODULE=1 -o lib/mm_resize/convolve.wasm
./support/wasm_wrap.js lib/mm_resize/convolve.wasm lib/mm_resize/convolve_wasm_base64.js

emcc lib/mm_unsharp_mask/unsharp_mask.c -v -O3 -s WASM=1 -s SIDE_MODULE=1 -o lib/mm_unsharp_mask/unsharp_mask.wasm
./support/wasm_wrap.js lib/mm_unsharp_mask/unsharp_mask.wasm lib/mm_unsharp_mask/unsharp_mask_wasm_base64.js
