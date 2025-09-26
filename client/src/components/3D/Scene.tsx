"use client";
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import AnimatedCube from './AnimatedCube';
import FloatingSpheres from './FloatingSpheres';

export default function Scene() {
    return (
        <Canvas
            camera={{ position: [0, 0, 8], fov: 75 }}
            style={{ width: '100%', height: '100%' }}
        >
            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8B5CF6" />
            <directionalLight position={[0, 10, 5]} intensity={0.8} />

            {/* Environment */}
            <Environment preset="night" />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {/* 3D Objects */}
            <AnimatedCube />
            <FloatingSpheres />

            {/* Controls */}
            <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.5}
                maxPolarAngle={Math.PI / 2}
                minPolarAngle={Math.PI / 2}
            />
        </Canvas>
    );
}
