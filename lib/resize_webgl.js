/*global window,document*/
'use strict';


var unsharp = require('./js/unsharp');
var generateId = require('./js/generate_id');

// shaders

var shadersContent = {};

/*eslint-disable no-path-concat*/
shadersContent['#vsh-basic'] =
  require('fs').readFileSync(__dirname + '/webgl/vsh-basic.vert', 'utf8');
shadersContent['#fsh-lanczos1d-optimized-tpl'] =
  require('fs').readFileSync(__dirname + '/webgl/fsh-lanczos1d-optimized-tpl.frag', 'utf8');

// optimization

var FILTER_INFO = [
  { // Nearest neibor (Box)
    win: 0.5,
    filter: function (x) {
      return (x >= -0.5 && x < 0.5) ? 1.0 : 0.0;
    }
  },
  { // Hamming
    win: 1.0,
    filter: function (x) {
      if (x <= -1.0 || x >= 1.0) { return 0.0; }
      if (x > -1.19209290E-07 && x < 1.19209290E-07) { return 1.0; }
      var xpi = x * Math.PI;
      return ((Math.sin(xpi) / xpi) *  (0.54 + 0.46 * Math.cos(xpi / 1.0)));
    }
  },
  { // Lanczos, win = 2
    win: 2.0,
    filter: function (x) {
      if (x <= -2.0 || x >= 2.0) { return 0.0; }
      if (x > -1.19209290E-07 && x < 1.19209290E-07) { return 1.0; }
      var xpi = x * Math.PI;
      return (Math.sin(xpi) / xpi) * Math.sin(xpi / 2.0) / (xpi / 2.0);
    }
  },
  { // Lanczos, win = 3
    win: 3.0,
    filter: function (x) {
      if (x <= -3.0 || x >= 3.0) { return 0.0; }
      if (x > -1.19209290E-07 && x < 1.19209290E-07) { return 1.0; }
      var xpi = x * Math.PI;
      return (Math.sin(xpi) / xpi) * Math.sin(xpi / 3.0) / (xpi / 3.0);
    }
  }
];

// error

function error(msg) {
  try {
    (window.console.error || window.console.log).call(window.console, msg);
  } catch (__) {}
}


function checkGlError(gl) {
  var e = gl.getError();
  if (e !== gl.NO_ERROR) { throw new Error('gl error ' + e); }
}

// create

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

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    error('Program linking error: ' + gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
  }

  checkGlError(gl);
  return program;
}

// shader params

function setAttributeValues(gl, program, name, values, options) {
  var a = gl.getAttribLocation(program, name);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, options.elementSize, gl.FLOAT, false, 0, 0);
  checkGlError(gl);
}


function setUniform1i(gl, program, name, i0) {
  var u = gl.getUniformLocation(program, name);
  gl.uniform1i(u, i0);
}


function setUniform2f(gl, program, name, f0, f1) {
  var u = gl.getUniformLocation(program, name);
  gl.uniform2f(u, f0, f1);
}

// texture

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

// process

function vec2Rectangle(x, y, w, h) {
  var x1 = x;
  var x2 = x + w;
  var y1 = y;
  var y2 = y + h;
  return [ x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2 ];
}

function generateFragmentShader(options) {
  var template = shadersContent['#fsh-lanczos1d-optimized-tpl'];

  var direction = options.direction;

  var scaleW = options.texW / options.destW,
      scaleH = options.texH / options.destH,
      scale = direction === 'horizontal' ? scaleW : scaleH;

  // filter

  var quality = 3;

  var filterFunction = FILTER_INFO[quality].filter;

  var winSize = FILTER_INFO[quality].win;

  // kernel processing

  var isHorizontal = direction === 'horizontal';

  var pixelSizeX = 1.0 / options.texW,
      pixelSizeY = 1.0 / options.texH,
      pixelSize = isHorizontal ? pixelSizeX : pixelSizeY;

  var count = Math.ceil(winSize * scale) * 2.0;

  var code = 'float total = 0.0;\ngl_FragColor = vec4(0.0);\n';

  function float(v) {
    return v.toFixed(20);
  }

  for (var i = 0; i < count + 1; i++) {
    var offset = i - count / 2.0;
    var x = (offset) / scale;
    var kv = filterFunction(x);

    var p = pixelSize * offset;
    var px = isHorizontal ? p : 0.0;
    var py = isHorizontal ? 0.0 : p;

    code += 'addPoint(vec2(' + float(px) + ', ' + float(py) + '), ' + float(kv) + ', total);\n';
  }

  code += 'gl_FragColor /= vec4(total);';

  var fragmentShader = template.replace('__CODE__', code);

  return fragmentShader;
}

function createProgramOptimized(gl, options) {
  var vertexShader = createShader(gl, gl.VERTEX_SHADER, shadersContent['#vsh-basic']);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, generateFragmentShader(options));

  return createProgram(gl, vertexShader, fragmentShader);
}

function convolveOptimized(gl, texUnit0, texW, texH, texUnit, direction, destW, destH, flipY) {

  var programOptions = {
    direction: direction,
    texW: texW,
    texH: texH,
    destW: destW,
    destH: destH
  };

  var program = createProgramOptimized(gl, programOptions);

  gl.useProgram(program);

  setUniform1i(gl, program, 'u_image', texUnit0);
//  setUniform2f(gl, program, 'u_imageSize', texWidth, texHeight);
  setUniform2f(gl, program, 'u_resolution', destW, destH);

  setAttributeValues(gl, program, 'a_texCoord',
    [ 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1 ], { elementSize: 2 });
  setAttributeValues(gl, program, 'a_position',
    !flipY ? vec2Rectangle(0, 0, destW, destH) : vec2Rectangle(0, destH, destW, -destH), { elementSize: 2 });

  gl.viewport(0, 0, destW, destH);

  var fboObject = setupTextureFBO(gl, texUnit, destW, destH);

  gl.viewport(0, 0, destW, destH);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fboObject.oldFbo);

  checkGlError(gl);

  return fboObject;
}


function webglProcessResizeOptimized(from, gl, options) {
  var srcW = from.naturalWidth || from.width,
      srcH = from.naturalHeight || from.height,
      dstW = gl.canvas.width,
      dstH = gl.canvas.height;

  var texUnit0 = 0;
  var texUnit1 = 1;
  var texUnit2 = 2;

  loadTexture(gl, texUnit0, from);

  convolveOptimized(gl, texUnit0, srcW, srcH, texUnit1, 'horizontal', dstW, srcH, false);

  var finalFboObject = convolveOptimized(gl, texUnit1, dstW, srcH, texUnit2, 'vertical', dstW, dstH, true);

  gl.flush();

  var fb = gl.createFramebuffer();

  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, finalFboObject.texture, 0);

  var fb_status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

  if (fb_status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error('Bad framebuffer status: ' + fb_status);
  }

  // Clear alpha for sure, if disabled.
  if (!options.alpha) {
    gl.clearColor(1, 1, 1, 1);
    gl.colorMask(false, false, false, true);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  var pixels = new Uint8Array(dstW * dstH * 4);

  gl.readPixels(0, 0, dstW, dstH, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  var unsharpAmount = typeof options.unsharpAmount === 'undefined' ? 0 : (options.unsharpAmount | 0);
  var unsharpRadius = typeof options.unsharpRadius === 'undefined' ? 0 : (options.unsharpRadius);
  var unsharpThreshold = typeof options.unsharpThreshold === 'undefined' ? 0 : (options.unsharpThreshold | 0);

  if (unsharpAmount) {
    unsharp(pixels, dstW, dstH, unsharpAmount, unsharpRadius, unsharpThreshold);
  }

  return pixels;
}

// exports

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

    var data = webglProcessResizeOptimized(from, gl, options);


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

  return generateId();
};

module.exports.terminate = function () {};
