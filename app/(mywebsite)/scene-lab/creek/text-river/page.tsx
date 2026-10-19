import { SceneStage } from "../../components/scene-stage";
import { TextRiverScene } from "../components/text-river-scene";

export default function TextRiverPage() {
    return (
        <SceneStage scene="creek" direction="text-river">
            <TextRiverScene />
        </SceneStage>
    );
}
