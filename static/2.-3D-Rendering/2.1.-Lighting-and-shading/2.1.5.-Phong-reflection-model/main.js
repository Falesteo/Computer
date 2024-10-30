var vertices, vBuffer;
var normals, nBuffer;
var subdivisions, min_sub, max_sub;
var v0, v1, v2, v3;
var thetaY = 30;
var gl, canvas, program;
var viewMatrixLoc, modelMatrixLoc, projectionMatrixLoc, eyePosLoc;
var kLoc, LLoc, ksLoc, sLoc;
var k, L, ks, s;

window.onload = function init() {
    setupWebGL();
    
    // enabling depth test and culling
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);

    // set the camera position
    eyePosLoc = gl.getUniformLocation(program, "eyePos");

    // set the light direction
    var lightDirection = vec3(0.0, 0.0, -1.0);
    var lightDirectionLoc = gl.getUniformLocation(program, "lightDirection");
    gl.uniform3fv(lightDirectionLoc, flatten(lightDirection));

    // and all the lighting parameters
    kLoc = gl.getUniformLocation(program, "k");
    LLoc = gl.getUniformLocation(program, "L");
    ksLoc = gl.getUniformLocation(program, "ks");
    sLoc = gl.getUniformLocation(program, "s");

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

    normals = [];

    min_sub = 0;
    max_sub = 8;
    subdivisions = max_sub;
    
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
    var eyePos = vec3(dist * Math.cos(thetaY), 0.0, dist * Math.sin(thetaY));
    var target = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);
    var viewMatrix = lookAt(eyePos, target, up);

    // model matrix
    var modelMatrix = mat4();

    // update the lighting parameters
    updateLighting();

    // Pass matrices to the shader
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniform3fv(eyePosLoc, flatten(eyePos));

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

    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
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

    // Normalize the midpoints correctly
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
    normals.push(a);
    vertices.push(b);
    normals.push(b);
    vertices.push(c);
    normals.push(c);
}

document.getElementById("increment-subdivision-level").addEventListener("click", function() {
    if (subdivisions == max_sub)
        alert("Maximum subdivision level reached!");
    else
        subdivisions++;

    buildPolyhedron();
});

document.getElementById("decrement-subdivision-level").addEventListener("click", function() {
    if (subdivisions == min_sub)
        alert("subdivision level is already 0!");
    else
        subdivisions--;

    buildPolyhedron();
});

function updateLighting() {
    k = parseFloat(document.getElementById("k").value);
    L = parseFloat(document.getElementById("L").value);
    ks = parseFloat(document.getElementById("ks").value);
    s = parseFloat(document.getElementById("s").value);

    gl.uniform1f(kLoc, k);
    gl.uniform1f(LLoc, L);
    gl.uniform1f(ksLoc, ks);
    gl.uniform1f(sLoc, Math.pow(10, s));
} 

function setupWebGL() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
        return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    program = initShaders(gl, "vshader.glsl", "fshader.glsl");
    gl.useProgram(program);
}