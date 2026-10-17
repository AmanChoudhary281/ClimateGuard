import { useEffect, useMemo, useRef } from "react";

type Star = { x: number; y: number; size: number; opacity: number; delay: number; dur: number; twinkle: boolean; tint: string };

function makeStars(seed: number, count: number): Star[] {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };

  return Array.from({ length: count }, (_, index) => ({
    x: random() * 100,
    y: random() * 100,
    size: 0.5 + Math.pow(random(), 4) * 1.6,
    opacity: 0.25 + random() * 0.55,
    delay: -(index % 11) * 0.61,
    dur: 3.2 + random() * 6.5,
    twinkle: random() < 0.38,
    tint: random() < 0.16 ? "oklch(0.88 0.08 70)" : random() < 0.2 ? "oklch(0.86 0.07 235)" : "",
  }));
}

export function ClimateBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stars = useMemo(() => makeStars(1847, 170), []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches || matchMedia("(pointer: coarse)").matches) return;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let previous = performance.now();

    const animate = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      const easing = 1 - Math.exp(-2.2 * delta);
      x += (targetX - x) * easing;
      y += (targetY - y) * easing;
      root.style.setProperty("--space-x", x.toFixed(3));
      root.style.setProperty("--space-y", y.toFixed(3));
      frame = requestAnimationFrame(animate);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      targetX = event.clientX / window.innerWidth * 2 - 1;
      targetY = event.clientY / window.innerHeight * 2 - 1;
    };
    const onLeave = () => { targetX = 0; targetY = 0; };

    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div ref={rootRef} className="space-environment" aria-hidden="true">
      <div className="space-haze" />
      <div className="milky-way" />
      <div className="solar-presence" />
      <div className="star-field">
        {stars.map((star, index) => (
          <i
            key={index}
            className={star.twinkle ? "star twinkle" : "star"}
            style={{
              left: `${star.x}%`, top: `${star.y}%`, width: star.size,
              height: star.size, opacity: star.opacity,
              animationDelay: `${star.delay}s`, animationDuration: `${star.dur}s`,
              ...(star.tint ? { background: star.tint } : {}),
            }}
          />
        ))}
      </div>
      <div className="space-vignette" />
    </div>
  );
}
