import React, { useLayoutEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getRandomSpherePoint, getTreePoint } from '../utils/math';
import { TreeState } from '../types';

interface PhotoCloudProps {
  treeState: TreeState;
  count?: number;
}

export const PhotoCloud: React.FC<PhotoCloudProps> = ({ treeState, count = 20 }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const progressRef = useRef(0);

  const data = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      const chaos = getRandomSpherePoint(10);
      
      // Place randomly on the tree surface
      const yRatio = Math.random();
      const targetArr = getTreePoint(14, 5.0, yRatio, 0.2);
      const target = new THREE.Vector3(...targetArr);
      
      // Determine orientation: Look outwards from center
      const lookAtPos = new THREE.Vector3(target.x * 2, target.y, target.z * 2);

      return {
        chaos: new THREE.Vector3(...chaos),
        target: target,
        lookAt: lookAtPos,
        scale: 0.8 + Math.random() * 0.4,
        color: new THREE.Color("#FFF8E7") // Off-white polaroid paper
      };
    });
  }, [count]);

  useLayoutEffect(() => {
    if (meshRef.current) {
        data.forEach((d, i) => {
            meshRef.current!.setColorAt(i, d.color);
        });
        meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [data]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const isFormed = treeState === TreeState.FORMED;
    const targetForm = isFormed ? 1 : 0;
    progressRef.current = THREE.MathUtils.damp(progressRef.current, targetForm, 2, delta);
    
    const cameraPos = state.camera.position;

    data.forEach((d, i) => {
      const t = progressRef.current; 

      let currentPos = new THREE.Vector3().lerpVectors(d.chaos, d.target, t);

      // Float effect in Chaos
      if (t < 0.5) {
        currentPos.y += Math.sin(state.clock.elapsedTime + i) * 0.005;
        currentPos.x += Math.cos(state.clock.elapsedTime * 0.5 + i) * 0.005;
      }

      dummy.position.copy(currentPos);
      
      // Orientation logic
      if (t > 0.8) {
        // When formed, align roughly with tree surface (outwards)
        dummy.lookAt(0, currentPos.y, 0); 
        dummy.rotateY(Math.PI); // Face out
      } else {
        // When chaotic, face camera
        dummy.lookAt(cameraPos);
      }

      // Add a slight swing animation like it's hanging
      if (t > 0.8) {
          dummy.rotation.z += Math.sin(state.clock.elapsedTime * 2 + i) * 0.05;
      }

      dummy.scale.setScalar(d.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      castShadow
    >
      <boxGeometry args={[1.0, 1.2, 0.02]} /> {/* Simple Card Shape */}
      <meshStandardMaterial
        color="#ffffff"
        roughness={0.8}
        metalness={0.0}
        emissive="#fff"
        emissiveIntensity={0.1}
      />
    </instancedMesh>
  );
};