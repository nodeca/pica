// Transparently pack & unpack custom filter to serializable object
// That's required to pass custom filter into webworker.
//
// { win, function } <=> { win, Float32Array }
//
// Function is mapped to interpolation array
//
// [0...win] <=> [O...INTERPOLATION_ARRAY_SIZE]
//
'use strict';


const INTERPOLATION_ARRAY_SIZE = 1000;

function objClass(obj) { return Object.prototype.toString.call(obj); }


module.exports.isCustomFilter = function isCustomFilter(filter_prop) {
  return filter_prop && filter_prop.win && filter_prop.fn;
};


module.exports.pack = function pack(filter_info) {
  // Bypass already packed filter
  if (objClass(filter_info.fn) !== '[object Function]') return filter_info;

  const packed = new Float32Array(INTERPOLATION_ARRAY_SIZE);

  for (var i = 0; i < INTERPOLATION_ARRAY_SIZE; i++) {
    packed[i] = Math.round(
      filter_info.fn(filter_info.win * (i / (INTERPOLATION_ARRAY_SIZE - 1)))
    );
  }

  return { win: filter_info.win, fn: packed };
};


module.exports.unpack = function unpack(filter_info) {
  // Bypass already packed filter
  if (objClass(filter_info.fn) === '[object Function]') return filter_info;

  // Clone params for sure
  const win = filter_info.win;
  const packed = filter_info.fn;
  const packed_length = packed.length;


  function fn(x) {
    if (x < 0) x = -x;

    const idx_float = (x / win) * (packed_length - 1);
    const idx1 = Math.floor(idx_float);
    const idx2 = Math.ceil(idx_float);

    // out of range => 0
    if (idx2 > (packed_length - 1)) return 0.0;

    // exact point => return direct value
    if (idx1 === idx2) return packed[idx1];

    // interpolate
    return (packed[idx1] + ((packed[idx2] - packed[idx2]) * (idx_float - idx1)));
  }

  return { win, fn };
};
