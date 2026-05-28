"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useContext, useRef } from "react";
import * as THREE from "three";
import { FocusContext } from "./FocusContext";
import { CAMERA_LERP, DEFAULT_CAM_POS, DEFAULT_LOOK_AT } from "./constants";

export function CameraController() {
  const { focused } = useContext(FocusContext);
  const { camera } = useThree();
  const lookAtRef = useRef(new THREE.Vector3().copy(DEFAULT_LOOK_AT));

  useFrame(() => {
    let desiredPos: THREE.Vector3;
    let desiredLook: THREE.Vector3;

    if (focused) {
      const offset = new THREE.Vector3(
        0,
        focused.size * 0.6,
        focused.size * 4 + 0.9,
      );
      desiredPos = new THREE.Vector3().copy(focused.position).add(offset);
      desiredLook = focused.position;
    } else {
      desiredPos = DEFAULT_CAM_POS;
      desiredLook = DEFAULT_LOOK_AT;
    }

    camera.position.lerp(desiredPos, CAMERA_LERP);
    lookAtRef.current.lerp(desiredLook, CAMERA_LERP);
    camera.lookAt(lookAtRef.current);
  });

  return null;
}
