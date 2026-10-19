import { PerspectiveCamera, Scene, Vector2, Vector3 } from "three";
import { cameraDistance, FOV, halfHeightAt, LOOK_AT, POLY_PLACEMENTS, whaleRoutes } from "./framing";
import type { Look } from "./looks/look";
import { createPolyActor, type PolyActor } from "./polyhedron-actor";
import { seededRandom } from "./random";
import { createWhaleActor, type WhaleActor } from "./whale-actor";
import type { WhaleAsset } from "./whale-asset";
import { createZapDirector, type Strikable, type ZapDirector } from "./zap-director";

export type SpaceWorld = {
    scene: Scene;
    camera: PerspectiveCamera;
    director: ZapDirector;
    addWhales: (asset: WhaleAsset) => void;
    layout: (aspect: number) => void;
    update: (dt: number, time: number, pointer: Vector2) => void;
    nearestTo: (ndc: Vector2) => Strikable | undefined;
    /** Where each whale sits on screen in NDC, for the lab's screenshot scripts. */
    whaleScreenPositions: () => { x: number; y: number }[];
    dispose: () => void;
};

const PARALLAX = { x: 3.2, y: 2.2, ease: 2.4 };
const ON_SCREEN = 0.86;
const projected = new Vector3();

export function createSpaceWorld(look: Look, scene: Scene, camera: PerspectiveCamera): SpaceWorld {
    const polys: PolyActor[] = POLY_PLACEMENTS.map(createPolyActor);
    const whales: WhaleActor[] = [];
    const actors: Strikable[] = [...polys];
    const base = new Vector3(0, 0, 60);
    let aspect = 1.6;

    polys.forEach((poly) => {
        scene.add(poly.root);
        look.dressPoly(poly);
    });

    const project = (actor: Strikable) => actor.center(projected).project(camera);
    const visible = (actor: Strikable) => {
        const p = project(actor);
        return p.z < 1 && Math.abs(p.x) < ON_SCREEN && Math.abs(p.y) < ON_SCREEN;
    };
    const director = createZapDirector(actors, visible);
    look.dressZap(director.zap);

    function placePolys() {
        polys.forEach((poly) => {
            const halfHeight = halfHeightAt(camera, poly.placement.depth);
            poly.anchor.set(poly.placement.frame.x * halfHeight * aspect, poly.placement.frame.y * halfHeight, poly.placement.depth);
        });
    }

    return {
        scene,
        camera,
        director,
        addWhales: (asset) => {
            const random = seededRandom(7);
            whaleRoutes(aspect).forEach((route) => {
                const whale = createWhaleActor(asset, route, random);
                whales.push(whale);
                actors.push(whale);
                scene.add(whale.root);
                look.dressWhale(whale);
            });
        },
        layout: (nextAspect) => {
            aspect = nextAspect;
            camera.aspect = aspect;
            camera.fov = FOV;
            base.set(0, 0, cameraDistance(aspect));
            camera.position.copy(base);
            camera.lookAt(LOOK_AT);
            camera.updateProjectionMatrix();
            camera.updateMatrixWorld();
            placePolys();
            const routes = whaleRoutes(aspect);
            whales.forEach((whale, i) => Object.assign(whale.route, routes[i]));
        },
        update: (dt, time, pointer) => {
            const ease = 1 - Math.exp(-PARALLAX.ease * dt);
            camera.position.x += (base.x + pointer.x * PARALLAX.x - camera.position.x) * ease;
            camera.position.y += (base.y + pointer.y * PARALLAX.y - camera.position.y) * ease;
            camera.lookAt(LOOK_AT);
            camera.updateMatrixWorld();
            polys.forEach((poly) => poly.update(dt, time));
            whales.forEach((whale) => whale.update(dt, time));
            scene.updateMatrixWorld();
            director.update(dt);
        },
        nearestTo: (ndc) => {
            let best: Strikable | undefined;
            let bestDistance = Infinity;
            actors.forEach((actor) => {
                const p = project(actor);
                const distance = p.z < 1 ? Math.hypot((p.x - ndc.x) * aspect, p.y - ndc.y) : Infinity;
                if (distance < bestDistance) [best, bestDistance] = [actor, distance];
            });
            return best;
        },
        whaleScreenPositions: () =>
            whales.map((whale) => {
                const p = project(whale);
                return { x: p.x, y: p.y };
            }),
        dispose: () => whales.forEach((whale) => whale.dispose()),
    };
}
