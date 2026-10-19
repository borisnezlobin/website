import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, NormalBlending, Points, ShaderMaterial, type Scene } from "three";
import { between, seededRandom } from "../random";

export type DustShape = "cross" | "dot" | "glow";

const SHAPE_GLSL: Record<DustShape, string> = {
    cross: `
        vec2 p = abs(gl_PointCoord - 0.5);
        float arm = step(min(p.x, p.y), 0.07) * step(max(p.x, p.y), 0.5);
        if (arm < 0.5) discard;
        float alpha = 1.0;`,
    dot: `
        if (length(gl_PointCoord - 0.5) > 0.5) discard;
        float alpha = 1.0;`,
    glow: `
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float alpha = exp(-d * d * 7.0);`,
};

/** A field of specks spread through depth; they are what makes the pointer parallax read as space. */
export function createDust(scene: Scene, count: number, shape: DustShape, size: number) {
    const random = seededRandom(31);
    const positions = new Float32Array(count * 3);
    const twinkle = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
        positions.set([between(random, -110, 110), between(random, -70, 70), between(random, -150, 34)], i * 3);
        twinkle[i] = random();
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("aTwinkle", new BufferAttribute(twinkle, 1));
    const material = new ShaderMaterial({
        uniforms: { uColor: { value: new Color() }, uSize: { value: size }, uPixelRatio: { value: 1 }, uTime: { value: 0 }, uOpacity: { value: 1 } },
        vertexShader: /* glsl */ `
            attribute float aTwinkle;
            uniform float uSize;
            uniform float uPixelRatio;
            uniform float uTime;
            varying float vFade;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                float flicker = 0.75 + 0.25 * sin(uTime * (0.6 + aTwinkle * 1.7) + aTwinkle * 40.0);
                vFade = clamp(60.0 / -mvPosition.z, 0.25, 1.0) * flicker;
                gl_PointSize = max(1.0, uSize * uPixelRatio * (0.5 + aTwinkle) * clamp(70.0 / -mvPosition.z, 0.35, 1.6));
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: /* glsl */ `
            uniform vec3 uColor;
            uniform float uOpacity;
            varying float vFade;
            void main() {
                ${SHAPE_GLSL[shape]}
                gl_FragColor = vec4(uColor, alpha * vFade * uOpacity);
            }
        `,
        transparent: true,
        depthWrite: false,
    });
    const points = new Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);
    return {
        points,
        material,
        setPixelRatio: (ratio: number) => (material.uniforms.uPixelRatio.value = ratio),
        frame: (time: number) => (material.uniforms.uTime.value = time),
        setColor: (color: string, opacity: number) => {
            material.uniforms.uColor.value.set(color);
            material.uniforms.uOpacity.value = opacity;
        },
        setAdditive: (additive: boolean) => {
            material.blending = additive ? AdditiveBlending : NormalBlending;
            material.needsUpdate = true;
        },
    };
}
