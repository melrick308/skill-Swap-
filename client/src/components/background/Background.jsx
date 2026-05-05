import React, { useEffect, useState } from "react";
import "./Background.css";

const colors = [
  ["from-purple-500/20", "to-blue-500/20"],
  ["from-cyan-500/20", "to-blue-600/20"],
  ["from-indigo-500/20", "to-purple-600/20"],
  ["from-violet-500/20", "to-fuchsia-500/20"],
  ["from-blue-600/20", "to-cyan-600/20"],
  ["from-fuchsia-500/20", "to-pink-500/20"],
  ["from-sky-500/20", "to-indigo-500/20"],
];

const depths = [
  { z: "z-0", blur: "blur-md", opacity: 0.3 },
  { z: "z-10", blur: "blur-lg", opacity: 0.45 },
  { z: "z-20", blur: "blur-2xl", opacity: 0.6 },
];

const generateCircles = (count = 30) => {
  return Array.from({ length: count }, () => {
    const depth = depths[Math.floor(Math.random() * depths.length)];
    return {
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.floor(Math.random() * 180 + 80),
      colors: colors[Math.floor(Math.random() * colors.length)],
      delay: `${(Math.random() * 5).toFixed(1)}s`,
      duration: `${(18 + Math.random() * 10).toFixed(1)}s`,
      blur: depth.blur,
      z: depth.z,
      opacity: depth.opacity,
    };
  });
};

const circles = generateCircles();

const Background = () => {
  const [sparkTrigger, setSparkTrigger] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSparkTrigger(true);
      setTimeout(() => setSparkTrigger(false), 800); // Match spark animation duration
    }, Math.random() * 1000 + 2000); // Every 2–3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.02),_transparent)] mix-blend-overlay" />

      {circles.map((circle, index) => (
        <div
          key={index}
          className={`
            absolute rounded-full bg-gradient-to-br 
            ${circle.colors.join(" ")} shimmer 
            ${circle.blur} ${circle.z}
            ${sparkTrigger ? "spark" : ""}
          `}
          style={{
            width: `${circle.size}px`,
            height: `${circle.size}px`,
            top: circle.top,
            left: circle.left,
            opacity: circle.opacity,
            animation: `floatXY ${circle.duration} cubic-bezier(0.45, 0, 0.55, 1) infinite`,
            animationDelay: circle.delay,
          }}
        />
      ))}
    </div>
  );
};

export default Background;
