import { build, mergeConfig } from 'vite'
import { rm } from 'node:fs/promises'

const TARGET = 'es2015'

const common = {
  configFile: false,
  define: {
    __PICA_WORKER_SRC__: JSON.stringify('')
  },
  logLevel: 'info',
  build: {
    target: TARGET,
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      output: {
        banner: '/*!\n\npica\nhttps://github.com/nodeca/pica\n\n*/'
      }
    }
  },
  worker: {
    format: 'iife'
  }
}

function stripRegionComments () {
  return {
    name: 'strip-region-comments',
    renderChunk (code) {
      code = code.replace(/\\n\t?\/\/#(?:end)?region.*?(?=\\n)/g, '')

      return {
        code: code.replace(/^\s*\/\/#(?:end)?region.*\n/gm, ''),
        map: null
      }
    }
  }
}

function withConfig (config) {
  return mergeConfig(common, {
    ...config,
    plugins: [
      stripRegionComments(),
      ...(config.plugins || [])
    ]
  })
}

async function buildMainUmd ({ name, jsFile, minify, define }) {
  await build(withConfig({
    define,
    build: {
      minify,
      lib: {
        entry: 'src/pica_main_cjs_proxy.ts',
        name: 'pica',
        formats: ['umd'],
        fileName: () => jsFile
      },
      rollupOptions: {
        output: {
          exports: 'default',
          name
        }
      }
    }
  }))
}

async function buildMainEsm ({ entry, mjsFile, minify, define }) {
  await build(withConfig({
    define,
    build: {
      minify,
      lib: {
        entry,
        name: 'pica',
        formats: ['es'],
        fileName: () => mjsFile
      }
    }
  }))
}

async function buildInlineWorker ({ minify }) {
  const result = await build(withConfig({
    build: {
      write: false,
      minify,
      sourcemap: false,
      lib: {
        entry: 'src/pica_worker.ts',
        name: 'picaWorker',
        formats: ['iife'],
        fileName: () => 'pica_inline_worker.js'
      }
    }
  }))

  const output = Array.isArray(result) ? result.flatMap(item => item.output) : result.output
  const chunk = output.find(item => item.type === 'chunk' && item.fileName === 'pica_inline_worker.js')

  if (!chunk) throw new Error('Inline worker build failed')

  return `${chunk.code}\n//# sourceURL=pica-inline-worker.js`
}

async function buildWorker (fileName) {
  await build(withConfig({
    build: {
      minify: false,
      lib: {
        entry: 'src/pica_worker.ts',
        name: 'picaWorker',
        formats: ['iife'],
        fileName: () => fileName
      }
    }
  }))
}

const inlineWorker = await buildInlineWorker({ minify: false })
const inlineWorkerMin = await buildInlineWorker({ minify: 'terser' })

await rm('dist', { recursive: true, force: true })

await buildMainUmd({
  name: 'pica',
  jsFile: 'pica.js',
  minify: false,
  define: {
    __PICA_WORKER_SRC__: JSON.stringify(inlineWorker)
  }
})

await buildMainEsm({
  entry: 'src/pica_main.ts',
  mjsFile: 'pica.mjs',
  minify: false,
  define: {
    __PICA_WORKER_SRC__: JSON.stringify(inlineWorker)
  }
})

await buildMainUmd({
  name: 'pica',
  jsFile: 'pica.min.js',
  minify: 'terser',
  define: {
    __PICA_WORKER_SRC__: JSON.stringify(inlineWorkerMin)
  }
})

await buildMainEsm({
  entry: 'src/pica_main.ts',
  mjsFile: 'pica.min.mjs',
  minify: 'terser',
  define: {
    __PICA_WORKER_SRC__: JSON.stringify(inlineWorkerMin)
  }
})

await buildMainUmd({
  name: 'pica',
  jsFile: 'pica_main.js',
  minify: false
})

await buildMainEsm({
  entry: 'src/pica_main.ts',
  mjsFile: 'pica_main.mjs',
  minify: false
})

await buildWorker('pica_worker.js')
await buildWorker('pica_worker.mjs')
