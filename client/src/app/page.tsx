"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* 3D Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full opacity-25 animate-pulse"></div>
        <div className="absolute bottom-40 right-1/3 w-28 h-28 bg-gradient-to-r from-green-500 to-teal-500 rounded-full opacity-35 animate-bounce"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-white">
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              SecurityApp
            </span>
          </div>
          <div className="space-x-4">
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2 text-white border border-white/30 rounded-lg hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
            >
              Login
            </button>
            <button
              onClick={() => router.push("/register")}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
            >
              Register
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6">
        <div className="text-center max-w-4xl">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Secure
            </span>
            <br />
            <span className="text-white">Your Future</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Advanced security solutions powered by cutting-edge technology.
            Protect what matters most with our comprehensive security platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => router.push("/register")}
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-lg font-semibold rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-2xl hover:shadow-pink-500/25 transform hover:scale-105"
            >
              Get Started
            </button>
            <button
              onClick={() => router.push("/login")}
              className="px-8 py-4 text-white text-lg font-semibold border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
            >
              Sign In
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 border-t border-white/10">
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
      <div className="absolute inset-0 pointer-events-none">
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
