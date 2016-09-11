game_one();

function game_one(){
	var can = document.querySelectorAll(".game-one-canvas")[0];
	var gl = can.getContext("webgl");
	var w,h;
	var mouse = [];

	init_gl(gl);
	
	function resize(){
		w = can.width  = window.innerWidth;
		h = can.height = window.innerHeight;
		draw();
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
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	}

	function init_program(gl_ctx, vertex, fragment){
		var gl = gl_ctx;
		
		gl.program = gl.createProgram();
		
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
			
			gl.attachShader(gl.program, shader);
			return shader;
		}
		
		gl.linkProgram(gl.program);
		
		if(!gl.getProgramParameter(gl.program, gl.LINK_STATUS)){
			console.log(gl.getProgramInfoLog(gl.program));
		}
		
		gl.useProgram(gl.program);
		
		var positionAttribute = gl.getAttribLocation(gl.program, "position");
		
		gl.enableVertexAttribArray(positionAttribute);
		gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0);
	}
	
	function draw_gl(can, gl){
		var time = (new Date().getTime()) % 10000 / 1000;
		
		var timeAttribute = gl.getUniformLocation(gl.program, "time");
		gl.uniform1f(timeAttribute, time);
		
		// Screen ratio
		var ratio = can.width / can.height;
		
		var ratioAttribute = gl.getUniformLocation(gl.program, "ratio");
		gl.uniform1f(ratioAttribute, ratio);
		
		// Mouse
		var x = mouse[0] / can.width * ratio;
		var y = - mouse[1] / can.height;
		var mouseAttribute = gl.getUniformLocation(gl.program, "mouse");
		gl.uniform2fv(mouseAttribute, [x, y]);
		
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		
		gl.viewport(0, 0, can.width, can.height);
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
		init_program(gl, files["bgvert"].data, files["bgfrag"].data);
		draw();
	}
}
