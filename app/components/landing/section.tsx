const Section = ({
    title, description, children
}: { title: string, description: string, children: any }) => {
    return (
        <div className="w-full flex flex-col justify-center items-left mt-4">
            <h2 className="text-xl sm:text-4xl mt-12 font-bold text-left dark:text-dark">
                {title}
            </h2>
            <p className="mt-4">
                {description}
            </p>
            {children}
        </div>
    )
}

export { Section };