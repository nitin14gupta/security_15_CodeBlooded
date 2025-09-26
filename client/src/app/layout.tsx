import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { OnboardingProvider } from "@/context/onboardingContext";

// Root layout component

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
