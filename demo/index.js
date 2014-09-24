////////////////////////////////////////////////////////////////////////////////
// performance.now polyfill
(function() {
if(window.performance && window.performance.now) return;
if(!window.performance) window.performance = {};
var methods = ['webkitNow', 'msNow', 'mozNow'];
for(var i = 0; i < methods.length; i++) {
  if(window.performance[methods[i]]) {
    window.performance.now = window.performance[methods[i]];
    return;
  }
}
if(Date.now) {
  window.performance.now = function() { return Date.now(); };
  return;
}
window.performance.now = function() { return +(new Date()); };
})();

////////////////////////////////////////////////////////////////////////////////

var qualityInfo = [
  'Box (win 0.5px)',
  'Hamming (win 1px)',
  'Lanczos (win 2px)',
  'Lanczos (win 3px)',
]

function updateOrig() {
  var src, ctx;

  src = $('#src')[0];
  src.width = img.width;
  src.height = img.height;

  $('#src-info').text('' + img.width + ' x ' + img.height);

  ctx = src.getContext("2d")
  ctx.drawImage(img, 0, 0);
}

var updateResized = _.debounce(function () {
  var dst, ctx, width, start;

  width = $('.pica-options').width();

  // Resize with canvas

  dst = $('#dst-cvs')[0];
  dst.width = width;
  dst.height = img.height * width / img.width;

  start = performance.now();

  ctx = dst.getContext("2d")
  ctx.drawImage(img, 0, 0, dst.width, dst.height);


  $('#dst-cvs-info').text(_.template('<%= time %>ms', {
    time: (performance.now() - start).toFixed(2)
  }));

  // Resize with pica

  dst = $('#dst-pica')[0];
  dst.width = width;
  dst.height = img.height * width / img.width;

  start = performance.now();

  window.pica.resizeCanvas($('#src')[0], dst, quality, function (err) {
    $('#dst-info').text(_.template('<%= time %>ms, <%= info %>', {
      time: (performance.now() - start).toFixed(2),
      info: qualityInfo[quality]
    }));
  });
}, 100);

//
// Init
//
var img = new Image();
var quality = $('#pica-quality').val();

img.src = imageEncoded;

img.onload = function () {
  updateOrig();
  updateResized();
};

$(window).on('resize', updateResized);
$('#dst-pica').on('click', updateResized);
$('#dst-cvs').on('click', updateResized);

$('#pica-quality').on('change', function () {
  quality = $('#pica-quality').val();
  updateResized();
});

$('#upload-btn, #src').on('click', function () {
  $('#upload').trigger('click');
});

$('#upload').on('change', function () {
  var files = $(this)[0].files;

  if (files.length = 0) { return; }

  img.src = window.URL.createObjectURL(files[0]);
});
