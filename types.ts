export enum TreeState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED'
}

export type GestureType = 'NONE' | 'OPEN_PALM' | 'FIST';

export interface HandData {
  gesture: GestureType;
  x: number; // Normalized 0-1 (inverted X for mirror effect)
  y: number; // Normalized 0-1
  velocityX: number; // Velocity of X movement
  isPresent: boolean;
}

export interface DualPosition {
  chaos: [number, number, number];
  target: [number, number, number];
}

export interface OrnamentData {
  id: number;
  position: DualPosition;
  scale: number;
  color: string;
  type: 'ball' | 'box' | 'light';
  rotationSpeed: [number, number, number];
}