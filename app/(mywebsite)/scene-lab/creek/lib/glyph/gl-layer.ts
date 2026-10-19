import { linkProgram } from "@/app/lib/gl/basics";
import type { CanvasSize } from "../stage";

/**
 * A WebGL2 canvas laid exactly over the scene's 2D canvas. The 2D canvas keeps the paper, banks
 * and faceted rocks (and the pointer); this layer draws only the water's glyphs on top, with a
 * transparent background so everything underneath shows through.
 */
export type GlLayer = {
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
    quad: WebGLVertexArrayObject;
    floatTargets: boolean;
    resize: (size: CanvasSize) => void;
    dispose: () => void;
};

const FULLSCREEN_VERTEX = `#version 300 es
layout(location = 0) in vec2 aUnit;
out vec2 vUv;
void main() {
    vUv = aUnit;
    gl_Position = vec4(aUnit * 2.0 - 1.0, 0.0, 1.0);
}`;

/** `linkProgram` is typed for WebGL1; a WebGL2 context implements everything it calls. */
const linkProgram2 = (gl: WebGL2RenderingContext, vertex: string, fragment: string) =>
    linkProgram(gl as unknown as WebGLRenderingContext, vertex, fragment);

function createQuad(gl: WebGL2RenderingContext) {
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return vao;
}

export function createGlLayer(under: HTMLCanvasElement): GlLayer | null {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "pointer-events-none absolute inset-0 h-full w-full";
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return null;
    under.after(canvas);
    const floatTargets = Boolean(gl.getExtension("EXT_color_buffer_float"));
    gl.getExtension("OES_texture_float_linear");
    return {
        canvas, gl, quad: createQuad(gl), floatTargets,
        resize: ({ width, height, dpr }) => {
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
        },
        dispose: () => {
            gl.getExtension("WEBGL_lose_context")?.loseContext();
            canvas.remove();
        },
    };
}

/** Every program reads the one shared quad from attribute 0. */
export const fullscreenProgram = (gl: WebGL2RenderingContext, fragment: string) => linkProgram2(gl, FULLSCREEN_VERTEX, fragment);

export function drawQuad(layer: GlLayer) {
    layer.gl.bindVertexArray(layer.quad);
    layer.gl.drawArrays(layer.gl.TRIANGLES, 0, 6);
}

export function dataTexture(gl: WebGL2RenderingContext, filter: number) {
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    return texture;
}
