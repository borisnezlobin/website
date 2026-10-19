import { Color, Vector2 } from "three";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

/**
 * One-bit-and-red Bayer dither at a chunky cell size. Each cell samples the render once, maps its
 * perceptual brightness through a levels window, and compares it to an 8x8 ordered threshold; red
 * surfaces dither between ground and red instead. During a zap, horizontal bands of cells slide
 * sideways by whole cells and shift their threshold phase, so the pattern itself tears.
 */
const FRAGMENT = /* glsl */ `
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform float uCell;
uniform float uGlitch;
uniform float uSeed;
uniform vec2 uLevels;
uniform vec3 uDarkTone;
uniform vec3 uLightTone;
uniform vec3 uRed;
varying vec2 vUv;

float hash(float n) { return fract(sin(n) * 43758.5453123); }
float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

vec2 tear(vec2 px) {
    float bandCells = 5.0 + floor(hash(floor(px.y / (uCell * 23.0)) + uSeed) * 9.0);
    float band = floor(px.y / (uCell * bandCells));
    float moving = step(0.45, hash(band * 3.1 + uSeed));
    float cells = floor((hash(band + uSeed * 17.0) - 0.5) * 2.0 * 26.0 + 0.5);
    float phase = floor(hash(band * 7.3 + uSeed) * 8.0);
    return vec2(cells * uCell, phase) * moving * step(0.01, uGlitch);
}

vec3 toPerceptual(vec3 linear) { return pow(max(linear, 0.0), vec3(1.0 / 2.2)); }

void main() {
    vec2 px = vUv * uResolution;
    vec2 torn = tear(px);
    vec2 cell = floor((px + vec2(torn.x, 0.0)) / uCell);
    vec2 sampleUv = fract((cell + 0.5) * uCell / uResolution);
    vec3 color = toPerceptual(texture2D(tDiffuse, sampleUv).rgb);
    float threshold = bayer8(cell + torn.y) * 0.96 + 0.02;
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    float level = clamp((luma - uLevels.x) / (uLevels.y - uLevels.x), 0.0, 1.0);
    float redness = clamp((color.r - max(color.g, color.b) - 0.14) * 2.4, 0.0, 1.0);
    vec3 tone = level > threshold ? uLightTone : uDarkTone;
    gl_FragColor = vec4(redness > threshold ? uRed : tone, 1.0);
}
`;

const VERTEX = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

export type DitherTones = { dark: string; light: string; red: string; levels: [number, number] };

/** Cells are this many CSS pixels: chunkier on wide screens, finer on phones where the stars sit farther away. */
const cellCssPx = (cssWidth: number) => (cssWidth < 640 ? 2 : 3);

export function createDitherPass() {
    const pass = new ShaderPass({
        uniforms: {
            tDiffuse: { value: null },
            uResolution: { value: new Vector2(1, 1) },
            uCell: { value: 3 },
            uGlitch: { value: 0 },
            uSeed: { value: 0 },
            uLevels: { value: new Vector2(0, 1) },
            uDarkTone: { value: new Color() },
            uLightTone: { value: new Color() },
            uRed: { value: new Color() },
        },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
    });
    return {
        pass,
        resize: (cssWidth: number, cssHeight: number, pixelRatio: number) => {
            pass.uniforms.uResolution.value.set(cssWidth * pixelRatio, cssHeight * pixelRatio);
            pass.uniforms.uCell.value = Math.round(cellCssPx(cssWidth) * pixelRatio);
        },
        frame: (glitch: number, seed: number) => {
            pass.uniforms.uGlitch.value = glitch;
            pass.uniforms.uSeed.value = seed;
        },
        setTones: ({ dark, light, red, levels }: DitherTones) => {
            pass.uniforms.uDarkTone.value.set(dark);
            pass.uniforms.uLightTone.value.set(light);
            pass.uniforms.uRed.value.set(red);
            pass.uniforms.uLevels.value.set(...levels);
        },
    };
}
