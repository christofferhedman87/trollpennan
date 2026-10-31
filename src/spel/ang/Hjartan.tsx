import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function Hjartan({ puls }: { puls: number }) {
  const grupp = useRef<THREE.Group>(null);
  const start = useRef(-10);
  useEffect(() => { if (puls > 0) start.current = performance.now(); }, [puls]);
  useFrame(() => {
    const g = grupp.current;
    if (!g) return;
    const t = (performance.now() - start.current) / 1000;
    const syns = t >= 0 && t < 1.35;
    g.visible = syns;
    if (!syns) return;
    g.position.y = 1.05 + t * 0.55;
    if (puls >= 2) g.rotation.y += 0.08;
    for (let i = 0; i < g.children.length; i++) {
      const m = g.children[i] as THREE.Mesh;
      const gnist = m.name === "gnist";
      if (gnist && puls < 2) { m.visible = false; continue; }
      m.visible = true;
      const lokal = Math.max(0, t - i * 0.08);
      m.position.y = lokal * (gnist ? 0.5 : 0.28);
      const mat = m.material as THREE.MeshBasicMaterial | undefined;
      if (mat) mat.opacity = Math.max(0, 1 - lokal / (gnist ? 0.85 : 1.2));
    }
  });
  return (
    <group ref={grupp} visible={false}>
      {[-0.28, 0.02, 0.3].map((x) => (
        <mesh key={x} position={[x, 0, 0]}><sphereGeometry args={[0.16, 8, 6]} /><meshBasicMaterial color="#F06292" transparent opacity={1} /></mesh>
      ))}
      {[[-0.16, 0.08], [0.18, -0.05], [0.02, 0.16], [-0.04, -0.12]].map(([x, z]) => (
        <mesh key={`${x}${z}`} name="gnist" position={[x ?? 0, 0, z ?? 0]} visible={false}><sphereGeometry args={[0.045, 6, 5]} /><meshBasicMaterial color="#FFE082" transparent opacity={1} /></mesh>
      ))}
    </group>
  );
}

