game_one();

function game_one(){
	var can = document.querySelectorAll(".game-one-canvas")[0];
	var gl = can.getContext("webgl");
	var w,h;

    // Shader program
    var defaultglprogram;
    
    // Framebuffer data
    var fb_count = 4;
    // Framebuffers
    var fbs = [];
    // Framebuffer textures
    var fb_texs = [];
    // Depth buffer
    var depth_bufs = [];

    var frame = 0;
    
	var mouse = [];

	function resize(){
		w = can.width  = window.innerWidth;
		h = can.height = window.innerHeight;
		draw();
        init_gl(gl);
	}

	window.addEventListener("resize", resize);
	resize();
    
	enable_mouse(can);
	
	function enable_mouse(can){
		can.hover = false;
		
		mouse = [can.width / 2.0, can.height / 2.0];
		smooth_mouse = [0.5, 0.5];
		
		can.addEventListener("mouseenter", function(e){
			can.hover = true;
			mouse = [can.width / 2.0, can.height / 2.0];
		});
		
		can.addEventListener("mousemove", setMouse);
		
		function setMouse(e){
			var x, y;
			
			x = e.clientX
				- can.offsetLeft
				- can.offsetParent.offsetLeft
				+ window.scrollX;
			y = e.clientY
				- can.offsetTop
				- can.offsetParent.offsetTop
				+ window.scrollY;
			
			mouse = [x, y];
		}
		
		can.addEventListener("mouseleave", function(){
			can.hover = false;
			mouse = [can.width / 2.0, can.height / 2.0];
		});
	}
	
	function init_gl(gl){
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		// Triangle strip for whole screen square
		var vertices = [
				-1,-1,0,
				-1,1,0,
			1,-1,0,
			1,1,0,
		];
		
		var tri = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER,tri);
		gl.bufferData(gl.ARRAY_BUFFER,
                      new Float32Array(vertices),
                      gl.STATIC_DRAW);

        // Create 3 framebuffers for 3 pass render
        for(var i = 0; i < fb_count; i++){
            window.gl = gl;
            var fb = fbs[i] = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            fb.width = w;
            fb.height = h;

            var tex = fb_texs[i] = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, tex);

            // Nearest pixel interpolation
            gl.texParameteri(gl.TEXTURE_2D,
                             gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D,
                             gl.TEXTURE_MIN_FILTER, gl.NEAREST);

            // Clamp to edge to allow non-power-of-2 textures
            gl.texParameteri(gl.TEXTURE_2D,
                             gl.TEXTURE_WRAP_T,
                             gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D,
                             gl.TEXTURE_WRAP_S,
                             gl.CLAMP_TO_EDGE);

            // Create the empty data
            gl.texImage2D(gl.TEXTURE_2D,
                          0, gl.RGBA, w, h,
                          0, gl.RGBA, gl.UNSIGNED_BYTE,
                          null);

            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

            // Create depth & render buffers
            var depthbuf = depth_bufs[i] = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, depthbuf);
            gl.renderbufferStorage(gl.RENDERBUFFER,
                                   gl.DEPTH_COMPONENT16, w, h);

            gl.framebufferTexture2D(gl.FRAMEBUFFER,
                                    gl.COLOR_ATTACHMENT0,
                                    gl.TEXTURE_2D, tex, 0);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER,
                                       gl.DEPTH_ATTACHMENT,
                                       gl.RENDERBUFFER,
                                       depthbuf);
        }
	}
    
	function init_program(gl_ctx, vertex, fragment){
		var gl = gl_ctx;
		
		defaultglprogram = gl.createProgram();
		
		var vertex_shader =
			add_shader(gl.VERTEX_SHADER, vertex);
		
		var fragment_shader =
			add_shader(gl.FRAGMENT_SHADER, fragment);
		
		function add_shader(type, content){
			var shader = gl.createShader(type);
			gl.shaderSource(shader,content);
			gl.compileShader(shader);
			
			if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
				var err = gl.getShaderInfoLog(shader);
				
				// Find shader type
				var type_str = type == gl.VERTEX_SHADER ?
					"vertex":
					"fragment";
				
				console.log(
					"Error in " + type_str + " shader.\n" + err
				);
			}
			
			gl.attachShader(defaultglprogram, shader);
			return shader;
		}
		
		gl.linkProgram(defaultglprogram);
		
		if(!gl.getProgramParameter(defaultglprogram, gl.LINK_STATUS)){
			console.log(gl.getProgramInfoLog(defaultglprogram));
		}
		
		gl.useProgram(defaultglprogram);
		
		var positionAttribute = gl.getAttribLocation(defaultglprogram, "position");
		
		gl.enableVertexAttribArray(positionAttribute);
		gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0);

        return {
            bind: function(){
                gl.useProgram(defaultglprogram);
            }
        }
	}

	function draw_gl(can, gl){
        var time = (new Date().getTime()) % 10000 / 1000;

        if(defaultglprogram == null){
            return;
        }

        // Set frame attribute
        var frameAttribute = gl.getUniformLocation(defaultglprogram, "frame");
        gl.uniform1i(frameAttribute, frame);
        // And why not increment it right now
        frame++;
        
        
		var timeAttribute = gl.getUniformLocation(defaultglprogram, "time");
		gl.uniform1f(timeAttribute, time);
		
		// Screen ratio
		var ratio = can.width / can.height;
		var ratioAttribute = gl.getUniformLocation(defaultglprogram, "ratio");
        gl.uniform1f(ratioAttribute, ratio);

        // Pixel width
        var pixel_w = 1.0 / can.width;
		var pwAttribute = gl.getUniformLocation(defaultglprogram, "pixelw");
        gl.uniform1f(pwAttribute, pixel_w);

        // Pixel height
        var pixel_h = 1.0 / can.height;
		var phAttribute = gl.getUniformLocation(defaultglprogram, "pixelh");
        gl.uniform1f(phAttribute, pixel_h);

        
		// Mouse
		var x = mouse[0] / can.width * ratio;
		var y = - mouse[1] / can.height;
		var mouseAttribute = gl.getUniformLocation(defaultglprogram, "mouse");
		gl.uniform2fv(mouseAttribute, [x, y]);
        
        // We'll use that in the passes loop
        var passAttribute = gl.getUniformLocation(defaultglprogram, "pass");
        
        for(var i = 0; i < fb_count; i++){
            var fb = fbs[i];
            var tex = fb_texs[i];

            gl.uniform1i(passAttribute, i);

            var texUniformAttribute =
                gl.getUniformLocation(defaultglprogram, "pass"+i);
            
            gl.activeTexture(gl["TEXTURE"+i]);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.uniform1i(texUniformAttribute, i);
            
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            
            gl.viewport(0, 0, w, h);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

        // Set pass variable to last pass
        gl.uniform1i(passAttribute, fb_count);

        // Bind default fb
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Render
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.viewport(0, 0, w, h);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}
    
	function draw(){
		draw_gl(can, gl);
		window.requestAnimationFrame(draw);
	}

	function get_file(file, callback){
		try{
			var xhr = new XMLHttpRequest;
			xhr.open('GET', "./" + file.name, true);
			xhr.onreadystatechange = function(){
				if (4 == xhr.readyState) {
					var val = xhr.responseText;
					file.data = val;
					callback(file);
				}
			};
			xhr.send();
		} catch (e){
			// Do nothing
			// Errors will be logged anyway
		}
	}

	var files = {};

	files["bgfrag"] = {name: "./shaders/background/fragment.glsl"};
	files["bgvert"] = {name: "./shaders/background/vertex.glsl"};

	var loaded_count = 0;
	var total_files = 0;
	
	function on_file_loaded(data){
		loaded_count++;
		
		if(loaded_count == total_files){
			on_all_files_loaded();
		}
	}

	// Count files
	for(var i in files){
		total_files++;
	}
	
	// Load all files
	for(var i in files){
		get_file(files[i], on_file_loaded);
	}

	function on_all_files_loaded(){
		var program = init_program(gl, files["bgvert"].data, files["bgfrag"].data);
		draw();
	}
}
