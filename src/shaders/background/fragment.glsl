// Fragment shader
precision highp float;

varying vec2 UV;
varying vec3 v_position;
uniform float time;
uniform int frame;
uniform float ratio;
uniform int pass;
uniform float pixelw;
uniform float pixelh;

uniform sampler2D pass0;
uniform sampler2D pass1;
uniform sampler2D pass2;
uniform sampler2D pass3;
uniform sampler2D pass4;

#define PI 3.1416

/* 
   We need an encoder and decoder to store -1 to +1 values
   in 0 to 1 color values
 */
vec4 encode(vec4 vin){
    vec4 vout = (vin + vec4(1.0)) / 2.0;
    return vout;
}
vec4 decode(vec4 vin){
    vec4 vout = vin * 2.0 - vec4(1.0);
    return vout;
}

vec4 particles(float x, float y){
    vec4 col = vec4(0.0);
    float lines = cos(100.0 * x);
    col.r = lines < 0.0 ? 0.0: lines;
    lines = cos(100.0 * y);
    col.r += lines < 0.0 ? 0.0: lines;
    col.r = pow(col.r, 30.0);

    return col;
}

void main(void){
	float x = (UV.x - 0.5) * ratio;
	float y = UV.y - 0.5;
    
	float radius = sqrt(pow(x/ratio,2.0) + pow(y,2.0));

	vec4 col = vec4(0.0);
    
    if(pass == 0){
        // Vector field pass
        if(frame == 0){
            float angle = atan(y,x);
            angle += PI/2.0;
            
            // Init
            col.x = 0.3 * cos(angle);
            col.y = 0.3 * sin(angle);
            // Bring values between 0 and 1
            col = encode(col);
        } else {
            col = texture2D(pass2, UV);
        }
    } else if (pass == 1) {
        // Particle pass
        if(frame == 0){
            // Init
            col = particles(x, y);
        } else {
            vec3 new_col;
            vec3 old_col = texture2D(pass3, UV).rgb;
            
            vec3 top    = texture2D(pass3, UV + vec2(0.0,pixelh)).rgb;
            vec3 bottom = texture2D(pass3, UV + vec2(0.0,-pixelh)).rgb;
            vec3 left   = texture2D(pass3, UV + vec2(-pixelw,0.0)).rgb;
            vec3 right  = texture2D(pass3, UV + vec2(pixelw,0.0)).rgb;
            

            vec2 d = decode(texture2D(pass0, UV)).xy;
            float dx = d.x;
            float dy = d.y;

            new_col = (1.0 - abs(dx) - abs(dy)) * old_col;
            
            if(dx < 0.0){
                new_col += -dx * right;
            } else {
                new_col += dx * left;
            }
            
            if(dy < 0.0){
                new_col += -dy * top;
            } else {
                new_col += dy * bottom;
            }

            col.rgb = new_col;
        }
    } else if (pass == 2) {
        // Pass 0 backup
        col = texture2D(pass0, UV);
    } else if (pass == 3) {
        // Pass 1 backup 
        col = texture2D(pass1, UV);
    } else if (pass == 4) {
        // Render pass
        col = texture2D(pass3, UV);
        col += texture2D(pass0, UV);
    }

    col.a = 1.0;
	gl_FragColor = col;
}
