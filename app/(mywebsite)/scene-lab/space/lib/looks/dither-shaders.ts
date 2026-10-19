/**
 * A plain lit whale for the dither to chew on: dark back, pale belly, a key light from the upper left
 * and a darker rim so the silhouette holds against the ground. Output is linear grey (red when struck).
 */
export const TONE_WHALE_FRAGMENT = /* glsl */ `
uniform vec3 uRed;
uniform float uFlash;
varying vec3 vRestPos;
varying vec3 vObjectNormal;
varying vec3 vViewNormal;

void main() {
    vec3 n = normalize(vViewNormal);
    float lambert = dot(n, normalize(vec3(-0.35, 0.85, 0.45))) * 0.5 + 0.5;
    float dorsal = smoothstep(-0.05, 0.5, vObjectNormal.y + vRestPos.y * 0.12);
    float rim = pow(1.0 - abs(n.z), 3.0);
    float value = mix(0.86, 0.3, dorsal) * (0.42 + 0.7 * lambert) - rim * 0.3;
    vec3 grey = vec3(pow(clamp(value, 0.0, 1.0), 2.2));
    gl_FragColor = vec4(mix(grey, uRed, uFlash * 0.8), 1.0);
}
`;
