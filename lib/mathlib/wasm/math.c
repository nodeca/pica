#include <stdint.h>

inline uint8_t clampTo8(int32_t i) {
  return i < 0 ? 0 : (i > 255 ? 255 : i);
}


#define R(x) ((uint8_t)(x))
#define G(x) ((uint8_t)((x) >> 8))
#define B(x) ((uint8_t)((x) >> 16))
#define A(x) ((uint8_t)((x) >> 24))

#define RGBA(r, g, b, a) ((r) | ((g) << 8) | ((b) << 16) | ((a) << 24))


void convolve(uint32_t *src, uint32_t *dest, uint32_t srcW, uint32_t srcH, uint32_t destW, int16_t *filters)
{
  int32_t  r, g, b, a;
  uint32_t rgba;
  uint32_t filterPtr, filterShift, filterSize;
  uint32_t srcPtr, srcY, destX;
  int32_t  filterVal;
  uint32_t srcOffset = 0, destOffset = 0;
  //
  for (srcY=0; srcY < srcH; srcY++) {
    filterPtr = 0;
    // Apply precomputed filters to each destination row point
    for (destX = 0; destX < destW; destX++) {
      // Get the filter that determines the current output pixel.
      filterShift = filters[filterPtr++];
      srcPtr      = srcOffset + filterShift;
      filterSize  = filters[filterPtr++];

      r = g = b = a = 0;
      // Apply the filter to the row to get the destination pixel r, g, b, a
      for (; filterSize > 0; filterSize--) {
        filterVal = filters[filterPtr++];
        rgba = src[srcPtr++];

        r += filterVal * R(rgba);
        g += filterVal * G(rgba);
        b += filterVal * B(rgba);
        a += filterVal * A(rgba);
      };
      // Bring this value back in range. All of the filter scaling factors
      // are in fixed point with FIXED_FRAC_BITS bits of fractional part.
      //
      // (!) Add 1/2 of value before clamping to get proper rounding. In other
      // case brightness loss will be noticeable if you resize image with white
      // border and place it on white background.
      dest[destOffset] = RGBA(
        clampTo8((r + (1<<13))>>14  /*FIXED_FRAC_BITS*/),
        clampTo8((g + (1<<13))>>14  /*FIXED_FRAC_BITS*/),
        clampTo8((b + (1<<13))>>14  /*FIXED_FRAC_BITS*/),
        clampTo8((a + (1<<13))>>14  /*FIXED_FRAC_BITS*/));
      destOffset += srcH;
    };
    destOffset = srcY + 1;
    srcOffset  = (srcY + 1) * srcW;
  };
}

void convolveHV(uint32_t filtersX_offset,
                uint32_t filtersY_offset,
                uint32_t tmp_offset,
                uint32_t srcW,
                uint32_t srcH,
                uint32_t destW,
                uint32_t destH)
{
  uint8_t  *memory  = 0;

  uint32_t *src     = (uint32_t *)memory;
  int16_t  *filterX = (int16_t *)(memory + filtersX_offset);
  int16_t  *filterY = (int16_t *)(memory + filtersY_offset);
  uint32_t *tmp     = (uint32_t *)(memory + tmp_offset);

  convolve(src, tmp, srcW, srcH, destW, filterX);
  convolve(tmp, src, srcH, destW, destH, filterY);
}
