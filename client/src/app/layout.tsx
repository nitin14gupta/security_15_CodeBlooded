import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Poppins, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { OnboardingProvider } from "@/context/onboardingContext";

// Root layout component

// Primary font for body text - Inter (clean, modern, highly readable)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Secondary font for headings - Space Grotesk (geometric, modern, tech-focused)
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

// Accent font for special elements - Poppins (friendly, approachable)
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Monospace font for code - JetBrains Mono (developer-friendly)
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SecurityApp - Advanced Security Solutions",
  description: "Advanced security solutions powered by cutting-edge technology", // TODO: update this description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${poppins.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {/* Wrap everything in context providers */}
        <AuthProvider>
          <OnboardingProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </OnboardingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
