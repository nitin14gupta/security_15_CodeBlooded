"use client";
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

export default function FloatingSpheres() {
    const sphere1Ref = useRef<Mesh>(null);
    const sphere2Ref = useRef<Mesh>(null);
    const sphere3Ref = useRef<Mesh>(null);

    useFrame((state, delta) => {
        if (sphere1Ref.current) {
            sphere1Ref.current.rotation.x += delta * 0.2;
            sphere1Ref.current.rotation.y += delta * 0.4;
            sphere1Ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.3 + 1;
        }
        if (sphere2Ref.current) {
            sphere2Ref.current.rotation.x += delta * 0.3;
            sphere2Ref.current.rotation.z += delta * 0.2;
            sphere2Ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.2 + 1) * 0.4 + 0.5;
        }
        if (sphere3Ref.current) {
            sphere3Ref.current.rotation.y += delta * 0.5;
            sphere3Ref.current.rotation.z += delta * 0.3;
            sphere3Ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.6 + 2) * 0.2 + 1.5;
        }
    });

    return (
        <group>
            <mesh ref={sphere1Ref} position={[-3, 1, -2]}>
                <sphereGeometry args={[0.8, 32, 32]} />
                <meshStandardMaterial
                    color="#EC4899"
                    metalness={0.7}
                    roughness={0.3}
                    emissive="#BE185D"
                    emissiveIntensity={0.3}
                />
            </mesh>

            <mesh ref={sphere2Ref} position={[3, 0.5, -1]}>
                <sphereGeometry args={[0.6, 32, 32]} />
                <meshStandardMaterial
                    color="#06B6D4"
                    metalness={0.8}
                    roughness={0.2}
                    emissive="#0891B2"
                    emissiveIntensity={0.4}
                />
            </mesh>

            <mesh ref={sphere3Ref} position={[0, 1.5, -3]}>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshStandardMaterial
                    color="#10B981"
                    metalness={0.5}
                    roughness={0.5}
                    emissive="#059669"
                    emissiveIntensity={0.2}
                />
            </mesh>
        </group>
    );
}
