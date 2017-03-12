// PPM image format save/load. This format is very easy
// to read/write without canvas and extra dependencies.
//
// Implementation is simplified, for test only.
//
'use strict';


function is_empty(ch) {
  return ch <= 0x20;
}


function decode(src) {
  var pos = 0;

  function peek_string(src) {
    var result = '';

    while (pos <= src.length && !is_empty(src[pos])) {
      result += String.fromCharCode(src[pos]);
      pos++;
    }

    pos++;

    return result;
  }

  if (peek_string(src) !== 'P6') throw new Error('Fromat should be P6');

  var width  = parseInt(peek_string(src), 10);
  var height = parseInt(peek_string(src), 10);

  var colors = parseInt(peek_string(src), 10);

  if (colors > 255) throw new Error('2-bytes per channel are not supported');

  var pixels = width * height;

  if ((src.length - pos) !== pixels * 3) {
    throw new Error('Binary content does not match header');
  }

  var buffer = new Uint8Array(pixels * 4);
  var dest_pos = 0;

  while (pixels > 0) {
    buffer[dest_pos + 0] = src[pos + 0];
    buffer[dest_pos + 1] = src[pos + 1];
    buffer[dest_pos + 2] = src[pos + 2];
    buffer[dest_pos + 3] = 0xFF; // alpha
    dest_pos += 4;
    pos += 3;
    pixels--;
  }

  return {
    width: width,
    height: height,
    buffer: buffer
  };
}


function encode(buffer, width, height) {
  if (arguments.length === 1) {
    width  = buffer.width;
    height = buffer.height;
    buffer = buffer.buffer;
  }

  var header = 'P6\n' + width + ' ' + height + '\n255\n';

  var pixels = width * height;

  if (buffer.length !== pixels * 4) {
    throw new Error('Data size does not match width*height');
  }

  var result = new Uint8Array(header.length + pixels * 3);

  var dest_pos = 0;

  while (dest_pos < header.length) {
    result[dest_pos] = header.charCodeAt(dest_pos);
    dest_pos++;
  }

  var src_pos = 0;

  while (pixels > 0) {
    result[dest_pos + 0] = buffer[src_pos + 0];
    result[dest_pos + 1] = buffer[src_pos + 1];
    result[dest_pos + 2] = buffer[src_pos + 2];
    dest_pos += 3;
    src_pos  += 4;
    pixels--;
  }

  return result;
}


exports.encode = encode;
exports.decode = decode;


/*describe.only('ppm', function () {
  var join = require('path').join;
  var fs   = require('fs');

  var src_path = join(__dirname, 'fixtures', 'original.ppm');

  it('decode/encode', function () {
    var src = fs.readFileSync(src_path);
    var decoded = decode(src);
    var encoded = encode(decoded);

    // fs.writeFileSync(join(__dirname, 'fixtures', 'test.ppm'), Buffer.from(encoded));

    for (var i = 0; i < src.length; i++) {
      if (src[i] !== encoded[i]) {
        throw new Error('pos: ' + i + ', expected: ' + src[i] + ' instead of ' + encoded[i]);
      }
    }
  });

});*/
