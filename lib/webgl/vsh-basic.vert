precision highp float;
attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
   vec2 clipSpace = a_position / u_resolution * 2.0 - 1.0;

   gl_Position = vec4(clipSpace, 0, 1);
   v_texCoord = a_texCoord;
}
