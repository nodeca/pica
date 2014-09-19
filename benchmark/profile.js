#!/usr/bin/env node

'use strict';

var path      = require('path');
var fs        = require('fs');

var Canvas    = require('canvas');
var pica      = require('../');

var Image = Canvas.Image;
var image = new Image();

image.src = fs.readFileSync(path.join(__dirname, 'samples', 'sample-3264x2448.jpg'));

var canvas = new Canvas(image.width, image.height);
var ctx = canvas.getContext('2d');

ctx.drawImage(image, 0, 0, image.width, image.height);

var data = ctx.getImageData(0, 0, image.width, image.height);

pica.resizeBuffer(data, image.width, image.height, 300, 225, 3, function() {
});
