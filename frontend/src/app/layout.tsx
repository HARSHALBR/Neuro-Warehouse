import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/hooks/useTheme";

export const metadata: Metadata = {
  title: "NeuroWarehouse — Autonomous Digital Twin Command Center",
  description: "BREAK IT. WATCH IT HEAL. SEE WHY. AI-Powered Autonomous Warehouse Recovery inside a Digital Twin.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
