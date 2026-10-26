import { useFrame } from "@react-three/fiber";
import { Component, useRef, type ReactNode } from "react";
import * as THREE from "three";

/** Mjuk gyllene reserv när en GLB saknas eller är offline. Ingen engelsk feltext. */
export function StjarnPuffReserv({ skala = 1, y = 0.45 }: { skala?: number; y?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.position.y = y + Math.sin(clock.elapsedTime * 1.8) * 0.06;
  });
  return (
    <group ref={g} name="stjarn-puff-reserv" position={[0, y, 0]} scale={skala}>
      <mesh>
        <sphereGeometry args={[0.18, 12, 10]} />
        <meshStandardMaterial color="#FFD54F" emissive="#FFA000" emissiveIntensity={0.4} roughness={0.45} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.cos(i * 1.5708) * 0.28, 0.04, Math.sin(i * 1.5708) * 0.28]}>
          <sphereGeometry args={[0.08, 8, 6]} />
          <meshStandardMaterial color="#FFF8E1" emissive="#FFD54F" emissiveIntensity={0.25} roughness={0.65} />
        </mesh>
      ))}
    </group>
  );
}

export class DjurModellGren extends Component<{ children: ReactNode; reserv?: ReactNode }, { fel: boolean }> {
  state = { fel: false };
  static getDerivedStateFromError() {
    return { fel: true };
  }
  componentDidCatch() {
    /* fånga tyst utan pageerror */
  }
  render() {
    return this.state.fel ? (this.props.reserv ?? <StjarnPuffReserv />) : this.props.children;
  }
}
