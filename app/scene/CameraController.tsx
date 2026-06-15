"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useSceneStoreApi } from "./store/scene-store-context";
import { selectBodyById } from "./store/tree-ops";
import { getBodyMesh } from "./store/body-mesh-registry";
import { CAMERA_LERP, DEFAULT_CAM_POS, DEFAULT_LOOK_AT } from "./constants";
import { defaultCamDistanceScale } from "./camera-frame";

export function CameraController() {
  // Read the store fresh each frame instead of via a React subscription, so a
  // keyboard focus change retargets the camera with zero dependence on render
  // or useFrame-closure timing.
  const api = useSceneStoreApi();
  const { camera } = useThree();
  const lookAtRef = useRef(new THREE.Vector3().copy(DEFAULT_LOOK_AT));
  const worldPos = useRef(new THREE.Vector3());
  const desiredPos = useRef(new THREE.Vector3());
  const desiredLook = useRef(new THREE.Vector3());

  useFrame((state) => {
    const { tree, focusedId } = api.getState();
    const body = focusedId ? selectBodyById(tree, focusedId) : null;
    const mesh = focusedId ? getBodyMesh(focusedId) : null;

    if (focusedId && body && mesh) {
      mesh.getWorldPosition(worldPos.current);
      const offset = new THREE.Vector3(
        0,
        body.size * 0.6,
        body.size * 4 + 0.9,
      );
      desiredPos.current.copy(worldPos.current).add(offset);
      desiredLook.current.copy(worldPos.current);
    } else {
      // Portrait: pull the camera back so the whole Universe fits the narrower
      // horizontal FOV (landscape/desktop unchanged).
      const scale = defaultCamDistanceScale(
        state.size.width / state.size.height,
      );
      desiredPos.current.copy(DEFAULT_CAM_POS).multiplyScalar(scale);
      desiredLook.current.copy(DEFAULT_LOOK_AT);
    }

    camera.position.lerp(desiredPos.current, CAMERA_LERP);
    lookAtRef.current.lerp(desiredLook.current, CAMERA_LERP);
    camera.lookAt(lookAtRef.current);
  });

  return null;
}
