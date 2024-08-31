const Section = ({
    id, title, description, children
}: { id: string, title: string, description: string, children: any }) => {
    return (
        <div className={`w-full flex flex-col justify-center items-left mt-4`}>
            <h2 className="text-2xl sm:text-4xl mt-12 font-bold text-left dark:text-dark transition-colors duration-300">
                <span className="text-primary dark:text-primary-dark">
                    {id}
                </span>
                {" "}{title}
            </h2>
            <p className="mt-4 transition-colors duration-300">
                {description}
            </p>
            {children}
        </div>
    )
}

export { Section };