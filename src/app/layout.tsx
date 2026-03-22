import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { LangProvider } from "@/contexts/LangContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "Atoms – Build Your Ideas with Agents",
  description:
    "AI agent-powered app generator. Describe what you want to build, and Atoms builds it for you in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <head>
        {/* Inline script to apply saved theme before first paint, avoiding flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var m=localStorage.getItem('theme-mode');var dark=(m==='dark')||(m!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark)document.documentElement.classList.add('dark');})()`,
          }}
        />
      </head>
      <body style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <ThemeProvider>
          <LangProvider>
            {children}
            <Toaster position="bottom-right" richColors />
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
