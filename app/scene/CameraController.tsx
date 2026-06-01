"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useSceneStore } from "./store/scene-store-context";
import { selectBodyById } from "./store/tree-ops";
import { getBodyMesh } from "./store/body-mesh-registry";
import { CAMERA_LERP, DEFAULT_CAM_POS, DEFAULT_LOOK_AT } from "./constants";

export function CameraController() {
  const focusedId = useSceneStore((s) => s.focusedId);
  const focusedSize = useSceneStore((s) => {
    const id = s.focusedId;
    if (!id) return null;
    return selectBodyById(s.tree, id)?.size ?? null;
  });
  const { camera } = useThree();
  const lookAtRef = useRef(new THREE.Vector3().copy(DEFAULT_LOOK_AT));
  const worldPos = useRef(new THREE.Vector3());
  const desiredPos = useRef(new THREE.Vector3());
  const desiredLook = useRef(new THREE.Vector3());

  useFrame(() => {
    const mesh = focusedId ? getBodyMesh(focusedId) : null;

    if (focusedId && focusedSize !== null && mesh) {
      mesh.getWorldPosition(worldPos.current);
      const offset = new THREE.Vector3(
        0,
        focusedSize * 0.6,
        focusedSize * 4 + 0.9,
      );
      desiredPos.current.copy(worldPos.current).add(offset);
      desiredLook.current.copy(worldPos.current);
    } else {
      desiredPos.current.copy(DEFAULT_CAM_POS);
      desiredLook.current.copy(DEFAULT_LOOK_AT);
    }

    camera.position.lerp(desiredPos.current, CAMERA_LERP);
    lookAtRef.current.lerp(desiredLook.current, CAMERA_LERP);
    camera.lookAt(lookAtRef.current);
  });

  return null;
}
