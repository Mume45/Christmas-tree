import { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { GestureType } from "../types";

// Helper to calculate distance between two landmarks
const distance = (a: NormalizedLandmark, b: NormalizedLandmark) => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

export const detectGesture = (landmarks: NormalizedLandmark[]): GestureType => {
  if (!landmarks || landmarks.length < 21) return 'NONE';

  const wrist = landmarks[0];

  // Fingers: Index(8), Middle(12), Ring(16), Pinky(20)
  // Knuckles (MCP): Index(5), Middle(9), Ring(13), Pinky(17)
  // PIP Joints: Index(6), Middle(10), Ring(14), Pinky(18)

  const fingerIndices = [
      { tip: 8, pip: 6, mcp: 5 },   // Index
      { tip: 12, pip: 10, mcp: 9 }, // Middle
      { tip: 16, pip: 14, mcp: 13 },// Ring
      { tip: 20, pip: 18, mcp: 17 } // Pinky
  ];

  let extendedFingers = 0;
  let curledFingers = 0;

  fingerIndices.forEach(({ tip, pip, mcp }) => {
      const tipLandmark = landmarks[tip];
      const pipLandmark = landmarks[pip];
      const mcpLandmark = landmarks[mcp];

      // Robust check: Is the tip further from the wrist than the PIP joint?
      // Also check if tip is further from wrist than MCP to avoid edge cases.
      const distTipWrist = distance(tipLandmark, wrist);
      const distPipWrist = distance(pipLandmark, wrist);
      const distMcpWrist = distance(mcpLandmark, wrist);

      // Extension: Tip is furthest point
      if (distTipWrist > distPipWrist && distTipWrist > distMcpWrist) {
          extendedFingers++;
      } 
      // Curl: Tip is closer to wrist than PIP
      else if (distTipWrist < distPipWrist) {
          curledFingers++;
      }
  });

  // Thumb logic (different due to joint structure)
  // Thumb Tip (4), IP (3), MCP (2)
  const thumbTip = landmarks[4];
  const thumbMCP = landmarks[2];
  
  // A simple heuristic for thumb extension: Tip is far from Pinky MCP (17)
  const isThumbExtended = distance(thumbTip, landmarks[17]) > distance(thumbMCP, landmarks[17]);
  if (isThumbExtended) extendedFingers++;
  else curledFingers++;

  // Classification
  // 5 Fingers Extended -> OPEN_PALM
  if (extendedFingers >= 4) return 'OPEN_PALM';
  
  // 4 or 5 Fingers Curled -> FIST
  if (curledFingers >= 4) return 'FIST';

  return 'NONE';
};