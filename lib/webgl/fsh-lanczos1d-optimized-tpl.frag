precision highp float;

varying vec2 v_texCoord;

uniform sampler2D u_image;

#define addPoint(offset, kv, total)   {vec2 pos = v_texCoord + offset; gl_FragColor += texture2D(u_image, pos) * kv; total += kv; }

void main()
{
__CODE__
}
