import * as THREE from "three";

export const IDLE_ROTATION_SPEED = 0.05;
export const MOUSE_INFLUENCE = 0.8;
export const LERP_FACTOR = 0.08;

// Touch steering (coarse pointer). Spin is proportional to the finger's signed
// distance from center("나"): touchSpinSpeed(pointerX) = pointerX * TOUCH_SPIN_SCALE,
// so the screen edges spin fastest and center is slow — symmetric, no idle bias.
// A light lerp smooths analog jitter without the cross-zero 저항감 of the old
// fixed-magnitude model. Both dogfood-tunable.
export const TOUCH_SPIN_SCALE = 1.2;
export const TOUCH_LERP_FACTOR = 0.2;

export const LABEL_FADE_NEAR = 6;
export const LABEL_FADE_FAR = 11;

// Label culling — unmount DOM labels for bodies too small on screen to read.
// Apparent size = world size / camera distance. Hysteresis pair: a label
// mounts above SHOW and unmounts below HIDE (see label-cull.ts). At the
// default camera (~8.25 away) this keeps the sun + near-side planets labeled
// and culls moon labels until the camera moves in (focus zoom).
export const LABEL_CULL_SHOW = 0.014;
export const LABEL_CULL_HIDE = 0.011;

// coarse-pointer(터치)용 더 느슨한 쌍 — hover로 라벨을 띄울 수 없으니 더 작은
// 겉보기 크기에서도 보이게 한다(데스크탑 대비 ~35% 낮춤).
export const LABEL_CULL_SHOW_MOBILE = 0.009;
export const LABEL_CULL_HIDE_MOBILE = 0.007;

export const CAMERA_LERP = 0.06;
export const DEFAULT_CAM_POS = new THREE.Vector3(0, 2, 8);
export const DEFAULT_LOOK_AT = new THREE.Vector3(0, 0, 0);
