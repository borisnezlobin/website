import { BufferAttribute, BufferGeometry, Color, MeshBasicMaterial, Points, ShaderMaterial, Vector3, type IUniform, type SkinnedMesh } from "three";
import { seededRandom } from "../random";
import { BREAKDOWN_GLSL } from "./whale-shader";

type Corner = { index: number; weight: number };

function triangleIndices(geometry: BufferGeometry): ArrayLike<number> {
    if (geometry.index) return geometry.index.array;
    return Array.from({ length: geometry.getAttribute("position").count }, (_, i) => i);
}

function triangleAreas(position: BufferAttribute, indices: ArrayLike<number>) {
    const [a, b, c] = [new Vector3(), new Vector3(), new Vector3()];
    const areas = new Float32Array(indices.length / 3);
    let total = 0;
    for (let t = 0; t < areas.length; t += 1) {
        a.fromBufferAttribute(position, indices[t * 3]);
        b.fromBufferAttribute(position, indices[t * 3 + 1]).sub(a);
        c.fromBufferAttribute(position, indices[t * 3 + 2]).sub(a);
        total += b.cross(c).length() / 2;
        areas[t] = total;
    }
    return { cumulative: areas, total };
}

function pickTriangle(cumulative: Float32Array, target: number) {
    let low = 0;
    let high = cumulative.length - 1;
    while (low < high) {
        const mid = (low + high) >> 1;
        if (cumulative[mid] < target) low = mid + 1;
        else high = mid;
    }
    return low;
}

function barycentric(random: () => number): [number, number, number] {
    let u = random();
    let v = random();
    if (u + v > 1) [u, v] = [1 - u, 1 - v];
    return [1 - u - v, u, v];
}

function copyInterpolated(source: BufferAttribute, corners: Corner[], out: Float32Array, at: number) {
    for (let k = 0; k < 3; k += 1) {
        out[at * 3 + k] = corners.reduce((sum, corner) => sum + source.getComponent(corner.index, k) * corner.weight, 0);
    }
}

function copyDominantSkin(geometry: BufferGeometry, corners: Corner[], indices: Float32Array, weights: Float32Array, at: number) {
    const dominant = corners.reduce((best, corner) => (corner.weight > best.weight ? corner : best)).index;
    const skinIndex = geometry.getAttribute("skinIndex");
    const skinWeight = geometry.getAttribute("skinWeight");
    for (let k = 0; k < 4; k += 1) {
        indices[at * 4 + k] = skinIndex.getComponent(dominant, k);
        weights[at * 4 + k] = skinWeight.getComponent(dominant, k);
    }
}

/** Scatters `count` points over the whale's surface by area, each carrying skin weights so it rides the rig. */
export function sampleSkinnedSurface(geometry: BufferGeometry, count: number, seed: number): BufferGeometry {
    const random = seededRandom(seed);
    const position = geometry.getAttribute("position") as BufferAttribute;
    const normal = geometry.getAttribute("normal") as BufferAttribute;
    const indices = triangleIndices(geometry);
    const { cumulative, total } = triangleAreas(position, indices);
    const out = { position: new Float32Array(count * 3), normal: new Float32Array(count * 3), skinIndex: new Float32Array(count * 4), skinWeight: new Float32Array(count * 4), seed: new Float32Array(count) };
    for (let i = 0; i < count; i += 1) {
        const t = pickTriangle(cumulative, random() * total);
        const weights = barycentric(random);
        const corners = weights.map((weight, k) => ({ index: indices[t * 3 + k], weight }));
        copyInterpolated(position, corners, out.position, i);
        copyInterpolated(normal, corners, out.normal, i);
        copyDominantSkin(geometry, corners, out.skinIndex, out.skinWeight, i);
        out.seed[i] = random();
    }
    const sampled = new BufferGeometry();
    sampled.setAttribute("position", new BufferAttribute(out.position, 3));
    sampled.setAttribute("normal", new BufferAttribute(out.normal, 3));
    sampled.setAttribute("skinIndex", new BufferAttribute(out.skinIndex, 4));
    sampled.setAttribute("skinWeight", new BufferAttribute(out.skinWeight, 4));
    sampled.setAttribute("aSeed", new BufferAttribute(out.seed, 1));
    return sampled;
}

const VERTEX = /* glsl */ `
#include <common>
#include <skinning_pars_vertex>
${BREAKDOWN_GLSL}
attribute float aSeed;
uniform float uSize;
uniform float uPixelRatio;
uniform float uTime;
varying float vSeed;
varying float vRim;
void main() {
    vec3 objectNormal = vec3(normal);
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    vec3 transformed = vec3(position);
    #include <skinning_vertex>
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    vec3 viewNormal = normalize(normalMatrix * objectNormal);
    mvPosition.xyz += breakdownOffset(mvPosition.xyz, viewNormal, position) * (0.6 + aSeed);
    vRim = 1.0 - abs(viewNormal.z);
    vSeed = aSeed;
    gl_PointSize = uSize * uPixelRatio * (0.6 + aSeed * 0.8) * clamp(70.0 / -mvPosition.z, 0.45, 1.8);
    gl_Position = projectionMatrix * mvPosition;
}
`;

const FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uAccent;
uniform vec3 uRed;
uniform float uFlash;
uniform float uTime;
uniform float uGain;
varying float vSeed;
varying float vRim;
void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float twinkle = 0.65 + 0.35 * sin(uTime * (1.0 + vSeed * 3.0) + vSeed * 60.0);
    vec3 color = mix(uColor, uAccent, step(0.93, vSeed));
    color = mix(color, uRed, uFlash);
    float energy = (0.35 + 0.9 * vRim * vRim) * twinkle * uGain;
    gl_FragColor = vec4(color, (1.0 - d * d) * energy);
}
`;

export type WhalePointUniforms = {
    uBreak: IUniform<number>;
    uSeed: IUniform<number>;
    uFlash: IUniform<number>;
    uTime: IUniform<number>;
    uSize: IUniform<number>;
    uPixelRatio: IUniform<number>;
    uGain: IUniform<number>;
    uColor: IUniform<Color>;
    uAccent: IUniform<Color>;
    uRed: IUniform<Color>;
};

/**
 * Replaces the whale's surface with a skinned point cloud. The original mesh stays in the graph,
 * drawing nothing, so its skeleton keeps animating; the points share that skeleton's bone texture.
 */
export function attachWhalePoints(mesh: SkinnedMesh, count: number, seed: number) {
    mesh.material = new MeshBasicMaterial({ visible: false });
    mesh.skeleton.computeBoneTexture();
    const uniforms: WhalePointUniforms & Record<string, IUniform> = {
        uBreak: { value: 0 },
        uSeed: { value: 0 },
        uFlash: { value: 0 },
        uTime: { value: 0 },
        uSize: { value: 1.7 },
        uPixelRatio: { value: 1 },
        uGain: { value: 1 },
        uColor: { value: new Color() },
        uAccent: { value: new Color() },
        uRed: { value: new Color() },
        boneTexture: { value: mesh.skeleton.boneTexture },
        bindMatrix: { value: mesh.bindMatrix },
        bindMatrixInverse: { value: mesh.bindMatrixInverse },
    };
    const material = new ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms, defines: { USE_SKINNING: "" }, transparent: true, depthWrite: false });
    const points = new Points(sampleSkinnedSurface(mesh.geometry, count, seed), material);
    points.frustumCulled = false;
    mesh.add(points);
    return { points, material, uniforms };
}
