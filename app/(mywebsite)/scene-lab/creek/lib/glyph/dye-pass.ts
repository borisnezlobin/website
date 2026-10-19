import { ROCK, WATER } from "../creek-layout";
import type { FlowGrid } from "../flow-grid";
import { dataTexture, drawQuad, fullscreenProgram, type GlLayer } from "./gl-layer";

/**
 * Dye carried by the water on the GPU, at many times the lattice's resolution. The lattice flow
 * is uploaded as a velocity texture each frame; a fragment shader traces every dye texel back
 * along it (a midpoint semi-Lagrangian step) and fetches what was there. Thin lanes of dye are
 * let in along the top edge in slow pulses (red channel) and every rock face bleeds a second dye
 * (green channel), which draws the wakes. Texture y runs up, as GL's does; the CPU fields run
 * down, so the shader flips y when it reads them.
 */
export type DyePass = {
    dye: () => WebGLTexture;
    velocity: WebGLTexture;
    foam: WebGLTexture;
    mask: WebGLTexture;
    upload: (grid: FlowGrid, foam: Float32Array) => void;
    advance: (steps: number, time: number, delta: number) => void;
    dispose: () => void;
};

const DYE_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outDye;
uniform sampler2D uDye;
uniform sampler2D uVelocity;
uniform sampler2D uMask;
uniform vec2 uStep;
uniform float uTime;
uniform float uKeep;
uniform float uLanes;
uniform float uTopBand;

vec2 down(vec2 uv) { return vec2(uv.x, 1.0 - uv.y); }
vec2 flowAt(vec2 uv) { vec2 v = texture(uVelocity, down(uv)).rg; return vec2(v.x, -v.y) * uStep; }

float lane(float x, float t) {
    float wobble = 0.35 * sin(t * 0.21 + x * 9.0) + 0.2 * sin(t * 0.47 - x * 23.0);
    float stripe = pow(max(0.0, sin((x * uLanes + wobble) * 6.2831853)), 18.0);
    float id = floor(x * uLanes + wobble + 0.25);
    float pulse = step(0.28, fract(t * (0.16 + 0.05 * fract(id * 0.618)) + id * 0.37));
    return stripe * pulse;
}

void main() {
    vec2 back = vUv - flowAt(vUv - 0.5 * flowAt(vUv));
    vec4 dye = texture(uDye, back) * uKeep;
    vec2 mask = texture(uMask, down(vUv)).rg;
    float fromTop = 1.0 - vUv.y;
    if (fromTop < uTopBand) dye.r = max(dye.r, lane(vUv.x, uTime));
    dye.g = max(dye.g, mask.g * (0.75 + 0.25 * sin(uTime * 3.0 + vUv.y * 40.0)));
    outDye = dye * (1.0 - mask.r);
}`;

type Target = { texture: WebGLTexture; framebuffer: WebGLFramebuffer };

function createTarget(layer: GlLayer, width: number, height: number): Target {
    const { gl, floatTargets } = layer;
    const texture = dataTexture(gl, gl.LINEAR);
    const internal = floatTargets ? gl.RGBA16F : gl.RGBA8;
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, width, height, 0, gl.RGBA, floatTargets ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
    const framebuffer = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { texture, framebuffer };
}

/** Solid cells in red, water touching a rock face in green: the dye's walls and its wake sources. */
function maskBytes(grid: FlowGrid) {
    const { cols, rows, mask } = grid;
    const bytes = new Uint8Array(cols * rows * 2);
    for (let k = 0; k < cols * rows; k++) {
        bytes[k * 2] = mask.kind[k] === WATER ? 0 : 255;
        const touches = mask.kind[k] === WATER && [k - 1, k + 1, k - cols, k + cols].some((n) => mask.kind[n] === ROCK);
        bytes[k * 2 + 1] = touches ? 255 : 0;
    }
    return bytes;
}

const DYE_SCALE = 0.5;
const KEEP_PER_SECOND = 0.93;

export function createDyePass(layer: GlLayer, grid: FlowGrid, size: { width: number; height: number }): DyePass {
    const { gl } = layer;
    const program = fullscreenProgram(gl, DYE_FRAGMENT);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const width = Math.max(2, Math.round(size.width * DYE_SCALE)), height = Math.max(2, Math.round(size.height * DYE_SCALE));
    const targets = [createTarget(layer, width, height), createTarget(layer, width, height)];
    let current = 0;
    const velocity = dataTexture(gl, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, grid.cols, grid.rows, 0, gl.RG, gl.FLOAT, null);
    const foam = dataTexture(gl, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, grid.cols, grid.rows, 0, gl.RED, gl.FLOAT, null);
    const mask = dataTexture(gl, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, grid.cols, grid.rows, 0, gl.RG, gl.UNSIGNED_BYTE, maskBytes(grid));
    const packed = new Float32Array(grid.cols * grid.rows * 2);
    const lanes = Math.max(8, Math.round(size.width / 52));

    return {
        dye: () => targets[current].texture,
        velocity, foam, mask,
        upload: ({ flow, cols, rows }, foamValues) => {
            for (let k = 0; k < cols * rows; k++) { packed[k * 2] = flow.ux[k]; packed[k * 2 + 1] = flow.uy[k]; }
            gl.bindTexture(gl.TEXTURE_2D, velocity);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, cols, rows, gl.RG, gl.FLOAT, packed);
            gl.bindTexture(gl.TEXTURE_2D, foam);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, cols, rows, gl.RED, gl.FLOAT, foamValues);
        },
        advance: (steps, time, delta) => {
            const next = 1 - current;
            gl.bindFramebuffer(gl.FRAMEBUFFER, targets[next].framebuffer);
            gl.viewport(0, 0, width, height);
            gl.disable(gl.BLEND);
            gl.useProgram(program);
            [targets[current].texture, velocity, mask].forEach((texture, unit) => {
                gl.activeTexture(gl.TEXTURE0 + unit);
                gl.bindTexture(gl.TEXTURE_2D, texture);
            });
            gl.uniform1i(uniform("uDye"), 0);
            gl.uniform1i(uniform("uVelocity"), 1);
            gl.uniform1i(uniform("uMask"), 2);
            gl.uniform2f(uniform("uStep"), steps / grid.cols, steps / grid.rows);
            gl.uniform1f(uniform("uTime"), time);
            gl.uniform1f(uniform("uKeep"), KEEP_PER_SECOND ** delta);
            gl.uniform1f(uniform("uLanes"), lanes);
            gl.uniform1f(uniform("uTopBand"), 2.5 / grid.rows);
            drawQuad(layer);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            current = next;
        },
        dispose: () => {
            targets.forEach(({ texture, framebuffer }) => { gl.deleteTexture(texture); gl.deleteFramebuffer(framebuffer); });
            [velocity, foam, mask].forEach((texture) => gl.deleteTexture(texture));
            gl.deleteProgram(program);
        },
    };
}
