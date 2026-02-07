import { Children, cloneElement, isValidElement, ReactElement, ReactNode } from 'react';

interface HorizontalScrollProps {
    children: ReactNode;
    className?: string;
}

const HorizontalScroll = ({ children, className = "" }: HorizontalScrollProps) => {
    // Ensure children is an array of ReactElement
    const elements = Children.toArray(children).filter(
        (child): child is ReactElement => isValidElement(child)
    );

    return (
        <>
            <div className={`print:hidden w-full overflow-hidden motion-reduce:overflow-auto print:overflow-auto relative scroller ${className}`}>
                <div className="h-max py-4 flex flex-row print:flex-col motion-reduce:flex-wrap print:flex-wrap justify-start gap-4 items-center scroller-inner">
                    {children}
                    {elements.map((e, i) => {
                        return cloneElement(e, { key: i });
                    })}
                </div>
            </div>
            <div className="hidden flex-col print:flex">
                {children}
            </div>
        </>
    );
}

export default HorizontalScroll;