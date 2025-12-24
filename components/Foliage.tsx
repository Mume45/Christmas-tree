import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { generateFoliageData } from '../utils/math';

// Custom Shader for the needles
const FoliageMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uProgress: { value: 0 }
  },
  vertexShader: `
    uniform float uProgress;
    uniform float uTime;
    attribute vec3 aChaosPos;
    attribute vec3 aTargetPos;
    attribute float aSize;
    attribute vec3 aColor;
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vColor = aColor;
      
      // Mix positions based on progress
      vec3 pos = mix(aChaosPos, aTargetPos, uProgress);
      
      // Gentle swaying wind
      float wind = sin(uTime * 1.0 + pos.y * 0.8) * 0.1 * uProgress;
      pos.x += wind;
      pos.z += cos(uTime * 0.7 + pos.x) * 0.05 * uProgress;

      // Chaos float
      if(uProgress < 0.5) {
        pos.y += sin(uTime + pos.x) * 0.1;
      }

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation
      gl_PointSize = (15.0 * aSize + 5.0) * (1.0 / -mvPosition.z);
      
      // Transparency control
      vAlpha = 0.8 + 0.2 * uProgress;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      // Soft blurred circle
      vec2 coord = gl_PointCoord - vec2(0.5);
      float r = length(coord);
      if (r > 0.5) discard;
      
      // Soft edge
      float alpha = 1.0 - smoothstep(0.2, 0.5, r);
      
      // Boost color for Bloom (HDR)
      // Multiplying by 2.0 pushes values > 1.0 for the bloom pass
      vec3 finalColor = vColor * 2.5; 

      gl_FragColor = vec4(finalColor, alpha * vAlpha);
    }
  `
};

interface FoliageProps {
  progress: number; // 0 to 1
}

export const Foliage: React.FC<FoliageProps> = ({ progress }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const count = 50000; // Increased density since we removed ornaments

  // Memoize geometry data generation
  const { chaosPositions, targetPositions, colors, sizes } = useMemo(() => generateFoliageData(count), []);

  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
        shaderRef.current.uniforms.uProgress.value,
        progress,
        0.1 
      );
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={targetPositions} 
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aChaosPos"
          count={count}
          array={chaosPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTargetPos"
          count={count}
          array={targetPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aColor"
          count={count}
          array={colors}
          itemSize={3}
        />
         <bufferAttribute
          attach="attributes-aSize"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        attach="material"
        args={[FoliageMaterial]}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending} // Additive blending makes it glow more
      />
    </points>
  );
};