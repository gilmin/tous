// Scales the default (unfocused) camera distance so the whole Universe fits the
// narrower horizontal FOV of a portrait viewport. Landscape/desktop (aspect >= 1)
// is unchanged; portrait pulls the camera back, capped so it can't fly absurdly
// far. aspect = canvas width / height. Pure → vitest; CameraController applies it.
export function defaultCamDistanceScale(aspect: number): number {
  if (aspect >= 1) return 1;
  return Math.min(1.7, 1 + (1 - aspect));
}
