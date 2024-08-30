import { ThemeProvider } from "next-themes";

interface ProvidersProps {
    children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <ThemeProvider attribute="class">
            {children}
        </ThemeProvider>
    );
}

export default Providers;