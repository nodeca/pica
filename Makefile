NPM_PACKAGE := $(shell node -e 'process.stdout.write(require("./package.json").name)')
NPM_VERSION := $(shell node -e 'process.stdout.write(require("./package.json").version)')

TMP_PATH    := /tmp/${NPM_PACKAGE}-$(shell date +%s)

REMOTE_NAME ?= origin
REMOTE_REPO ?= $(shell git config --get remote.${REMOTE_NAME}.url)

CURR_HEAD   := $(firstword $(shell git show-ref --hash HEAD | cut -b -6) master)
GITHUB_PROJ := nodeca/${NPM_PACKAGE}

wasm:
	@# install: multimath => ./support/llvm_install.sh
	@# https://github.com/nodeca/multimath
	~/llvmwasm/bin/clang -emit-llvm --target=wasm32 -O3 -c -o ./lib/mm_resize/convolve.bc ./lib/mm_resize/convolve.c
	~/llvmwasm/bin/llc -asm-verbose=false -o ./lib/mm_resize/convolve.s ./lib/mm_resize/convolve.bc
	~/llvmwasm/bin/s2wasm --import-memory ./lib/mm_resize/convolve.s > ./lib/mm_resize/convolve.wast
	~/llvmwasm/bin/wasm-opt ./lib/mm_resize/convolve.wast -O3 -o ./lib/mm_resize/convolve.wasm
	rm ./lib/mm_resize/convolve.bc
	rm ./lib/mm_resize/convolve.s
	node ./node_modules/multimath/support/wasm_wrap.js ./lib/mm_resize/convolve.wasm ./lib/mm_resize/convolve_wasm_base64.js
	make browserify

publish:
	@if test 0 -ne `git status --porcelain | wc -l` ; then \
		echo "Unclean working tree. Commit or stash changes first." >&2 ; \
		exit 128 ; \
		fi
	@if test 0 -ne `git fetch ; git status | grep '^# Your branch' | wc -l` ; then \
		echo "Local/Remote history differs. Please push/pull changes." >&2 ; \
		exit 128 ; \
		fi
	@if test 0 -ne `git tag -l ${NPM_VERSION} | wc -l` ; then \
		echo "Tag ${NPM_VERSION} exists. Update package.json" >&2 ; \
		exit 128 ; \
		fi
	git tag ${NPM_VERSION} && git push origin ${NPM_VERSION}
	npm publish https://github.com/${GITHUB_PROJ}/tarball/${NPM_VERSION}


.PHONY: publish lint doc
.SILENT: help lint
