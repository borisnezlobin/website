import { Color, MeshBasicMaterial, MeshStandardMaterial, type Material } from "three";

/** Colours for one lit star. Gains above 1 push the glowing parts past white so a bloom threshold catches them. */
export type StarFinish = {
    panel: string;
    bevel: string;
    inset: string;
    ring: string;
    ringGain: number;
    light: string;
    lightGain: number;
    red: string;
};

export type StarMaterials = { materials: Material[]; paint: (finish: StarFinish) => void; flash: (amount: number) => void };

/** Matte-metal panels, polished chamfers, dark recessed triangles, emissive edge lines and red indicator lights. */
export function createStarMaterials(finish: StarFinish): StarMaterials {
    const panel = new MeshStandardMaterial({ metalness: 0.5, roughness: 0.42 });
    const bevel = new MeshStandardMaterial({ metalness: 0.9, roughness: 0.2 });
    const ring = new MeshBasicMaterial({ toneMapped: false });
    const inset = new MeshStandardMaterial({ metalness: 0.35, roughness: 0.5 });
    const light = new MeshBasicMaterial({ toneMapped: false });
    const ringColor = new Color();
    const red = new Color();
    const hotRed = new Color();
    let current = finish;

    const paint = (next: StarFinish) => {
        current = next;
        panel.color.set(next.panel);
        bevel.color.set(next.bevel);
        inset.color.set(next.inset);
        ringColor.set(next.ring).multiplyScalar(next.ringGain);
        red.set(next.red);
        light.color.set(next.light).multiplyScalar(next.lightGain);
        ring.color.copy(ringColor);
    };
    paint(finish);

    return {
        materials: [panel, bevel, ring, inset, light],
        paint,
        flash: (amount) => {
            ring.color.copy(ringColor).lerp(hotRed.copy(red).multiplyScalar(current.ringGain), amount);
            panel.emissive.copy(red).multiplyScalar(amount * 0.45);
            inset.emissive.copy(red).multiplyScalar(amount * 0.8);
        },
    };
}
