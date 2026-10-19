/**
 * Pen-and-ink whale: dark back and paper belly like the site's drawn humpbacks, toned with
 * variable-width hatching that lives on the body (so it swims with it), ventral pleats on the
 * throat, and a crosshatch layer only where the form turns into shadow.
 */
export const INK_WHALE_FRAGMENT = /* glsl */ `
uniform vec3 uPaper;
uniform vec3 uInk;
uniform vec3 uRed;
uniform float uFlash;
varying vec3 vRestPos;
varying vec3 vObjectNormal;
varying vec3 vViewNormal;

float lineMask(float coord, float halfWidth) {
    float d = abs(fract(coord + 0.5) - 0.5);
    float aa = fwidth(coord) * 0.75;
    float crisp = 1.0 - smoothstep(halfWidth - aa, halfWidth + aa, d);
    return mix(crisp, clamp(halfWidth * 2.0, 0.0, 1.0), smoothstep(0.22, 0.5, aa)) * step(0.001, halfWidth);
}

void main() {
    vec3 n = normalize(vViewNormal);
    float lambert = dot(n, normalize(vec3(-0.35, 0.85, 0.45)));
    float dorsal = smoothstep(-0.05, 0.5, vObjectNormal.y + vRestPos.y * 0.12);
    float shade = smoothstep(0.3, -0.65, lambert);
    float rim = pow(1.0 - abs(n.z), 4.0);
    float tone = clamp(max(dorsal * 0.88, shade * 0.72) + rim * 0.3, 0.0, 1.0);

    float along = (vRestPos.x * 1.1 + vRestPos.y * 3.2) * 1.6;
    float across = (vRestPos.z * 3.0 - vRestPos.x * 0.9) * 1.6;
    float ink = lineMask(along, clamp((tone - 0.1) * 0.62, 0.0, 0.5));
    ink = max(ink, lineMask(across, clamp((tone - 0.58) * 0.9, 0.0, 0.5)));

    float throat = smoothstep(0.15, -0.35, vObjectNormal.y) * smoothstep(-1.5, 0.8, vRestPos.x) * smoothstep(6.9, 5.2, vRestPos.x);
    ink = max(ink, lineMask(atan(vRestPos.z, 0.6 - vRestPos.y) * 11.0, 0.08) * throat);

    gl_FragColor = vec4(mix(uPaper, mix(uInk, uRed, uFlash), ink), 1.0);
}
`;
