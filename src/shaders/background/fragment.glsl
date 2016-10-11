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

#define PI 3.141592653589793

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

vec4 encodepos(vec2 pos){
    vec4 ret;
    
    //pos.x = mod(pos.x + 1.0, 1.0) - 1.0;
    //pos.y = mod(pos.y + 1.0, 1.0) - 1.0;
    
    pos = ((
               (
                   255.0 * 255.0 * pos +
                   255.0 * 255.0 * vec2(1.0)
                   )
               /
               2.0
               )
        );
    
    float mx = mod(pos.x, 255.0);
    ret.w = (pos.x - mx) / 255.0 / 255.0;
    ret.x = mx / 255.0;
    float my = mod(pos.y, 255.0);
    ret.y = (pos.y - my) / 255.0 / 255.0;
    ret.z = my / 255.0;
    
    return ret;
}

vec2 decodepos(vec4 col){
    vec2 ret;

    float x = col.w * 255.0 + col.x;
    float y = col.y * 255.0 + col.z;
    
    ret = vec2(x,y) / 255.0;
    
    ret *= 2.0;
    ret -= vec2(1.0);
    
    return ret;
}


vec4 particles(float x, float y){
    vec4 col = vec4(0.0);
    col.r = cos(100.0 * x) * cos(100.0 * y);
    return col;
}

void main(void){
	float x = (UV.x - 0.5) * ratio;
	float y = (UV.y - 0.5);
    
	float radius = sqrt(pow(x/ratio,2.0) + pow(y,2.0));

	vec4 col = vec4(0.0);
    
    if(pass == 0){
        // Vector field pass
        if(frame == 0){
            vec2 d = vec2(-y,x);
            
            d = normalize(d);

            d *= 0.001;
            
            // Bring values between 0 and 1
            col = encodepos(d);
        } else {
            vec2 d = decodepos(texture2D(pass2, UV));
            col = encodepos(d);
        }
    } else if (pass == 1) {
        // Particle pass
        if(frame == 0){
            // Init
            col = encodepos(vec2(x,y));
        } else {
            vec4 old_col = texture2D(pass3, UV);
            vec2 pos = decodepos(old_col);
            vec2 d = decodepos(texture2D(pass0, UV));
            
            pos += d;
            
            col = encodepos(pos);
        }
    } else if (pass == 2) {
        // Pass 0 backup (vector field)
        col = texture2D(pass0, UV);
    } else if (pass == 3) {
        // Pass 1 backup (particle) 
        col = texture2D(pass1, UV);
    } else if (pass == 4) {
        // Render pass
        vec2 pos = decodepos(texture2D(pass3, UV));
        vec2 d = decodepos(texture2D(pass0, UV));
        col = particles(pos.x, pos.y);
        //col.gb = pos;
        //col.rg += d;
        col.a = 1.0;
    }
    
	gl_FragColor = col;
}
