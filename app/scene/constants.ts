import * as THREE from "three";

export const IDLE_ROTATION_SPEED = 0.05;
export const MOUSE_INFLUENCE = 0.8;
export const LERP_FACTOR = 0.08;

export const LABEL_FADE_NEAR = 6;
export const LABEL_FADE_FAR = 11;

// Label culling — unmount DOM labels for bodies too small on screen to read.
// Apparent size = world size / camera distance. Hysteresis pair: a label
// mounts above SHOW and unmounts below HIDE (see label-cull.ts). At the
// default camera (~8.25 away) this keeps the sun + near-side planets labeled
// and culls moon labels until the camera moves in (focus zoom).
export const LABEL_CULL_SHOW = 0.014;
export const LABEL_CULL_HIDE = 0.011;

export const CAMERA_LERP = 0.06;
export const DEFAULT_CAM_POS = new THREE.Vector3(0, 2, 8);
export const DEFAULT_LOOK_AT = new THREE.Vector3(0, 0, 0);
