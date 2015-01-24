function box_blur_rgba(options) {
  var src = options.src;
  var srcW = options.width;
  var srcH = options.height;

  var dst = options.dest || new Uint8Array(srcW * srcH * 4);
  var radius = options.radius || 1;
  var div = radius + radius + 1;
  var iterations = options.iterations || 1;

  var hv = true, k1dim, k2dim, k2inc, offset, idim, tmp0, tmp1, tmp2;
  var sum_r, sum_g, sum_b, sum_a ;
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
        offset = k1 * 4;
      } else {
        k2dim = srcW - 1;
        k2inc = 1;
        offset = k1 * srcW * 4;
      }
      sum_r = sum_g =  sum_b =  sum_a = 0;
      var k2 = 0, i = 0;
      while (i != radius + 1) {
        tmp0 = offset + k2 * 4;
        sum_r += src[tmp0];
        sum_g += src[tmp0 + 1];
        sum_b += src[tmp0 + 2];
        sum_a += src[tmp0 + 3];
        k2 += k2inc;
        i++;
      }
      dst[offset] = sum_r / (radius + 1);
      dst[offset + 1] = sum_g / (radius + 1);
      dst[offset + 2] = sum_b / (radius + 1);
      dst[offset + 3] = sum_a / (radius + 1);
      while (i != div) {
        tmp0 = offset + k2 * 4;
        tmp1 = offset + (i - radius) * k2inc * 4;
        sum_r += src[tmp0];
        sum_g += src[tmp0 + 1];
        sum_b += src[tmp0 + 2];
        sum_a += src[tmp0 + 3];
        dst[tmp1] = sum_r / (i + 1);
        dst[tmp1 + 1] = sum_g / (i + 1);
        dst[tmp1 + 2] = sum_b / (i + 1);
        dst[tmp1 + 3] = sum_a / (i + 1);
        k2 += k2inc;
        i++;
      }
      while (i != idim) {
        tmp0 = offset + k2 * 4;
        tmp1 = offset + (i - radius) * k2inc * 4;
        tmp2 = offset + (i - div) * k2inc * 4;
        sum_r -= src[tmp2];
        sum_g -= src[tmp2 + 1];
        sum_b -= src[tmp2 + 2];
        sum_a -= src[tmp2 + 3];
        sum_r += src[tmp0];
        sum_g += src[tmp0 + 1];
        sum_b += src[tmp0 + 2];
        sum_a += src[tmp0 + 3];
        dst[tmp1] = sum_r / div;
        dst[tmp1 + 1] = sum_g / div;
        dst[tmp1 + 2] = sum_b / div;
        dst[tmp1 + 3] = sum_a / div;
        k2 += k2inc;
        i++;
      }
      while (i != idim + radius) {
        tmp0 = div + idim - i - 1;
        tmp1 = offset + (i - radius) * k2inc * 4;
        tmp2 = offset + (i - div) * k2inc * 4;
        sum_r -= src[tmp2];
        sum_g -= src[tmp2 + 1];
        sum_b -= src[tmp2 + 2];
        sum_a -= src[tmp2 + 3];
        dst[tmp1] = sum_r / (tmp0);
        dst[tmp1 + 1] = sum_g / (tmp0);
        dst[tmp1 + 2] = sum_b / (tmp0);
        dst[tmp1 + 3] = sum_a / (tmp0);
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
    for (k1 = 0; k1 < srcW*srcH*4; k1++) {
      options.dest[k1]=src[k1]
    }
  } else {
    return src;
  }
}