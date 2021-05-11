#!/bin/bash

set -e -x

emcc lib/mm_resize/convolve.c -v -O3 -s WASM=1 -s SIDE_MODULE=1 -o lib/mm_resize/convolve.wasm
./support/wasm_wrap.js lib/unsharp_mask/unsharp_mask.wasm lib/unsharp_mask/unsharp_mask_wasm_base64.js

emcc lib/unsharp_mask/unsharp_mask.c -v -O3 -s WASM=1 -s SIDE_MODULE=1 -o lib/unsharp_mask/unsharp_mask.wasm
./support/wasm_wrap.js lib/unsharp_mask/unsharp_mask.wasm lib/unsharp_mask/unsharp_mask_wasm_base64.js
