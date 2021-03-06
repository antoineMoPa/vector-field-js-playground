// Vertex Shader
attribute vec3 position;
varying vec2 UV;
varying vec3 v_position;
uniform float time;

void main(){
	v_position = position;
	UV = vec2((position.x+1.0) / 2.0, (position.y + 1.0)/2.0);
	gl_Position = vec4(v_position.x,v_position.y, 0.0, 1.0);
}
