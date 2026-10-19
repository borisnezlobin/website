import { Color, Vector2 } from "three";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

/**
 * The last pass before colour output. During a zap the frame is cut into horizontal bands of uneven
 * height that slide sideways; the few that spike also get a diagonal facet cut and frayed, grainy
 * tears, after the sliced plate on the Writing page. Grain, chromatic split and scanlines are
 * per-look dials.
 */
const FRAGMENT = /* glsl */ `
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform float uGlitch;
uniform float uSeed;
uniform float uTime;
uniform float uGrain;
uniform float uChroma;
uniform float uScan;
uniform float uQuantize;
uniform float uVignette;
uniform vec3 uTear;
varying vec2 vUv;

float hash(float n) { return fract(sin(n) * 43758.5453123); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(float x) {
    float i = floor(x), f = fract(x);
    return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f));
}

vec3 sampleSplit(vec2 uv, float split) {
    vec2 offset = vec2(split / uResolution.x, 0.0);
    return vec3(texture2D(tDiffuse, uv + offset).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - offset).b);
}

void main() {
    vec2 px = vUv * uResolution;
    float bandPx = max(uResolution.y / 24.0, 6.0);
    float t = px.y / bandPx;
    t += 0.45 * vnoise(t * 0.4 + uSeed) + 0.22 * vnoise(t * 1.1 + uSeed * 2.0);
    float band = floor(t);
    float moving = step(0.42, hash(band * 3.1 + uSeed));
    float spike = step(0.84, hash(band + uSeed * 31.0 + 0.5)) * moving;
    float disp = (hash(band + uSeed * 17.0) - 0.5) * 2.0 * uResolution.x * 0.05 * (0.3 + 1.6 * spike) * moving;
    float facet = floor(dot(px, vec2(0.7071, -0.7071)) / (bandPx * 2.4));
    disp += spike * (hash(facet + band * 7.0 + uSeed) - 0.5) * uResolution.x * 0.04;
    disp *= uGlitch;
    disp = uQuantize > 0.0 ? floor(disp / uQuantize + 0.5) * uQuantize : disp;
    vec2 uv = vec2(fract(vUv.x + disp / uResolution.x), vUv.y);

    float split = uChroma * (0.25 + uGlitch * (2.0 + 6.0 * spike));
    vec3 color = sampleSplit(uv, split);

    float edge = 1.0 - smoothstep(0.0, 0.08, min(fract(t), 1.0 - fract(t)));
    float tear = edge * step(0.45, hash2(floor(px / 2.0) + uSeed)) * uGlitch * moving;
    color = mix(color, uTear, tear);

    float scan = 0.5 + 0.5 * sin(px.y * 3.14159);
    color *= 1.0 - uScan * scan * (0.35 + uGlitch);

    vec2 centered = vUv - 0.5;
    color *= 1.0 - uVignette * dot(centered, centered) * 2.0;
    vec3 perceptual = pow(max(color, 0.0), vec3(1.0 / 2.2));
    perceptual += (hash2(px + fract(uTime) * 91.0) - 0.5) * uGrain;
    gl_FragColor = vec4(pow(max(perceptual, 0.0), vec3(2.2)), 1.0);
}
`;

const VERTEX = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

export type FinishDials = { grain: number; chroma: number; scan: number; quantize: number; vignette: number };

export function createFinishPass(dials: FinishDials) {
    const pass = new ShaderPass({
        uniforms: {
            tDiffuse: { value: null },
            uResolution: { value: new Vector2(1, 1) },
            uGlitch: { value: 0 },
            uSeed: { value: 0 },
            uTime: { value: 0 },
            uGrain: { value: dials.grain },
            uChroma: { value: dials.chroma },
            uScan: { value: dials.scan },
            uQuantize: { value: dials.quantize },
            uVignette: { value: dials.vignette },
            uTear: { value: new Color() },
        },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
    });
    return {
        pass,
        resize: (widthPx: number, heightPx: number) => pass.uniforms.uResolution.value.set(widthPx, heightPx),
        frame: (time: number, glitch: number, seed: number) => {
            pass.uniforms.uTime.value = time;
            pass.uniforms.uGlitch.value = glitch;
            pass.uniforms.uSeed.value = seed;
        },
        setTear: (color: string) => pass.uniforms.uTear.value.set(color),
        setDial: (name: "uGrain" | "uChroma" | "uScan" | "uQuantize" | "uVignette", value: number) => {
            pass.uniforms[name].value = value;
        },
    };
}

export type FinishPass = ReturnType<typeof createFinishPass>;
