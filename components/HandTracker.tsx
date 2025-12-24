import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { HandData } from '../types';
import { detectGesture } from '../utils/gestureLogic';

interface HandTrackerProps {
  onHandUpdate: (data: HandData) => void;
}

export const HandTracker: React.FC<HandTrackerProps> = ({ onHandUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  
  // Velocity tracking
  const lastXRef = useRef<number>(0.5);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    let active = true;

    const setup = async () => {
        try {
            // 1. Initialize MediaPipe
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
            );
            
            if (!active) return;

            handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 1
            });

            // 2. Initialize Camera
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: 640, height: 480 } 
                });
                
                if (!active) return;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    // Start detection loop immediately after playback starts
                    detect();
                }
            }
        } catch (err) {
            console.error("Initialization error:", err);
        }
    };

    setup();

    return () => {
        active = false;
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
    };
  }, []);

  const detect = () => {
    if (videoRef.current && handLandmarkerRef.current && videoRef.current.readyState >= 2) {
      const startTimeMs = performance.now();
      
      try {
          const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            const gesture = detectGesture(landmarks);
            
            // Calculate Center of Palm (approximate with wrist and index knuckle)
            const wrist = landmarks[0];
            const indexMCP = landmarks[5];
            const centerX = (wrist.x + indexMCP.x) / 2;
            const centerY = (wrist.y + indexMCP.y) / 2;
            
            const finalX = 1 - centerX; // Mirroring
            
            // Calculate Velocity
            const now = performance.now();
            const dt = now - lastTimeRef.current;
            let velocityX = 0;
            
            // Velocity filter to reduce noise
            if (dt > 0 && lastTimeRef.current > 0) {
                velocityX = (finalX - lastXRef.current) / (dt / 1000);
            }
            
            lastXRef.current = finalX;
            lastTimeRef.current = now;

            onHandUpdate({
                gesture,
                x: finalX,
                y: centerY,
                velocityX,
                isPresent: true
            });
          } else {
            // Hand lost
            lastTimeRef.current = 0; 
            onHandUpdate({ gesture: 'NONE', x: 0.5, y: 0.5, velocityX: 0, isPresent: false });
          }
      } catch (e) {
          console.warn("Detection error:", e);
      }
    }
    
    // Loop
    requestRef.current = requestAnimationFrame(detect);
  };

  return (
    // Essential: Video must have dimensions to be rendered by browser engine, 
    // even if opacity is 0. 1x1 pixels often get culled.
    <video 
        ref={videoRef} 
        id="webcam-preview" 
        autoPlay 
        playsInline 
        muted 
        className="absolute opacity-0 pointer-events-none"
        style={{ 
            width: '640px', 
            height: '480px', 
            zIndex: -50,
            top: 0, 
            left: 0 
        }}
    />
  );
};