/**
 * motion-kit settings. Raised on 14.10.2026 at the client's request ("it has to feel premium"):
 * longer travel and a slower, softer settle than the first A-3 lock. Still transform/opacity only.
 */
export interface MotionSettings {
  ease: string;
  duration: number;
  distance: number;
  stagger: number;
  start: string;
}

export const motionSettings: MotionSettings = {
  ease: "expo.out",
  duration: 1.1,
  distance: 40,
  stagger: 0.12,
  start: "top 88%",
};
