"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Spline from "@splinetool/react-spline";
import { useOnboarding } from "@/context/onboardingContext";
export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { isOnboardingComplete } = useOnboarding();

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
          scene="https://prod.spline.design/R60TBNU4E4B9D-ND/scene.splinecode"
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
      <header className="absolute top-0 left-0 right-0 z-20 p-6 bg-black/20 backdrop-blur-sm">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-heading text-white">
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              SecurityApp
            </span>
          </div>
          <div className="space-x-4">
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2 text-white border border-white/30 rounded-lg hover:bg-white/10 transition-all duration-300 backdrop-blur-sm cursor-pointer font-accent"
            >
              Login
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
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg cursor-pointer font-accent"
            >
              {isOnboardingComplete() ? 'Register' : '✨ Start Your Journey'}
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="text-center max-w-4xl mx-auto px-6">
          <h1 className="text-display text-white mb-6">
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              SecurityApp
            </span>
          </h1>
          <p className="text-hero text-gray-300 mb-8">
            Advanced security solutions powered by cutting-edge AI technology
          </p>

          {/* Onboarding Flow Explanation */}
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-8">
            <h2 className="text-2xl font-heading text-white mb-4">🎯 Personalized Experience</h2>
            <p className="text-body text-gray-300 mb-6">
              Before you register, let's get to know you better! Answer a few fun questions to personalize your security experience.
            </p>

            <div className="grid md:grid-cols-3 gap-4 text-left">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl mb-2">☕</div>
                <h3 className="font-heading text-white mb-1">Morning Vibes</h3>
                <p className="text-caption">Tell us how you start your day</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl mb-2">🎨</div>
                <h3 className="font-heading text-white mb-1">Color Your Day</h3>
                <p className="text-caption">What color represents you today?</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl mb-2">🎬</div>
                <h3 className="font-heading text-white mb-1">Life Genre</h3>
                <p className="text-caption">Comedy, drama, or adventure?</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                if (isOnboardingComplete()) {
                  router.push("/register");
                } else {
                  router.push("/onboarding");
                }
              }}
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-lg font-accent rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              {isOnboardingComplete() ? '🚀 Complete Registration' : '✨ Start Your Journey'}
            </button>

            <button
              onClick={() => router.push("/login")}
              className="px-8 py-4 text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm text-lg font-accent"
            >
              Already have an account? Login
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-black backdrop-blur-sm border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-caption text-gray-300 mb-4 md:mb-0">
              © 2024 SecurityApp. All rights reserved.
            </div>
            <div className="flex space-x-6 text-caption text-gray-300">
              <a href="#" className="hover:text-white transition-colors font-accent">Privacy</a>
              <a href="#" className="hover:text-white transition-colors font-accent">Terms</a>
              <a href="#" className="hover:text-white transition-colors font-accent">Support</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}