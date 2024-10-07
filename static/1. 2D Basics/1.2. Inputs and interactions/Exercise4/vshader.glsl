precision mediump float;

attribute vec4 vPosition;
attribute vec4 vColor;
varying vec4 fColor;

void main() {
    gl_Position = vPosition;
    fColor = vColor;
    gl_PointSize = 20.0;
}