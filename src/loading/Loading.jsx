import React, { useEffect, useState } from "react";
import { Compass } from "lucide-react";

export default function LoadingSpinner() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setRotation((prev) => (prev + 4) % 360);
    }, 16); // smooth rotation
    return () => clearInterval(rotationInterval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Outer subtle ring */}
        <div className="absolute inset-0 rounded-full border-2 border-purple-500/20"></div>

        {/* Rotating Compass */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <Compass className="w-10 h-10 text-purple-400" />
        </div>

        {/* Center pulse */}
        <div className="absolute w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
      </div>
    </div>
  );
}
