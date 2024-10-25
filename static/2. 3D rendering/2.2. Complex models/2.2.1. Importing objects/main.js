var obj;
var vertices, vBuffer;
var thetaY = 0;
var gl, canvas, program;
var modelViewMatrixLoc, projectionMatrixLoc;

window.onload = function init() {
    setupWebGL();

    // enabling depth test and culling
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // set the camera position
    eyePosLoc = gl.getUniformLocation(program, "eyePos");

    // set the light direction
    var leftLightDirection = vec3(-1.0, 0.0, 0.0);
    var leftLightDirectionLoc = gl.getUniformLocation(program, "left_light");
    gl.uniform3fv(leftLightDirectionLoc, flatten(leftLightDirection));

    var rightLightDirection = vec3(1.0, 0.0, 0.0);
    var rightLightDirectionLoc = gl.getUniformLocation(program, "right_light");
    gl.uniform3fv(rightLightDirectionLoc, flatten(rightLightDirection));

    // Uniform locations for the matrices
    viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
    modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    // Load the OBJ file and buffer its data
    readOBJFile(fileName = '../suzanne.obj', scale = 0.75, reverse = false)
        .then(objInfo => {
            obj = objInfo;

            var newVertices = [];
            var newColors = [];
            var newNormals = [];
            for (let i = 0; i < obj.vertices.length; i++) {
                if (i % 4 != 3) {
                    newVertices.push(obj.vertices[i]);
                    newColors.push(obj.colors[i]);
                    newNormals.push(obj.normals[i]);
                }
            }
            obj.vertices = newVertices;
            obj.normals = newNormals;
            obj.colors = newColors;

            // Create and bind the vertex buffer for vertices
            var vBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(obj.vertices), gl.STATIC_DRAW);
            var vPosition = gl.getAttribLocation(program, "vPosition");
            gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vPosition);

            // Create and bind the color buffer for colors
            var cBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(obj.colors), gl.STATIC_DRAW);
            var vColor = gl.getAttribLocation(program, "vColor");
            gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vColor);

            // Create and bind the index buffer
            var indices = new Uint16Array(obj.indices);
            var iBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

            // Initialize rotation and transformations
            modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
            projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

            // Start rendering
            render();
        })
        .catch(error => {
            console.error("Error loading OBJ file:", error);
        });
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    thetaY += 0.0025;

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

    // Pass matrices to the shader
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniform3fv(eyePosLoc, flatten(eyePos));

    // Draw the object using the index buffer
    gl.drawElements(gl.TRIANGLES, obj.indices.length, gl.UNSIGNED_SHORT, 0);

    // Request the next frame
    requestAnimFrame(render);
}

function setupWebGL() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn’t available");
        return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0); // Clear to a nice color
    gl.enable(gl.DEPTH_TEST);  // Enable depth testing

    // Load and use shaders
    program = initShaders(gl, "vshader.glsl", "fshader.glsl");
    gl.useProgram(program);
}
