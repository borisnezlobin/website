import { Color, ShaderMaterial, BackSide, FrontSide, type IUniform } from "three";

/**
 * Vertex stage shared by every whale material: skins the mesh, then tears it apart while the whale
 * is breaking down. Horizontal view-space bands slide sideways (the sliced-plate look) and chunks of
 * the body drift out along their normals, so it shatters into facets and knits back.
 */
export const BREAKDOWN_GLSL = /* glsl */ `
uniform float uBreak;
uniform float uSeed;
float bHash(float n) { return fract(sin(n) * 43758.5453); }
float bHash3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
vec3 breakdownOffset(vec3 viewPos, vec3 viewNormal, vec3 restPos) {
    if (uBreak <= 0.0) return vec3(0.0);
    float band = floor(viewPos.y / 0.8 + bHash(floor(viewPos.y / 3.0) + uSeed) * 2.0);
    float shift = (bHash(band + uSeed * 13.0) - 0.5) * 2.0;
    float spike = step(0.78, bHash(band * 1.7 + uSeed));
    vec3 offset = vec3(shift * (0.6 + 3.2 * spike) * 1.3, 0.0, 0.0);
    float chunk = bHash3(floor(restPos * 1.6) + uSeed);
    offset += viewNormal * chunk * chunk * 3.5;
    return offset * uBreak;
}
`;

const VERTEX = /* glsl */ `
#include <common>
#include <skinning_pars_vertex>
${BREAKDOWN_GLSL}
uniform float uOutlinePx;
uniform float uPixelWorld;
varying vec3 vRestPos;
varying vec3 vObjectNormal;
varying vec3 vViewNormal;
varying vec3 vViewPos;
void main() {
    vec3 objectNormal = vec3(normal);
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    vec3 transformed = vec3(position);
    #include <skinning_vertex>
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    vec3 viewNormal = normalize(normalMatrix * objectNormal);
    mvPosition.xyz += breakdownOffset(mvPosition.xyz, viewNormal, position);
    #ifdef OUTLINE
    mvPosition.xyz += viewNormal * uOutlinePx * uPixelWorld * -mvPosition.z;
    #endif
    vRestPos = position;
    vObjectNormal = normalize(objectNormal);
    vViewNormal = viewNormal;
    vViewPos = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
`;

export type WhaleUniforms = {
    uBreak: IUniform<number>;
    uSeed: IUniform<number>;
    uFlash: IUniform<number>;
    uOutlinePx: IUniform<number>;
    uPixelWorld: IUniform<number>;
    uPaper: IUniform<Color>;
    uInk: IUniform<Color>;
    uRed: IUniform<Color>;
    uMid: IUniform<Color>;
};

export function whaleUniforms(): WhaleUniforms {
    return {
        uBreak: { value: 0 },
        uSeed: { value: 0 },
        uFlash: { value: 0 },
        uOutlinePx: { value: 0 },
        uPixelWorld: { value: 0.001 },
        uPaper: { value: new Color() },
        uInk: { value: new Color() },
        uRed: { value: new Color() },
        uMid: { value: new Color() },
    };
}

export function whaleBodyMaterial(fragmentShader: string, uniforms: WhaleUniforms) {
    return new ShaderMaterial({ vertexShader: VERTEX, fragmentShader, uniforms, side: FrontSide });
}

/** Inverted hull: back faces pushed out a few pixels along the normal, drawn in flat ink. */
export function whaleOutlineMaterial(uniforms: WhaleUniforms) {
    return new ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: /* glsl */ `
            uniform vec3 uInk;
            uniform vec3 uRed;
            uniform float uFlash;
            void main() { gl_FragColor = vec4(mix(uInk, uRed, uFlash), 1.0); }
        `,
        uniforms,
        side: BackSide,
        defines: { OUTLINE: "" },
    });
}

/** World units per screen pixel at one unit of depth, for outlines that stay a constant pixel width. */
export const pixelWorld = (fovDegrees: number, heightPx: number) => (2 * Math.tan(((fovDegrees / 2) * Math.PI) / 180)) / heightPx;
