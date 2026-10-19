import { SceneStage } from "../../components/scene-stage";
import { CanopyScene } from "../components/canopy-scene";

export default function WeepingCherryPage() {
    return (
        <SceneStage scene="canopy" direction="weeping-cherry">
            <CanopyScene direction="weeping-cherry" />
        </SceneStage>
    );
}
