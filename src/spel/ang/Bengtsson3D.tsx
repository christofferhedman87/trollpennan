import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { belysScen } from "../belys.ts";

const BENGTSSON_GLB = "/models/bulk/bengtsson.glb";
const kopplaMeshopt = (loader: { setMeshoptDecoder?: (d: typeof MeshoptDecoder) => void }) => {
  loader.setMeshoptDecoder?.(MeshoptDecoder);
};

/** Doktor Bengtsson på ängen, CC0-modell från Kenney Blocky Characters. */
export function Bengtsson3D() {
  const gltf = useGLTF("/models/bulk/bengtsson.glb", true, true, kopplaMeshopt);
  const gruppRef = useRef<THREE.Group>(null);
  const klon = useMemo(() => {
    const c = SkeletonUtils.clone(gltf.scene);
    belysScen(c);
    c.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const lista = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of lista) {
        if (!("roughness" in m) || !("metalness" in m)) continue;
        const std = m as THREE.MeshStandardMaterial;
        std.roughness = 0.75;
        std.metalness = 0.08;
      }
    });
    return c;
  }, [gltf.scene]);
  const { actions } = useAnimations(gltf.animations, gruppRef);
  useEffect(() => {
    const idle = actions.idle;
    if (!idle) return;
    idle.reset().fadeIn(0.25).play();
    return () => {
      idle.fadeOut(0.2);
    };
  }, [actions]);
  useFrame(({ clock }) => {
    if (!gruppRef.current) return;
    const t = clock.getElapsedTime();
    gruppRef.current.position.y = Math.sin(t * 1.8) * 0.03;
    gruppRef.current.rotation.y = 0.38 + Math.sin(t * 0.9) * 0.08;
  });
  return (
    <group ref={gruppRef} name="bengtsson-3d" position={[-2.35, 0, 1.35]} scale={0.95} userData={{ trollNpc: "bengtsson" }}>
      <primitive object={klon} />
    </group>
  );
}

useGLTF.preload(BENGTSSON_GLB, true, true, kopplaMeshopt);
