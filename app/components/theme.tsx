import { ThemeProvider } from "next-themes"

export const Theme = ({ children }: { children: React.ReactNode }) => {
    return (
        <ThemeProvider attribute="class">
            <div className="theme-light screen:dark:theme-dark">
                {children}
            </div>
        </ThemeProvider>
    )
}