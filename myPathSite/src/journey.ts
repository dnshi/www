export const SIGNAL_POSITIONS = [0.12, 0.36, 0.62, 0.88] as const;

export function clampJourneyProgress(value: number): number {
  if (!Number.isFinite(value)) throw new TypeError('Journey progress must be finite');
  return Math.min(0.94, Math.max(0.018, value));
}

export function nearestSignal(progress: number): number {
  const position = clampJourneyProgress(progress);
  let best = 0;
  SIGNAL_POSITIONS.forEach((destination, index) => {
    if (Math.abs(destination - position) < Math.abs((SIGNAL_POSITIONS[best] ?? 0) - position)) best = index;
  });
  return best;
}
