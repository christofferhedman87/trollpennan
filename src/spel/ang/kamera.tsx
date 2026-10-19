import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { sagaNu } from "../saga.ts";
import type { OrbitStyr } from "./saga.tsx";

export function KameraRam({ styr }: { styr: { current: OrbitStyr | null } }) {
  const lage = useRef("");
  useFrame(({ camera, size }) => {
    if (sagaNu.aktiv) {
      lage.current = "";
      return;
    }
    const land = size.width > size.height + 40;
    const ny = land ? "land" : "sta";
    if (lage.current === ny) return;
    lage.current = ny;
    const cam = camera as THREE.PerspectiveCamera;
    if (land) {
      cam.fov = 46;
      cam.position.set(0, 3.9, 8.6);
    } else {
      cam.fov = 58;
      cam.position.set(0, 4.15, 9.8);
    }
    cam.updateProjectionMatrix();
    cam.lookAt(0, 1.05, -0.15);
    const c = styr.current;
    if (c) {
      c.target.set(0, 1.05, -0.15);
      c.update();
    }
  });
  return null;
}
