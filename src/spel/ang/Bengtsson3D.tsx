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
    gruppRef.current.rotation.y = 0.32 + Math.sin(t * 0.9) * 0.06;
  });
  const D1_DOLJ_3D_BENGTSSON = true; if (D1_DOLJ_3D_BENGTSSON) return null;
  return (
    <group ref={gruppRef} name="bengtsson-3d" position={[-1.45, 0, 1.50]} rotation={[0, 0.32, 0]} scale={1.0} userData={{ trollNpc: "bengtsson" }} onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("troll-npc-klick")); }}>
      <primitive object={klon} />
      <mesh position={[0, 0.78, 0]} visible={false} onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("troll-npc-klick")); }}>
        <cylinderGeometry args={[0.55, 0.55, 1.60, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

useGLTF.preload(BENGTSSON_GLB, true, true, kopplaMeshopt);
