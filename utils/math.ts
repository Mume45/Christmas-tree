import * as THREE from 'three';

// Helper to generate a random point inside a sphere
export const getRandomSpherePoint = (radius: number): [number, number, number] => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return [
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  ];
};

// New Algorithm: Layered Pine Tree
export const getTreePoint = (
  height: number, 
  maxRadius: number, 
  yRatio: number, // 0 to 1 (0 is bottom, 1 is top)
  jitter: number = 0
): [number, number, number] => {
  
  // Define distinct "boughs" or layers
  const levels = 14; // More layers for density
  const levelIndex = Math.floor(yRatio * levels);
  
  const levelYNormalized = levelIndex / levels; 
  const y = (levelYNormalized - 0.5) * height;

  const levelMaxRadius = maxRadius * (1 - levelYNormalized);

  const angle = Math.random() * Math.PI * 2;
  const r = Math.pow(Math.random(), 0.7) * levelMaxRadius;
  
  const branchThickness = height / levels * 0.9;
  const yOffset = (Math.random() - 0.5) * branchThickness;
  const droop = r * 0.15; 

  const x = r * Math.cos(angle);
  const z = r * Math.sin(angle);

  return [
    x + (Math.random() - 0.5) * jitter,
    y + yOffset - droop * 0.5 + (Math.random() - 0.5) * jitter,
    z + (Math.random() - 0.5) * jitter
  ];
};

export const generateFoliageData = (count: number) => {
  const chaosPositions = new Float32Array(count * 3);
  const targetPositions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  // Luxury Palette
  const deepEmerald = new THREE.Color("#004d25");
  const brightEmerald = new THREE.Color("#00ff66");
  const gold = new THREE.Color("#ffaa00");
  const ice = new THREE.Color("#ccffff");

  const tempColor = new THREE.Color();

  for (let i = 0; i < count; i++) {
    // Chaos: Large explosion
    const [cx, cy, cz] = getRandomSpherePoint(20);
    chaosPositions[i * 3] = cx;
    chaosPositions[i * 3 + 1] = cy;
    chaosPositions[i * 3 + 2] = cz;

    // Target: Layered Pine Tree
    const yRatio = Math.random(); 
    const [tx, ty, tz] = getTreePoint(14, 5.5, yRatio, 0.4);
    targetPositions[i * 3] = tx;
    targetPositions[i * 3 + 1] = ty;
    targetPositions[i * 3 + 2] = tz;

    // Color Logic: Luxury Glow
    const rand = Math.random();
    
    // Tips of the branches get lighter/gold colors
    const dist = Math.sqrt(tx*tx + tz*tz);
    const maxDistAtHeight = 5.5 * (1 - yRatio);
    const isTip = dist > maxDistAtHeight * 0.8;

    if (isTip) {
        if (Math.random() > 0.7) {
            tempColor.copy(gold); // Gold tips
        } else {
            tempColor.copy(ice); // Icy tips
        }
    } else {
        // Inner volume is emerald mixture
        if (rand > 0.8) {
            tempColor.copy(brightEmerald); // Neon highlights
        } else {
            tempColor.copy(deepEmerald); // Deep base
        }
    }

    colors[i * 3] = tempColor.r;
    colors[i * 3 + 1] = tempColor.g;
    colors[i * 3 + 2] = tempColor.b;

    // Size: Varied for natural look
    sizes[i] = Math.random() * 1.5;
  }

  return { chaosPositions, targetPositions, colors, sizes };
};