import { SceneStage } from "../../components/scene-stage";
import { CanopyScene } from "../components/canopy-scene";

export default function InkWillowPage() {
    return (
        <SceneStage scene="canopy" direction="ink-willow">
            <CanopyScene direction="ink-willow" />
        </SceneStage>
    );
}
