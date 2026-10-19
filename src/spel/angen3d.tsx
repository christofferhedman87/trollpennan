import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Component, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { useMinne } from "./minne.ts";
import { KenneyNatur } from "./kenneyNatur.tsx";
import { KV, MILJO } from "./miljo.ts";
import { HINT, SNART } from "./ang/delat.ts";
import { Eldflugor, FagelFlyg, Fjarilar, Forgrund, Glitter, GrasTuvor, Horisont, Ljusflackar, Moln, Nackrosor, Ringar, Sond, Stenar, TradOchBlommor } from "./ang/dekor.tsx";
import { Byggnad, Skogsstig, SpokHus } from "./ang/byggnader.tsx";
import { DjurIScen } from "./ang/djur.tsx";
import { Himmel, SvajMark } from "./ang/himmel.tsx";
import { KameraRam } from "./ang/kamera.tsx";
import { PlatsScen } from "./ang/PlatsDekor.tsx";
import { START_PLATS } from "./platser.ts";
import { SagaBoll, SagaKamera, SagaKanin, SagaLjus, SagaPenna, type OrbitStyr } from "./ang/saga.tsx";

class NaturGren extends Component<{ children: ReactNode }, { fel: boolean }> {
  state = { fel: false };
  static getDerivedStateFromError() {
    return { fel: true };
  }
  render() {
    if (this.state.fel) {
      return (
        <>
          <TradOchBlommor />
          <GrasTuvor />
          <Stenar />
          <Nackrosor />
          <Forgrund />
        </>
      );
    }
    return this.props.children;
  }
}

class TredGren extends Component<{ children: ReactNode }, { fel: boolean }> {
  state = { fel: false };
  static getDerivedStateFromError() {
    return { fel: true };
  }
  render() {
    return this.state.fel ? null : this.props.children;
  }
}


function Scen({ natt, onSnart, saga }: { natt: number; onSnart: () => void; saga: boolean }) {
  const djur = useMinne((s) => s.ang);
  const garden = useMinne((s) => s.garden);
  const vis = saga ? 0 : 0 * natt;
  const himmel = MILJO.himmel.bakgrund;
  const mark = "#ffffff";
  const L = MILJO.ljus;
  const amb = useRef<THREE.AmbientLight>(null);
  const hem = useRef<THREE.HemisphereLight>(null);
  const dir = useRef<THREE.DirectionalLight>(null);
  const sol = useRef<THREE.MeshBasicMaterial>(null);
  const fyll = useRef<THREE.DirectionalLight>(null);
  const kantL = useRef<THREE.DirectionalLight>(null);
  const styr = useRef<OrbitStyr>(null);
  const plats = useMinne((s) => s.plats);
  // B1.3b: andra platser ritas helt ur data/platser.json; ängen (och sagan) som förut.
  if (plats !== START_PLATS && !saga) return <PlatsScen plats={plats} />;
  return (
    <>
      <color attach="background" args={[himmel]} />
      <fog attach="fog" args={[MILJO.dis.farg, MILJO.dis.nara, MILJO.dis.fjarran]} />
      <Himmel natt={vis} />
      <ambientLight ref={amb} intensity={L.ambient.styrka} color={L.ambient.farg} />
      <hemisphereLight ref={hem} args={[L.hemi.himmel, L.hemi.mark, L.hemi.styrka]} />
      <directionalLight
        ref={dir}
        color={L.nyckel.farg}
        position={L.nyckel.position as [number, number, number]}
        intensity={L.nyckel.styrka}
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
      <directionalLight ref={fyll} color={L.fyll.farg} position={[-6, 3, 4]} intensity={L.fyll.styrka} />
      <directionalLight ref={kantL} color={L.kant.farg} position={[-2, 4, -5]} intensity={L.kant.styrka} />
      <SagaLjus natt={vis} amb={amb} hem={hem} dir={dir} sol={sol} fyll={fyll} kant={kantL} />
      <mesh position={[-1.5, 5.5, -6]}>
        <sphereGeometry args={[0.42, 8, 6]} />
        <meshBasicMaterial ref={sol} color="#FFE082" />
      </mesh>
      <Moln position={[-2.2, 5.6, -8]} fart={0.016} />
      <Moln position={[0.4, 6.2, -9]} fart={0.02} />
      <Moln position={[2.4, 5.5, -7.5]} fart={0.014} />
      <Moln position={[-0.6, 4.9, -6]} fart={0.018} />
      <Moln position={[1.6, 6.6, -10]} fart={0.012} />
      <FagelFlyg />
      <SvajMark color={mark} natt={vis} />
      <Horisont />
      <NaturGren>
        <Suspense fallback={null}>
          <KenneyNatur />
        </Suspense>
      </NaturGren>
      <Ljusflackar />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.12, 0.02, -0.35]}>
        <circleGeometry args={[0.72, 20]} />
        <meshStandardMaterial color="#4FC3E8" roughness={0.22} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.12, 0.03, -0.35]}>
        <ringGeometry args={[0.64, 0.76, 20]} />
        <meshBasicMaterial color="#B3E5FC" side={THREE.DoubleSide} />
      </mesh>
      <Ringar />
      <Glitter />
      <Fjarilar />
      <Eldflugor natt={vis} />
      <SpokHus onSnart={onSnart} />
      <Skogsstig onSnart={onSnart} />
      {garden.map((b) => (
        <Byggnad key={b.uid} b={b} />
      ))}
      {djur.map((spec) => (
        <DjurIScen key={spec.uid} spec={spec} alla={djur} />
      ))}
      <Sond />
      <SagaPenna />
      <SagaBoll />
      <SagaKanin />
      <OrbitControls
        ref={styr as never}
        enabled={!saga}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={1.42}
        minPolarAngle={1.1}
        minAzimuthAngle={-1.05}
        maxAzimuthAngle={1.05}
        minDistance={6}
        maxDistance={14}
        target={[0, 1.05, -0.15]}
        rotateSpeed={0.7}
        zoomSpeed={0.75}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />
      <SagaKamera styr={styr} />
      <KameraRam styr={styr} />
    </>
  );
}

export function Angen3D({ natt, saga = false, onGrind }: { natt: number; saga?: boolean; onGrind?: () => boolean }) {
  const djur = useMinne((s) => s.ang);
  const garden = useMinne((s) => s.garden);
  const dragit = useMinne((s) => s.dragit);
  const plats = useMinne((s) => s.plats);
  const [prat, setPrat] = useState(false);
  const dolj = useRef<number | null>(null);
  const rot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    return () => {
      if (dolj.current) window.clearTimeout(dolj.current);
    };
  }, []);
  useEffect(() => {
    const el = rot.current;
    if (!el) return;
    let aktiv = false;
    let sx = 0;
    let sy = 0;
    const ned = (e: PointerEvent) => {
      aktiv = true;
      sx = e.clientX;
      sy = e.clientY;
    };
    const flytta = (e: PointerEvent) => {
      if (!aktiv || useMinne.getState().dragit) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (dx * dx + dy * dy > 24 * 24) {
        aktiv = false;
        useMinne.getState().sattTittat();
      }
    };
    const upp = () => {
      aktiv = false;
    };
    el.addEventListener("pointerdown", ned);
    window.addEventListener("pointermove", flytta);
    window.addEventListener("pointerup", upp);
    window.addEventListener("pointercancel", upp);
    return () => {
      el.removeEventListener("pointerdown", ned);
      window.removeEventListener("pointermove", flytta);
      window.removeEventListener("pointerup", upp);
      window.removeEventListener("pointercancel", upp);
    };
  }, []);
  const onSnart = useCallback(() => {
    if (onGrind && onGrind()) return;
    setPrat(true);
    if (dolj.current) window.clearTimeout(dolj.current);
    dolj.current = window.setTimeout(() => setPrat(false), 2400);
  }, [onGrind]);
  return (
    <div ref={rot} className="angen-3d" data-testid="angen-3d" style={{ "--grad-m": KV.farggrad ? MILJO.farggrad.mattnad : 1, "--grad-k": KV.farggrad ? MILJO.farggrad.kontrast : 1, "--vinjett": MILJO.vinjett.styrka } as React.CSSProperties} data-djur={djur.length} data-byggen={garden.length} data-saga={saga ? "ja" : "nej"} data-plats={plats}>
      {!saga && !dragit ? (
        <p className="tred-hint" data-testid="tred-hint">
          {HINT}
        </p>
      ) : null}
      {prat ? (
        <p className="teaser-bubbla" data-testid="kommer-snart">
          {SNART}
        </p>
      ) : null}
      <div className="ladd-3d" data-testid="ladd-3d">
        <h1>Trollpennan</h1>
        <span className="ladd-penna" aria-hidden />
      </div>
      <TredGren>
        <Canvas
          camera={{ position: [0, 4.15, 9.8], fov: 58, near: 0.1, far: 90 }}
          dpr={[1, KV.dpr_max]}
          shadows
          gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1 }}
          onCreated={({ gl }) => {
            gl.shadowMap.type = THREE.PCFShadowMap;
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                rot.current?.querySelector("[data-testid='ladd-3d']")?.setAttribute("data-klar", "ja");
              });
            });
          }}
        >
          <Scen natt={natt} onSnart={onSnart} saga={saga} />
        </Canvas>
      </TredGren>
      <div className="vinjett" aria-hidden />
    </div>
  );
}
