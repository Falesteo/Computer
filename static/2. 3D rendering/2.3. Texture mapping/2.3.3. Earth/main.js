window.onload = function init() {
    setupWebGL();

    // enabling depth test and culling
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // Set the light direction
    var lightDirection = vec3(0.0, 0.0, -1.0);
    var lightDirectionLoc = gl.getUniformLocation(program, "lightDirection");
    gl.uniform3fv(lightDirectionLoc, flatten(lightDirection));

    // Uniform locations for the matrices
    viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
    modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    // vertices
    vertices = [];
    v0 = vec4(0.0, 0.0, -1.0, 1); 
    v1 = vec4(0.0, 0.942809, 0.333333, 1);
    v2 = vec4(-0.816497, -0.471405, 0.333333, 1);
    v3 = vec4(0.816497, -0.471405, 0.333333, 1);

    // texture
    gl.activeTexture(gl.TEXTURE0);
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    textureLoc = gl.getUniformLocation(program, "texMap");
    gl.uniform1i(textureLoc, 0);

    var myTexels = new Image();
    image.src = "earth.jpg";
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, myTexels);
    gl.generateMipmap(gl.TEXTURE_2D);

    var textCoords = [
        vec2(-1.5, 0.0),
        vec2(2.5, 0.0),
        vec2(2.5, 10.0),
        vec2(-1.5, 10.0),
    ];

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textCoords), gl.STATIC_DRAW);
    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);
    
    subdivisions = 6;
    thetaY = 30;
    
    buildPolyhedron();
    render();
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    thetaY += 0.005;

    // projection matrix
    var projectionMatrix = perspective(45, canvas.width / canvas.height, 0.1, 100.0);

    // view matrix
    var dist = 3.0;
    var eye = vec3(dist * Math.cos(thetaY), 0.0, dist * Math.sin(thetaY));
    var target = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);
    var viewMatrix = lookAt(eye, target, up);

    // model matrix
    var modelMatrix = mat4();

    // Pass matrices to the shader
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // draw the model using triangles
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
    
    // call the next frame
    requestAnimFrame(render);
}

function buildPolyhedron() {
    vertices = [];
    tetrahedron(v0, v1, v2, v3, subdivisions);

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}

function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

function divideTriangle(a, b, c, count) {
    if (count === 0) {
        triangle(a, b, c);
        return;
    }

    var ab = normalize(mix(a, b, 0.5), true);
    var ac = normalize(mix(a, c, 0.5), true);
    var bc = normalize(mix(b, c, 0.5), true);

    divideTriangle(a, ab, ac, count - 1);
    divideTriangle(ab, b, bc, count - 1);
    divideTriangle(bc, c, ac, count - 1);
    divideTriangle(ab, bc, ac, count - 1);
}

function triangle(a, b, c) {
    vertices.push(a);
    vertices.push(b);
    vertices.push(c);
}

function setupWebGL() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn’t available");
        return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    program = initShaders(gl, "vshader.glsl", "fshader.glsl");
    gl.useProgram(program);
}