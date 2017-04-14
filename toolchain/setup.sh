#!/bin/sh

[ -n "$WORKDIR" ] && [ -n "$INSTALLDIR" ] || { echo "WORKDIR and INSTALLDIR should be set"; exit 1; }

set -e -x
LLVM_REVISION=300398
BINARYEN_COMMIT=ec66e273e350c3d48df0ccaaf73c53b14485848f

mkdir -p $WORKDIR
cd $WORKDIR
# install llvm with support for webassembly target
svn co -q https://llvm.org/svn/llvm-project/llvm/trunk@$LLVM_REVISION llvm
cd $WORKDIR/llvm/tools
svn co -q https://llvm.org/svn/llvm-project/cfe/trunk@$LLVM_REVISION clang
mkdir -p $WORKDIR/llvm-build
cd $WORKDIR/llvm-build
cmake -G "Unix Makefiles" -DCMAKE_INSTALL_PREFIX=$INSTALLDIR -DLLVM_TARGETS_TO_BUILD= -DLLVM_EXPERIMENTAL_TARGETS_TO_BUILD=WebAssembly -DCMAKE_EXE_LINKER_FLAGS="-fuse-ld=gold" -DCMAKE_SHARED_LINKER_FLAGS="-fuse-ld=gold" -DCMAKE_BUILD_TYPE=MinSizeRel $WORKDIR/llvm
make -j $(nproc)
make install
# install binaryen
mkdir -p $WORKDIR/binaryen
cd $WORKDIR/binaryen
git init
git fetch https://github.com/WebAssembly/binaryen.git
git checkout $BINARYEN_COMMIT
cmake -DCMAKE_EXE_LINKER_FLAGS="-fuse-ld=gold" -DCMAKE_SHARED_LINKER_FLAGS="-fuse-ld=gold" -DCMAKE_BUILD_TYPE=MinSizeRel -DCMAKE_INSTALL_PREFIX=$INSTALLDIR .
make -j $(nproc)
make install
