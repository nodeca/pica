import { build, mergeConfig } from 'vite'


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


async function buildMain ({ entry, name, jsFile, mjsFile, minify, emptyOutDir, define }) {
  await build(withConfig({
    define,
    build: {
      emptyOutDir,
      minify,
      lib: {
        entry,
        name: 'pica',
        formats: ['umd', 'es'],
        fileName: format => (format === 'es' ? mjsFile : jsFile)
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


async function buildInlineWorker ({ minify }) {
  const result = await build(withConfig({
    build: {
      write: false,
      minify,
      sourcemap: false,
      lib: {
        entry: 'lib/pica_worker.js',
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


async function buildWorker (fileName, emptyOutDir) {
  await build(withConfig({
    build: {
      emptyOutDir,
      minify: false,
      lib: {
        entry: 'lib/pica_worker.js',
        name: 'picaWorker',
        formats: ['iife'],
        fileName: () => fileName
      }
    }
  }))
}


const inlineWorker = await buildInlineWorker({ minify: false })
const inlineWorkerMin = await buildInlineWorker({ minify: 'terser' })

await buildMain({
  entry: 'lib/pica_main.js',
  name: 'pica',
  jsFile: 'pica.js',
  mjsFile: 'pica.mjs',
  minify: false,
  emptyOutDir: true,
  define: {
    __PICA_WORKER_SRC__: JSON.stringify(inlineWorker)
  }
})

await buildMain({
  entry: 'lib/pica_main.js',
  name: 'pica',
  jsFile: 'pica.min.js',
  mjsFile: 'pica.min.mjs',
  minify: 'terser',
  emptyOutDir: false,
  define: {
    __PICA_WORKER_SRC__: JSON.stringify(inlineWorkerMin)
  }
})

await buildMain({
  entry: 'lib/pica_main.js',
  name: 'pica',
  jsFile: 'pica_main.js',
  mjsFile: 'pica_main.mjs',
  minify: false,
  emptyOutDir: false
})

await buildWorker('pica_worker.js', false)
await buildWorker('pica_worker.mjs', false)
