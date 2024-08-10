type HorizontalScrollProps = {
    children?: React.ReactNode[];
}

export const HorizontalScroll = ({ children }: HorizontalScrollProps) => {

    return (
        <div className="w-full overflow-hidden motion-reduce:overflow-auto relative scroller">
            <div className="h-max py-4 flex flex-row motion-reduce:flex-wrap justify-start gap-4 items-center scroller-inner">
                {children}
                {children}
            </div>
        </div>
    );
}

export default HorizontalScroll;