/* global $, Benchmark */

$(function () {
  const sample = {
    width: 1024,
    height: 1024
  }
  sample.buffer = new Uint8Array(sample.width * sample.height * 4)

  const p = window.pica({ features: ['js'] })

  Benchmark.Suite()

    .add(`Resize of ${sample.width}x${sample.height}`, {
      defer: true,
      fn (defer) {
        p.resizeBuffer({
          src: sample.buffer,
          width: sample.width,
          height: sample.height,
          toWidth: (sample.width * 0.15)|0,
          toHeight: (sample.height * 0.15)|0,
          filter: 'lanczos3'
        })
          .then(() => defer.resolve())
      }
    })

    .add(`Unsharp of ${sample.width}x${sample.height}`, {
      fn () {
        p.__mathlib.unsharp_mask(
          sample.buffer, sample.width, sample.height,
          80, 0.5, 4
        )
      }
    })

    .on('cycle', event => {
      const $el = $('<p></p>')

      $el.text(`> ${event.target}`)
      $('body').append($el)

      console.log(`> ${event.target}`)
    })

    .run()
})
