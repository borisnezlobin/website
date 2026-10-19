import { Color, HalfFloatType, ShaderMaterial, Vector2, WebGLRenderTarget, type PerspectiveCamera, type Scene, type WebGLRenderer } from "three";
import { FullScreenQuad, Pass } from "three/examples/jsm/postprocessing/Pass.js";

/** Bolts live on their own layer so the glow pass can render them alone. */
export const ZAP_LAYER = 3;

/**
 * `add` lights the frame up (for dark grounds); `tint` multiplies it toward red, so on paper the halo
 * reads as a red stain instead of washing out to white.
 */
export type GlowMode = "add" | "tint";
export type ZapGlowOptions = { mode: GlowMode; strength: number; drawCore: boolean; isActive: () => boolean };

const LEVELS = 5;
const SIGMAS = [1.6, 2.6, 3.6, 4.6, 5.6];
const WEIGHTS = [0.9, 0.85, 0.75, 0.6, 0.5];

const VERTEX = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const BLUR_FRAGMENT = /* glsl */ `
uniform sampler2D tSource;
uniform vec2 uStep;
uniform float uSigma;
varying vec2 vUv;
void main() {
    vec4 sum = vec4(0.0);
    float total = 0.0;
    for (int i = -8; i <= 8; i++) {
        float x = float(i);
        float w = exp(-0.5 * x * x / (uSigma * uSigma));
        sum += texture2D(tSource, vUv + uStep * x) * w;
        total += w;
    }
    gl_FragColor = sum / total;
}
`;

const COMPOSITE_FRAGMENT = /* glsl */ `
uniform sampler2D tBase;
uniform sampler2D tCore;
uniform sampler2D tMip[${LEVELS}];
uniform float uWeights[${LEVELS}];
uniform float uStrength;
uniform float uTintMode;
uniform float uDrawCore;
uniform vec3 uTint;
varying vec2 vUv;
void main() {
    vec4 base = texture2D(tBase, vUv);
    vec3 halo = vec3(0.0);
    ${Array.from({ length: LEVELS }, (_, i) => `halo += texture2D(tMip[${i}], vUv).rgb * uWeights[${i}];`).join("\n    ")}
    float redness = clamp((halo.r - 0.5 * (halo.g + halo.b)) * uStrength, 0.0, 1.0);
    vec3 tinted = base.rgb * mix(vec3(1.0), uTint, redness);
    vec3 color = mix(base.rgb + halo * uStrength, tinted, uTintMode);
    vec4 core = texture2D(tCore, vUv) * uDrawCore;
    gl_FragColor = vec4(color * (1.0 - core.a) + core.rgb, base.a);
}
`;

const target = (samples = 0) => new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples });

/** Renders only the bolts, blurs them through a five-level mip chain, and lays the halo (and optionally the crisp bolt) over the frame. */
export class ZapGlowPass extends Pass {
    private readonly core = target(4);
    private readonly mips = Array.from({ length: LEVELS }, () => target());
    private readonly scratch = Array.from({ length: LEVELS }, () => target());
    private readonly blur = new ShaderMaterial({ uniforms: { tSource: { value: null }, uStep: { value: new Vector2() }, uSigma: { value: 1 } }, vertexShader: VERTEX, fragmentShader: BLUR_FRAGMENT, depthTest: false });
    private readonly composite = new ShaderMaterial({
        uniforms: {
            tBase: { value: null },
            tCore: { value: this.core.texture },
            tMip: { value: this.mips.map((mip) => mip.texture) },
            uWeights: { value: WEIGHTS },
            uStrength: { value: 1 },
            uTintMode: { value: 0 },
            uDrawCore: { value: 0 },
            uTint: { value: new Color() },
        },
        vertexShader: VERTEX,
        fragmentShader: COMPOSITE_FRAGMENT,
        depthTest: false,
    });
    private readonly quad = new FullScreenQuad();
    private readonly savedClear = new Color();

    constructor(
        private readonly scene: Scene,
        private readonly camera: PerspectiveCamera,
        private readonly options: ZapGlowOptions,
    ) {
        super();
        this.configure(options);
    }

    configure(options: Partial<ZapGlowOptions>) {
        Object.assign(this.options, options);
        this.composite.uniforms.uStrength.value = this.options.strength;
        this.composite.uniforms.uTintMode.value = this.options.mode === "tint" ? 1 : 0;
        this.composite.uniforms.uDrawCore.value = this.options.drawCore ? 1 : 0;
    }

    /** The colour a fully lit halo multiplies paper by in `tint` mode. */
    setTint(color: string) {
        this.composite.uniforms.uTint.value.set(color);
    }

    setSize(width: number, height: number) {
        this.core.setSize(width, height);
        this.mips.forEach((mip, i) => {
            const scale = 2 ** (i + 1);
            mip.setSize(Math.max(1, Math.round(width / scale)), Math.max(1, Math.round(height / scale)));
            this.scratch[i].setSize(mip.width, mip.height);
        });
    }

    render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget) {
        this.needsSwap = this.options.isActive();
        if (!this.needsSwap) return;
        this.renderBolts(renderer);
        this.blurChain(renderer);
        this.composite.uniforms.tBase.value = readBuffer.texture;
        this.quad.material = this.composite;
        renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
        this.quad.render(renderer);
    }

    private renderBolts(renderer: WebGLRenderer) {
        const mask = this.camera.layers.mask;
        const background = this.scene.background;
        const alpha = renderer.getClearAlpha();
        this.scene.background = null;
        renderer.getClearColor(this.savedClear);
        this.camera.layers.set(ZAP_LAYER);
        renderer.setRenderTarget(this.core);
        renderer.setClearColor(0x000000, 0);
        renderer.clear();
        renderer.render(this.scene, this.camera);
        this.camera.layers.mask = mask;
        this.scene.background = background;
        renderer.setClearColor(this.savedClear, alpha);
    }

    private blurPass(renderer: WebGLRenderer, source: WebGLRenderTarget, into: WebGLRenderTarget, horizontal: boolean, sigma: number) {
        this.blur.uniforms.tSource.value = source.texture;
        this.blur.uniforms.uStep.value.set(horizontal ? 1 / into.width : 0, horizontal ? 0 : 1 / into.height);
        this.blur.uniforms.uSigma.value = sigma;
        this.quad.material = this.blur;
        renderer.setRenderTarget(into);
        this.quad.render(renderer);
    }

    private blurChain(renderer: WebGLRenderer) {
        let source = this.core;
        this.mips.forEach((mip, i) => {
            this.blurPass(renderer, source, this.scratch[i], true, SIGMAS[i]);
            this.blurPass(renderer, this.scratch[i], mip, false, SIGMAS[i]);
            source = mip;
        });
    }

    dispose() {
        [this.core, ...this.mips, ...this.scratch].forEach((t) => t.dispose());
        this.blur.dispose();
        this.composite.dispose();
        this.quad.dispose();
    }
}
