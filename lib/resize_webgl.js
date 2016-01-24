/*global window,document*/
'use strict';


var unsharp = require('./pure/unsharp');


function error(msg) {
  try { (window.console.error || window.console.log).call(window.console, msg); } catch (__) {}
}


function checkGlError(gl) {
  var e = gl.getError();
  if (e !== gl.NO_ERROR) {
    var msg = 'gl error ' + e;
    throw msg
  }
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
  shadersCache['#fsh-simple-texture'] =
    fs.readFileSync(__dirname + '/webgl/fsh-simple-texture.frag', 'utf8');
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

  var basicProgram;
  var resizeProgram;

  var program;

  var bigsize = {
    width: from.width,
    height: from.height
  };

  loadShaders();

  basicProgram = createShader2file(gl, '#vsh-basic', '#fsh-simple-texture');

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

    resizeProgram = createShader2file(gl, '#vsh-basic', fsh);
    program = resizeProgram;
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

  convolve(texUnit0, tsize.width, tsize.height,
    texUnit2, '#fsh-lanczos-1d-covolve-horizontal', winSize, gl.canvas.width, tsize.height);

  var finalFboObject = convolve(texUnit2, gl.canvas.width, tsize.height,
    texUnit3, '#fsh-lanczos-1d-covolve-vertical', winSize, gl.canvas.width, gl.canvas.height);

  // resize ]
  // final draw to canvas (for debug) [

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  var texUnitOutput = texUnit3;

  program = basicProgram;
  gl.useProgram(program);
  setUniform1i(gl, program, 'u_image', texUnitOutput);
  setUniform2f(gl, program, 'u_resolution', gl.canvas.width, gl.canvas.height);
  setAttributeValues(gl, program, 'a_texCoord',
    [ 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1 ], { elementSize: 2 });
  setAttributeValues(gl, program, 'a_position',
    vec2Rectangle(0, 0, gl.canvas.width, gl.canvas.height), { elementSize: 2 });

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  checkGlError(gl);

  // final draw to canvas (for debug) ]

  gl.flush();

  var fb = gl.createFramebuffer();

  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, finalFboObject.texture, 0);

  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
    var width = gl.canvas.width;
    var height = gl.canvas.height;
    var pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    var destW = width;
    var destH = height;
    var dest = pixels;
    var unsharpAmount = typeof options.unsharpAmount === 'undefined' ? 0 : (options.unsharpAmount | 0);
    var unsharpRadius = typeof options.unsharpRadius === 'undefined' ? 0 : (options.unsharpRadius);
    var unsharpThreshold = typeof options.unsharpThreshold === 'undefined' ? 0 : (options.unsharpThreshold | 0);

    if (unsharpAmount) {
      unsharp(dest, destW, destH, unsharpAmount, unsharpRadius, unsharpThreshold);
    }

    return dest;
  }
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

    var pixels = webglProcessResize(from, gl, options);

    gl.finish();
    document.body.removeChild(canvas);

    callback(null, pixels);
  } catch (e) {
    error(e);
    gl.finish();
    document.body.removeChild(canvas);
    callback(e);
  }

  return null; // No webworker
};
