/*!

pica
https://github.com/nodeca/pica

*/
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var require_object_assign = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var getOwnPropertySymbols = Object.getOwnPropertySymbols;
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;
	function toObject(val) {
		if (val === null || val === void 0) throw new TypeError("Object.assign cannot be called with null or undefined");
		return Object(val);
	}
	function shouldUseNative() {
		try {
			if (!Object.assign) return false;
			var test1 = /* @__PURE__ */ new String("abc");
			test1[5] = "de";
			if (Object.getOwnPropertyNames(test1)[0] === "5") return false;
			var test2 = {};
			for (var i = 0; i < 10; i++) test2["_" + String.fromCharCode(i)] = i;
			if (Object.getOwnPropertyNames(test2).map(function(n) {
				return test2[n];
			}).join("") !== "0123456789") return false;
			var test3 = {};
			"abcdefghijklmnopqrst".split("").forEach(function(letter) {
				test3[letter] = letter;
			});
			if (Object.keys(Object.assign({}, test3)).join("") !== "abcdefghijklmnopqrst") return false;
			return true;
		} catch (err) {
			return false;
		}
	}
	module.exports = shouldUseNative() ? Object.assign : function(target, source) {
		var from;
		var to = toObject(target);
		var symbols;
		for (var s = 1; s < arguments.length; s++) {
			from = Object(arguments[s]);
			for (var key in from) if (hasOwnProperty.call(from, key)) to[key] = from[key];
			if (getOwnPropertySymbols) {
				symbols = getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) if (propIsEnumerable.call(from, symbols[i])) to[symbols[i]] = from[symbols[i]];
			}
		}
		return to;
	};
}));
var require_base64decode = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	module.exports = function base64decode(str) {
		var input = str.replace(/[\r\n=]/g, ""), max = input.length;
		var out = new Uint8Array(max * 3 >> 2);
		var bits = 0;
		var ptr = 0;
		for (var idx = 0; idx < max; idx++) {
			if (idx % 4 === 0 && idx) {
				out[ptr++] = bits >> 16 & 255;
				out[ptr++] = bits >> 8 & 255;
				out[ptr++] = bits & 255;
			}
			bits = bits << 6 | BASE64_MAP.indexOf(input.charAt(idx));
		}
		var tailbits = max % 4 * 6;
		if (tailbits === 0) {
			out[ptr++] = bits >> 16 & 255;
			out[ptr++] = bits >> 8 & 255;
			out[ptr++] = bits & 255;
		} else if (tailbits === 18) {
			out[ptr++] = bits >> 10 & 255;
			out[ptr++] = bits >> 2 & 255;
		} else if (tailbits === 12) out[ptr++] = bits >> 4 & 255;
		return out;
	};
}));
var require_wa_detect = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var wa;
	module.exports = function hasWebAssembly() {
		if (typeof wa !== "undefined") return wa;
		wa = false;
		if (typeof WebAssembly === "undefined") return wa;
		try {
			var bin = new Uint8Array([
				0,
				97,
				115,
				109,
				1,
				0,
				0,
				0,
				1,
				6,
				1,
				96,
				1,
				127,
				1,
				127,
				3,
				2,
				1,
				0,
				5,
				3,
				1,
				0,
				1,
				7,
				8,
				1,
				4,
				116,
				101,
				115,
				116,
				0,
				0,
				10,
				16,
				1,
				14,
				0,
				32,
				0,
				65,
				1,
				54,
				2,
				0,
				32,
				0,
				40,
				2,
				0,
				11
			]);
			var module$4 = new WebAssembly.Module(bin);
			if (new WebAssembly.Instance(module$4, {}).exports.test(4) !== 0) wa = true;
			return wa;
		} catch (__) {}
		return wa;
	};
}));
var require_multimath = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assign = require_object_assign();
	var base64decode = require_base64decode();
	var hasWebAssembly = require_wa_detect();
	var DEFAULT_OPTIONS = {
		js: true,
		wasm: true
	};
	function MultiMath(options) {
		if (!(this instanceof MultiMath)) return new MultiMath(options);
		var opts = assign({}, DEFAULT_OPTIONS, options || {});
		this.options = opts;
		this.__cache = {};
		this.__init_promise = null;
		this.__modules = opts.modules || {};
		this.__memory = null;
		this.__wasm = {};
		this.__isLE = new Uint32Array(new Uint8Array([
			1,
			0,
			0,
			0
		]).buffer)[0] === 1;
		if (!this.options.js && !this.options.wasm) throw new Error("mathlib: at least \"js\" or \"wasm\" should be enabled");
	}
	MultiMath.prototype.has_wasm = hasWebAssembly;
	MultiMath.prototype.use = function(module$1) {
		this.__modules[module$1.name] = module$1;
		if (this.options.wasm && this.has_wasm() && module$1.wasm_fn) this[module$1.name] = module$1.wasm_fn;
		else this[module$1.name] = module$1.fn;
		return this;
	};
	MultiMath.prototype.init = function() {
		if (this.__init_promise) return this.__init_promise;
		if (!this.options.js && this.options.wasm && !this.has_wasm()) return Promise.reject(/* @__PURE__ */ new Error("mathlib: only \"wasm\" was enabled, but it's not supported"));
		var self = this;
		this.__init_promise = Promise.all(Object.keys(self.__modules).map(function(name) {
			var module$2 = self.__modules[name];
			if (!self.options.wasm || !self.has_wasm() || !module$2.wasm_fn) return null;
			if (self.__wasm[name]) return null;
			return WebAssembly.compile(self.__base64decode(module$2.wasm_src)).then(function(m) {
				self.__wasm[name] = m;
			});
		})).then(function() {
			return self;
		});
		return this.__init_promise;
	};
	MultiMath.prototype.__base64decode = base64decode;
	MultiMath.prototype.__reallocate = function mem_grow_to(bytes) {
		if (!this.__memory) {
			this.__memory = new WebAssembly.Memory({ initial: Math.ceil(bytes / (64 * 1024)) });
			return this.__memory;
		}
		var mem_size = this.__memory.buffer.byteLength;
		if (mem_size < bytes) this.__memory.grow(Math.ceil((bytes - mem_size) / (64 * 1024)));
		return this.__memory;
	};
	MultiMath.prototype.__instance = function instance(name, memsize, env_extra) {
		if (memsize) this.__reallocate(memsize);
		if (!this.__wasm[name]) {
			var module$3 = this.__modules[name];
			this.__wasm[name] = new WebAssembly.Module(this.__base64decode(module$3.wasm_src));
		}
		if (!this.__cache[name]) {
			var env_base = {
				memoryBase: 0,
				memory: this.__memory,
				tableBase: 0,
				table: new WebAssembly.Table({
					initial: 0,
					element: "anyfunc"
				})
			};
			this.__cache[name] = new WebAssembly.Instance(this.__wasm[name], { env: assign(env_base, env_extra || {}) });
		}
		return this.__cache[name];
	};
	MultiMath.prototype.__align = function align(number, base) {
		base = base || 8;
		var reminder = number % base;
		return number + (reminder ? base - reminder : 0);
	};
	module.exports = MultiMath;
}));
var require_mono16 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var a0, a1, a2, a3, b1, b2, left_corner, right_corner;
	function gaussCoef(sigma) {
		if (sigma < .5) sigma = .5;
		var a = Math.exp(.726 * .726) / sigma, g1 = Math.exp(-a), g2 = Math.exp(-2 * a), k = (1 - g1) * (1 - g1) / (1 + 2 * a * g1 - g2);
		a0 = k;
		a1 = k * (a - 1) * g1;
		a2 = k * (a + 1) * g1;
		a3 = -k * g2;
		b1 = 2 * g1;
		b2 = -g2;
		left_corner = (a0 + a1) / (1 - b1 - b2);
		right_corner = (a2 + a3) / (1 - b1 - b2);
		return new Float32Array([
			a0,
			a1,
			a2,
			a3,
			b1,
			b2,
			left_corner,
			right_corner
		]);
	}
	function convolveMono16(src, out, line, coeff, width, height) {
		var prev_src, curr_src, curr_out, prev_out, prev_prev_out;
		var src_index, out_index, line_index;
		var i, j;
		var coeff_a0, coeff_a1, coeff_b1, coeff_b2;
		for (i = 0; i < height; i++) {
			src_index = i * width;
			out_index = i;
			line_index = 0;
			prev_src = src[src_index];
			prev_prev_out = prev_src * coeff[6];
			prev_out = prev_prev_out;
			coeff_a0 = coeff[0];
			coeff_a1 = coeff[1];
			coeff_b1 = coeff[4];
			coeff_b2 = coeff[5];
			for (j = 0; j < width; j++) {
				curr_src = src[src_index];
				curr_out = curr_src * coeff_a0 + prev_src * coeff_a1 + prev_out * coeff_b1 + prev_prev_out * coeff_b2;
				prev_prev_out = prev_out;
				prev_out = curr_out;
				prev_src = curr_src;
				line[line_index] = prev_out;
				line_index++;
				src_index++;
			}
			src_index--;
			line_index--;
			out_index += height * (width - 1);
			prev_src = src[src_index];
			prev_prev_out = prev_src * coeff[7];
			prev_out = prev_prev_out;
			curr_src = prev_src;
			coeff_a0 = coeff[2];
			coeff_a1 = coeff[3];
			for (j = width - 1; j >= 0; j--) {
				curr_out = curr_src * coeff_a0 + prev_src * coeff_a1 + prev_out * coeff_b1 + prev_prev_out * coeff_b2;
				prev_prev_out = prev_out;
				prev_out = curr_out;
				prev_src = curr_src;
				curr_src = src[src_index];
				out[out_index] = line[line_index] + prev_out;
				src_index--;
				line_index--;
				out_index -= height;
			}
		}
	}
	function blurMono16(src, width, height, radius) {
		if (!radius) return;
		var out = new Uint16Array(src.length), tmp_line = new Float32Array(Math.max(width, height));
		var coeff = gaussCoef(radius);
		convolveMono16(src, out, tmp_line, coeff, width, height, radius);
		convolveMono16(out, src, tmp_line, coeff, height, width, radius);
	}
	module.exports = blurMono16;
}));
var import_multimath = /* @__PURE__ */ __toESM(require_multimath());
var import_mono16 = /* @__PURE__ */ __toESM(require_mono16());
function hsv_v16(img, width, height) {
	const size = width * height;
	const out = new Uint16Array(size);
	let r, g, b, max;
	for (let i = 0; i < size; i++) {
		r = img[4 * i];
		g = img[4 * i + 1];
		b = img[4 * i + 2];
		max = r >= g && r >= b ? r : g >= b && g >= r ? g : b;
		out[i] = max << 8;
	}
	return out;
}
function unsharp$1(img, width, height, amount, radius, threshold) {
	let v1, v2, vmul;
	let diff, iTimes4;
	if (amount === 0 || radius < .5) return;
	if (radius > 2) radius = 2;
	const brightness = hsv_v16(img, width, height);
	const blured = new Uint16Array(brightness);
	(0, import_mono16.default)(blured, width, height, radius);
	const amountFp = amount / 100 * 4096 + .5 | 0;
	const thresholdFp = threshold << 8;
	const size = width * height;
	for (let i = 0; i < size; i++) {
		v1 = brightness[i];
		diff = v1 - blured[i];
		if (Math.abs(diff) >= thresholdFp) {
			v2 = v1 + (amountFp * diff + 2048 >> 12);
			v2 = v2 > 65280 ? 65280 : v2;
			v2 = v2 < 0 ? 0 : v2;
			v1 = v1 !== 0 ? v1 : 1;
			vmul = (v2 << 12) / v1 | 0;
			iTimes4 = i * 4;
			img[iTimes4] = img[iTimes4] * vmul + 2048 >> 12;
			img[iTimes4 + 1] = img[iTimes4 + 1] * vmul + 2048 >> 12;
			img[iTimes4 + 2] = img[iTimes4 + 2] * vmul + 2048 >> 12;
		}
	}
}
function unsharp(img, width, height, amount, radius, threshold) {
	if (amount === 0 || radius < .5) return;
	if (radius > 2) radius = 2;
	const pixels = width * height;
	const img_bytes_cnt = pixels * 4;
	const hsv_bytes_cnt = pixels * 2;
	const blur_bytes_cnt = pixels * 2;
	const blur_line_byte_cnt = Math.max(width, height) * 4;
	const blur_coeffs_byte_cnt = 32;
	const img_offset = 0;
	const hsv_offset = img_bytes_cnt;
	const blur_offset = hsv_offset + hsv_bytes_cnt;
	const blur_tmp_offset = blur_offset + blur_bytes_cnt;
	const blur_line_offset = blur_tmp_offset + blur_bytes_cnt;
	const blur_coeffs_offset = blur_line_offset + blur_line_byte_cnt;
	const instance = this.__instance("unsharp_mask", img_bytes_cnt + hsv_bytes_cnt + blur_bytes_cnt * 2 + blur_line_byte_cnt + blur_coeffs_byte_cnt, { exp: Math.exp });
	const img32 = new Uint32Array(img.buffer);
	new Uint32Array(this.__memory.buffer).set(img32);
	let fn = instance.exports.hsv_v16 || instance.exports._hsv_v16;
	if (!fn) throw new Error("WASM hsv_v16 function is not available");
	fn(img_offset, hsv_offset, width, height);
	fn = instance.exports.blurMono16 || instance.exports._blurMono16;
	if (!fn) throw new Error("WASM blurMono16 function is not available");
	fn(hsv_offset, blur_offset, blur_tmp_offset, blur_line_offset, blur_coeffs_offset, width, height, radius);
	fn = instance.exports.unsharp || instance.exports._unsharp;
	if (!fn) throw new Error("WASM unsharp function is not available");
	fn(img_offset, img_offset, hsv_offset, blur_offset, width, height, amount, threshold);
	img32.set(new Uint32Array(this.__memory.buffer, 0, pixels));
}
var mm_unsharp_mask_default = {
	name: "unsharp_mask",
	fn: unsharp$1,
	wasm_fn: unsharp,
	wasm_src: "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"
};
var resize_filter_info_default = { filter: {
	box: {
		win: .5,
		fn(x) {
			if (x < 0) x = -x;
			return x < .5 ? 1 : 0;
		}
	},
	hamming: {
		win: 1,
		fn(x) {
			if (x < 0) x = -x;
			if (x >= 1) return 0;
			if (x < 1.1920929e-7) return 1;
			const xpi = x * Math.PI;
			return Math.sin(xpi) / xpi * (.54 + .46 * Math.cos(xpi / 1));
		}
	},
	lanczos2: {
		win: 2,
		fn(x) {
			if (x < 0) x = -x;
			if (x >= 2) return 0;
			if (x < 1.1920929e-7) return 1;
			const xpi = x * Math.PI;
			return Math.sin(xpi) / xpi * Math.sin(xpi / 2) / (xpi / 2);
		}
	},
	lanczos3: {
		win: 3,
		fn(x) {
			if (x < 0) x = -x;
			if (x >= 3) return 0;
			if (x < 1.1920929e-7) return 1;
			const xpi = x * Math.PI;
			return Math.sin(xpi) / xpi * Math.sin(xpi / 3) / (xpi / 3);
		}
	},
	mks2013: {
		win: 2.5,
		fn(x) {
			if (x < 0) x = -x;
			if (x >= 2.5) return 0;
			if (x >= 1.5) return -.125 * (x - 2.5) * (x - 2.5);
			if (x >= .5) return .25 * (4 * x * x - 11 * x + 7);
			return 1.0625 - 1.75 * x * x;
		}
	}
} };
var FIXED_FRAC_BITS = 14;
function toFixedPoint(num) {
	return Math.round(num * ((1 << FIXED_FRAC_BITS) - 1));
}
function resizeFilterGen(filter, srcSize, destSize, scale, offset) {
	const filterFunction = resize_filter_info_default.filter[filter].fn;
	const scaleInverted = 1 / scale;
	const scaleClamped = Math.min(1, scale);
	const srcWindow = resize_filter_info_default.filter[filter].win / scaleClamped;
	let destPixel, srcPixel, srcFirst, srcLast, filterElementSize, floatFilter, fxpFilter, total, pxl, idx, floatVal, filterTotal, filterVal;
	let leftNotEmpty, rightNotEmpty, filterShift, filterSize;
	const maxFilterElementSize = Math.floor((srcWindow + 1) * 2);
	const packedFilter = new Int16Array((maxFilterElementSize + 2) * destSize);
	let packedFilterPtr = 0;
	const slowCopy = !packedFilter.subarray || !packedFilter.set;
	for (destPixel = 0; destPixel < destSize; destPixel++) {
		srcPixel = (destPixel + .5) * scaleInverted + offset;
		srcFirst = Math.max(0, Math.floor(srcPixel - srcWindow));
		srcLast = Math.min(srcSize - 1, Math.ceil(srcPixel + srcWindow));
		filterElementSize = srcLast - srcFirst + 1;
		floatFilter = new Float32Array(filterElementSize);
		fxpFilter = new Int16Array(filterElementSize);
		total = 0;
		for (pxl = srcFirst, idx = 0; pxl <= srcLast; pxl++, idx++) {
			floatVal = filterFunction((pxl + .5 - srcPixel) * scaleClamped);
			total += floatVal;
			floatFilter[idx] = floatVal;
		}
		filterTotal = 0;
		for (idx = 0; idx < floatFilter.length; idx++) {
			filterVal = floatFilter[idx] / total;
			filterTotal += filterVal;
			fxpFilter[idx] = toFixedPoint(filterVal);
		}
		fxpFilter[destSize >> 1] += toFixedPoint(1 - filterTotal);
		leftNotEmpty = 0;
		while (leftNotEmpty < fxpFilter.length && fxpFilter[leftNotEmpty] === 0) leftNotEmpty++;
		if (leftNotEmpty < fxpFilter.length) {
			rightNotEmpty = fxpFilter.length - 1;
			while (rightNotEmpty > 0 && fxpFilter[rightNotEmpty] === 0) rightNotEmpty--;
			filterShift = srcFirst + leftNotEmpty;
			filterSize = rightNotEmpty - leftNotEmpty + 1;
			packedFilter[packedFilterPtr++] = filterShift;
			packedFilter[packedFilterPtr++] = filterSize;
			if (!slowCopy) {
				packedFilter.set(fxpFilter.subarray(leftNotEmpty, rightNotEmpty + 1), packedFilterPtr);
				packedFilterPtr += filterSize;
			} else for (idx = leftNotEmpty; idx <= rightNotEmpty; idx++) packedFilter[packedFilterPtr++] = fxpFilter[idx];
		} else {
			packedFilter[packedFilterPtr++] = 0;
			packedFilter[packedFilterPtr++] = 0;
		}
	}
	return packedFilter;
}
function clampTo8(i) {
	return i < 0 ? 0 : i > 255 ? 255 : i;
}
function clampNegative(i) {
	return i >= 0 ? i : 0;
}
function convolveHor(src, dest, srcW, srcH, destW, filters) {
	let r, g, b, a;
	let filterPtr, filterShift, filterSize;
	let srcPtr, srcY, destX, filterVal;
	let srcOffset = 0, destOffset = 0;
	for (srcY = 0; srcY < srcH; srcY++) {
		filterPtr = 0;
		for (destX = 0; destX < destW; destX++) {
			filterShift = filters[filterPtr++];
			filterSize = filters[filterPtr++];
			srcPtr = srcOffset + filterShift * 4 | 0;
			r = g = b = a = 0;
			for (; filterSize > 0; filterSize--) {
				filterVal = filters[filterPtr++];
				a = a + filterVal * src[srcPtr + 3] | 0;
				b = b + filterVal * src[srcPtr + 2] | 0;
				g = g + filterVal * src[srcPtr + 1] | 0;
				r = r + filterVal * src[srcPtr] | 0;
				srcPtr = srcPtr + 4 | 0;
			}
			dest[destOffset + 3] = clampNegative(a >> 7);
			dest[destOffset + 2] = clampNegative(b >> 7);
			dest[destOffset + 1] = clampNegative(g >> 7);
			dest[destOffset] = clampNegative(r >> 7);
			destOffset = destOffset + srcH * 4 | 0;
		}
		destOffset = (srcY + 1) * 4 | 0;
		srcOffset = (srcY + 1) * srcW * 4 | 0;
	}
}
function convolveVert(src, dest, srcW, srcH, destW, filters) {
	let r, g, b, a;
	let filterPtr, filterShift, filterSize;
	let srcPtr, srcY, destX, filterVal;
	let srcOffset = 0, destOffset = 0;
	for (srcY = 0; srcY < srcH; srcY++) {
		filterPtr = 0;
		for (destX = 0; destX < destW; destX++) {
			filterShift = filters[filterPtr++];
			filterSize = filters[filterPtr++];
			srcPtr = srcOffset + filterShift * 4 | 0;
			r = g = b = a = 0;
			for (; filterSize > 0; filterSize--) {
				filterVal = filters[filterPtr++];
				a = a + filterVal * src[srcPtr + 3] | 0;
				b = b + filterVal * src[srcPtr + 2] | 0;
				g = g + filterVal * src[srcPtr + 1] | 0;
				r = r + filterVal * src[srcPtr] | 0;
				srcPtr = srcPtr + 4 | 0;
			}
			r >>= 7;
			g >>= 7;
			b >>= 7;
			a >>= 7;
			dest[destOffset + 3] = clampTo8(a + 8192 >> 14);
			dest[destOffset + 2] = clampTo8(b + 8192 >> 14);
			dest[destOffset + 1] = clampTo8(g + 8192 >> 14);
			dest[destOffset] = clampTo8(r + 8192 >> 14);
			destOffset = destOffset + srcH * 4 | 0;
		}
		destOffset = (srcY + 1) * 4 | 0;
		srcOffset = (srcY + 1) * srcW * 4 | 0;
	}
}
function convolveHorWithPre(src, dest, srcW, srcH, destW, filters) {
	let r, g, b, a, alpha;
	let filterPtr, filterShift, filterSize;
	let srcPtr, srcY, destX, filterVal;
	let srcOffset = 0, destOffset = 0;
	for (srcY = 0; srcY < srcH; srcY++) {
		filterPtr = 0;
		for (destX = 0; destX < destW; destX++) {
			filterShift = filters[filterPtr++];
			filterSize = filters[filterPtr++];
			srcPtr = srcOffset + filterShift * 4 | 0;
			r = g = b = a = 0;
			for (; filterSize > 0; filterSize--) {
				filterVal = filters[filterPtr++];
				alpha = src[srcPtr + 3];
				a = a + filterVal * alpha | 0;
				b = b + filterVal * src[srcPtr + 2] * alpha | 0;
				g = g + filterVal * src[srcPtr + 1] * alpha | 0;
				r = r + filterVal * src[srcPtr] * alpha | 0;
				srcPtr = srcPtr + 4 | 0;
			}
			b = b / 255 | 0;
			g = g / 255 | 0;
			r = r / 255 | 0;
			dest[destOffset + 3] = clampNegative(a >> 7);
			dest[destOffset + 2] = clampNegative(b >> 7);
			dest[destOffset + 1] = clampNegative(g >> 7);
			dest[destOffset] = clampNegative(r >> 7);
			destOffset = destOffset + srcH * 4 | 0;
		}
		destOffset = (srcY + 1) * 4 | 0;
		srcOffset = (srcY + 1) * srcW * 4 | 0;
	}
}
function convolveVertWithPre(src, dest, srcW, srcH, destW, filters) {
	let r, g, b, a;
	let filterPtr, filterShift, filterSize;
	let srcPtr, srcY, destX, filterVal;
	let srcOffset = 0, destOffset = 0;
	for (srcY = 0; srcY < srcH; srcY++) {
		filterPtr = 0;
		for (destX = 0; destX < destW; destX++) {
			filterShift = filters[filterPtr++];
			filterSize = filters[filterPtr++];
			srcPtr = srcOffset + filterShift * 4 | 0;
			r = g = b = a = 0;
			for (; filterSize > 0; filterSize--) {
				filterVal = filters[filterPtr++];
				a = a + filterVal * src[srcPtr + 3] | 0;
				b = b + filterVal * src[srcPtr + 2] | 0;
				g = g + filterVal * src[srcPtr + 1] | 0;
				r = r + filterVal * src[srcPtr] | 0;
				srcPtr = srcPtr + 4 | 0;
			}
			r >>= 7;
			g >>= 7;
			b >>= 7;
			a >>= 7;
			a = clampTo8(a + 8192 >> 14);
			if (a > 0) {
				r = r * 255 / a | 0;
				g = g * 255 / a | 0;
				b = b * 255 / a | 0;
			}
			dest[destOffset + 3] = a;
			dest[destOffset + 2] = clampTo8(b + 8192 >> 14);
			dest[destOffset + 1] = clampTo8(g + 8192 >> 14);
			dest[destOffset] = clampTo8(r + 8192 >> 14);
			destOffset = destOffset + srcH * 4 | 0;
		}
		destOffset = (srcY + 1) * 4 | 0;
		srcOffset = (srcY + 1) * srcW * 4 | 0;
	}
}
function hasAlpha$1(src, width, height) {
	let ptr = 3;
	const len = width * height * 4 | 0;
	while (ptr < len) {
		if (src[ptr] !== 255) return true;
		ptr = ptr + 4 | 0;
	}
	return false;
}
function resetAlpha$1(dst, width, height) {
	let ptr = 3;
	const len = width * height * 4 | 0;
	while (ptr < len) {
		dst[ptr] = 255;
		ptr = ptr + 4 | 0;
	}
}
function resize(options) {
	const src = options.src;
	const srcW = options.width;
	const srcH = options.height;
	const destW = options.toWidth;
	const destH = options.toHeight;
	const scaleX = options.scaleX || options.toWidth / options.width;
	const scaleY = options.scaleY || options.toHeight / options.height;
	const offsetX = options.offsetX || 0;
	const offsetY = options.offsetY || 0;
	const dest = options.dest || new Uint8Array(destW * destH * 4);
	const filter = typeof options.filter === "undefined" ? "mks2013" : options.filter;
	const filtersX = resizeFilterGen(filter, srcW, destW, scaleX, offsetX), filtersY = resizeFilterGen(filter, srcH, destH, scaleY, offsetY);
	const tmp = new Uint16Array(destW * srcH * 4);
	if (hasAlpha$1(src, srcW, srcH)) {
		convolveHorWithPre(src, tmp, srcW, srcH, destW, filtersX);
		convolveVertWithPre(tmp, dest, srcH, destW, destH, filtersY);
	} else {
		convolveHor(src, tmp, srcW, srcH, destW, filtersX);
		convolveVert(tmp, dest, srcH, destW, destH, filtersY);
		resetAlpha$1(dest, destW, destH);
	}
	return dest;
}
function hasAlpha(src, width, height) {
	let ptr = 3;
	const len = width * height * 4 | 0;
	while (ptr < len) {
		if (src[ptr] !== 255) return true;
		ptr = ptr + 4 | 0;
	}
	return false;
}
function resetAlpha(dst, width, height) {
	let ptr = 3;
	const len = width * height * 4 | 0;
	while (ptr < len) {
		dst[ptr] = 255;
		ptr = ptr + 4 | 0;
	}
}
function asUint8Array(src) {
	return new Uint8Array(src.buffer, 0, src.byteLength);
}
var IS_LE = true;
try {
	IS_LE = new Uint32Array(new Uint8Array([
		1,
		0,
		0,
		0
	]).buffer)[0] === 1;
} catch (__) {}
function copyInt16asLE(src, target, target_offset) {
	if (IS_LE) {
		target.set(asUint8Array(src), target_offset);
		return;
	}
	for (let ptr = target_offset, i = 0; i < src.length; i++) {
		const data = src[i];
		target[ptr++] = data & 255;
		target[ptr++] = data >> 8 & 255;
	}
}
function resize_wasm(options) {
	const src = options.src;
	const srcW = options.width;
	const srcH = options.height;
	const destW = options.toWidth;
	const destH = options.toHeight;
	const scaleX = options.scaleX || options.toWidth / options.width;
	const scaleY = options.scaleY || options.toHeight / options.height;
	const offsetX = options.offsetX || 0;
	const offsetY = options.offsetY || 0;
	const dest = options.dest || new Uint8Array(destW * destH * 4);
	const filter = typeof options.filter === "undefined" ? "mks2013" : options.filter;
	const filtersX = resizeFilterGen(filter, srcW, destW, scaleX, offsetX), filtersY = resizeFilterGen(filter, srcH, destH, scaleY, offsetY);
	const src_offset = 0;
	const src_size = Math.max(src.byteLength, dest.byteLength);
	const tmp_offset = this.__align(src_offset + src_size);
	const tmp_size = srcH * destW * 4 * 2;
	const filtersX_offset = this.__align(tmp_offset + tmp_size);
	const filtersY_offset = this.__align(filtersX_offset + filtersX.byteLength);
	const alloc_bytes = filtersY_offset + filtersY.byteLength;
	const instance = this.__instance("resize", alloc_bytes);
	const mem = new Uint8Array(this.__memory.buffer);
	const mem32 = new Uint32Array(this.__memory.buffer);
	const src32 = new Uint32Array(src.buffer);
	mem32.set(src32);
	copyInt16asLE(filtersX, mem, filtersX_offset);
	copyInt16asLE(filtersY, mem, filtersY_offset);
	const fn = instance.exports.convolveHV || instance.exports._convolveHV;
	if (!fn) throw new Error("WASM resize function is not available");
	if (hasAlpha(src, srcW, srcH)) fn(filtersX_offset, filtersY_offset, tmp_offset, srcW, srcH, destW, destH, 1);
	else {
		fn(filtersX_offset, filtersY_offset, tmp_offset, srcW, srcH, destW, destH, 0);
		resetAlpha(dest, destW, destH);
	}
	new Uint32Array(dest.buffer).set(new Uint32Array(this.__memory.buffer, 0, destH * destW));
	return dest;
}
var mm_resize_default = {
	name: "resize",
	fn: resize,
	wasm_fn: resize_wasm,
	wasm_src: "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"
};
var MathLib = class extends import_multimath.default {
	constructor(requested_features) {
		const __requested_features = requested_features || [];
		const features = {
			js: __requested_features.indexOf("js") >= 0,
			wasm: __requested_features.indexOf("wasm") >= 0
		};
		super(features);
		this.features = {
			js: features.js,
			wasm: features.wasm && this.has_wasm()
		};
		this.use(mm_unsharp_mask_default);
		this.use(mm_resize_default);
	}
	resizeAndUnsharp(options) {
		const result = this.resize(options);
		if (options.unsharpAmount) this.unsharp_mask(result, options.toWidth, options.toHeight, options.unsharpAmount, options.unsharpRadius, options.unsharpThreshold);
		return result;
	}
};
function _typeof(o) {
	"@babel/helpers - typeof";
	return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
		return typeof o;
	} : function(o) {
		return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	}, _typeof(o);
}
function toPrimitive(t, r) {
	if ("object" != _typeof(t) || !t) return t;
	var e = t[Symbol.toPrimitive];
	if (void 0 !== e) {
		var i = e.call(t, r || "default");
		if ("object" != _typeof(i)) return i;
		throw new TypeError("@@toPrimitive must return a primitive value.");
	}
	return ("string" === r ? String : Number)(t);
}
function toPropertyKey(t) {
	var i = toPrimitive(t, "string");
	return "symbol" == _typeof(i) ? i : i + "";
}
function _defineProperty(e, r, t) {
	return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
		value: t,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[r] = t, e;
}
function ownKeys(e, r) {
	var t = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var o = Object.getOwnPropertySymbols(e);
		r && (o = o.filter(function(r) {
			return Object.getOwnPropertyDescriptor(e, r).enumerable;
		})), t.push.apply(t, o);
	}
	return t;
}
function _objectSpread2(e) {
	for (var r = 1; r < arguments.length; r++) {
		var t = null != arguments[r] ? arguments[r] : {};
		r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
			_defineProperty(e, r, t[r]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
			Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
		});
	}
	return e;
}
var GC_INTERVAL = 100;
var Pool = class {
	constructor(create, idle) {
		_defineProperty(this, "create", void 0);
		_defineProperty(this, "available", void 0);
		_defineProperty(this, "acquired", void 0);
		_defineProperty(this, "lastId", void 0);
		_defineProperty(this, "timeoutId", void 0);
		_defineProperty(this, "idle", void 0);
		this.create = create;
		this.available = [];
		this.acquired = {};
		this.lastId = 1;
		this.timeoutId = 0;
		this.idle = idle || 2e3;
	}
	acquire() {
		let descriptor;
		if (this.available.length !== 0) descriptor = this.available.pop();
		else descriptor = _objectSpread2(_objectSpread2({}, this.create()), {}, {
			id: this.lastId++,
			lastUsed: 0
		});
		this.acquired[descriptor.id] = descriptor;
		return {
			value: descriptor.value,
			release: () => this.release(descriptor)
		};
	}
	release(descriptor) {
		delete this.acquired[descriptor.id];
		descriptor.lastUsed = Date.now();
		this.available.push(descriptor);
		if (this.timeoutId === 0) this.timeoutId = setTimeout(() => this.gc(), GC_INTERVAL);
	}
	gc() {
		const now = Date.now();
		this.available = this.available.filter((descriptor) => {
			if (now - descriptor.lastUsed > this.idle) {
				descriptor.destroy();
				return false;
			}
			return true;
		});
		if (this.available.length !== 0) this.timeoutId = setTimeout(() => this.gc(), GC_INTERVAL);
		else this.timeoutId = 0;
	}
};
function objClass(obj) {
	var _obj$constructor$name, _obj$constructor;
	return (_obj$constructor$name = obj === null || obj === void 0 || (_obj$constructor = obj.constructor) === null || _obj$constructor === void 0 ? void 0 : _obj$constructor.name) !== null && _obj$constructor$name !== void 0 ? _obj$constructor$name : "";
}
function isCanvas(element) {
	const cname = objClass(element);
	return cname === "HTMLCanvasElement" || cname === "OffscreenCanvas" || cname === "Canvas" || cname === "CanvasElement";
}
function isImage(element) {
	return objClass(element) === "HTMLImageElement";
}
function isImageBitmap(element) {
	return objClass(element) === "ImageBitmap";
}
function limiter(concurrency) {
	let active = 0;
	const queue = [];
	function roll() {
		if (active < concurrency && queue.length) {
			var _queue$shift;
			active++;
			(_queue$shift = queue.shift()) === null || _queue$shift === void 0 || _queue$shift();
		}
	}
	return function limit(fn) {
		return new Promise((resolve, reject) => {
			queue.push(() => {
				fn().then((result) => {
					resolve(result);
					active--;
					roll();
				}, (err) => {
					reject(err);
					active--;
					roll();
				});
			});
			roll();
		});
	};
}
function cib_quality_name(num) {
	switch (num) {
		case 0: return "pixelated";
		case 1: return "low";
		case 2: return "medium";
	}
	return "high";
}
var CIB_QUALITY_FILTERS = [
	"box",
	"hamming",
	"lanczos2",
	"lanczos3"
];
function cib_quality_filter(num) {
	return CIB_QUALITY_FILTERS[num];
}
function is_cib_filter(filter) {
	return CIB_QUALITY_FILTERS.indexOf(filter) >= 0;
}
function filter_to_cib_quality(filter) {
	const index = CIB_QUALITY_FILTERS.indexOf(filter);
	return index >= 0 ? index : void 0;
}
var MIN_INNER_TILE_SIZE = 2;
var DEST_TILE_BORDER = 3;
function createStages(fromWidth, fromHeight, toWidth, toHeight, srcTileSize) {
	const scaleX = toWidth / fromWidth;
	const scaleY = toHeight / fromHeight;
	const minScale = (2 * DEST_TILE_BORDER + MIN_INNER_TILE_SIZE + 1) / srcTileSize;
	if (minScale > .5) return [[toWidth, toHeight]];
	const stageCount = Math.ceil(Math.log(Math.min(scaleX, scaleY)) / Math.log(minScale));
	if (stageCount <= 1) return [[toWidth, toHeight]];
	const result = [];
	for (let i = 0; i < stageCount; i++) {
		const width = Math.round(Math.pow(Math.pow(fromWidth, stageCount - i - 1) * Math.pow(toWidth, i + 1), 1 / stageCount));
		const height = Math.round(Math.pow(Math.pow(fromHeight, stageCount - i - 1) * Math.pow(toHeight, i + 1), 1 / stageCount));
		result.push([width, height]);
	}
	return result;
}
var PIXEL_EPSILON = 1e-5;
function pixelFloor(x) {
	const nearest = Math.round(x);
	if (Math.abs(x - nearest) < PIXEL_EPSILON) return nearest;
	return Math.floor(x);
}
function pixelCeil(x) {
	const nearest = Math.round(x);
	if (Math.abs(x - nearest) < PIXEL_EPSILON) return nearest;
	return Math.ceil(x);
}
function createRegions(options) {
	const scaleX = options.toWidth / options.width;
	const scaleY = options.toHeight / options.height;
	const innerTileWidth = pixelFloor(options.srcTileSize * scaleX) - 2 * options.destTileBorder;
	const innerTileHeight = pixelFloor(options.srcTileSize * scaleY) - 2 * options.destTileBorder;
	if (innerTileWidth < 1 || innerTileHeight < 1) throw new Error("Internal error in pica: target tile width/height is too small.");
	let x, y;
	let innerX, innerY, toTileWidth, toTileHeight;
	const tiles = [];
	let tile;
	for (innerY = 0; innerY < options.toHeight; innerY += innerTileHeight) for (innerX = 0; innerX < options.toWidth; innerX += innerTileWidth) {
		x = innerX - options.destTileBorder;
		if (x < 0) x = 0;
		toTileWidth = innerX + innerTileWidth + options.destTileBorder - x;
		if (x + toTileWidth >= options.toWidth) toTileWidth = options.toWidth - x;
		y = innerY - options.destTileBorder;
		if (y < 0) y = 0;
		toTileHeight = innerY + innerTileHeight + options.destTileBorder - y;
		if (y + toTileHeight >= options.toHeight) toTileHeight = options.toHeight - y;
		tile = {
			toX: x,
			toY: y,
			toWidth: toTileWidth,
			toHeight: toTileHeight,
			toInnerX: innerX,
			toInnerY: innerY,
			toInnerWidth: innerTileWidth,
			toInnerHeight: innerTileHeight,
			offsetX: x / scaleX - pixelFloor(x / scaleX),
			offsetY: y / scaleY - pixelFloor(y / scaleY),
			scaleX,
			scaleY,
			x: pixelFloor(x / scaleX),
			y: pixelFloor(y / scaleY),
			width: pixelCeil(toTileWidth / scaleX),
			height: pixelCeil(toTileHeight / scaleY)
		};
		tiles.push(tile);
	}
	return tiles;
}
var ORIENTED_JPEG_BASE64 = "/9j/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAYAAAAAAAD/4AAQskZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAACAAMBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABsQAAMBAQADAAAAAAAAAAAAAAECAwQFABEx/9oACAEBAAA/AC06fW6va0ps7PT179E88MiV02arrCEkjGQZiSEnKc5ovxURVHoADz//2Q==";
var features = {
	canvas: false,
	offscreen_canvas: false,
	may_be_worker: false,
	create_image_bitmap: false,
	safari_put_image_data_fix: false,
	bug_canvas_orientation_region: true,
	bug_image_bitmap_orientation_region: true,
	cib_resize: false
};
var checked = false;
var checking = null;
function check_canvas() {
	if (typeof document === "undefined" || !document.createElement) return false;
	try {
		const canvas = document.createElement("canvas");
		canvas.width = 2;
		canvas.height = 1;
		const ctx = canvas.getContext("2d");
		let d = ctx.createImageData(2, 1);
		d.data[0] = 12;
		d.data[1] = 23;
		d.data[2] = 34;
		d.data[3] = 255;
		d.data[4] = 45;
		d.data[5] = 56;
		d.data[6] = 67;
		d.data[7] = 255;
		ctx.putImageData(d, 0, 0);
		d = ctx.getImageData(0, 0, 2, 1);
		return d.data[0] === 12 && d.data[1] === 23 && d.data[2] === 34 && d.data[3] === 255 && d.data[4] === 45 && d.data[5] === 56 && d.data[6] === 67 && d.data[7] === 255;
	} catch (__) {
		return false;
	}
}
function check_offscreen_canvas() {
	if (typeof OffscreenCanvas === "undefined") return false;
	try {
		const ctx = new OffscreenCanvas(2, 1).getContext("2d");
		let d = ctx.createImageData(2, 1);
		d.data[0] = 12;
		d.data[1] = 23;
		d.data[2] = 34;
		d.data[3] = 255;
		d.data[4] = 45;
		d.data[5] = 56;
		d.data[6] = 67;
		d.data[7] = 255;
		ctx.putImageData(d, 0, 0);
		d = ctx.getImageData(0, 0, 2, 1);
		return d.data[0] === 12 && d.data[1] === 23 && d.data[2] === 34 && d.data[3] === 255 && d.data[4] === 45 && d.data[5] === 56 && d.data[6] === 67 && d.data[7] === 255;
	} catch (__) {
		return false;
	}
}
function check_create_image_bitmap() {
	return typeof createImageBitmap !== "undefined";
}
function check_may_be_worker() {
	return typeof Worker !== "undefined" && typeof URL !== "undefined" && !!URL.createObjectURL;
}
function check_safari_put_image_data_fix() {
	try {
		return !!(typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.indexOf("Safari") >= 0 && navigator.userAgent.indexOf("Chrome") < 0);
	} catch (__) {
		return false;
	}
}
function check_bug_canvas_orientation_region_async() {
	return Promise.resolve().then(() => {
		if (check_offscreen_canvas() && check_create_image_bitmap() && typeof Blob !== "undefined" && typeof atob !== "undefined") {
			const binary = atob(ORIENTED_JPEG_BASE64);
			const bytes = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
			return createImageBitmap(new Blob([bytes], { type: "image/jpeg" })).then((bitmap) => {
				const canvas = new OffscreenCanvas(1, 1);
				try {
					const ctx = canvas.getContext("2d");
					ctx.drawImage(bitmap, 1, 1, 1, 1, 0, 0, 1, 1);
					return ctx.getImageData(0, 0, 1, 1).data[0] < 240;
				} finally {
					bitmap.close();
				}
			});
		}
		if (check_canvas() && typeof Image !== "undefined") return new Promise((resolve) => {
			const image = new Image();
			image.onload = () => {
				try {
					const canvas = document.createElement("canvas");
					canvas.width = 1;
					canvas.height = 1;
					const ctx = canvas.getContext("2d");
					ctx.drawImage(image, 1, 1, 1, 1, 0, 0, 1, 1);
					resolve(ctx.getImageData(0, 0, 1, 1).data[0] < 240);
				} catch (__) {
					resolve(true);
				}
			};
			image.onerror = () => resolve(true);
			image.src = `data:image/jpeg;base64,${ORIENTED_JPEG_BASE64}`;
		});
		return true;
	}).catch(() => true);
}
function check_bug_image_bitmap_orientation_region_async() {
	return Promise.resolve().then(() => {
		if (!features.create_image_bitmap && !check_create_image_bitmap()) return true;
		if (typeof Blob === "undefined" || typeof atob === "undefined") return true;
		const canOffscreenCanvas = check_offscreen_canvas();
		const canCanvas = check_canvas();
		if (!canOffscreenCanvas && !canCanvas) return true;
		const binary = atob(ORIENTED_JPEG_BASE64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
		return createImageBitmap(new Blob([bytes], { type: "image/jpeg" })).then((imageBitmap) => createImageBitmap(imageBitmap, 1, 1, 1, 1).then((bitmap) => {
			let canvas;
			if (canOffscreenCanvas) canvas = new OffscreenCanvas(1, 1);
			else {
				canvas = document.createElement("canvas");
				canvas.width = 1;
				canvas.height = 1;
			}
			try {
				const ctx = canvas.getContext("2d");
				ctx.drawImage(bitmap, 0, 0);
				return bitmap.width !== 1 || bitmap.height !== 1 || ctx.getImageData(0, 0, 1, 1).data[0] < 240;
			} finally {
				imageBitmap.close();
				bitmap.close();
			}
		}, () => {
			imageBitmap.close();
			return true;
		}));
	}).catch(() => true);
}
function check_cib_resize_async() {
	return Promise.resolve().then(() => {
		if (!check_create_image_bitmap()) return false;
		const SRC_SIZE = 20;
		const DST_SIZE = 5;
		let canvas;
		if (features.canvas || check_canvas()) {
			canvas = document.createElement("canvas");
			canvas.width = SRC_SIZE;
			canvas.height = SRC_SIZE;
		} else if (features.offscreen_canvas || check_offscreen_canvas()) {
			canvas = new OffscreenCanvas(SRC_SIZE, SRC_SIZE);
			canvas.getContext("2d").clearRect(0, 0, SRC_SIZE, SRC_SIZE);
		} else return false;
		return createImageBitmap(canvas, 0, 0, SRC_SIZE, SRC_SIZE, {
			resizeWidth: DST_SIZE,
			resizeHeight: DST_SIZE,
			resizeQuality: "high"
		}).then((bitmap) => {
			const status = bitmap.width === DST_SIZE && !!bitmap.close;
			if (bitmap.close) bitmap.close();
			canvas = null;
			return status;
		});
	}).catch(() => false);
}
function get_supported_features() {
	if (checked) return Promise.resolve(Object.assign({}, features));
	if (checking) return checking.then(() => Object.assign({}, features));
	features.canvas = check_canvas();
	features.offscreen_canvas = check_offscreen_canvas();
	features.may_be_worker = check_may_be_worker();
	features.create_image_bitmap = check_create_image_bitmap();
	features.safari_put_image_data_fix = check_safari_put_image_data_fix();
	const bugCanvasOrientationRegion = check_bug_canvas_orientation_region_async().then((result) => {
		features.bug_canvas_orientation_region = result;
	}).catch(() => {});
	const bugImageBitmapOrientationRegion = check_bug_image_bitmap_orientation_region_async().then((result) => {
		features.bug_image_bitmap_orientation_region = result;
	}).catch(() => {});
	const cibResize = check_cib_resize_async().then((result) => {
		features.cib_resize = result;
	}).catch(() => {});
	checking = Promise.all([
		bugCanvasOrientationRegion,
		bugImageBitmapOrientationRegion,
		cibResize
	]).then(() => {
		checked = true;
		checking = null;
		return Object.assign({}, features);
	}, (err) => {
		checking = null;
		throw err;
	});
	return checking;
}
function asyncGeneratorStep(n, t, e, r, o, a, c) {
	try {
		var i = n[a](c), u = i.value;
	} catch (n) {
		e(n);
		return;
	}
	i.done ? t(u) : Promise.resolve(u).then(r, o);
}
function _asyncToGenerator(n) {
	return function() {
		var t = this, e = arguments;
		return new Promise(function(r, o) {
			var a = n.apply(t, e);
			function _next(n) {
				asyncGeneratorStep(a, r, o, _next, _throw, "next", n);
			}
			function _throw(n) {
				asyncGeneratorStep(a, r, o, _next, _throw, "throw", n);
			}
			_next(void 0);
		});
	};
}
var WORKER_SRC = "/*!\n\npica\nhttps://github.com/nodeca/pica\n\n*/\n(function() {\n	var __create = Object.create;\n	var __defProp = Object.defineProperty;\n	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;\n	var __getOwnPropNames = Object.getOwnPropertyNames;\n	var __getProtoOf = Object.getPrototypeOf;\n	var __hasOwnProp = Object.prototype.hasOwnProperty;\n	var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);\n	var __copyProps = (to, from, except, desc) => {\n		if (from && typeof from === \"object\" || typeof from === \"function\") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {\n			key = keys[i];\n			if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {\n				get: ((k) => from[k]).bind(null, key),\n				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable\n			});\n		}\n		return to;\n	};\n	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, \"default\", {\n		value: mod,\n		enumerable: true\n	}) : target, mod));\n	/*\n	object-assign\n	(c) Sindre Sorhus\n	@license MIT\n	*/\n	var require_object_assign = /* @__PURE__ */ __commonJSMin(((exports, module) => {\n		var getOwnPropertySymbols = Object.getOwnPropertySymbols;\n		var hasOwnProperty = Object.prototype.hasOwnProperty;\n		var propIsEnumerable = Object.prototype.propertyIsEnumerable;\n		function toObject(val) {\n			if (val === null || val === void 0) throw new TypeError(\"Object.assign cannot be called with null or undefined\");\n			return Object(val);\n		}\n		function shouldUseNative() {\n			try {\n				if (!Object.assign) return false;\n				var test1 = /* @__PURE__ */ new String(\"abc\");\n				test1[5] = \"de\";\n				if (Object.getOwnPropertyNames(test1)[0] === \"5\") return false;\n				var test2 = {};\n				for (var i = 0; i < 10; i++) test2[\"_\" + String.fromCharCode(i)] = i;\n				if (Object.getOwnPropertyNames(test2).map(function(n) {\n					return test2[n];\n				}).join(\"\") !== \"0123456789\") return false;\n				var test3 = {};\n				\"abcdefghijklmnopqrst\".split(\"\").forEach(function(letter) {\n					test3[letter] = letter;\n				});\n				if (Object.keys(Object.assign({}, test3)).join(\"\") !== \"abcdefghijklmnopqrst\") return false;\n				return true;\n			} catch (err) {\n				return false;\n			}\n		}\n		module.exports = shouldUseNative() ? Object.assign : function(target, source) {\n			var from;\n			var to = toObject(target);\n			var symbols;\n			for (var s = 1; s < arguments.length; s++) {\n				from = Object(arguments[s]);\n				for (var key in from) if (hasOwnProperty.call(from, key)) to[key] = from[key];\n				if (getOwnPropertySymbols) {\n					symbols = getOwnPropertySymbols(from);\n					for (var i = 0; i < symbols.length; i++) if (propIsEnumerable.call(from, symbols[i])) to[symbols[i]] = from[symbols[i]];\n				}\n			}\n			return to;\n		};\n	}));\n	var require_base64decode = /* @__PURE__ */ __commonJSMin(((exports, module) => {\n		var BASE64_MAP = \"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/\";\n		module.exports = function base64decode(str) {\n			var input = str.replace(/[\\r\\n=]/g, \"\"), max = input.length;\n			var out = new Uint8Array(max * 3 >> 2);\n			var bits = 0;\n			var ptr = 0;\n			for (var idx = 0; idx < max; idx++) {\n				if (idx % 4 === 0 && idx) {\n					out[ptr++] = bits >> 16 & 255;\n					out[ptr++] = bits >> 8 & 255;\n					out[ptr++] = bits & 255;\n				}\n				bits = bits << 6 | BASE64_MAP.indexOf(input.charAt(idx));\n			}\n			var tailbits = max % 4 * 6;\n			if (tailbits === 0) {\n				out[ptr++] = bits >> 16 & 255;\n				out[ptr++] = bits >> 8 & 255;\n				out[ptr++] = bits & 255;\n			} else if (tailbits === 18) {\n				out[ptr++] = bits >> 10 & 255;\n				out[ptr++] = bits >> 2 & 255;\n			} else if (tailbits === 12) out[ptr++] = bits >> 4 & 255;\n			return out;\n		};\n	}));\n	var require_wa_detect = /* @__PURE__ */ __commonJSMin(((exports, module) => {\n		var wa;\n		module.exports = function hasWebAssembly() {\n			if (typeof wa !== \"undefined\") return wa;\n			wa = false;\n			if (typeof WebAssembly === \"undefined\") return wa;\n			try {\n				var bin = new Uint8Array([\n					0,\n					97,\n					115,\n					109,\n					1,\n					0,\n					0,\n					0,\n					1,\n					6,\n					1,\n					96,\n					1,\n					127,\n					1,\n					127,\n					3,\n					2,\n					1,\n					0,\n					5,\n					3,\n					1,\n					0,\n					1,\n					7,\n					8,\n					1,\n					4,\n					116,\n					101,\n					115,\n					116,\n					0,\n					0,\n					10,\n					16,\n					1,\n					14,\n					0,\n					32,\n					0,\n					65,\n					1,\n					54,\n					2,\n					0,\n					32,\n					0,\n					40,\n					2,\n					0,\n					11\n				]);\n				var module$4 = new WebAssembly.Module(bin);\n				if (new WebAssembly.Instance(module$4, {}).exports.test(4) !== 0) wa = true;\n				return wa;\n			} catch (__) {}\n			return wa;\n		};\n	}));\n	var require_multimath = /* @__PURE__ */ __commonJSMin(((exports, module) => {\n		var assign = require_object_assign();\n		var base64decode = require_base64decode();\n		var hasWebAssembly = require_wa_detect();\n		var DEFAULT_OPTIONS = {\n			js: true,\n			wasm: true\n		};\n		function MultiMath(options) {\n			if (!(this instanceof MultiMath)) return new MultiMath(options);\n			var opts = assign({}, DEFAULT_OPTIONS, options || {});\n			this.options = opts;\n			this.__cache = {};\n			this.__init_promise = null;\n			this.__modules = opts.modules || {};\n			this.__memory = null;\n			this.__wasm = {};\n			this.__isLE = new Uint32Array(new Uint8Array([\n				1,\n				0,\n				0,\n				0\n			]).buffer)[0] === 1;\n			if (!this.options.js && !this.options.wasm) throw new Error(\"mathlib: at least \\\"js\\\" or \\\"wasm\\\" should be enabled\");\n		}\n		MultiMath.prototype.has_wasm = hasWebAssembly;\n		MultiMath.prototype.use = function(module$1) {\n			this.__modules[module$1.name] = module$1;\n			if (this.options.wasm && this.has_wasm() && module$1.wasm_fn) this[module$1.name] = module$1.wasm_fn;\n			else this[module$1.name] = module$1.fn;\n			return this;\n		};\n		MultiMath.prototype.init = function() {\n			if (this.__init_promise) return this.__init_promise;\n			if (!this.options.js && this.options.wasm && !this.has_wasm()) return Promise.reject(/* @__PURE__ */ new Error(\"mathlib: only \\\"wasm\\\" was enabled, but it's not supported\"));\n			var self = this;\n			this.__init_promise = Promise.all(Object.keys(self.__modules).map(function(name) {\n				var module$2 = self.__modules[name];\n				if (!self.options.wasm || !self.has_wasm() || !module$2.wasm_fn) return null;\n				if (self.__wasm[name]) return null;\n				return WebAssembly.compile(self.__base64decode(module$2.wasm_src)).then(function(m) {\n					self.__wasm[name] = m;\n				});\n			})).then(function() {\n				return self;\n			});\n			return this.__init_promise;\n		};\n		MultiMath.prototype.__base64decode = base64decode;\n		MultiMath.prototype.__reallocate = function mem_grow_to(bytes) {\n			if (!this.__memory) {\n				this.__memory = new WebAssembly.Memory({ initial: Math.ceil(bytes / (64 * 1024)) });\n				return this.__memory;\n			}\n			var mem_size = this.__memory.buffer.byteLength;\n			if (mem_size < bytes) this.__memory.grow(Math.ceil((bytes - mem_size) / (64 * 1024)));\n			return this.__memory;\n		};\n		MultiMath.prototype.__instance = function instance(name, memsize, env_extra) {\n			if (memsize) this.__reallocate(memsize);\n			if (!this.__wasm[name]) {\n				var module$3 = this.__modules[name];\n				this.__wasm[name] = new WebAssembly.Module(this.__base64decode(module$3.wasm_src));\n			}\n			if (!this.__cache[name]) {\n				var env_base = {\n					memoryBase: 0,\n					memory: this.__memory,\n					tableBase: 0,\n					table: new WebAssembly.Table({\n						initial: 0,\n						element: \"anyfunc\"\n					})\n				};\n				this.__cache[name] = new WebAssembly.Instance(this.__wasm[name], { env: assign(env_base, env_extra || {}) });\n			}\n			return this.__cache[name];\n		};\n		MultiMath.prototype.__align = function align(number, base) {\n			base = base || 8;\n			var reminder = number % base;\n			return number + (reminder ? base - reminder : 0);\n		};\n		module.exports = MultiMath;\n	}));\n	var require_mono16 = /* @__PURE__ */ __commonJSMin(((exports, module) => {\n		var a0, a1, a2, a3, b1, b2, left_corner, right_corner;\n		function gaussCoef(sigma) {\n			if (sigma < .5) sigma = .5;\n			var a = Math.exp(.726 * .726) / sigma, g1 = Math.exp(-a), g2 = Math.exp(-2 * a), k = (1 - g1) * (1 - g1) / (1 + 2 * a * g1 - g2);\n			a0 = k;\n			a1 = k * (a - 1) * g1;\n			a2 = k * (a + 1) * g1;\n			a3 = -k * g2;\n			b1 = 2 * g1;\n			b2 = -g2;\n			left_corner = (a0 + a1) / (1 - b1 - b2);\n			right_corner = (a2 + a3) / (1 - b1 - b2);\n			return new Float32Array([\n				a0,\n				a1,\n				a2,\n				a3,\n				b1,\n				b2,\n				left_corner,\n				right_corner\n			]);\n		}\n		function convolveMono16(src, out, line, coeff, width, height) {\n			var prev_src, curr_src, curr_out, prev_out, prev_prev_out;\n			var src_index, out_index, line_index;\n			var i, j;\n			var coeff_a0, coeff_a1, coeff_b1, coeff_b2;\n			for (i = 0; i < height; i++) {\n				src_index = i * width;\n				out_index = i;\n				line_index = 0;\n				prev_src = src[src_index];\n				prev_prev_out = prev_src * coeff[6];\n				prev_out = prev_prev_out;\n				coeff_a0 = coeff[0];\n				coeff_a1 = coeff[1];\n				coeff_b1 = coeff[4];\n				coeff_b2 = coeff[5];\n				for (j = 0; j < width; j++) {\n					curr_src = src[src_index];\n					curr_out = curr_src * coeff_a0 + prev_src * coeff_a1 + prev_out * coeff_b1 + prev_prev_out * coeff_b2;\n					prev_prev_out = prev_out;\n					prev_out = curr_out;\n					prev_src = curr_src;\n					line[line_index] = prev_out;\n					line_index++;\n					src_index++;\n				}\n				src_index--;\n				line_index--;\n				out_index += height * (width - 1);\n				prev_src = src[src_index];\n				prev_prev_out = prev_src * coeff[7];\n				prev_out = prev_prev_out;\n				curr_src = prev_src;\n				coeff_a0 = coeff[2];\n				coeff_a1 = coeff[3];\n				for (j = width - 1; j >= 0; j--) {\n					curr_out = curr_src * coeff_a0 + prev_src * coeff_a1 + prev_out * coeff_b1 + prev_prev_out * coeff_b2;\n					prev_prev_out = prev_out;\n					prev_out = curr_out;\n					prev_src = curr_src;\n					curr_src = src[src_index];\n					out[out_index] = line[line_index] + prev_out;\n					src_index--;\n					line_index--;\n					out_index -= height;\n				}\n			}\n		}\n		function blurMono16(src, width, height, radius) {\n			if (!radius) return;\n			var out = new Uint16Array(src.length), tmp_line = new Float32Array(Math.max(width, height));\n			var coeff = gaussCoef(radius);\n			convolveMono16(src, out, tmp_line, coeff, width, height, radius);\n			convolveMono16(out, src, tmp_line, coeff, height, width, radius);\n		}\n		module.exports = blurMono16;\n	}));\n	var import_multimath = /* @__PURE__ */ __toESM(require_multimath());\n	var import_mono16 = /* @__PURE__ */ __toESM(require_mono16());\n	function hsv_v16(img, width, height) {\n		const size = width * height;\n		const out = new Uint16Array(size);\n		let r, g, b, max;\n		for (let i = 0; i < size; i++) {\n			r = img[4 * i];\n			g = img[4 * i + 1];\n			b = img[4 * i + 2];\n			max = r >= g && r >= b ? r : g >= b && g >= r ? g : b;\n			out[i] = max << 8;\n		}\n		return out;\n	}\n	function unsharp$1(img, width, height, amount, radius, threshold) {\n		let v1, v2, vmul;\n		let diff, iTimes4;\n		if (amount === 0 || radius < .5) return;\n		if (radius > 2) radius = 2;\n		const brightness = hsv_v16(img, width, height);\n		const blured = new Uint16Array(brightness);\n		(0, import_mono16.default)(blured, width, height, radius);\n		const amountFp = amount / 100 * 4096 + .5 | 0;\n		const thresholdFp = threshold << 8;\n		const size = width * height;\n		for (let i = 0; i < size; i++) {\n			v1 = brightness[i];\n			diff = v1 - blured[i];\n			if (Math.abs(diff) >= thresholdFp) {\n				v2 = v1 + (amountFp * diff + 2048 >> 12);\n				v2 = v2 > 65280 ? 65280 : v2;\n				v2 = v2 < 0 ? 0 : v2;\n				v1 = v1 !== 0 ? v1 : 1;\n				vmul = (v2 << 12) / v1 | 0;\n				iTimes4 = i * 4;\n				img[iTimes4] = img[iTimes4] * vmul + 2048 >> 12;\n				img[iTimes4 + 1] = img[iTimes4 + 1] * vmul + 2048 >> 12;\n				img[iTimes4 + 2] = img[iTimes4 + 2] * vmul + 2048 >> 12;\n			}\n		}\n	}\n	function unsharp(img, width, height, amount, radius, threshold) {\n		if (amount === 0 || radius < .5) return;\n		if (radius > 2) radius = 2;\n		const pixels = width * height;\n		const img_bytes_cnt = pixels * 4;\n		const hsv_bytes_cnt = pixels * 2;\n		const blur_bytes_cnt = pixels * 2;\n		const blur_line_byte_cnt = Math.max(width, height) * 4;\n		const blur_coeffs_byte_cnt = 32;\n		const img_offset = 0;\n		const hsv_offset = img_bytes_cnt;\n		const blur_offset = hsv_offset + hsv_bytes_cnt;\n		const blur_tmp_offset = blur_offset + blur_bytes_cnt;\n		const blur_line_offset = blur_tmp_offset + blur_bytes_cnt;\n		const blur_coeffs_offset = blur_line_offset + blur_line_byte_cnt;\n		const instance = this.__instance(\"unsharp_mask\", img_bytes_cnt + hsv_bytes_cnt + blur_bytes_cnt * 2 + blur_line_byte_cnt + blur_coeffs_byte_cnt, { exp: Math.exp });\n		const img32 = new Uint32Array(img.buffer);\n		new Uint32Array(this.__memory.buffer).set(img32);\n		let fn = instance.exports.hsv_v16 || instance.exports._hsv_v16;\n		if (!fn) throw new Error(\"WASM hsv_v16 function is not available\");\n		fn(img_offset, hsv_offset, width, height);\n		fn = instance.exports.blurMono16 || instance.exports._blurMono16;\n		if (!fn) throw new Error(\"WASM blurMono16 function is not available\");\n		fn(hsv_offset, blur_offset, blur_tmp_offset, blur_line_offset, blur_coeffs_offset, width, height, radius);\n		fn = instance.exports.unsharp || instance.exports._unsharp;\n		if (!fn) throw new Error(\"WASM unsharp function is not available\");\n		fn(img_offset, img_offset, hsv_offset, blur_offset, width, height, amount, threshold);\n		img32.set(new Uint32Array(this.__memory.buffer, 0, pixels));\n	}\n	var mm_unsharp_mask_default = {\n		name: \"unsharp_mask\",\n		fn: unsharp$1,\n		wasm_fn: unsharp,\n		wasm_src: \"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\"\n	};\n	var resize_filter_info_default = { filter: {\n		box: {\n			win: .5,\n			fn(x) {\n				if (x < 0) x = -x;\n				return x < .5 ? 1 : 0;\n			}\n		},\n		hamming: {\n			win: 1,\n			fn(x) {\n				if (x < 0) x = -x;\n				if (x >= 1) return 0;\n				if (x < 1.1920929e-7) return 1;\n				const xpi = x * Math.PI;\n				return Math.sin(xpi) / xpi * (.54 + .46 * Math.cos(xpi / 1));\n			}\n		},\n		lanczos2: {\n			win: 2,\n			fn(x) {\n				if (x < 0) x = -x;\n				if (x >= 2) return 0;\n				if (x < 1.1920929e-7) return 1;\n				const xpi = x * Math.PI;\n				return Math.sin(xpi) / xpi * Math.sin(xpi / 2) / (xpi / 2);\n			}\n		},\n		lanczos3: {\n			win: 3,\n			fn(x) {\n				if (x < 0) x = -x;\n				if (x >= 3) return 0;\n				if (x < 1.1920929e-7) return 1;\n				const xpi = x * Math.PI;\n				return Math.sin(xpi) / xpi * Math.sin(xpi / 3) / (xpi / 3);\n			}\n		},\n		mks2013: {\n			win: 2.5,\n			fn(x) {\n				if (x < 0) x = -x;\n				if (x >= 2.5) return 0;\n				if (x >= 1.5) return -.125 * (x - 2.5) * (x - 2.5);\n				if (x >= .5) return .25 * (4 * x * x - 11 * x + 7);\n				return 1.0625 - 1.75 * x * x;\n			}\n		}\n	} };\n	var FIXED_FRAC_BITS = 14;\n	function toFixedPoint(num) {\n		return Math.round(num * ((1 << FIXED_FRAC_BITS) - 1));\n	}\n	function resizeFilterGen(filter, srcSize, destSize, scale, offset) {\n		const filterFunction = resize_filter_info_default.filter[filter].fn;\n		const scaleInverted = 1 / scale;\n		const scaleClamped = Math.min(1, scale);\n		const srcWindow = resize_filter_info_default.filter[filter].win / scaleClamped;\n		let destPixel, srcPixel, srcFirst, srcLast, filterElementSize, floatFilter, fxpFilter, total, pxl, idx, floatVal, filterTotal, filterVal;\n		let leftNotEmpty, rightNotEmpty, filterShift, filterSize;\n		const maxFilterElementSize = Math.floor((srcWindow + 1) * 2);\n		const packedFilter = new Int16Array((maxFilterElementSize + 2) * destSize);\n		let packedFilterPtr = 0;\n		const slowCopy = !packedFilter.subarray || !packedFilter.set;\n		for (destPixel = 0; destPixel < destSize; destPixel++) {\n			srcPixel = (destPixel + .5) * scaleInverted + offset;\n			srcFirst = Math.max(0, Math.floor(srcPixel - srcWindow));\n			srcLast = Math.min(srcSize - 1, Math.ceil(srcPixel + srcWindow));\n			filterElementSize = srcLast - srcFirst + 1;\n			floatFilter = new Float32Array(filterElementSize);\n			fxpFilter = new Int16Array(filterElementSize);\n			total = 0;\n			for (pxl = srcFirst, idx = 0; pxl <= srcLast; pxl++, idx++) {\n				floatVal = filterFunction((pxl + .5 - srcPixel) * scaleClamped);\n				total += floatVal;\n				floatFilter[idx] = floatVal;\n			}\n			filterTotal = 0;\n			for (idx = 0; idx < floatFilter.length; idx++) {\n				filterVal = floatFilter[idx] / total;\n				filterTotal += filterVal;\n				fxpFilter[idx] = toFixedPoint(filterVal);\n			}\n			fxpFilter[destSize >> 1] += toFixedPoint(1 - filterTotal);\n			leftNotEmpty = 0;\n			while (leftNotEmpty < fxpFilter.length && fxpFilter[leftNotEmpty] === 0) leftNotEmpty++;\n			if (leftNotEmpty < fxpFilter.length) {\n				rightNotEmpty = fxpFilter.length - 1;\n				while (rightNotEmpty > 0 && fxpFilter[rightNotEmpty] === 0) rightNotEmpty--;\n				filterShift = srcFirst + leftNotEmpty;\n				filterSize = rightNotEmpty - leftNotEmpty + 1;\n				packedFilter[packedFilterPtr++] = filterShift;\n				packedFilter[packedFilterPtr++] = filterSize;\n				if (!slowCopy) {\n					packedFilter.set(fxpFilter.subarray(leftNotEmpty, rightNotEmpty + 1), packedFilterPtr);\n					packedFilterPtr += filterSize;\n				} else for (idx = leftNotEmpty; idx <= rightNotEmpty; idx++) packedFilter[packedFilterPtr++] = fxpFilter[idx];\n			} else {\n				packedFilter[packedFilterPtr++] = 0;\n				packedFilter[packedFilterPtr++] = 0;\n			}\n		}\n		return packedFilter;\n	}\n	function clampTo8(i) {\n		return i < 0 ? 0 : i > 255 ? 255 : i;\n	}\n	function clampNegative(i) {\n		return i >= 0 ? i : 0;\n	}\n	function convolveHor(src, dest, srcW, srcH, destW, filters) {\n		let r, g, b, a;\n		let filterPtr, filterShift, filterSize;\n		let srcPtr, srcY, destX, filterVal;\n		let srcOffset = 0, destOffset = 0;\n		for (srcY = 0; srcY < srcH; srcY++) {\n			filterPtr = 0;\n			for (destX = 0; destX < destW; destX++) {\n				filterShift = filters[filterPtr++];\n				filterSize = filters[filterPtr++];\n				srcPtr = srcOffset + filterShift * 4 | 0;\n				r = g = b = a = 0;\n				for (; filterSize > 0; filterSize--) {\n					filterVal = filters[filterPtr++];\n					a = a + filterVal * src[srcPtr + 3] | 0;\n					b = b + filterVal * src[srcPtr + 2] | 0;\n					g = g + filterVal * src[srcPtr + 1] | 0;\n					r = r + filterVal * src[srcPtr] | 0;\n					srcPtr = srcPtr + 4 | 0;\n				}\n				dest[destOffset + 3] = clampNegative(a >> 7);\n				dest[destOffset + 2] = clampNegative(b >> 7);\n				dest[destOffset + 1] = clampNegative(g >> 7);\n				dest[destOffset] = clampNegative(r >> 7);\n				destOffset = destOffset + srcH * 4 | 0;\n			}\n			destOffset = (srcY + 1) * 4 | 0;\n			srcOffset = (srcY + 1) * srcW * 4 | 0;\n		}\n	}\n	function convolveVert(src, dest, srcW, srcH, destW, filters) {\n		let r, g, b, a;\n		let filterPtr, filterShift, filterSize;\n		let srcPtr, srcY, destX, filterVal;\n		let srcOffset = 0, destOffset = 0;\n		for (srcY = 0; srcY < srcH; srcY++) {\n			filterPtr = 0;\n			for (destX = 0; destX < destW; destX++) {\n				filterShift = filters[filterPtr++];\n				filterSize = filters[filterPtr++];\n				srcPtr = srcOffset + filterShift * 4 | 0;\n				r = g = b = a = 0;\n				for (; filterSize > 0; filterSize--) {\n					filterVal = filters[filterPtr++];\n					a = a + filterVal * src[srcPtr + 3] | 0;\n					b = b + filterVal * src[srcPtr + 2] | 0;\n					g = g + filterVal * src[srcPtr + 1] | 0;\n					r = r + filterVal * src[srcPtr] | 0;\n					srcPtr = srcPtr + 4 | 0;\n				}\n				r >>= 7;\n				g >>= 7;\n				b >>= 7;\n				a >>= 7;\n				dest[destOffset + 3] = clampTo8(a + 8192 >> 14);\n				dest[destOffset + 2] = clampTo8(b + 8192 >> 14);\n				dest[destOffset + 1] = clampTo8(g + 8192 >> 14);\n				dest[destOffset] = clampTo8(r + 8192 >> 14);\n				destOffset = destOffset + srcH * 4 | 0;\n			}\n			destOffset = (srcY + 1) * 4 | 0;\n			srcOffset = (srcY + 1) * srcW * 4 | 0;\n		}\n	}\n	function convolveHorWithPre(src, dest, srcW, srcH, destW, filters) {\n		let r, g, b, a, alpha;\n		let filterPtr, filterShift, filterSize;\n		let srcPtr, srcY, destX, filterVal;\n		let srcOffset = 0, destOffset = 0;\n		for (srcY = 0; srcY < srcH; srcY++) {\n			filterPtr = 0;\n			for (destX = 0; destX < destW; destX++) {\n				filterShift = filters[filterPtr++];\n				filterSize = filters[filterPtr++];\n				srcPtr = srcOffset + filterShift * 4 | 0;\n				r = g = b = a = 0;\n				for (; filterSize > 0; filterSize--) {\n					filterVal = filters[filterPtr++];\n					alpha = src[srcPtr + 3];\n					a = a + filterVal * alpha | 0;\n					b = b + filterVal * src[srcPtr + 2] * alpha | 0;\n					g = g + filterVal * src[srcPtr + 1] * alpha | 0;\n					r = r + filterVal * src[srcPtr] * alpha | 0;\n					srcPtr = srcPtr + 4 | 0;\n				}\n				b = b / 255 | 0;\n				g = g / 255 | 0;\n				r = r / 255 | 0;\n				dest[destOffset + 3] = clampNegative(a >> 7);\n				dest[destOffset + 2] = clampNegative(b >> 7);\n				dest[destOffset + 1] = clampNegative(g >> 7);\n				dest[destOffset] = clampNegative(r >> 7);\n				destOffset = destOffset + srcH * 4 | 0;\n			}\n			destOffset = (srcY + 1) * 4 | 0;\n			srcOffset = (srcY + 1) * srcW * 4 | 0;\n		}\n	}\n	function convolveVertWithPre(src, dest, srcW, srcH, destW, filters) {\n		let r, g, b, a;\n		let filterPtr, filterShift, filterSize;\n		let srcPtr, srcY, destX, filterVal;\n		let srcOffset = 0, destOffset = 0;\n		for (srcY = 0; srcY < srcH; srcY++) {\n			filterPtr = 0;\n			for (destX = 0; destX < destW; destX++) {\n				filterShift = filters[filterPtr++];\n				filterSize = filters[filterPtr++];\n				srcPtr = srcOffset + filterShift * 4 | 0;\n				r = g = b = a = 0;\n				for (; filterSize > 0; filterSize--) {\n					filterVal = filters[filterPtr++];\n					a = a + filterVal * src[srcPtr + 3] | 0;\n					b = b + filterVal * src[srcPtr + 2] | 0;\n					g = g + filterVal * src[srcPtr + 1] | 0;\n					r = r + filterVal * src[srcPtr] | 0;\n					srcPtr = srcPtr + 4 | 0;\n				}\n				r >>= 7;\n				g >>= 7;\n				b >>= 7;\n				a >>= 7;\n				a = clampTo8(a + 8192 >> 14);\n				if (a > 0) {\n					r = r * 255 / a | 0;\n					g = g * 255 / a | 0;\n					b = b * 255 / a | 0;\n				}\n				dest[destOffset + 3] = a;\n				dest[destOffset + 2] = clampTo8(b + 8192 >> 14);\n				dest[destOffset + 1] = clampTo8(g + 8192 >> 14);\n				dest[destOffset] = clampTo8(r + 8192 >> 14);\n				destOffset = destOffset + srcH * 4 | 0;\n			}\n			destOffset = (srcY + 1) * 4 | 0;\n			srcOffset = (srcY + 1) * srcW * 4 | 0;\n		}\n	}\n	function hasAlpha$1(src, width, height) {\n		let ptr = 3;\n		const len = width * height * 4 | 0;\n		while (ptr < len) {\n			if (src[ptr] !== 255) return true;\n			ptr = ptr + 4 | 0;\n		}\n		return false;\n	}\n	function resetAlpha$1(dst, width, height) {\n		let ptr = 3;\n		const len = width * height * 4 | 0;\n		while (ptr < len) {\n			dst[ptr] = 255;\n			ptr = ptr + 4 | 0;\n		}\n	}\n	function resize$1(options) {\n		const src = options.src;\n		const srcW = options.width;\n		const srcH = options.height;\n		const destW = options.toWidth;\n		const destH = options.toHeight;\n		const scaleX = options.scaleX || options.toWidth / options.width;\n		const scaleY = options.scaleY || options.toHeight / options.height;\n		const offsetX = options.offsetX || 0;\n		const offsetY = options.offsetY || 0;\n		const dest = options.dest || new Uint8Array(destW * destH * 4);\n		const filter = typeof options.filter === \"undefined\" ? \"mks2013\" : options.filter;\n		const filtersX = resizeFilterGen(filter, srcW, destW, scaleX, offsetX), filtersY = resizeFilterGen(filter, srcH, destH, scaleY, offsetY);\n		const tmp = new Uint16Array(destW * srcH * 4);\n		if (hasAlpha$1(src, srcW, srcH)) {\n			convolveHorWithPre(src, tmp, srcW, srcH, destW, filtersX);\n			convolveVertWithPre(tmp, dest, srcH, destW, destH, filtersY);\n		} else {\n			convolveHor(src, tmp, srcW, srcH, destW, filtersX);\n			convolveVert(tmp, dest, srcH, destW, destH, filtersY);\n			resetAlpha$1(dest, destW, destH);\n		}\n		return dest;\n	}\n	function hasAlpha(src, width, height) {\n		let ptr = 3;\n		const len = width * height * 4 | 0;\n		while (ptr < len) {\n			if (src[ptr] !== 255) return true;\n			ptr = ptr + 4 | 0;\n		}\n		return false;\n	}\n	function resetAlpha(dst, width, height) {\n		let ptr = 3;\n		const len = width * height * 4 | 0;\n		while (ptr < len) {\n			dst[ptr] = 255;\n			ptr = ptr + 4 | 0;\n		}\n	}\n	function asUint8Array(src) {\n		return new Uint8Array(src.buffer, 0, src.byteLength);\n	}\n	var IS_LE = true;\n	try {\n		IS_LE = new Uint32Array(new Uint8Array([\n			1,\n			0,\n			0,\n			0\n		]).buffer)[0] === 1;\n	} catch (__) {}\n	function copyInt16asLE(src, target, target_offset) {\n		if (IS_LE) {\n			target.set(asUint8Array(src), target_offset);\n			return;\n		}\n		for (let ptr = target_offset, i = 0; i < src.length; i++) {\n			const data = src[i];\n			target[ptr++] = data & 255;\n			target[ptr++] = data >> 8 & 255;\n		}\n	}\n	function resize_wasm(options) {\n		const src = options.src;\n		const srcW = options.width;\n		const srcH = options.height;\n		const destW = options.toWidth;\n		const destH = options.toHeight;\n		const scaleX = options.scaleX || options.toWidth / options.width;\n		const scaleY = options.scaleY || options.toHeight / options.height;\n		const offsetX = options.offsetX || 0;\n		const offsetY = options.offsetY || 0;\n		const dest = options.dest || new Uint8Array(destW * destH * 4);\n		const filter = typeof options.filter === \"undefined\" ? \"mks2013\" : options.filter;\n		const filtersX = resizeFilterGen(filter, srcW, destW, scaleX, offsetX), filtersY = resizeFilterGen(filter, srcH, destH, scaleY, offsetY);\n		const src_offset = 0;\n		const src_size = Math.max(src.byteLength, dest.byteLength);\n		const tmp_offset = this.__align(src_offset + src_size);\n		const tmp_size = srcH * destW * 4 * 2;\n		const filtersX_offset = this.__align(tmp_offset + tmp_size);\n		const filtersY_offset = this.__align(filtersX_offset + filtersX.byteLength);\n		const alloc_bytes = filtersY_offset + filtersY.byteLength;\n		const instance = this.__instance(\"resize\", alloc_bytes);\n		const mem = new Uint8Array(this.__memory.buffer);\n		const mem32 = new Uint32Array(this.__memory.buffer);\n		const src32 = new Uint32Array(src.buffer);\n		mem32.set(src32);\n		copyInt16asLE(filtersX, mem, filtersX_offset);\n		copyInt16asLE(filtersY, mem, filtersY_offset);\n		const fn = instance.exports.convolveHV || instance.exports._convolveHV;\n		if (!fn) throw new Error(\"WASM resize function is not available\");\n		if (hasAlpha(src, srcW, srcH)) fn(filtersX_offset, filtersY_offset, tmp_offset, srcW, srcH, destW, destH, 1);\n		else {\n			fn(filtersX_offset, filtersY_offset, tmp_offset, srcW, srcH, destW, destH, 0);\n			resetAlpha(dest, destW, destH);\n		}\n		new Uint32Array(dest.buffer).set(new Uint32Array(this.__memory.buffer, 0, destH * destW));\n		return dest;\n	}\n	var mm_resize_default = {\n		name: \"resize\",\n		fn: resize$1,\n		wasm_fn: resize_wasm,\n		wasm_src: \"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\"\n	};\n	var MathLib = class extends import_multimath.default {\n		constructor(requested_features) {\n			const __requested_features = requested_features || [];\n			const features = {\n				js: __requested_features.indexOf(\"js\") >= 0,\n				wasm: __requested_features.indexOf(\"wasm\") >= 0\n			};\n			super(features);\n			this.features = {\n				js: features.js,\n				wasm: features.wasm && this.has_wasm()\n			};\n			this.use(mm_unsharp_mask_default);\n			this.use(mm_resize_default);\n		}\n		resizeAndUnsharp(options) {\n			const result = this.resize(options);\n			if (options.unsharpAmount) this.unsharp_mask(result, options.toWidth, options.toHeight, options.unsharpAmount, options.unsharpRadius, options.unsharpThreshold);\n			return result;\n		}\n	};\n	var ORIENTED_JPEG_BASE64 = \"/9j/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAYAAAAAAAD/4AAQskZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAACAAMBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABsQAAMBAQADAAAAAAAAAAAAAAECAwQFABEx/9oACAEBAAA/AC06fW6va0ps7PT179E88MiV02arrCEkjGQZiSEnKc5ovxURVHoADz//2Q==\";\n	var features = {\n		canvas: false,\n		offscreen_canvas: false,\n		may_be_worker: false,\n		create_image_bitmap: false,\n		safari_put_image_data_fix: false,\n		bug_canvas_orientation_region: true,\n		bug_image_bitmap_orientation_region: true,\n		cib_resize: false\n	};\n	var checked = false;\n	var checking = null;\n	function check_canvas() {\n		if (typeof document === \"undefined\" || !document.createElement) return false;\n		try {\n			const canvas = document.createElement(\"canvas\");\n			canvas.width = 2;\n			canvas.height = 1;\n			const ctx = canvas.getContext(\"2d\");\n			let d = ctx.createImageData(2, 1);\n			d.data[0] = 12;\n			d.data[1] = 23;\n			d.data[2] = 34;\n			d.data[3] = 255;\n			d.data[4] = 45;\n			d.data[5] = 56;\n			d.data[6] = 67;\n			d.data[7] = 255;\n			ctx.putImageData(d, 0, 0);\n			d = ctx.getImageData(0, 0, 2, 1);\n			return d.data[0] === 12 && d.data[1] === 23 && d.data[2] === 34 && d.data[3] === 255 && d.data[4] === 45 && d.data[5] === 56 && d.data[6] === 67 && d.data[7] === 255;\n		} catch (__) {\n			return false;\n		}\n	}\n	function check_offscreen_canvas() {\n		if (typeof OffscreenCanvas === \"undefined\") return false;\n		try {\n			const ctx = new OffscreenCanvas(2, 1).getContext(\"2d\");\n			let d = ctx.createImageData(2, 1);\n			d.data[0] = 12;\n			d.data[1] = 23;\n			d.data[2] = 34;\n			d.data[3] = 255;\n			d.data[4] = 45;\n			d.data[5] = 56;\n			d.data[6] = 67;\n			d.data[7] = 255;\n			ctx.putImageData(d, 0, 0);\n			d = ctx.getImageData(0, 0, 2, 1);\n			return d.data[0] === 12 && d.data[1] === 23 && d.data[2] === 34 && d.data[3] === 255 && d.data[4] === 45 && d.data[5] === 56 && d.data[6] === 67 && d.data[7] === 255;\n		} catch (__) {\n			return false;\n		}\n	}\n	function check_create_image_bitmap() {\n		return typeof createImageBitmap !== \"undefined\";\n	}\n	function check_may_be_worker() {\n		return typeof Worker !== \"undefined\" && typeof URL !== \"undefined\" && !!URL.createObjectURL;\n	}\n	function check_safari_put_image_data_fix() {\n		try {\n			return !!(typeof navigator !== \"undefined\" && navigator.userAgent && navigator.userAgent.indexOf(\"Safari\") >= 0 && navigator.userAgent.indexOf(\"Chrome\") < 0);\n		} catch (__) {\n			return false;\n		}\n	}\n	function check_bug_canvas_orientation_region_async() {\n		return Promise.resolve().then(() => {\n			if (check_offscreen_canvas() && check_create_image_bitmap() && typeof Blob !== \"undefined\" && typeof atob !== \"undefined\") {\n				const binary = atob(ORIENTED_JPEG_BASE64);\n				const bytes = new Uint8Array(binary.length);\n				for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);\n				return createImageBitmap(new Blob([bytes], { type: \"image/jpeg\" })).then((bitmap) => {\n					const canvas = new OffscreenCanvas(1, 1);\n					try {\n						const ctx = canvas.getContext(\"2d\");\n						ctx.drawImage(bitmap, 1, 1, 1, 1, 0, 0, 1, 1);\n						return ctx.getImageData(0, 0, 1, 1).data[0] < 240;\n					} finally {\n						bitmap.close();\n					}\n				});\n			}\n			if (check_canvas() && typeof Image !== \"undefined\") return new Promise((resolve) => {\n				const image = new Image();\n				image.onload = () => {\n					try {\n						const canvas = document.createElement(\"canvas\");\n						canvas.width = 1;\n						canvas.height = 1;\n						const ctx = canvas.getContext(\"2d\");\n						ctx.drawImage(image, 1, 1, 1, 1, 0, 0, 1, 1);\n						resolve(ctx.getImageData(0, 0, 1, 1).data[0] < 240);\n					} catch (__) {\n						resolve(true);\n					}\n				};\n				image.onerror = () => resolve(true);\n				image.src = `data:image/jpeg;base64,${ORIENTED_JPEG_BASE64}`;\n			});\n			return true;\n		}).catch(() => true);\n	}\n	function check_bug_image_bitmap_orientation_region_async() {\n		return Promise.resolve().then(() => {\n			if (!features.create_image_bitmap && !check_create_image_bitmap()) return true;\n			if (typeof Blob === \"undefined\" || typeof atob === \"undefined\") return true;\n			const canOffscreenCanvas = check_offscreen_canvas();\n			const canCanvas = check_canvas();\n			if (!canOffscreenCanvas && !canCanvas) return true;\n			const binary = atob(ORIENTED_JPEG_BASE64);\n			const bytes = new Uint8Array(binary.length);\n			for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);\n			return createImageBitmap(new Blob([bytes], { type: \"image/jpeg\" })).then((imageBitmap) => createImageBitmap(imageBitmap, 1, 1, 1, 1).then((bitmap) => {\n				let canvas;\n				if (canOffscreenCanvas) canvas = new OffscreenCanvas(1, 1);\n				else {\n					canvas = document.createElement(\"canvas\");\n					canvas.width = 1;\n					canvas.height = 1;\n				}\n				try {\n					const ctx = canvas.getContext(\"2d\");\n					ctx.drawImage(bitmap, 0, 0);\n					return bitmap.width !== 1 || bitmap.height !== 1 || ctx.getImageData(0, 0, 1, 1).data[0] < 240;\n				} finally {\n					imageBitmap.close();\n					bitmap.close();\n				}\n			}, () => {\n				imageBitmap.close();\n				return true;\n			}));\n		}).catch(() => true);\n	}\n	function check_cib_resize_async() {\n		return Promise.resolve().then(() => {\n			if (!check_create_image_bitmap()) return false;\n			const SRC_SIZE = 20;\n			const DST_SIZE = 5;\n			let canvas;\n			if (features.canvas || check_canvas()) {\n				canvas = document.createElement(\"canvas\");\n				canvas.width = SRC_SIZE;\n				canvas.height = SRC_SIZE;\n			} else if (features.offscreen_canvas || check_offscreen_canvas()) {\n				canvas = new OffscreenCanvas(SRC_SIZE, SRC_SIZE);\n				canvas.getContext(\"2d\").clearRect(0, 0, SRC_SIZE, SRC_SIZE);\n			} else return false;\n			return createImageBitmap(canvas, 0, 0, SRC_SIZE, SRC_SIZE, {\n				resizeWidth: DST_SIZE,\n				resizeHeight: DST_SIZE,\n				resizeQuality: \"high\"\n			}).then((bitmap) => {\n				const status = bitmap.width === DST_SIZE && !!bitmap.close;\n				if (bitmap.close) bitmap.close();\n				canvas = null;\n				return status;\n			});\n		}).catch(() => false);\n	}\n	function get_supported_features() {\n		if (checked) return Promise.resolve(Object.assign({}, features));\n		if (checking) return checking.then(() => Object.assign({}, features));\n		features.canvas = check_canvas();\n		features.offscreen_canvas = check_offscreen_canvas();\n		features.may_be_worker = check_may_be_worker();\n		features.create_image_bitmap = check_create_image_bitmap();\n		features.safari_put_image_data_fix = check_safari_put_image_data_fix();\n		const bugCanvasOrientationRegion = check_bug_canvas_orientation_region_async().then((result) => {\n			features.bug_canvas_orientation_region = result;\n		}).catch(() => {});\n		const bugImageBitmapOrientationRegion = check_bug_image_bitmap_orientation_region_async().then((result) => {\n			features.bug_image_bitmap_orientation_region = result;\n		}).catch(() => {});\n		const cibResize = check_cib_resize_async().then((result) => {\n			features.cib_resize = result;\n		}).catch(() => {});\n		checking = Promise.all([\n			bugCanvasOrientationRegion,\n			bugImageBitmapOrientationRegion,\n			cibResize\n		]).then(() => {\n			checked = true;\n			checking = null;\n			return Object.assign({}, features);\n		}, (err) => {\n			checking = null;\n			throw err;\n		});\n		return checking;\n	}\n	var workerScope = self;\n	var mathLib = null;\n	function resize_math(data, tileJob) {\n		if (!mathLib) mathLib = new MathLib(data.features);\n		return mathLib.resizeAndUnsharp(tileJob);\n	}\n	function resizeBitmap(data, tileJob) {\n		let srcCanvas = new OffscreenCanvas(tileJob.width, tileJob.height);\n		const srcCtx = srcCanvas.getContext(\"2d\");\n		srcCtx.drawImage(tileJob.src, 0, 0);\n		const src = srcCtx.getImageData(0, 0, tileJob.width, tileJob.height).data;\n		srcCanvas.width = srcCanvas.height = 0;\n		srcCanvas = null;\n		tileJob.src.close();\n		const result = resize_math(data, {\n			src,\n			width: tileJob.width,\n			height: tileJob.height,\n			toWidth: tileJob.toWidth,\n			toHeight: tileJob.toHeight,\n			scaleX: tileJob.scaleX,\n			scaleY: tileJob.scaleY,\n			offsetX: tileJob.offsetX,\n			offsetY: tileJob.offsetY,\n			filter: tileJob.filter,\n			unsharpAmount: tileJob.unsharpAmount,\n			unsharpRadius: tileJob.unsharpRadius,\n			unsharpThreshold: tileJob.unsharpThreshold\n		});\n		const canvas = new OffscreenCanvas(tileJob.toWidth, tileJob.toHeight);\n		const ctx = canvas.getContext(\"2d\");\n		const toImageData = ctx.createImageData(tileJob.toWidth, tileJob.toHeight);\n		toImageData.data.set(result);\n		ctx.putImageData(toImageData, 0, 0);\n		const bitmap = canvas.transferToImageBitmap();\n		workerScope.postMessage({\n			kind: \"bitmap\",\n			data: bitmap\n		}, [bitmap]);\n	}\n	function resize(data) {\n		if (data.job.kind === \"bitmap\") {\n			resizeBitmap(data, data.job);\n			return;\n		}\n		const result = resize_math(data, data.job);\n		workerScope.postMessage({\n			kind: \"array\",\n			data: result\n		}, [result.buffer]);\n	}\n	function handleMessage(data) {\n		switch (data.method) {\n			case \"get_supported_features\": return get_supported_features().then((result) => {\n				workerScope.postMessage({ data: result });\n			});\n			case \"resize\":\n				resize(data);\n				return Promise.resolve();\n			default: return Promise.reject(/* @__PURE__ */ new Error(`Unknown worker method: ${data.method}`));\n		}\n	}\n	workerScope.onmessage = function(ev) {\n		Promise.resolve().then(() => handleMessage(ev.data)).catch((err) => {\n			workerScope.postMessage({ err });\n		});\n	};\n})();\n\n//# sourceURL=pica-inline-worker.js";
var concurrency = 1;
if (typeof navigator !== "undefined") concurrency = Math.min(navigator.hardwareConcurrency || 1, 4);
var DEFAULT_PICA_OPTS = {
	tile: 1024,
	concurrency,
	features: [
		"js",
		"wasm",
		"ww"
	],
	idle: 2e3
};
var DEFAULT_RESIZE_OPTS = {
	filter: "mks2013",
	unsharpAmount: 0,
	unsharpRadius: 0,
	unsharpThreshold: 0
};
var Pica = class {
	constructor(options) {
		_defineProperty(this, "options", void 0);
		_defineProperty(this, "__limit", void 0);
		_defineProperty(this, "resize_features", void 0);
		_defineProperty(this, "__workersPool", void 0);
		_defineProperty(this, "capabilities", void 0);
		_defineProperty(this, "__requested_features", void 0);
		_defineProperty(this, "__mathlib", void 0);
		_defineProperty(this, "__initPromise", void 0);
		this.options = Object.assign({}, DEFAULT_PICA_OPTS, options || {});
		if ((this.options.features.indexOf("ww") >= 0 || this.options.features.indexOf("all") >= 0) && !this.options.workerURL && false);
		this.__limit = limiter(this.options.concurrency);
		this.resize_features = {
			js: false,
			wasm: false,
			cib: false,
			ww: false
		};
		this.__workersPool = null;
		this.capabilities = {
			worker: false,
			ww_offscreen_canvas: false,
			canvas: false,
			offscreen_canvas: false,
			may_be_worker: false,
			create_image_bitmap: false,
			safari_put_image_data_fix: false,
			bug_canvas_orientation_region: true,
			bug_image_bitmap_orientation_region: true,
			cib_resize: false
		};
		this.__requested_features = [];
		this.__mathlib = null;
	}
	init() {
		if (this.__initPromise) return this.__initPromise;
		this.__initPromise = this.__init();
		return this.__initPromise;
	}
	__init() {
		var _this = this;
		return _asyncToGenerator(function* () {
			let features = _this.options.features.slice();
			if (features.indexOf("all") >= 0) features = [
				"cib",
				"wasm",
				"js",
				"ww"
			];
			_this.__requested_features = features;
			_this.__mathlib = new MathLib(features);
			const result = yield get_supported_features();
			Object.assign(_this.capabilities, result);
			if (_this.capabilities.cib_resize && features.indexOf("cib") >= 0) _this.resize_features.cib = true;
			if (_this.capabilities.may_be_worker && features.indexOf("ww") >= 0 && WORKER_SRC) _this.__workersPool = new Pool(() => _this.__createWorkerSlot(), _this.options.idle);
			if (_this.__workersPool) try {
				const result = yield _this.__invokeWorker("get_supported_features");
				const resultData = result && result.data;
				if (resultData) {
					_this.capabilities.worker = true;
					_this.resize_features.ww = true;
					_this.capabilities.ww_offscreen_canvas = !!resultData.offscreen_canvas;
				}
			} catch (__) {}
			const mathlib = yield _this.__mathlib.init();
			Object.assign(_this.resize_features, mathlib.features);
			return _this;
		})();
	}
	createCanvas(width, height, preferOffscreen) {
		if (preferOffscreen && this.capabilities.offscreen_canvas) return new OffscreenCanvas(width, height);
		if (this.capabilities.canvas) {
			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			return canvas;
		}
		if (this.capabilities.ww_offscreen_canvas) return new OffscreenCanvas(width, height);
		throw new Error("Pica: cannot create canvas");
	}
	__createWorkerSlot() {
		if (this.options.workerURL) {
			const worker = new Worker(String(this.options.workerURL));
			return {
				value: worker,
				destroy() {
					worker.terminate();
				}
			};
		}
		{
			const objectURL = window.URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
			const worker = new Worker(objectURL);
			return {
				value: worker,
				destroy() {
					worker.terminate();
					if (typeof window !== "undefined") {
						var _window$URL, _window$URL$revokeObj;
						(_window$URL = window.URL) === null || _window$URL === void 0 || (_window$URL$revokeObj = _window$URL.revokeObjectURL) === null || _window$URL$revokeObj === void 0 || _window$URL$revokeObj.call(_window$URL, objectURL);
					}
				}
			};
		}
		throw new Error("Pica: no worker source available");
	}
	__invokeWorker(method, payload, transfer, opts) {
		return new Promise((resolve, reject) => {
			const w = this.__workersPool.acquire();
			if (opts && opts.cancelToken) opts.cancelToken.catch((err) => reject(err));
			w.value.onmessage = (ev) => {
				w.release();
				if (ev.data.err) reject(ev.data.err);
				else resolve(ev.data);
			};
			w.value.postMessage(Object.assign({ method }, payload || {}), transfer || []);
		});
	}
	__invokeResize(tileJob, ctx) {
		var _this2 = this;
		return _asyncToGenerator(function* () {
			yield Promise.resolve();
			if (!_this2.resize_features.ww) {
				if (tileJob.kind !== "array") throw new Error("Pica: resize tile data is missing");
				const mathOpts = {
					src: tileJob.src,
					width: tileJob.width,
					height: tileJob.height,
					toWidth: tileJob.toWidth,
					toHeight: tileJob.toHeight,
					scaleX: tileJob.scaleX,
					scaleY: tileJob.scaleY,
					offsetX: tileJob.offsetX,
					offsetY: tileJob.offsetY,
					filter: tileJob.filter,
					unsharpAmount: tileJob.unsharpAmount,
					unsharpRadius: tileJob.unsharpRadius,
					unsharpThreshold: tileJob.unsharpThreshold
				};
				return {
					kind: "array",
					data: _this2.__mathlib.resizeAndUnsharp(mathOpts)
				};
			}
			const transfer = [];
			if (tileJob.kind === "array") transfer.push(tileJob.src.buffer);
			else transfer.push(tileJob.src);
			return _this2.__invokeWorker("resize", {
				job: tileJob,
				features: _this2.__requested_features
			}, transfer, ctx);
		})();
	}
	__extractTileData(tile, from, stageEnv, extractTo) {
		if (this.resize_features.ww && this.capabilities.ww_offscreen_canvas) {
			this.debug("Create tile imageBitmap");
			const tileCanvas = this.createCanvas(tile.width, tile.height, { preferOffscreen: true });
			tileCanvas.getContext("2d").drawImage(stageEnv.srcImageBitmap || from, tile.x, tile.y, tile.width, tile.height, 0, 0, tile.width, tile.height);
			if (!("transferToImageBitmap" in tileCanvas)) throw new Error("Pica: offscreen canvas is not available for worker transfer");
			return Object.assign({}, extractTo, {
				kind: "bitmap",
				src: tileCanvas.transferToImageBitmap()
			});
		}
		if (isCanvas(from)) {
			if (!stageEnv.srcCtx) stageEnv.srcCtx = from.getContext("2d");
			this.debug("Get tile pixel data");
			return Object.assign({}, extractTo, {
				kind: "array",
				src: stageEnv.srcCtx.getImageData(tile.x, tile.y, tile.width, tile.height).data
			});
		}
		this.debug("Draw tile imageBitmap/image to temporary canvas");
		const tmpCanvas = this.createCanvas(tile.width, tile.height, { preferOffscreen: true });
		const tmpCtx = tmpCanvas.getContext("2d");
		tmpCtx.globalCompositeOperation = "copy";
		tmpCtx.drawImage(stageEnv.srcImageBitmap || from, tile.x, tile.y, tile.width, tile.height, 0, 0, tile.width, tile.height);
		this.debug("Get tile pixel data");
		const src = tmpCtx.getImageData(0, 0, tile.width, tile.height).data;
		tmpCanvas.width = tmpCanvas.height = 0;
		return Object.assign({}, extractTo, {
			kind: "array",
			src
		});
	}
	__landTileData(tile, result, stageEnv) {
		if (result.kind === "bitmap") {
			stageEnv.toCtx.drawImage(result.data, tile.toX, tile.toY);
			result.data.close();
			return null;
		}
		this.debug("Draw tile");
		const toImageData = stageEnv.toCtx.createImageData(tile.toWidth, tile.toHeight);
		toImageData.data.set(result.data);
		if (this.capabilities.safari_put_image_data_fix) stageEnv.toCtx.putImageData(toImageData, tile.toX, tile.toY, tile.toInnerX - tile.toX, tile.toInnerY - tile.toY, tile.toInnerWidth + 1e-5, tile.toInnerHeight + 1e-5);
		else stageEnv.toCtx.putImageData(toImageData, tile.toX, tile.toY, tile.toInnerX - tile.toX, tile.toInnerY - tile.toY, tile.toInnerWidth, tile.toInnerHeight);
		return null;
	}
	__tileAndResize(from, to, resizeParams, ctx) {
		var _this3 = this;
		return _asyncToGenerator(function* () {
			const stageEnv = {
				srcCtx: null,
				srcImageBitmap: null,
				isImageBitmapReused: false,
				toCtx: null
			};
			const processTile = (tile) => _this3.__limit(_asyncToGenerator(function* () {
				if (ctx.canceled) return ctx.cancelToken;
				const tileJob = {
					width: tile.width,
					height: tile.height,
					toWidth: tile.toWidth,
					toHeight: tile.toHeight,
					scaleX: tile.scaleX,
					scaleY: tile.scaleY,
					offsetX: tile.offsetX,
					offsetY: tile.offsetY,
					filter: resizeParams.filter,
					unsharpAmount: resizeParams.unsharpAmount,
					unsharpRadius: resizeParams.unsharpRadius,
					unsharpThreshold: resizeParams.unsharpThreshold
				};
				_this3.debug("Invoke resize math");
				const extractedTileJob = yield _this3.__extractTileData(tile, from, stageEnv, tileJob);
				_this3.debug("Invoke resize math");
				const result = yield _this3.__invokeResize(extractedTileJob, ctx);
				if (ctx.canceled) return ctx.cancelToken;
				return _this3.__landTileData(tile, result, stageEnv);
			}));
			yield Promise.resolve();
			stageEnv.toCtx = to.getContext("2d");
			if (isCanvas(from)) {} else if (isImageBitmap(from)) {
				stageEnv.srcImageBitmap = from;
				stageEnv.isImageBitmapReused = true;
			} else if (isImage(from)) {
				if (_this3.capabilities.create_image_bitmap) {
					_this3.debug("Decode image via createImageBitmap");
					try {
						stageEnv.srcImageBitmap = yield createImageBitmap(from);
					} catch (__) {}
				}
			} else throw new Error("Pica: \".from\" should be Image, Canvas or ImageBitmap");
			if (ctx.canceled) return ctx.cancelToken;
			_this3.debug("Calculate tiles");
			const jobs = createRegions({
				width: resizeParams.width,
				height: resizeParams.height,
				srcTileSize: _this3.options.tile,
				toWidth: resizeParams.toWidth,
				toHeight: resizeParams.toHeight,
				destTileBorder: Math.ceil(Math.max(3, 2.5 * resizeParams.unsharpRadius | 0))
			}).map((tile) => processTile(tile));
			function cleanup(stageEnv) {
				if (stageEnv.srcImageBitmap) {
					if (!stageEnv.isImageBitmapReused) stageEnv.srcImageBitmap.close();
					stageEnv.srcImageBitmap = null;
				}
			}
			_this3.debug("Process tiles");
			try {
				yield Promise.all(jobs);
				_this3.debug("Finished!");
				cleanup(stageEnv);
				return to;
			} catch (err) {
				cleanup(stageEnv);
				throw err;
			}
		})();
	}
	__planStagesAndResize(from, to, resizeParams, ctx) {
		var _this4 = this;
		return _asyncToGenerator(function* () {
			let src = from;
			let srcWidth = resizeParams.width;
			let srcHeight = resizeParams.height;
			const stages = createStages(resizeParams.width, resizeParams.height, resizeParams.toWidth, resizeParams.toHeight, _this4.options.tile);
			while (stages.length > 0) {
				if (ctx.canceled) return ctx.cancelToken;
				const [toWidth, toHeight] = stages.shift();
				const isLastStage = stages.length === 0;
				let filter;
				if (isLastStage || !is_cib_filter(resizeParams.filter)) filter = resizeParams.filter;
				else if (resizeParams.filter === "box") filter = "box";
				else filter = "hamming";
				const stageParams = _objectSpread2(_objectSpread2({}, resizeParams), {}, {
					filter,
					width: srcWidth,
					height: srcHeight,
					toWidth,
					toHeight
				});
				const dest = isLastStage ? to : _this4.createCanvas(toWidth, toHeight, { preferOffscreen: true });
				const prevTmp = src !== from ? src : void 0;
				try {
					yield _this4.__tileAndResize(src, dest, stageParams, ctx);
				} finally {
					if (prevTmp) prevTmp.width = prevTmp.height = 0;
				}
				src = dest;
				srcWidth = toWidth;
				srcHeight = toHeight;
			}
			return to;
		})();
	}
	__resizeViaCreateImageBitmap(from, to, resizeParams, ctx) {
		var _this5 = this;
		return _asyncToGenerator(function* () {
			var _utils$filter_to_cib_;
			let toCtx = to.getContext("2d");
			_this5.debug("Resize via createImageBitmap()");
			const imageBitmap = yield createImageBitmap(from, {
				resizeWidth: resizeParams.toWidth,
				resizeHeight: resizeParams.toHeight,
				resizeQuality: cib_quality_name((_utils$filter_to_cib_ = filter_to_cib_quality(resizeParams.filter)) !== null && _utils$filter_to_cib_ !== void 0 ? _utils$filter_to_cib_ : 3)
			});
			if (ctx.canceled) return ctx.cancelToken;
			if (!resizeParams.unsharpAmount) {
				toCtx.drawImage(imageBitmap, 0, 0);
				imageBitmap.close();
				toCtx = null;
				_this5.debug("Finished!");
				return to;
			}
			_this5.debug("Unsharp result");
			let tmpCanvas = _this5.createCanvas(resizeParams.toWidth, resizeParams.toHeight);
			let tmpCtx = tmpCanvas.getContext("2d");
			tmpCtx.drawImage(imageBitmap, 0, 0);
			imageBitmap.close();
			let iData = tmpCtx.getImageData(0, 0, resizeParams.toWidth, resizeParams.toHeight);
			_this5.__mathlib.unsharp_mask(iData.data, resizeParams.toWidth, resizeParams.toHeight, resizeParams.unsharpAmount, resizeParams.unsharpRadius, resizeParams.unsharpThreshold);
			toCtx.putImageData(iData, 0, 0);
			tmpCanvas.width = tmpCanvas.height = 0;
			iData = tmpCtx = tmpCanvas = toCtx = null;
			_this5.debug("Finished!");
			return to;
		})();
	}
	resize(from, to, options) {
		var _this6 = this;
		return _asyncToGenerator(function* () {
			_this6.debug("Start resize...");
			const requested = {};
			if (options) Object.assign(requested, options);
			let filter = requested.filter || DEFAULT_RESIZE_OPTS.filter;
			if (Object.prototype.hasOwnProperty.call(requested, "quality")) {
				const quality = requested.quality;
				if (typeof quality !== "number" || quality < 0 || quality > 3) throw new Error(`Pica: .quality should be [0..3], got ${quality}`);
				filter = cib_quality_filter(quality);
			}
			const resizeParams = {
				filter,
				unsharpAmount: requested.unsharpAmount || DEFAULT_RESIZE_OPTS.unsharpAmount,
				unsharpRadius: requested.unsharpRadius || DEFAULT_RESIZE_OPTS.unsharpRadius,
				unsharpThreshold: requested.unsharpThreshold || DEFAULT_RESIZE_OPTS.unsharpThreshold,
				width: isImage(from) ? from.naturalWidth : from.width,
				height: isImage(from) ? from.naturalHeight : from.height,
				toWidth: to.width,
				toHeight: to.height
			};
			if (resizeParams.unsharpRadius > 2) resizeParams.unsharpRadius = 2;
			if (to.width === 0 || to.height === 0) return Promise.reject(/* @__PURE__ */ new Error(`Invalid output size: ${to.width}x${to.height}`));
			const ctx = {
				cancelToken: requested.cancelToken,
				canceled: false
			};
			if (ctx.cancelToken) ctx.cancelToken = ctx.cancelToken.then((data) => {
				ctx.canceled = true;
				throw data;
			}, (err) => {
				ctx.canceled = true;
				throw err;
			});
			yield _this6.init();
			if (ctx.canceled) return ctx.cancelToken;
			if (_this6.capabilities.bug_image_bitmap_orientation_region && (isImage(from) || isImageBitmap(from))) {
				const tmpCanvas = _this6.createCanvas(resizeParams.width, resizeParams.height);
				tmpCanvas.getContext("2d").drawImage(from, 0, 0);
				from = tmpCanvas;
			}
			if (_this6.resize_features.cib) {
				if (is_cib_filter(resizeParams.filter)) return _this6.__resizeViaCreateImageBitmap(from, to, resizeParams, ctx);
				_this6.debug("cib is enabled, but not supports provided filter, fallback to manual math");
			}
			if (!_this6.capabilities.canvas && !_this6.capabilities.offscreen_canvas) {
				const err = /* @__PURE__ */ new Error("Pica: cannot use getImageData on canvas, make sure fingerprinting protection isn't enabled");
				err.code = "ERR_GET_IMAGE_DATA";
				throw err;
			}
			return _this6.__planStagesAndResize(from, to, resizeParams, ctx);
		})();
	}
	resizeBuffer(options) {
		var _this7 = this;
		return _asyncToGenerator(function* () {
			const opts = Object.assign({}, DEFAULT_RESIZE_OPTS, options);
			if (Object.prototype.hasOwnProperty.call(opts, "quality")) {
				const quality = opts.quality;
				if (typeof quality !== "number" || quality < 0 || quality > 3) throw new Error(`Pica: .quality should be [0..3], got ${quality}`);
				opts.filter = cib_quality_filter(quality);
			}
			yield _this7.init();
			if (!_this7.__mathlib) throw new Error("Pica: math library is not initialized");
			const mathOpts = {
				src: opts.src,
				width: opts.width,
				height: opts.height,
				toWidth: opts.toWidth,
				toHeight: opts.toHeight,
				dest: opts.dest,
				scaleX: opts.toWidth / opts.width,
				scaleY: opts.toHeight / opts.height,
				offsetX: 0,
				offsetY: 0,
				filter: opts.filter,
				unsharpAmount: opts.unsharpAmount,
				unsharpRadius: opts.unsharpRadius,
				unsharpThreshold: opts.unsharpThreshold
			};
			return _this7.__mathlib.resizeAndUnsharp(mathOpts);
		})();
	}
	toBlob(canvas, mimeType, quality) {
		return _asyncToGenerator(function* () {
			mimeType = mimeType || "image/png";
			if ("toBlob" in canvas && canvas.toBlob) return new Promise((resolve) => {
				canvas.toBlob((blob) => resolve(blob), mimeType, quality);
			});
			if ("convertToBlob" in canvas && canvas.convertToBlob) return canvas.convertToBlob({
				type: mimeType,
				quality
			});
			const asString = atob(canvas.toDataURL(mimeType, quality).split(",")[1]);
			const len = asString.length;
			const asBuffer = new Uint8Array(len);
			for (let i = 0; i < len; i++) asBuffer[i] = asString.charCodeAt(i);
			return new Blob([asBuffer], { type: mimeType });
		})();
	}
	debug(..._args) {}
};
function pica(options) {
	return new Pica(options);
}
export { Pica, pica as default };

//# sourceMappingURL=pica.mjs.map