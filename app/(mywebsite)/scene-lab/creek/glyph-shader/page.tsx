import { SceneStage } from "../../components/scene-stage";
import { GlyphShaderScene } from "../components/glyph-shader-scene";

export default function GlyphShaderPage() {
    return (
        <SceneStage scene="creek" direction="glyph-shader">
            <GlyphShaderScene />
        </SceneStage>
    );
}
