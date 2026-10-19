// B1.3b: scenen för andra platser än ängen (Skogen, Sjön, Grottan …), helt ur data/platser.json.
// Ängen ritas som förut i angen3d.tsx; här finns bara miljö (himmel, dis, ljus, mark), startobjekt och platsens skapelser.
import { OrbitControls } from "@react-three/drei";
import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GltfSak } from "../gltfDjur.tsx";
import { KV, miljoFor } from "../miljo.ts";
import { useMinne } from "../minne.ts";
import { dekorFor, vattenytor } from "../platsDekor.ts";
import { platsMed } from "../platser.ts";
import { DjurIScen } from "./djur.tsx";
import { SvajMark } from "./himmel.tsx";
import { SagaPenna } from "./saga.tsx";
import { KameraRam } from "./kamera.tsx";
import type { OrbitStyr } from "./saga.tsx";


/** Kameran börjar närmare platsens dekor (ängen har egen start). */
function PlatsKamera() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 3.05, 6.8);
    camera.near = 0.1;
    camera.far = 90;
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

const INGA: never[] = [];
const sagt = new Set<string>();

/** En modell som inte går att hämta ska inte släcka hela scenen: den saken hoppas över. */
class SakGren extends Component<{ children: ReactNode }, { fel: boolean }> {
  state = { fel: false };
  static getDerivedStateFromError() {
    return { fel: true };
  }
  render() {
    return this.state.fel ? null : this.props.children;
  }
}

/** Startobjekten (ord → entitet via samma uppslag som barnets ord) och vattenytorna. */
export function PlatsDekor({ plats }: { plats: string }) {
  const p = platsMed(plats);
  const { saker, saknas } = useMemo(() => dekorFor(p), [p]);
  const vatten = useMemo(() => vattenytor(p), [p]);
  for (const ord of saknas) {
    const nyckel = `${plats}:${ord}`;
    if (sagt.has(nyckel)) continue;
    sagt.add(nyckel);
    console.info(`[plats] ${plats}: "${ord}" har ingen modell, hoppas över`);
  }
  return (
    <group name={`plats-${plats}`} scale={1.45}>
      {vatten.map((v) => (
        <mesh key={v.id} name="vattenyta" rotation={[-Math.PI / 2, 0, 0]} position={v.mitt}>
          <planeGeometry args={v.storlek} />
          <meshStandardMaterial color="#4FC3F7" transparent opacity={0.85} roughness={0.22} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {saker.map((s, i) => (
        <group key={`${s.kropp}-${i}`} name={s.ord} position={s.pos} scale={s.skala}>
          <SakGren>
            <Suspense fallback={null}>
              <GltfSak id={s.kropp} />
            </Suspense>
          </SakGren>
        </group>
      ))}
    </group>
  );
}

/** Hela scenen för en plats som inte är ängen. */
export function PlatsScen({ plats }: { plats: string }) {
  const djur = useMinne((s) => s.platsSkapelser[plats] ?? INGA);
  const styr = useRef<OrbitStyr>(null);
  const { miljo, ljusSkala, mark } = useMemo(() => miljoFor(platsMed(plats)?.miljo), [plats]);
  const L = miljo.ljus;
  const k = ljusSkala;
  return (
    <>
      <color attach="background" args={[miljo.himmel.bakgrund]} />
      <fog attach="fog" args={[miljo.dis.farg, miljo.dis.nara, miljo.dis.fjarran]} />
      <ambientLight intensity={L.ambient.styrka * k} color={L.ambient.farg} />
      <hemisphereLight args={[L.hemi.himmel, L.hemi.mark, L.hemi.styrka * k]} />
      <directionalLight
        color={L.nyckel.farg}
        position={L.nyckel.position as [number, number, number]}
        intensity={L.nyckel.styrka * k}
        castShadow
        shadow-mapSize-width={KV.skuggkarta}
        shadow-mapSize-height={KV.skuggkarta}
        shadow-camera-near={0.5}
        shadow-camera-far={28}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <directionalLight color={L.fyll.farg} position={[-6, 3, 4]} intensity={L.fyll.styrka * k} />
      <directionalLight color={L.kant.farg} position={[-2, 4, -5]} intensity={L.kant.styrka * k} />
      <SvajMark color={mark} natt={0} utanTextur={mark !== "#ffffff"} />
      <PlatsKamera />
      <PlatsDekor plats={plats} />
      {djur.map((spec) => (
        <DjurIScen key={spec.uid} spec={spec} alla={djur} />
      ))}
      <SagaPenna />
      <OrbitControls
        ref={styr as never}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={1.42}
        minPolarAngle={1.1}
        minAzimuthAngle={-1.05}
        maxAzimuthAngle={1.05}
        minDistance={3.6}
        maxDistance={9.5}
        target={[0, 0.7, 0.5]}
        rotateSpeed={0.7}
        zoomSpeed={0.75}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />
      <KameraRam styr={styr} />
    </>
  );
}
