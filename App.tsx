import React, { useState, useCallback } from 'react';
import { Experience } from './components/Experience';
import { HandTracker } from './components/HandTracker';
import { TreeState, HandData } from './types';

export default function App() {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.CHAOS);
  const [handData, setHandData] = useState<HandData | null>(null);

  // Gesture State Machine
  const handleHandUpdate = useCallback((data: HandData) => {
    setHandData(data);

    if (data.isPresent) {
      if (data.gesture === 'FIST') {
        setTreeState(TreeState.FORMED);
      } else if (data.gesture === 'OPEN_PALM') {
        setTreeState(TreeState.CHAOS);
      }
    }
  }, []);

  // Determine Status UI
  let statusText = "等待手势...";
  let statusColor = "bg-[#ffd700]"; // Gold default
  let isTracking = false;

  if (handData && handData.isPresent) {
    isTracking = true;
    statusColor = "bg-[#2d5a42]"; // Emerald

    if (treeState === TreeState.FORMED) {
         statusText = "🎄 圣诞树已聚合";
    } else {
        // Removed directional text as requested
        statusText = "✨ 粒子散落模式";
    }
  }

  return (
    <div className="relative w-full h-full bg-[#0b1015] font-christmas">
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <Experience treeState={treeState} handData={handData} />
      </div>

      {/* Hand Tracker (Headless logic) */}
      <HandTracker onHandUpdate={handleHandUpdate} />

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Header - Moved to Top Left & Scaled Down */}
        <header className="flex flex-col items-start text-left space-y-2 animate-fade-in-down pt-2 pl-2 transform scale-75 origin-top-left">
           {/* Decorative Line */}
          <div className="w-16 h-[2px] bg-gradient-to-r from-[#ffd700] to-transparent mb-2"></div>
          
          <h1 className="text-6xl md:text-8xl text-[#fff8e7] drop-shadow-[0_0_15px_rgba(255,165,0,0.8)]" 
              style={{ textShadow: '0 0 40px rgba(255, 215, 0, 0.6)' }}>
            圣诞快乐
          </h1>
          <p className="text-[#ffd700] text-lg md:text-xl tracking-widest opacity-90 pl-1 font-bold font-sans">
             ~ Merry Christmas ~
          </p>
        </header>

        {/* Bottom Area */}
        <div className="w-full flex justify-between items-end pb-4 px-2">
            
            {/* Left: Instructions */}
            <div className="flex flex-col space-y-2 max-w-[200px] pointer-events-auto">
                <div className="bg-[#1a2e26]/60 backdrop-blur-md border border-[#fff8e7]/20 p-4 rounded-xl text-[#fff8e7] shadow-xl">
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#a61c1c] flex items-center justify-center text-[10px] border border-[#fff8e7]/30">✊</span>
                            <span><strong>握拳:</strong> 聚合圣诞树</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#2d5a42] flex items-center justify-center text-[10px] border border-[#fff8e7]/30">🖐</span>
                            <span><strong>挥手:</strong> 左右旋转</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Right: System Status */}
            <div className="pointer-events-auto">
                 <div className="bg-[#0b1015]/80 backdrop-blur-md border border-[#fff8e7]/10 rounded-full px-4 py-2 flex items-center gap-3 shadow-lg transform origin-bottom-right">
                    <span className="text-[#fff8e7] text-xs font-sans tracking-widest font-bold">
                        {statusText}
                    </span>
                    <div className="relative flex items-center justify-center w-2 h-2">
                        {isTracking && (
                            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${statusColor}`}></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${statusColor}`}></span>
                    </div>
                 </div>
            </div>

        </div>

      </div>
    </div>
  );
}