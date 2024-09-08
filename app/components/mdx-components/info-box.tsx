import { Info, PenNib, Question, WarningOctagon } from "@phosphor-icons/react/dist/ssr";

const InfoBox = ({ children, type }: { children: React.ReactNode, type: "info" | "definition" | "question" | "warning" }) => {
    let icon = <Info size="2rem" color="#0f539c" />;

    if (type === "question") {
        icon = <Question size="2rem" color="#136313" />;
    } else if (type === "warning") {
        icon = <WarningOctagon size="2rem" color="#87050a" />;
    } else if (type === "definition") {
        icon = <PenNib size="2rem" color="#999" />;
    }

    return (
        <div
            className={`info-box relative`}
            data-info-type={type}
        >
            <p className="relative md:absolute md:right-4 md:top-4 print:hidden pb-0">{icon}</p>
            <div className="info-box-content">
                {children}
            </div>
        </div>
    );
}

export default InfoBox;