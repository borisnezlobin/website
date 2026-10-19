import { Color, ShaderMaterial } from "three";

/** Section hatching for the stars' recessed triangles: fine diagonal ink lines fixed to the star, easing to a flat tone when they get too fine to draw. */
export function createHatchMaterial() {
    return new ShaderMaterial({
        uniforms: { uPaper: { value: new Color() }, uInk: { value: new Color() }, uStrength: { value: 0.75 } },
        vertexShader: /* glsl */ `
            varying vec3 vLocal;
            void main() {
                vLocal = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */ `
            uniform vec3 uPaper;
            uniform vec3 uInk;
            uniform float uStrength;
            varying vec3 vLocal;
            void main() {
                float coord = dot(vLocal, vec3(0.62, 0.62, 0.48)) * 34.0;
                float d = abs(fract(coord) - 0.5);
                float aa = fwidth(coord);
                float line = 1.0 - smoothstep(0.16 - aa, 0.16 + aa, d);
                float ink = mix(line, 0.32, smoothstep(0.25, 0.6, aa)) * uStrength;
                gl_FragColor = vec4(mix(uPaper, uInk, ink), 1.0);
            }
        `,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
    });
}
