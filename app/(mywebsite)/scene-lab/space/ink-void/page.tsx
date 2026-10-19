import { SceneStage } from "../../components/scene-stage";
import { SpaceCanvas } from "../components/space-canvas";

export default function SpacePreview() {
    return (
        <SceneStage scene="space" direction="ink-void">
            <SpaceCanvas look="ink-void" />
        </SceneStage>
    );
}
