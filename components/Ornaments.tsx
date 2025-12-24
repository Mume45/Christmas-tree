import React, { useLayoutEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getRandomSpherePoint, getTreePoint } from '../utils/math';

interface OrnamentsProps {
  progress: number;
  type: 'sphere' | 'box';
  count: number;
  colors: string[];
  scaleRange: [number, number];
}

export const Ornaments: React.FC<OrnamentsProps> = ({ progress, type, count, colors, scaleRange }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate data once
  const data = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      // Chaos Pos
      const chaos = getRandomSpherePoint(12);
      
      // Target Pos - Use tree point logic
      const yRatio = Math.random(); 
      // maxRadius reduced slightly to 4.8 to sit deeper inside foliage
      const target = getTreePoint(14, 4.8, yRatio, 0.6); 
      
      // Scale
      const scale = Math.random() * (scaleRange[1] - scaleRange[0]) + scaleRange[0];
      
      // Color
      const color = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);

      // Random Rotation speed
      const rotSpeed = [
        (Math.random() - 0.5), 
        (Math.random() - 0.5), 
        (Math.random() - 0.5)
      ];

      return {
        chaos: new THREE.Vector3(...chaos),
        target: new THREE.Vector3(...target),
        scale,
        color,
        rotSpeed,
        initialRotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]
      };
    });
  }, [count, colors, scaleRange]);

  useLayoutEffect(() => {
    if (meshRef.current) {
      data.forEach((d, i) => {
        meshRef.current!.setColorAt(i, d.color);
      });
      meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [data]);

  useFrame((state) => {
    if (!meshRef.current) return;

    data.forEach((d, i) => {
      const t = progress; 
      
      // Interpolate Position
      dummy.position.lerpVectors(d.chaos, d.target, t);

      // Animation: Float ONLY in Chaos. Stable in Formed.
      // We clamp movementFactor to strictly 0 when t is near 1
      const movementFactor = Math.max(0, 1 - t * 1.2); 

      // Float position in Chaos
      if (movementFactor > 0.01) {
         dummy.position.y += Math.sin(state.clock.elapsedTime + i) * 0.02 * movementFactor;
      }

      // Rotation Logic (Fixed to stop when formed)
      // Instead of accumulating rotation (+=), we set rotation based on initial + sine wave.
      // This ensures that when movementFactor becomes 0, it settles exactly at initialRotation
      // and doesn't "rewind" or spin chaotically.
      dummy.rotation.x = d.initialRotation[0] + Math.sin(state.clock.elapsedTime * 2.0 + i) * d.rotSpeed[0] * movementFactor * 3.0;
      dummy.rotation.y = d.initialRotation[1] + Math.cos(state.clock.elapsedTime * 2.0 + i) * d.rotSpeed[1] * movementFactor * 3.0;
      dummy.rotation.z = d.initialRotation[2] + Math.sin(state.clock.elapsedTime * 2.5 + i) * d.rotSpeed[2] * movementFactor * 3.0;

      // Scale Logic: Smaller in chaos, full size when formed
      const s = d.scale * (0.5 + 0.5 * t);
      dummy.scale.setScalar(s);

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const geometry = type === 'sphere' 
    ? new THREE.SphereGeometry(1, 16, 16) 
    : new THREE.BoxGeometry(1, 1, 1);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, count]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color="#ffffff"
        roughness={0.3}
        metalness={0.5}
        envMapIntensity={1.0}
      />
    </instancedMesh>
  );
};