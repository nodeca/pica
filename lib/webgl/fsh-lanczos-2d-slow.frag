// fail - halt
precision highp float;
uniform sampler2D u_image;

varying vec2 v_texCoord;

uniform vec2 u_resolution;
void main() {
  vec2 pixel = vec2(1.) / u_resolution;
  gl_FragColor = texture2D(u_image, v_texCoord);

#define MAX_W 100.
#define MAX_H 100.
  for (float i = 0.; i < MAX_W; i++) {
    for (float j = 0.; j < MAX_H; j++) {
      gl_FragColor += texture2D(u_image, v_texCoord+pixel*vec2(i-MAX_W/2., j-MAX_H/2.));
    }
  }
  gl_FragColor /= MAX_W*MAX_H;
//  gl_FragColor = vec4(pixel.x);

}
