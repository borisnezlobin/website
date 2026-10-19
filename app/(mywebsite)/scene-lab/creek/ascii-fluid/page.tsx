import { SceneStage } from "../../components/scene-stage";
import { AsciiFluidScene } from "../components/ascii-fluid-scene";

export default function AsciiFluidPage() {
    return (
        <SceneStage scene="creek" direction="ascii-fluid">
            <AsciiFluidScene />
        </SceneStage>
    );
}
