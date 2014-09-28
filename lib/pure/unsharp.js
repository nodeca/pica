// Unsharp mask filter
//
// http://stackoverflow.com/a/23322820/1031804
// USM(O) = O + (2 * (Amount / 100) * (O - GB))
// GB - gaussial blur.
//
// brightness = 0.299*R + 0.587*G + 0.114*B
// http://stackoverflow.com/a/596243/1031804
//
// To simplify math, normalize brighness mutipliers to 2^16:
//
// brightness = (19595*R + 38470*G + 7471*B) / 65536

'use strict';


function clampTo8(i) { return i < 0 ? 0 : (i > 255 ? 255 : i); }

// Convert image to greyscale, 32bits FP result (16.16)
//
function greyscale(src, srcW, srcH) {
  var size = srcW * srcH;
  var result = new Uint32Array(size); // We don't use sign, but that helps to JIT
  var i, srcPtr;

  for (i = 0, srcPtr = 0; i < size; i++) {
    result[i] = src[srcPtr++] * 19595 // red
              + src[srcPtr++] * 38470 // green
              + src[srcPtr] * 7471;   // blue
    srcPtr += 2;
  }

  return result;
}

// Apply unsharp mask to src
//
// NOTE: radius is ignored to simplify gaussian blur calculation
// on practice we need radius 0.3..2.0. Use 1.0 now.
//
function unsharp(src, srcW, srcH, amount, radius, threshold) {
  var x, y, bx, by, sx, sy, w, wsum, br, c, diff = 0, corr, srcPtr;

  // Normalized delta multiplier. Expect that:
  //
  // - delta is Fixed pont with 16-bit fractional part
  // - input color is in 0.255 range
  var CORR_NORM = amount / (50 * 255);

  // Convert to grayscale:
  //
  // - prevent color drift
  // - speedup blur calc
  // - improve presision, by keeping brightness in FP32 format
  //
  var gs = greyscale(src, srcW, srcH);
  var blurKernel = new Uint8Array([
    1, 2, 1,
    2, 4, 2,
    1, 2, 1
  ]);
  var kShift = 1;
  var fpThreshold = threshold << 16;

  for (y = 0; y < srcH; y++) {
    for (x = 0; x < srcW; x++) {

      // calculate brightness blur, difference & update source buffer
      wsum = 0; // weight sum to normalize result
      br   = 0;
      for (by = 0; by < 3; by++) {
        var bPtr = by * 3;
        for (bx = 0; bx < 3; bx++) {
          sx = x + bx - kShift;
          sy = y + by - kShift;

          if (sx >= 0 && sx < srcW && sy >= 0 && sy < srcH) {
            w  = blurKernel[bPtr];
            if (w !== 0) {
              wsum += w;
              br += gs[sx + sy * srcW] * w;
            }
          }
          bPtr = (bPtr + 1)|0;
        }
      }

      diff = gs[x + y * srcW] - (br - (br % wsum)) / wsum;

      // Update source image if thresold exceeded
      if (Math.abs(diff) > fpThreshold) {
        // Calculate correction multiplier
        corr = 65536 + Math.floor(diff * CORR_NORM);
        srcPtr = (x + y * srcW) * 4;

        c = src[srcPtr];
        src[srcPtr++] = clampTo8((c * corr) >> 16);
        c = src[srcPtr];
        src[srcPtr++] = clampTo8((c * corr) >> 16);
        c = src[srcPtr];
        src[srcPtr] = clampTo8((c * corr) >> 16);
      }

    } // end row
  } // end column
}


module.exports = unsharp;
