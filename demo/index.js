// //////////////////////////////////////////////////////////////////////////////
// performance.now polyfill
(function () {
  if(window.performance && window.performance.now) return
  if(!window.performance) window.performance = {}
  const methods = ['webkitNow', 'msNow', 'mozNow']
  for(let i = 0; i < methods.length; i++) {
    if(window.performance[methods[i]]) {
      window.performance.now = window.performance[methods[i]]
      return
    }
  }
  if(Date.now) {
    window.performance.now = function () { return Date.now() }
    return
  }
  window.performance.now = function () { return +(new Date()) }
})()

// //////////////////////////////////////////////////////////////////////////////

const filterInfo = {
  box: 'Box (win 0.5px)',
  hamming: 'Hamming (win 1px)',
  lanczos2: 'Lanczos (win 2px)',
  lanczos3: 'Lanczos (win 3px)',
  mks2013: 'MKS 2013 (win 2.5px)'
}

const filter_name = [
  'box',
  'hamming',
  'lanczos2',
  'lanczos3',
  'mks2013'
]


let resizer


const resizer_mode = {
  js: true,
  wasm: true,
  cib: true,
  ww: true
}


function create_resizer () {
  const opts = []

  Object.keys(resizer_mode).forEach(function (k) {
    if (resizer_mode[k]) opts.push(k)
  })

  resizer = window.pica({ features: opts })
  resizer.debug = console.log.bind(console)
}


function updateOrig () {
  let src, ctx

  src = $('#src')[0]
  src.width = img.width
  src.height = img.height

  $('#src-info').text(_.template('<%= w %> x <%= h %>', {
    w: img.width,
    h: img.height
  }))

  ctx = src.getContext("2d")
  ctx.drawImage(img, 0, 0)
}

const updateResized = _.debounce(function () {
  let dst, ctx, width, start, time

  width = $('.pica-options').width()

  // Resize with canvas

  dst = $('#dst-cvs')[0]
  dst.width = width
  dst.height = img.height * width / img.width

  start = performance.now()

  ctx = dst.getContext("2d")
  ctx.drawImage(img, 0, 0, dst.width, dst.height)

  time = (performance.now() - start).toFixed(2)

  $('#dst-cvs-info').text(_.template('<%= time %>ms, <%= w %> x <%= h %>', {
    time,
    w: dst.width,
    h: dst.height
  }))

  // Resize with pica

  dst = $('#dst-pica')[0]
  dst.width = width
  dst.height = img.height * width / img.width

  const offScreenCanvas = document.createElement('canvas')
  offScreenCanvas.width = dst.width
  offScreenCanvas.height = dst.height

  start = performance.now()

  /* createImageBitmap($('#src')[0]).then(image_bitmap => {
    return resizer.resize(image_bitmap, offScreenCanvas, {
      filter: filter,
      unsharpAmount: unsharpAmount,
      unsharpRadius: unsharpRadius,
      unsharpThreshold: unsharpThreshold,
      transferable: true
    });
  })*/
  resizer.resize($('#src')[0], offScreenCanvas, {
    filter,
    unsharpAmount,
    unsharpRadius,
    unsharpThreshold,
    transferable: true
  })
    .then(function () {
      time = (performance.now() - start).toFixed(2)

      // Copy buffer to visible element
      dst.getContext('2d').drawImage(offScreenCanvas, 0, 0)

      let features

      if (resizer.resize_features.cib) {
        features = 'method: CIB'
      } else if (resizer.resize_features.wasm) {
        features = 'method: WASM'
      } else {
        features = 'method: JS'
      }

      if (!resizer.resize_features.cib) {
        if (resizer.resize_features.ww) features += ', use WebWorker'
      }

      $('#dst-features').text(features)

      if (unsharpAmount) {
        $('#dst-info').text(_.template('<%= time %>ms, <%= info %>, Unsharp [<%= amount %>, <%= radius %>, <%= threshold %>]', {
          time,
          info: filterInfo[filter],
          amount: unsharpAmount,
          radius: unsharpRadius,
          threshold: unsharpThreshold
        }))
      } else {
        $('#dst-info').text(_.template('<%= time %>ms, <%= info %>, Unsharp off', {
          time,
          info: filterInfo[filter]
        }))
      }
    })
    .catch(function (err) {
      console.log(err)
      throw err
    })
}, 100)

//
// Init
//
var img = new Image()

var filter = filter_name[Number($('#pica-filter').val())]
var unsharpAmount = Number($('#pica-unsharp-amount').val())
var unsharpRadius = Number($('#pica-unsharp-radius').val())
var unsharpThreshold = Number($('#pica-unsharp-threshold').val())

resizer_mode.ww = $('#pica-use-ww').is(":checked")
resizer_mode.cib = $('#pica-use-cib').is(":checked")
resizer_mode.wasm = $('#pica-use-wasm').is(":checked")

create_resizer()

img.src = imageEncoded

img.onload = function () {
  updateOrig()
  updateResized()
}

$(window).on('resize', _.debounce(updateResized, 1000))
$('#dst-pica').on('click', updateResized)
$('#dst-cvs').on('click', updateResized)


$('#pica-filter').on('change', function () {
  filter = filter_name[Number($('#pica-filter').val())]
  updateResized()
})
$('#pica-unsharp-amount').on('change', function () {
  unsharpAmount = Number($('#pica-unsharp-amount').val())
  updateResized()
})
$('#pica-unsharp-radius').on('change', function () {
  unsharpRadius = Number($('#pica-unsharp-radius').val())
  updateResized()
})
$('#pica-unsharp-threshold').on('change', function () {
  unsharpThreshold = Number($('#pica-unsharp-threshold').val())
  updateResized()
})

$('#pica-use-ww').on('change', function () {
  resizer_mode.ww = $(this).is(":checked")
  create_resizer()
  updateResized()
})
$('#pica-use-cib').on('change', function () {
  resizer_mode.cib = $(this).is(":checked")
  create_resizer()
  updateResized()
})
$('#pica-use-wasm').on('change', function () {
  resizer_mode.wasm = $(this).is(":checked")
  create_resizer()
  updateResized()
})


$('#upload-btn, #src').on('click', function () {
  $('#upload').trigger('click')
})

$('#upload').on('change', function () {
  const files = $(this)[0].files

  if (files.length === 0) { return }

  img.src = window.URL.createObjectURL(files[0])
})
