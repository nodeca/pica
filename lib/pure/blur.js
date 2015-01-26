/**
 * Blur filter
 * 
 * This is implementation of blur filter.
 * 
 * This implementation works only for gray-scaled data.
 * This implementation uses box filter algorithm.
 * To speed up work, algorithm goes row by row
 * and after counting value for the current point, it writes
 * counted value to the transposed position of
 * resulting data array. Then, after all rows has been
 * processed, filter calls the algorithm again, but for
 * transposed data. The result of applying such 
 * algorithm to image equals to applying of usual box
 * filter alghorithm, but much faster.
 * 
 * When the points limited by radius are out of image edges,
 * algorithm use duplicates of the first (or last) image point
 * instead of such points.
 * 
 * Algorithm trys to minimize data loses during iterations.
 * 
 * http://web.archive.org/web/20060718054020/http://www.acm.uiuc.edu/siggraph/workshops/wjarosz_convolution_2001.pdf
 */

function blurRows(data, width, height, radius) {
	var d = 1/(2*radius+1)

	var sum = 0
	var result = new Uint16Array(data.length)
	for(var y = 0; y < height; y++)
		for(var x = 0; x < width; x++) {
			var curPos = y*width + x
			/**
			 * Counting current sum.
			 * If we are at the first point in row 
			 * then we need count whole sum for the first point
			 * otherwise we need 
			 * 	1) substract point number (x - (radius + 1)) from sum 
			 *	(this is previous point for the point from the left where the current radius begins)
			 *  2) and add point number (x + radius) to sum
			 *  (this is the latest point where the current radius ends)
			 */
			if(0 == x) { 
				//sum from the current position to left: left part including current position
				sum = (radius+1)*data[curPos]
				
				//sum from the current position to right
				for(var i = 1; i <= radius; i++) {
					//radius can be less then image with or greater
					if(x + i < width) 
						sum += data[curPos+i]
					else {
						//curPos+width-1 is always the latest point in current row because x is 0 now
						sum += data[curPos+width-1]
					}
				}
			} else {
				//Substracting. 
				//We either have such point, 
				//or the point is out of current row
				if(x - (radius + 1) >= 0) 
					sum -= data[curPos - (radius + 1)]
				else 
					sum -= data[curPos - x] //curPos - x = 0 in current row

				//Adding. Again, either the point is within image, or not
				if(x + radius < width)
					sum += data[curPos+radius]
				else
					sum += data[curPos+width-1]
			}

			//writing result to transposed position
			result[x*height+y] = Math.round(sum*d)
		}
	
	return result
}

/**
 * @param {Uint8Array} data The data of L channel for HSL or 
 * any other gray-scale data. Array must have one 8-bit element 
 * per every pixel of original image
 * @param {int} width The image width
 * @param {int} height The image height
 * @param {int} radius The blur radius. Can not be greater then 10000 to prevent data loses
 * @param {int} iterations=1 The amount of blur filter iterations one needs apply
 * 
 * @return {Uint8Array} blured image data
 * 
 * Note: source data is not corrupted
 * 
 * Note: if you need apply blur filter more then once,
 * it will better to use iterations param then just call
 * function 2 times because internally function trys to
 * prevent data loses. Estimately for one call function
 * will loose less or equal to 1/512 of image data plus
 * less or equal to 1/(512*128) of image data for every internal 
 * iteration. So, function will loose
 * 	- for one call with iterations=1: less or equal to 1/512 + 1/512*128 < 0.2% (~ 1/512) of information from supplied image data
 *  - for one call with iterations=2: less or equal to 1/512 + 2*(1/512*128) = 1/512 + 1/512*64 < 0.2% (~ 1/512)
 *  - for one call with iterations=4: less or equal to 1/512 + 4*(1/512*128) = 1/512 + 1/512*32 < 0.21% (~ 1/512)
 *  - for one call with iterations=16: less or equal to 1/512 + 16*(1/512*128) = 1/512 + 1/512*8 < 0.22% (~ 1/512)
 *  - for two calls with iterations=1: less or equal to 2*(1/512 + 1/512*128) = 1/256 + 1/256*128 (~ 1/256): 0.39% < x < 0.4% 
 * 
 * Note: actually radius value can be a bit more then 10000, but 
 * 	- who will use this?
 * 	- who will use javascript for it?
 *  - if one will need radius value greater then 10000, 
 *  	one will have to estimate upper radius value more accurate 
 */

function blur(data, width, height, radius, iterations) {
	if(width < 1 || height < 1 || radius < 1)
		throw new Error("blur filter can work with image dimensions starting with 1x1 px and radius value starting with 1, you provided width [%s], height [%s], radius [%s]", width,height,radius)
	
	if(radius > 10000)
		throw new Error("blur filter can not work with radius which value is greater then 10000, you provided radius [%s]", radius)
	
	iterations = (iterations > 0)?iterations:1

	//prepare array to decrease data loses
	var preparedData = new Uint16Array(data.length)
	for(var i = 0; i < data.length; i++)
		preparedData[i] = data[i]<<7

	//blur
	for(var i = 0; i < iterations; i++) {
		preparedData = blurRows(blurRows(preparedData, width, height, radius), height, width, radius)		
	}
	
	//prepare to return
	var result8Data = new Uint8Array(data.length)
	for(var i = 0; i < data.length; i++) 
		result8Data[i] = Math.round(preparedData[i]/128.0)

	return result8Data
}

module.exports = blur
