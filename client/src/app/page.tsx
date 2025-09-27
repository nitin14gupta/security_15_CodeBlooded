"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Spline from "@splinetool/react-spline";
import { useOnboarding } from "@/context/onboardingContext";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const { isOnboardingComplete } = useOnboarding();

  const features = [
    {
      title: "AI-Powered Security",
      description: "Advanced machine learning algorithms detect and prevent threats in real-time",
      icon: "🛡"
    },
    {
      title: "Real-time Monitoring",
      description: "24/7 surveillance with instant alerts and automated responses",
      icon: "📊"
    },
    {
      title: "Zero Trust Architecture",
      description: "Never trust, always verify - comprehensive security framework",
      icon: "🔐"
    }
  ];

  useEffect(() => {
    setMounted(true);

    // Force Spline to resize to full screen
    const resizeSpline = () => {
      const splineElements = document.querySelectorAll('canvas, iframe');
      splineElements.forEach((element: any) => {
        if (element) {
          element.style.width = '100vw';
          element.style.height = '100vh';
          element.style.position = 'absolute';
          element.style.top = '0';
          element.style.left = '0';
        }
      });
    };

    // Resize immediately and on window resize
    setTimeout(resizeSpline, 100);
    window.addEventListener('resize', resizeSpline);

    return () => window.removeEventListener('resize', resizeSpline);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full h-screen relative overflow-hidden">
      {/* Spline 3D Scene - Full Screen Background */}
      <div
        className="spline-container fixed inset-0 w-screen h-screen"
        style={{
          width: '100vw',
          height: '100vh',
          top: 0,
          left: 0,
          zIndex: 1
        }}
      >
        <Spline
          scene="https://prod.spline.design/1U-DYiRKef3rnKZF/scene.splinecode"
          style={{
            width: '100vw',
            height: '100vh',
            position: 'absolute',
            top: 0,
            left: 0,
            objectFit: 'cover',
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }}
        />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-30 p-6 bg-black/10 backdrop-blur-xl border-b border-white/10">
        <nav className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center shadow-2xl border border-slate-700/50">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="text-3xl font-bold">
              <Link href="/">
                <span className="bg-gradient-to-r from-slate-100 via-white to-slate-200 bg-clip-text text-transparent tracking-tight">
                  CareCompanion
                </span>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-3 text-white border border-white/30 rounded-xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm cursor-pointer font-medium hover:scale-105 hover:shadow-lg"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Login</span>
              </div>
            </button>
            <button
              onClick={() => {
                // Check if onboarding is complete, if not go to onboarding first
                if (isOnboardingComplete()) {
                  router.push("/register");
                } else {
                  router.push("/onboarding");
                }
              }}
              className="px-8 py-3.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl hover:from-slate-700 hover:to-slate-800 transition-all duration-300 shadow-2xl cursor-pointer font-semibold hover:scale-[1.02] hover:shadow-3xl border border-slate-700/50 hover:border-slate-600/50 backdrop-blur-sm"
            >
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <span className="text-sm tracking-wide">{isOnboardingComplete() ? 'Register' : 'Start Your Journey'}</span>
              </div>
            </button>
          </div>
        </nav>
      </header>
      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-30 p-6 bg-black/20 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-300 mb-4 md:mb-0">
              © 2024 SecurityApp. All rights reserved.
            </div>
            <div className="flex space-x-8 text-gray-300">
              <button onClick={() => router.push('/privacy')} className="hover:text-white transition-colors font-medium hover:scale-105 cursor-pointer">Privacy</button>
              <button onClick={() => router.push('/terms')} className="hover:text-white transition-colors font-medium hover:scale-105 cursor-pointer">Terms</button>
              <button onClick={() => router.push('/support')} className="hover:text-white transition-colors font-medium hover:scale-105 cursor-pointer">Support</button>
              <button onClick={() => router.push('/docs')} className="hover:text-white transition-colors font-medium hover:scale-105 cursor-pointer">Documentation</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}