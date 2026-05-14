/*!

pica
https://github.com/nodeca/pica

*/
(function() {
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
	function resize$1(options) {
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
		fn: resize$1,
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
	var workerScope = self;
	var mathLib = null;
	function resize_math(data, tileJob) {
		if (!mathLib) mathLib = new MathLib(data.features);
		return mathLib.resizeAndUnsharp(tileJob);
	}
	function resizeBitmap(data, tileJob) {
		let srcCanvas = new OffscreenCanvas(tileJob.width, tileJob.height);
		const srcCtx = srcCanvas.getContext("2d");
		srcCtx.drawImage(tileJob.src, 0, 0);
		const src = srcCtx.getImageData(0, 0, tileJob.width, tileJob.height).data;
		srcCanvas.width = srcCanvas.height = 0;
		srcCanvas = null;
		tileJob.src.close();
		const result = resize_math(data, {
			src,
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
		});
		const canvas = new OffscreenCanvas(tileJob.toWidth, tileJob.toHeight);
		const ctx = canvas.getContext("2d");
		const toImageData = ctx.createImageData(tileJob.toWidth, tileJob.toHeight);
		toImageData.data.set(result);
		ctx.putImageData(toImageData, 0, 0);
		const bitmap = canvas.transferToImageBitmap();
		workerScope.postMessage({
			kind: "bitmap",
			data: bitmap
		}, [bitmap]);
	}
	function resize(data) {
		if (data.job.kind === "bitmap") {
			resizeBitmap(data, data.job);
			return;
		}
		const result = resize_math(data, data.job);
		workerScope.postMessage({
			kind: "array",
			data: result
		}, [result.buffer]);
	}
	function handleMessage(data) {
		switch (data.method) {
			case "get_supported_features": return get_supported_features().then((result) => {
				workerScope.postMessage({ data: result });
			});
			case "resize":
				resize(data);
				return Promise.resolve();
			default: return Promise.reject(/* @__PURE__ */ new Error(`Unknown worker method: ${data.method}`));
		}
	}
	workerScope.onmessage = function(ev) {
		Promise.resolve().then(() => handleMessage(ev.data)).catch((err) => {
			workerScope.postMessage({ err });
		});
	};
})();

//# sourceMappingURL=pica_worker.js.map