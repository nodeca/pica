function rgbImageToLum(options){
  var src = options.src;
  var srcW = options.width;
  var srcH = options.height;

  var dst = options.dest || new Uint16Array(srcW * srcH);

  var i=0;
  var j=0;
  while (i<srcW*srcH*4){
    var r = src[i];i++;
    var g = src[i];i++;
    var b = src[i];i++;
    i++;
    var max=Math.max(r,g,b), min=Math.min(r,g,b);
    dst[j]=(max+min);
    j++;
  }

}

function blur_box_lum (options){
  var src = options.src;
  var srcW = options.width;
  var srcH = options.height;

  var dst = new Uint16Array(srcW * srcH);
  var radius = options.radius || 1;
  var div = radius + radius + 1;
  var iterations = options.iterations || 1;

  var hv = true, k1dim, k2dim, k2inc, offset, idim, tmp0, tmp1, tmp2;
  var sum_l;
  if (srcH == 1 || srcW == 1) {
    hv = true;
  }
  while (iterations > 0) {
    if (!hv) {
      k1dim = srcW;
      idim = srcH;
      iterations--;
    } else {
      k1dim = srcH;
      idim = srcW;
    }

    for (var k1 = 0; k1 < k1dim; k1++) {
      if (!hv) {
        k2dim = srcH * (srcW - 1) + k1 + 1;
        k2inc = srcW;
        offset = k1;
      } else {
        k2dim = srcW - 1;
        k2inc = 1;
        offset = k1 * srcW;
      }
      sum_l = 0;
      var k2 = 0, i = 0;
      while (i != radius + 1) {
        tmp0 = offset + k2;
        sum_l += src[tmp0];
        k2 += k2inc;
        i++;
      }
      dst[offset] = sum_l / (radius + 1);
      while (i != div) {
        tmp0 = offset + k2;
        tmp1 = offset + (i - radius) * k2inc;
        sum_l += src[tmp0];
        dst[tmp1] = sum_l / (i + 1);
        k2 += k2inc;
        i++;
      }
      while (i != idim) {
        tmp0 = offset + k2;
        tmp1 = offset + (i - radius) * k2inc;
        tmp2 = offset + (i - div) * k2inc;
        sum_l -= src[tmp2];
        sum_l += src[tmp0];
        dst[tmp1] = sum_l / div;
        k2 += k2inc;
        i++;
      }
      while (i != idim + radius) {
        tmp0 = div + idim - i - 1;
        tmp1 = offset + (i - radius) * k2inc;
        tmp2 = offset + (i - div) * k2inc;
        sum_l -= src[tmp2];
        dst[tmp1] = sum_l / (tmp0);
        k2 += k2inc;
        i++;
      }
    }
    hv = !hv;
    tmp0 = src;
    src = dst;
    dst = tmp0;
  }
  if (options.dest){
    for (k1 = 0; k1 < srcW*src; k1++) {
      options.dest[k1]=src[k1]
    }
  } else {
    return src;
  }
}

function updateImage(options){
  var rgb = options.rgb;
  var lum = options.lum;
  var srcW = options.width;
  var srcH = options.height;
  var dst = options.dest || new Uint8Array(srcW * srcH * 4);

  var i=0;
  var j=0;
  while (i<srcW*srcH*4){
    var r = rgb[i];
    var g = rgb[i+1];
    var b = rgb[i+2];
    var l = lum[j];j++;
    var tmp = rgbLumCorrection(r,g,b,l);
    dst[i] = tmp[0]; i++;
    dst[i] = tmp[1]; i++;
    dst[i] = tmp[2]; i++;
    dst[i] = 0; i++;
  }
  return dst;
}

function rgbLumCorrection(r,g,b,l){
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, q, p;
  var old_lum = (max + min);
  if (old_lum!=l){
    if (max==min){
      r = g = b = (l >> 2);
    } else {
      var d = (max - min);
      if (l<255){
        if (old_lum>255){
          q = l * (510 - 2 * min);
          p = l * (510 - 2 * max);
          h = (510 - max - min)
        } else {
          q = 2 * l * max;
          p =  2 * l * min ;
          h = old_lum
        }
      } else {
        if (old_lum>255){
          q = 510 * (max - min + l) - 2 * max * l;
          p = 510 * (l - max + min) - 2 * min * l;
          h = (510 - max - min)
        } else {
          q = 510 * (max - min) + 2 * l * min;
          p = 510 * (min - max) + 2 * l * max;
          h = old_lum
        }
      }

      function hue2rgb(p, q, t, d){
        if(t < 0) t += (6*d);
        if(t > 6*d) t -= (6*d);
        if(t < d) return (p*d + (q - p) * t);
        if(t < 3*d) return q * d;
        if(t < 4*d) return (p*d + (q - p) * (4*d - t)) ;
        return p * d;
      }

      switch(max){
        case r: {
          h *= ((g - b) + d * (g < b ? 6 : 0));
          break;
        }
        case g: {
          h *= ((b - r) + d * 2);
          break;
        }
        case b: {
          h *= ((r - g) + d * 4);
          break;
        }
      }
      var div2=d,
        div3,div4;
      if (old_lum>255){
        d*=(510 - max - min);
        div3=div4=(510 - max - min);
      } else {
        d*=old_lum;
        div3=div4=old_lum;
      }
      r = hue2rgb(p, q, h + 2*d, d) ;
      g = hue2rgb(p, q, h, d);
      b = hue2rgb(p, q, h - 2*d, d) ;

      r /= 2*div2*div3*div4;
      g /= 2*div2*div3*div4;
      b /= 2*div2*div3*div4;


    }
  }

  return [Math.round(r), Math.round(g), Math.round(b)];
}