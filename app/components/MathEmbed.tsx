import Latex from "react-latex-next";

const MathEmbed = ({ children, display }: { children: string; display: boolean }) => {
    console.log("Rendering MathEmbed", children, display);
    return (
        <Latex strict>
            ${display ? "$" : ""}{children}${display ? "$" : ""}
        </Latex>
    );
};

export default MathEmbed;