"use client";
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Scene from '@/components/3D/Scene';
import Spline from '@splinetool/react-spline';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  // If authenticated, redirect to main page
  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.href = '/main';
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Spline
        scene="https://prod.spline.design/R60TBNU4E4B9D-ND/scene.splinecode" 
      />
      </div>
    </div>
  );
}