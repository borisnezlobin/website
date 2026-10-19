import { DirectionalLight, HemisphereLight, PMREMGenerator, type Scene, type WebGLRenderer } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type StudioLevels = { environment: number; key: number; rim: number; fill: number };

/**
 * A prefiltered room for the stars' metal to reflect, a warm key from the upper left, a dim rim from
 * behind, and a low fill so the shadow side never goes dead.
 */
export function createStudio(renderer: WebGLRenderer, scene: Scene) {
    const pmrem = new PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04).texture;
    scene.environment = environment;
    const key = new DirectionalLight(0xfff0e0, 1);
    key.position.set(-40, 55, 60);
    const rim = new DirectionalLight(0xffd8c8, 1);
    rim.position.set(50, -20, -60);
    const fill = new HemisphereLight(0xfff6ee, 0x2a221c, 1);
    scene.add(key, rim, fill);

    return {
        setLevels: (levels: StudioLevels) => {
            scene.environmentIntensity = levels.environment;
            key.intensity = levels.key;
            rim.intensity = levels.rim;
            fill.intensity = levels.fill;
        },
        dispose: () => {
            environment.dispose();
            room.dispose();
            pmrem.dispose();
        },
    };
}
