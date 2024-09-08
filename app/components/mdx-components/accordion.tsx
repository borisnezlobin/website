const Accordion = ({ children, title = "" }: { children: React.ReactNode, title?: string }) => {
    return (
        <details className="accordion">
            <summary className="accordion-title">
                {title}
            </summary>
            {children}
        </details>
    );
}

export default Accordion;