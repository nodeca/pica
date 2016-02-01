/*global window,document*/
'use strict';


var unsharp = require('./pure/unsharp');


function error(msg) {
  try { (window.console.error || window.console.log).call(window.console, msg); } catch (__) {}
}


function checkGlError(gl) {
  var e = gl.getError();
  if (e !== gl.NO_ERROR) { throw new Error('gl error ' + e); }
}


function createGl(canvas) {
  return canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
}


function createShader(gl, type, src) {
  var shader = gl.createShader(type);

  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    error('Shader compile error: ' + gl.getShaderInfoLog(shader) + '. Source: `' + src + '`');
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}


function createProgram(gl, shaders, attrs, locations) {
  var program = gl.createProgram();

  shaders.forEach(function (shader) {
    gl.attachShader(program, shader);
  });

  if (attrs) {
    attrs.forEach(function (attr, idx) {
      gl.bindAttribLocation(program, locations ? locations[idx] : idx, attr);
    });
  }

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    error('Program linking error: ' + gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}


function createShader2(gl, vsh, fsh) {
  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vsh);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsh);
  var program = createProgram(gl, [ vertexShader, fragmentShader ]);
  checkGlError(gl);
  return program;
}


var shadersCache = {};


function loadShaders() {
  if (Object.keys(shadersCache).length) {
    return;
  }

  var fs = require('fs');

  /*eslint-disable no-path-concat*/
  shadersCache['#vsh-basic'] =
    fs.readFileSync(__dirname + '/webgl/vsh-basic.vert', 'utf8');
  shadersCache['#fsh-box-1d-covolve-horizontal'] =
    fs.readFileSync(__dirname + '/webgl/fsh-box-1d-covolve-horizontal.frag', 'utf8');
  shadersCache['#fsh-box-1d-covolve-vertical'] =
    fs.readFileSync(__dirname + '/webgl/fsh-box-1d-covolve-vertical.frag', 'utf8');
  shadersCache['#fsh-hamming-1d-covolve-horizontal'] =
    fs.readFileSync(__dirname + '/webgl/fsh-hamming-1d-covolve-horizontal.frag', 'utf8');
  shadersCache['#fsh-hamming-1d-covolve-vertical'] =
    fs.readFileSync(__dirname + '/webgl/fsh-hamming-1d-covolve-vertical.frag', 'utf8');
  shadersCache['#fsh-lanczos-1d-covolve-horizontal'] =
    fs.readFileSync(__dirname + '/webgl/fsh-lanczos-1d-covolve-horizontal.frag', 'utf8');
  shadersCache['#fsh-lanczos-1d-covolve-vertical'] =
    fs.readFileSync(__dirname + '/webgl/fsh-lanczos-1d-covolve-vertical.frag', 'utf8');
}


function createShader2file(gl, vshFile, fshFile) {
  var vsh = shadersCache[vshFile];
  var fsh = shadersCache[fshFile];
  return createShader2(gl, vsh, fsh);
}


function setAttributeValues(gl, program, name, values, options) {
  var a = gl.getAttribLocation(program, name);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, options.elementSize, gl.FLOAT, false, 0, 0);
  checkGlError(gl);
}


function loadTexture(gl, texUnit, data) {
  var tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + texUnit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
  checkGlError(gl);
  return tex;
}


function setUniform1i(gl, program, name, i0) {
  var u = gl.getUniformLocation(program, name);
  gl.uniform1i(u, i0);
}


function setUniform1f(gl, program, name, f0) {
  var u = gl.getUniformLocation(program, name);
  gl.uniform1f(u, f0);
}


function setUniform2f(gl, program, name, f0, f1) {
  var u = gl.getUniformLocation(program, name);
  gl.uniform2f(u, f0, f1);
}


function vec2Rectangle(x, y, w, h) {
  var x1 = x;
  var x2 = x + w;
  var y1 = y;
  var y2 = y + h;
  return [ x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2 ];
}


function createTextureSize(gl, texUnit, width, height) {
  var tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + texUnit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  checkGlError(gl);
  return tex;
}


function setupTextureFBO(gl, texUnit, width, height) {
  var texture = createTextureSize(gl, texUnit, width, height);

  var oldFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);

  var fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

//  gl.viewport(0, 0, width, height);

  checkGlError(gl);

  return {
    fbo: fbo,
    texture: texture,
    oldFbo: oldFbo
  };
}


function webglProcessResize(from, gl, options) {

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  var bigsize = {
    width: from.width,
    height: from.height
  };

  loadShaders();

  var texUnit0 = 0;
  /*var tex = */loadTexture(gl, texUnit0, from);

  var tsize = {
    width: bigsize.width,
    height: bigsize.height
  };

  // resize [

  function convolve(texUnit0, texWidth, texHeight, texUnit, fsh, winSize, width, height) {
    var outsize = {
      width: width,
      height: height
    };

    var program = createShader2file(gl, '#vsh-basic', fsh);
    gl.useProgram(program);

    setUniform1f(gl, program, 'u_winSize', winSize);
    setUniform1i(gl, program, 'u_image', texUnit0);
    setUniform2f(gl, program, 'u_imageSize', texWidth, texHeight);
    setUniform2f(gl, program, 'u_resolution', outsize.width, outsize.height);
    setAttributeValues(gl, program, 'a_texCoord',
      [ 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1 ], { elementSize: 2 });
    setAttributeValues(gl, program, 'a_position',
      vec2Rectangle(0, 0, outsize.width, outsize.height), { elementSize: 2 });
    gl.viewport(0, 0, outsize.width, outsize.height);

    var fboObject = setupTextureFBO(gl, texUnit, outsize.width, outsize.height);

    gl.viewport(0, 0, outsize.width, outsize.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboObject.oldFbo);

    checkGlError(gl);

    return fboObject;
  }

  var winSize = typeof options.quality === 'undefined' ? 3 : options.quality;

  var texUnit2 = 2;
  var texUnit3 = 3;

  var shaders = [
    { // Nearest neibor (Box)
      win: 0.5,
      horizontal: '#fsh-box-1d-covolve-horizontal',
      vertical: '#fsh-box-1d-covolve-vertical'
    },
    { // Hamming
      win: 1.0,
      horizontal: '#fsh-hamming-1d-covolve-horizontal',
      vertical: '#fsh-hamming-1d-covolve-vertical'
    },
    { // Lanczos, win = 2
      win: 2.0,
      horizontal: '#fsh-lanczos-1d-covolve-horizontal',
      vertical: '#fsh-lanczos-1d-covolve-vertical'
    },
    { // Lanczos, win = 3
      win: 3.0,
      horizontal: '#fsh-lanczos-1d-covolve-horizontal',
      vertical: '#fsh-lanczos-1d-covolve-vertical'
    }
  ];

  convolve(texUnit0, tsize.width, tsize.height,
    texUnit2, shaders[winSize].horizontal, shaders[winSize].win, gl.canvas.width, tsize.height);

  var finalFboObject = convolve(texUnit2, gl.canvas.width, tsize.height,
    texUnit3, shaders[winSize].vertical, shaders[winSize].win, gl.canvas.width, gl.canvas.height);

  // resize ]

  gl.flush();

  var fb = gl.createFramebuffer();

  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, finalFboObject.texture, 0);

  var fb_status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

  if (fb_status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error('Bad framebuffer status: ' + fb_status);
  }

  var width = gl.canvas.width;
  var height = gl.canvas.height;
  var pixels = new Uint8Array(width * height * 4);

  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  var unsharpAmount = typeof options.unsharpAmount === 'undefined' ? 0 : (options.unsharpAmount | 0);
  var unsharpRadius = typeof options.unsharpRadius === 'undefined' ? 0 : (options.unsharpRadius);
  var unsharpThreshold = typeof options.unsharpThreshold === 'undefined' ? 0 : (options.unsharpThreshold | 0);

  if (unsharpAmount) {
    unsharp(pixels, width, height, unsharpAmount, unsharpRadius, unsharpThreshold);
  }

  var i;

  // Kill alpha for sure, if disabled.
  if (!options.alpha) {
    for (i = pixels.length - 1; i > 0; i = i - 4) { pixels[i] = 255; }
  }

  // Flip result vertically
  var flipped = new Uint8Array(pixels.length),
      line, p0, p1;

  for (line = height - 1; line >= 0; line--) {
    p0 = (line * width) << 2;
    p1 = ((height - 1 - line) * width) << 2;
    for (i = width - 1; i >= 0; i--) {
      flipped[p0] = pixels[p1];
      flipped[p0 + 1] = pixels[p1 + 1];
      flipped[p0 + 2] = pixels[p1 + 2];
      flipped[p0 + 3] = pixels[p1 + 3];
      p0 = p0 + 4;
      p1 = p1 + 4;
    }
  }

  return flipped;
}


module.exports = function (from, to, options, callback) {
  var gl, canvas;

  try {
    // create temporarry canvas [

    canvas = document.createElement('canvas');
    canvas.id = 'pica-webgl-temporarry-canvas';
    canvas.height = to.height;
    canvas.width = to.width;
    document.body.appendChild(canvas);

    // create temporarry canvas ]

    gl = createGl(canvas);

    var data = webglProcessResize(from, gl, options);

    gl.finish();
    document.body.removeChild(canvas);

    var ctxTo = to.getContext('2d');
    var imageDataTo = ctxTo.createImageData(to.width, to.height);

    imageDataTo.data.set(data);
    ctxTo.putImageData(imageDataTo, 0, 0);

    callback(null, data);
  } catch (e) {
    error(e);
    gl.finish();
    document.body.removeChild(canvas);
    callback(e);
  }

  return null; // No webworker
};
