"use client";

import { ThemeProvider } from "@/app/components/theme-provider";
import { WalletProvider } from "@/app/contexts/WalletContext";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={true}
    >
      <WalletProvider>
        {children}
      </WalletProvider>
    </ThemeProvider>
  );
}
