import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/shared/lib/AuthContext";
import ThemeInitializer from "@/shared/components/ThemeInitializer";

export const metadata: Metadata = {
  title: "AURYN — Premium Hospitality Intelligence Platform",
  description: "An AI-powered restaurant operating system orchestrating the complete luxury dining lifecycle.",
};

export default function RootLayout({
  children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-neutral-200">
        <AuthProvider>
          <ThemeInitializer />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
