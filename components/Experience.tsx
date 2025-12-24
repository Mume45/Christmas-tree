import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, TiltShift } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Foliage } from './Foliage';
import { TreeState, HandData } from '../types';

interface ExperienceProps {
  treeState: TreeState;
  handData: HandData | null;
}

const SceneContent: React.FC<{ treeState: TreeState; handData: HandData | null }> = ({ treeState, handData }) => {
  const progress = useRef(0);
  const groupRef = useRef<THREE.Group>(null);
  
  // Physics state for rotation
  const angularVelocity = useRef(0);
  
  useFrame((state, delta) => {
    const target = treeState === TreeState.FORMED ? 1 : 0;
    progress.current = THREE.MathUtils.damp(progress.current, target, 1.5, delta);

    // Rotation Logic
    if (groupRef.current) {
        // Friction
        angularVelocity.current *= 0.95;

        // User Input (Swipe)
        if (handData && handData.isPresent && handData.gesture === 'OPEN_PALM') {
             // Velocity X: Negative (Left) / Positive (Right)
             const sensitivity = 1.2; 
             
             // Inverted logic: 
             // Left Wave -> Clockwise Rotation (Negative Y)
             // Right Wave -> Counter-Clockwise Rotation (Positive Y)
             angularVelocity.current -= handData.velocityX * sensitivity * delta;
             
             // Simple tilt based on hand Y
             const targetRotX = (handData.y - 0.5) * 0.3;
             groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.1);
        } else if (treeState === TreeState.FORMED) {
            // Re-center tilt when formed
             groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.05);
        }

        // Apply velocity
        groupRef.current.rotation.y += angularVelocity.current;
        
        // Idle gentle rotation when formed and not interacting
        if (treeState === TreeState.FORMED && Math.abs(angularVelocity.current) < 0.001) {
             groupRef.current.rotation.y += 0.001;
        }
    }
  });

  return (
    // Raised Y from -5 to -2 to center the tree vertically in the view
    <group ref={groupRef} position={[0, -2, 0]}> 
        
        {/* The Pine Tree Foliage - Now the main attraction */}
        <Foliage progress={progress.current} />
        
        {/* Star at the top */}
        <Star progress={progress.current} />
    </group>
  );
};

const Star: React.FC<{ progress: number }> = ({ progress }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
        ref.current.rotation.y += 0.01;
        // Subtle floating
        ref.current.position.y = 7.0 + Math.sin(state.clock.elapsedTime * 2.0) * 0.1;
        const s = THREE.MathUtils.smoothstep(progress, 0.8, 1.0);
        // Reduced scale from 1.5 to 0.6 for better proportion
        ref.current.scale.setScalar(s * 0.6); 
    }
  });

  return (
    <group ref={ref}>
        <pointLight intensity={5} color="#ffd700" distance={10} decay={2} />
        <mesh>
            <octahedronGeometry args={[0.8, 0]} />
            <meshStandardMaterial 
                color="#ffd700" 
                emissive="#ffd700" 
                emissiveIntensity={4} 
                toneMapped={false} 
            />
        </mesh>
        {/* Star glow halo */}
        <mesh scale={[1.2, 1.2, 1.2]}>
             <dodecahedronGeometry args={[0.8, 0]} />
             <meshBasicMaterial color="#ffaa00" transparent opacity={0.3} />
        </mesh>
    </group>
  );
};

export const Experience: React.FC<ExperienceProps> = ({ treeState, handData }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 24], fov: 45 }} 
      gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
      shadows
    >
      <color attach="background" args={["#020405"]} />
      
      {/* Cinematic Lighting */}
      <ambientLight intensity={0.2} color="#001133" />
      <pointLight position={[10, 5, 10]} intensity={20} color="#ffaa00" decay={2} />
      <pointLight position={[-10, 5, 10]} intensity={20} color="#00ffaa" decay={2} />
      <spotLight position={[0, 20, 0]} angle={0.6} penumbra={1} intensity={40} color="#fff" castShadow />
      
      <Environment preset="night" />
      
      <SceneContent treeState={treeState} handData={handData} />

      {/* Enhanced Snow/Magic particles */}
      <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
        <Sparkles count={400} scale={20} size={4} speed={0.4} opacity={0.5} color="#ffd700" />
        <Sparkles count={200} scale={15} size={2} speed={0.2} opacity={0.8} color="#00ffcc" />
      </Float>

      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 3} 
        maxPolarAngle={Math.PI / 1.6}
        minDistance={15}
        maxDistance={40}
        autoRotate={false}
      />

      <EffectComposer disableNormalPass>
        {/* Intense Bloom for the glowing particle look */}
        <Bloom luminanceThreshold={0.4} mipmapBlur intensity={1.5} radius={0.6} />
        <Vignette eskil={false} offset={0.1} darkness={1.2} />
        <TiltShift blur={0.03} /> 
      </EffectComposer>
    </Canvas>
  );
};