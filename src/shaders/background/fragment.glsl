// Fragment shader
precision highp float;

varying vec2 UV;
varying vec3 v_position;
uniform float time;
uniform float ratio;
uniform int pass;

uniform sampler2D pass0;
uniform sampler2D pass1;
uniform sampler2D pass2;

void main(void){
	float x = UV.x * ratio;
	float y = UV.y;
	float radius = sqrt(pow(x/ratio-0.5,2.0) + pow(y-0.5,2.0));

	vec4 col = vec4(0.0);

    if(pass == 0){
        col.g = cos(100.0 * x);
        col.r = cos(100.0 * y);
        col.a = 1.0;
    } else if (pass == 1) {
        float delta = 0.005;
        col = texture2D(pass0, UV + vec2(0.0, delta));
        col -= texture2D(pass0, UV - vec2(0.0, delta));
        col += texture2D(pass0, UV + vec2(delta, 0.0));
        col -= texture2D(pass0, UV - vec2(delta, 0.0));
        col.a = 1.0;
    } else if (pass == 2) {
        col = texture2D(pass1, UV);
        col.rgb *= 1.0 - radius;
    } else if(pass == 3){
        col = texture2D(pass2, UV);
    }
    
	gl_FragColor = col;
}
