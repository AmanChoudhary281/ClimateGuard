import { useEffect, useState } from 'react';

/**
 * Hook to smoothly interpolate / count up numbers from start to target value
 */
export function useAnimatedNumber(target: number, durationMs: number = 750): number {
  const [displayValue, setDisplayValue] = useState<number>(Math.max(0, Math.round(target * 0.4)));

  useEffect(() => {
    let startTimestamp: number | null = null;
    const initialValue = displayValue;
    const diff = target - initialValue;

    if (diff === 0) return;

    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / durationMs, 1);

      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(initialValue + diff * ease));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target, durationMs]);

  return displayValue;
}
