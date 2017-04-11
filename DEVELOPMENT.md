## Compiling webassembly code

To build wasm code you should install llvm & binaryen.
Note, `emsdk` DOES NOT supports natively some 64bit operations
and may not work. Also there are some minor interface differences,
see commented code in `mathlib.js` file and Makefile source.

Short instructions for linux (tested in Ubuntu 14.04):

```bash
export WORKDIR=~/llvmwasm; mkdir -p $WORKDIR
export INSTALLDIR=$WORKDIR

sudo apt-get install g++-multilib

cd $WORKDIR
svn co http://llvm.org/svn/llvm-project/llvm/trunk llvm

cd $WORKDIR/llvm/tools
svn co http://llvm.org/svn/llvm-project/cfe/trunk clang

mkdir $WORKDIR/llvm-build
cd $WORKDIR/llvm-build
cmake -G "Unix Makefiles" -DCMAKE_INSTALL_PREFIX=$INSTALLDIR -DLLVM_TARGETS_TO_BUILD= -DLLVM_EXPERIMENTAL_TARGETS_TO_BUILD=WebAssembly $WORKDIR/llvm
make
make install

cd $WORKDIR
git clone https://github.com/WebAssembly/binaryen.git
cd $WORKDIR/binaryen
cmake .
make
```
