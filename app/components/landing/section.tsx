// todo: find some animation/moving thingy other than
// [transition:all_300ms,opacity_2s,transform_2s] ${isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-105"}

const Section = ({
    id, title, description, children
}: { id: string, title: string, description: string, children: any }) => {

    return (
        <div className={`w-full flex flex-col justify-center items-left mt-4`}>
            <h2 className="text-2xl sm:text-4xl mt-12 font-bold text-left dark:text-dark transition-colors duration-300">
                <span className="text-primary dark:text-primary-dark">{id}</span> {title}
            </h2>
            <p className="mt-4 transition-colors duration-300">
                {description}
            </p>
            {children}
        </div>
    )
}

export { Section };