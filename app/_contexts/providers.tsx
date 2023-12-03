"use client"

import { ThemeProvider } from "./theme-provider"

interface ProvidersProps {
    children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <ThemeProvider>
            {children}
        </ThemeProvider>
    );
}

export default Providers;