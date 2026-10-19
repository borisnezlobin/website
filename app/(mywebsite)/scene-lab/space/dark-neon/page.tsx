import { SceneStage } from "../../components/scene-stage";
import { SpaceCanvas } from "../components/space-canvas";

export default function SpacePreview() {
    return (
        <SceneStage scene="space" direction="dark-neon">
            <SpaceCanvas look="dark-neon" />
        </SceneStage>
    );
}
