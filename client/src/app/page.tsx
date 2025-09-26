"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Spline from "@splinetool/react-spline";
import { useOnboarding } from "@/context/onboardingContext";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const { isOnboardingComplete } = useOnboarding();

  const features = [
    {
      title: "AI-Powered Security",
      description: "Advanced machine learning algorithms detect and prevent threats in real-time",
      icon: "🛡️"
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
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-5">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-60 h-60 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-30 p-6 bg-black/10 backdrop-blur-xl border-b border-white/10">
        <nav className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-white">
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
                SecurityApp
              </span>
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
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-xl cursor-pointer font-medium hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/30"
            >
              <div className="flex items-center space-x-2">
                <span>✨</span>
                <span>{isOnboardingComplete() ? 'Register' : 'Start Your Journey'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="absolute inset-0 z-20 flex items-center justify-center">
        <div className="text-center max-w-6xl mx-auto px-6">
          {/* Main Hero Content */}
          <div className="mb-12">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight">
              <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Next-Gen
              </span>
              <br />
              <br />
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
                Security Platform
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Protect your digital assets with AI-powered security solutions. 
              Advanced threat detection, real-time monitoring, and zero-trust architecture.
            </p>
          </div>

          {/* Feature Carousel */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 mb-12 max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">{features[currentFeature].icon}</span>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">
              {features[currentFeature].title}
            </h3>
            <p className="text-lg text-gray-300 mb-6">
              {features[currentFeature].description}
            </p>
            <div className="flex justify-center space-x-2">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentFeature 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 scale-125' 
                      : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">99.9%</div>
              <div className="text-gray-300">Uptime Guarantee</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-gray-300">Security Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">1000+</div>
              <div className="text-gray-300">Protected Assets</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-30 p-6 bg-black/20 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-300 mb-4 md:mb-0">
              © 2024 SecurityApp. All rights reserved.
            </div>
            <div className="flex space-x-8 text-gray-300">
              <a href="#" className="hover:text-white transition-colors font-medium hover:scale-105">Privacy</a>
              <a href="#" className="hover:text-white transition-colors font-medium hover:scale-105">Terms</a>
              <a href="#" className="hover:text-white transition-colors font-medium hover:scale-105">Support</a>
              <a href="#" className="hover:text-white transition-colors font-medium hover:scale-105">Documentation</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Enhanced Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
        {[...Array(10)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}