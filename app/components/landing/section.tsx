import React from "react";
const Section = ({
    id, title, description, children, className = ""
}: { id: string, title: string, description: string, children: any, className?: string }) => {
    return (
        <div className={`w-full flex flex-col justify-center items-left mt-4 print:m-0 ${className}`}>
            <h2 className="text-2xl sm:text-3xl mt-12 print:mt-2 font-bold text-left dark:text-dark transition-colors duration-300 emph">
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