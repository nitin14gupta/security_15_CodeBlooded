"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Spline from "@splinetool/react-spline";
export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

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
          <div className="text-2xl font-bold text-white">
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              SecurityApp
            </span>
          </div>
          <div className="space-x-4">
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2 text-white border border-white/30 rounded-lg hover:bg-white/10 transition-all duration-300 backdrop-blur-sm cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={() => router.push("/register")}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg cursor-pointer"
            >
              Register
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-black backdrop-blur-sm border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-300 mb-4 md:mb-0">
              © 2024 SecurityApp. All rights reserved.
            </div>
            <div className="flex space-x-6 text-gray-300">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
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