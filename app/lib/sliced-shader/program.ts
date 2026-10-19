import { bindUnitQuad, linkProgram, makeTexture, uniformLocations } from "@/app/lib/gl/basics";

/**
 * The torn-paper slice from the Writing page's Personal quote: the sprite is cut into diagonal bands
 * of uneven width, each band slides along the diagonal by its own amount, and the torn ends fray.
 * `progress` runs from 0 (whole) to 1 (fully sliced).
 */

const VERT = `
attribute vec2 aUnit;
uniform vec4 uQuad;   // x, y, w, h in canvas pixels
uniform vec2 uCanvas; // canvas size in pixels
varying vec2 vUv;
void main() {
    vec2 p = uQuad.xy + aUnit * uQuad.zw;
    gl_Position = vec4(p.x / uCanvas.x * 2.0 - 1.0, 1.0 - p.y / uCanvas.y * 2.0, 0.0, 1.0);
    vUv = aUnit;
}
`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uProgress;
uniform float uBandPx;
uniform float uAmp;
uniform float uDamage;
uniform float uSeed;
uniform float uOpacity;

float hash(float n) { return fract(sin(n) * 43758.5453123); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(float x) {
    float i = floor(x), f = fract(x);
    return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f));
}
vec4 samp(vec2 uv) {
    return (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) ? vec4(0.0) : texture2D(uTex, uv);
}

void main() {
    vec2 px = vUv * uRes;
    vec2 dir = normalize(vec2(1.0, -1.0));
    vec2 nrm = vec2(-dir.y, dir.x);

    // Band index in band-width units; small values keep the hash unbiased (no net drift).
    float t = dot(px, nrm) / uBandPx;
    // Bounded monotonic warp -> variable band widths (thin and thick) with no overlap.
    t += 0.45 * vnoise(t * 0.4 + uSeed) + 0.22 * vnoise(t * 1.1 + uSeed * 2.0);
    float band = floor(t);

    // Symmetric, zero-mean per-band shift so content doesn't drift; ~12% spike hard.
    float r = hash(band + uSeed * 17.0) - 0.5;
    float spike = step(0.88, hash(band + uSeed * 31.0 + 0.5));
    float disp = r * 2.0 * uAmp * (0.4 + 1.0 * spike) * uProgress;

    vec2 uv = (px + dir * disp) / uRes;
    vec4 col = samp(uv);

    // Damage the slice ends: grain-erode + fade where content meets its torn edge.
    vec2 texel = 1.0 / uRes;
    float aF = samp(uv + dir * texel * 2.5).a;
    float aB = samp(uv - dir * texel * 2.5).a;
    float edge = max(abs(col.a - aF), abs(col.a - aB));
    float tornness = clamp(abs(disp) / max(uAmp, 0.001), 0.0, 1.0);
    float fray = edge * (0.35 + 0.9 * tornness);
    float grain = hash2(floor(px / 1.6) + uSeed);
    float fine = hash2(floor(px) * 1.7 + uSeed * 2.0);
    col.a *= 1.0 - step(0.5, grain) * fray * 1.4 * uProgress * uDamage;
    col.a *= 1.0 - fine * edge * 0.4 * uProgress * uDamage;
    col.a = clamp(col.a * uOpacity, 0.0, 1.0);

    gl_FragColor = col;
}
`;

/** One textured quad, in device pixels of the canvas it is drawn into. */
export type SlicedDraw = {
    tex: WebGLTexture;
    quad: { x: number; y: number; w: number; h: number };
    progress: number;
    bandPx: number;
    amp: number;
    damage: number;
    seed: number;
    /** Multiplies the sprite's alpha; 1 when left out. */
    opacity?: number;
};

export type SlicedProgram = {
    makeTexture: () => WebGLTexture;
    upload: (tex: WebGLTexture, source: HTMLCanvasElement) => void;
    clear: () => void;
    draw: (sprite: SlicedDraw) => void;
    dispose: () => void;
};

/** Throws if WebGL can't compile the shader, so the caller can fall back to plain HTML. */
export function createSlicedProgram(gl: WebGLRenderingContext): SlicedProgram {
    const program = linkProgram(gl, VERT, FRAG);
    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    const buffer = bindUnitQuad(gl, program);
    const u = uniformLocations(gl, program, {
        quad: "uQuad",
        canvas: "uCanvas",
        res: "uRes",
        progress: "uProgress",
        bandPx: "uBandPx",
        amp: "uAmp",
        damage: "uDamage",
        seed: "uSeed",
        opacity: "uOpacity",
    });
    const textures: WebGLTexture[] = [];

    return {
        makeTexture: () => {
            const tex = makeTexture(gl);
            textures.push(tex);
            return tex;
        },
        upload: (tex, source) => {
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        },
        clear: () => {
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.uniform2f(u.canvas, gl.canvas.width, gl.canvas.height);
        },
        draw: ({ tex, quad, progress, bandPx, amp, damage, seed, opacity = 1 }) => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.uniform4f(u.quad, quad.x, quad.y, quad.w, quad.h);
            gl.uniform2f(u.res, quad.w, quad.h);
            gl.uniform1f(u.progress, Math.max(0, progress));
            gl.uniform1f(u.bandPx, bandPx);
            gl.uniform1f(u.amp, amp);
            gl.uniform1f(u.damage, damage);
            gl.uniform1f(u.seed, seed);
            gl.uniform1f(u.opacity, opacity);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        },
        dispose: () => {
            textures.forEach((tex) => gl.deleteTexture(tex));
            gl.deleteBuffer(buffer);
            gl.deleteProgram(program);
        },
    };
}
