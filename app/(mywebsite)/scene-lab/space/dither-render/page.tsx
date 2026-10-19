import { SceneStage } from "../../components/scene-stage";
import { SpaceCanvas } from "../components/space-canvas";

export default function SpacePreview() {
    return (
        <SceneStage scene="space" direction="dither-render">
            <SpaceCanvas look="dither-render" />
        </SceneStage>
    );
}
