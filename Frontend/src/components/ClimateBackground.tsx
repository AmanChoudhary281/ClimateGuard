import React, { useMemo } from 'react';

interface ClimateBackgroundProps {
  mouseX?: number;
  mouseY?: number;
}

export const ClimateBackground: React.FC<ClimateBackgroundProps> = ({
  mouseX = 0,
  mouseY = 0,
}) => {
  // Calm, restrained starfield without visual noise
  const stars = useMemo(() => {
    const list: Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      opacity: number;
      duration: number;
      delay: number;
    }> = [];

    let seed = 42;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    // 65 subtle, calm background stars
    for (let i = 0; i < 65; i++) {
      list.push({
        id: i,
        x: random() * 100,
        y: random() * 100,
        size: random() > 0.9 ? 1.5 : 1,
        opacity: 0.15 + random() * 0.45,
        duration: 4 + random() * 5,
        delay: random() * 6,
      });
    }
    return list;
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* Deep Space Vignette */}
      <div className="absolute inset-0 bg-[#02040a]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(14,30,55,0.35),rgba(2,4,10,0.96))]" />

      {/* Atmospheric Horizon Hue */}
      <div className="absolute bottom-0 left-0 w-full h-[55vh] bg-[radial-gradient(ellipse_70%_50%_at_30%_100%,rgba(6,25,50,0.25),transparent_70%)]" />

      {/* Subtle Starfield with Parallax */}
      <div
        className="absolute inset-[-4%] transition-transform duration-500 ease-out"
        style={{
          transform: `translate3d(${mouseX * -6}px, ${mouseY * -6}px, 0)`,
        }}
      >
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-white transition-opacity"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity,
              animation: `starPulse ${s.duration}s infinite ease-in-out ${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Frame HUD Corner Crosshairs */}
      <div className="absolute top-5 left-5 text-slate-800 font-mono text-xs select-none">+</div>
      <div className="absolute top-5 right-5 text-slate-800 font-mono text-xs select-none">+</div>
      <div className="absolute bottom-5 left-5 text-slate-800 font-mono text-xs select-none">+</div>
      <div className="absolute bottom-5 right-5 text-slate-800 font-mono text-xs select-none">+</div>
    </div>
  );
};
