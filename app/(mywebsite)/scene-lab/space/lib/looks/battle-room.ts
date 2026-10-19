import { BufferAttribute, BufferGeometry, Color, LineSegments, ShaderMaterial, type Scene } from "three";

const ROOM = { x: 124, y: 80, back: -170, front: 40 };
const CELL = 17;
const RIB_EVERY = 4;

type Segment = { from: number[]; to: number[]; rib: boolean };

function steps(min: number, max: number) {
    const out: { value: number; rib: boolean }[] = [];
    const first = Math.ceil(min / CELL);
    for (let i = first; i * CELL <= max; i += 1) out.push({ value: i * CELL, rib: i % RIB_EVERY === 0 });
    return out;
}

function backWall(): Segment[] {
    const { x, y, back } = ROOM;
    return [
        ...steps(-x, x).map(({ value, rib }) => ({ from: [value, -y, back], to: [value, y, back], rib })),
        ...steps(-y, y).map(({ value, rib }) => ({ from: [-x, value, back], to: [x, value, back], rib })),
    ];
}

/** Floor, ceiling and the two side walls: lines running into depth, plus rungs across them. */
function sideWalls(): Segment[] {
    const { x, y, back, front } = ROOM;
    const along = (a: number[], b: number[]) => ({ from: [...a, back], to: [...b, front] });
    const runs = [
        ...steps(-x, x).flatMap(({ value, rib }) => [{ ...along([value, -y], [value, -y]), rib }, { ...along([value, y], [value, y]), rib }]),
        ...steps(-y, y).flatMap(({ value, rib }) => [{ ...along([-x, value], [-x, value]), rib }, { ...along([x, value], [x, value]), rib }]),
    ];
    const rungs = steps(back, front).flatMap(({ value: z, rib }) => [
        { from: [-x, -y, z], to: [x, -y, z], rib },
        { from: [-x, y, z], to: [x, y, z], rib },
        { from: [-x, -y, z], to: [-x, y, z], rib },
        { from: [x, -y, z], to: [x, y, z], rib },
    ]);
    return [...runs, ...rungs];
}

/**
 * The battle room: a box of fine grid lines around the whole volume, heavier every few cells, fading
 * with distance so it frames the depth without competing with the stars.
 */
export function createBattleRoom(scene: Scene) {
    const segments = [...backWall(), ...sideWalls()];
    const positions = new Float32Array(segments.length * 6);
    const weight = new Float32Array(segments.length * 2);
    segments.forEach(({ from, to, rib }, i) => {
        positions.set([...from, ...to], i * 6);
        weight.set(rib ? [1, 1] : [0.45, 0.45], i * 2);
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("aWeight", new BufferAttribute(weight, 1));
    const material = new ShaderMaterial({
        uniforms: { uColor: { value: new Color() }, uOpacity: { value: 0.3 } },
        vertexShader: /* glsl */ `
            attribute float aWeight;
            varying float vAlpha;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vAlpha = aWeight * clamp(1.25 - -mvPosition.z / 260.0, 0.15, 1.0);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: /* glsl */ `
            uniform vec3 uColor;
            uniform float uOpacity;
            varying float vAlpha;
            void main() { gl_FragColor = vec4(uColor, vAlpha * uOpacity); }
        `,
        transparent: true,
        depthWrite: false,
    });
    const lines = new LineSegments(geometry, material);
    lines.frustumCulled = false;
    lines.renderOrder = -1;
    scene.add(lines);
    return {
        setColor: (color: string, opacity: number) => {
            material.uniforms.uColor.value.set(color);
            material.uniforms.uOpacity.value = opacity;
        },
    };
}
