import { Bvh, OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { startaBakgrundsForladdning } from "./modeller/forladda.ts";
import { Component, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { brygga } from "./brygga.ts";
import { useMinne } from "./minne.ts";
import { malTillDuk } from "./ui/hjalp.ts";
import { KenneyNatur } from "./kenneyNatur.tsx";
import { KV, MILJO } from "./miljo.ts";
import { HINT, SNART } from "./ang/delat.ts";
import { DAMM } from "./ang/damm.ts";
import { Eldflugor, FagelFlyg, Fjarilar, Forgrund, Glitter, GrasTuvor, Ljusflackar, Moln, Nackrosor, Ringar, Solkorn, Sond, Stenar, TradOchBlommor, VindGras } from "./ang/dekor.tsx";
import { Skogsstig, SpokHus } from "./ang/byggnader.tsx";
import { Trollring } from "./ang/Trollring.tsx";
import { Hemdalen } from "./dal/Hemdalen.tsx";
import { DalKamera } from "./dal/DalKamera.tsx";
import { DALEN } from "./dal/tomter.ts";
import { DjurIScen } from "./ang/djur.tsx";
import { Bengtsson3D } from "./ang/Bengtsson3D.tsx";
import { Himmel, SvajMark } from "./ang/himmel.tsx";
import { Parallax } from "./ang/Parallax.tsx";
import { KameraRam } from "./ang/kamera.tsx";
import { PlatsScen } from "./ang/PlatsDekor.tsx";
import { START_PLATS, platsMed } from "./platser.ts";
import { SagaBoll, SagaKamera, SagaKanin, SagaLjus, SagaPenna, type OrbitStyr } from "./ang/saga.tsx";
import { KameraFokus } from "./ang/fokus.tsx";
import { Vagvisare3D, VagvisareProjektor, type VagvisarePlatsId, type VagvisareSkarmPunkt } from "./ang/Vagvisare3D.tsx";
import { FlygKameraV09 } from "./ang/FlygKameraV09.tsx";
import { VarldsIntegrationV09 } from "./ang/VarldsIntegrationV09.tsx";
import { publiceraTredKamera } from "./ang/introFlygFas.ts";
import { KAMERA_ANG } from "./skarm.ts";
import { useStart } from "./start.ts";
import { IdPass } from "./ang/idpass.tsx";
import { forbattraModellMaterial, useSagomiljo } from "./grafikKvalitet.ts";
import { KvallsLjus } from "./ang/kvall.tsx";
import { kvallsTon } from "./ang/kvallTon.ts";

/** B6.3 (I): ängens zoner (dammen) ur data/platser.json – djur, figurer och saker hålls ur dammen, simmare i den. */
const ANG_PLATS = platsMed(START_PLATS);

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
  componentDidCatch() {
    useStart.getState().redo(); // utan 3D ska försidan ändå släppa fram spelet
  }
  render() {
    return this.state.fel ? null : this.props.children;
  }
}


function VagvisareLager({ plats, onValj, onPunkter }: { plats: VagvisarePlatsId; onValj?: (id: VagvisarePlatsId) => void; onPunkter?: (p: VagvisareSkarmPunkt[]) => void }) {
  if (!onValj || !onPunkter) return null;
  return (
    <>
      <VagvisareProjektor plats={plats} onPunkter={onPunkter} />
      <Suspense fallback={null}>
        <Vagvisare3D plats={plats} onValjPlats={onValj} />
      </Suspense>
    </>
  );
}

function Scen({ natt, onSnart, saga, aktivPlats = "ang", onValjPlats, onVagvisarePunkter, vyFlygAktiv = false, resaMal = null, dalEtiketter = false }: { natt: number; onSnart: () => void; saga: boolean; aktivPlats?: VagvisarePlatsId; onValjPlats?: (id: VagvisarePlatsId) => void; onVagvisarePunkter?: (p: VagvisareSkarmPunkt[]) => void; vyFlygAktiv?: boolean; resaMal?: VagvisarePlatsId | null; dalEtiketter?: boolean }) {
  useSagomiljo(natt > 0.55);
  useEffect(() => {
    if (saga) {
      if (!(window as unknown as { __tredKamera?: unknown }).__tredKamera) publiceraTredKamera(0, 14.5, 22, 0);
      return;
    }
    publiceraTredKamera(KAMERA_ANG[0], KAMERA_ANG[1], KAMERA_ANG[2], 0);
  }, [saga]);
  const scenGraf = useThree((s) => s.scene);
  const grafVarv = useRef(0);
  useFrame(() => {
    grafVarv.current += 1;
    if (grafVarv.current !== 1 && grafVarv.current % 40 !== 0) return;
    forbattraModellMaterial(scenGraf);
  });
  // Block 4: djur som flyttat in i ett bygge ritas vid sitt hem i Hemdalen (dal/Boende.tsx), inte bland djuren på ängen.
  const djur = useMinne((s) => s.ang);
  // `vis` styr introts natt (sagaNatt i Himmel/SagaLjus). Kvällen utanför introt sköts av KvallsLjus och `kvall`.
  const vis = 0;
  const kvall = saga ? 0 : kvallsTon(natt);
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
  if (plats !== START_PLATS && !saga) {
    return (
      <>
        <hemisphereLight args={["#FFF8E1", "#7CB342", 0.65]} />
        <VindGras />
        <Solkorn />
        <PlatsScen plats={plats} />
        <VagvisareLager plats={aktivPlats} onValj={onValjPlats} onPunkter={onVagvisarePunkter} />
        <FlygKameraV09 introAktiv={saga} vyFlygAktiv={vyFlygAktiv} resaMal={resaMal} />
      </>
    );
  }
  return (
    <>
      <color attach="background" args={[himmel]} />
      <fog attach="fog" args={[MILJO.dis.farg, MILJO.dis.nara, MILJO.dis.fjarran]} />
      <Himmel natt={vis} kvall={kvall} />
      <Parallax natt={saga ? 0 : natt} />
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
        shadow-bias={-0.00012}
        shadow-normalBias={0.025}
        shadow-radius={3}
      />
      <directionalLight ref={fyll} color={L.fyll.farg} position={[-6, 3, 4]} intensity={L.fyll.styrka} />
      <directionalLight ref={kantL} color={L.kant.farg} position={[-2, 4, -5]} intensity={L.kant.styrka} />
      <SagaLjus natt={vis} amb={amb} hem={hem} dir={dir} sol={sol} fyll={fyll} kant={kantL} />
      <KvallsLjus natt={natt} aktiv={!saga} hem={hem} dir={dir} fyll={fyll} kant={kantL} />
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
      <VindGras />
      <Solkorn />
      <NaturGren>
        <Suspense fallback={null}>
          <KenneyNatur />
        </Suspense>
      </NaturGren>
      <VarldsIntegrationV09 introAktiv={saga} vyFlygAktiv={vyFlygAktiv} resaMal={resaMal} plats={aktivPlats} onValjPlats={onValjPlats} onPunkter={onVagvisarePunkter} dalEtiketter={dalEtiketter} />
      {!saga ? (
        <Suspense fallback={null}>
          <Bengtsson3D />
        </Suspense>
      ) : null}
      <Ljusflackar />
      {/* B6.3 (G): vattnet över markens svaj (ang/damm.ts) */}
      <mesh name="damm-vatten" rotation={[-Math.PI / 2, 0, 0]} position={[DAMM.x, DAMM.y, DAMM.z]}>
        <circleGeometry args={[DAMM.r, 20]} />
        <meshStandardMaterial color="#4FC3E8" roughness={0.22} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[DAMM.x, DAMM.y + 0.01, DAMM.z]}>
        <ringGeometry args={[0.64, DAMM.kant, 20]} />
        <meshBasicMaterial color="#B3E5FC" side={THREE.DoubleSide} />
      </mesh>
      <Ringar />
      <Glitter />
      <Fjarilar />
      <Eldflugor natt={saga ? vis : natt} />
      <SpokHus onSnart={onSnart} />
      <Skogsstig onSnart={onSnart} />
      {!saga ? <Hemdalen natt={natt} /> : null}
      {!saga ? <Trollring /> : null}
      {djur.map((spec) => (
        <DjurIScen key={spec.uid} spec={spec} alla={djur} plats={ANG_PLATS} />
      ))}
      <Sond />
      <SagaPenna />
      <SagaBoll />
      <SagaKanin />
      <OrbitControls
        ref={styr as never}
        enabled={!saga && !vyFlygAktiv && resaMal == null}
        enableRotate={false}
        enablePan
        screenSpacePanning={false}
        panSpeed={1.1}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={1.42}
        minPolarAngle={0.85}
        minDistance={DALEN.kamera.avstand[0]}
        maxDistance={DALEN.kamera.avstand[1]}
        target={[0, 1.05, -0.15]}
        zoomSpeed={0.75}
        touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
        mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
      />
      <DalKamera styr={styr} aktiv={!saga && !vyFlygAktiv && resaMal == null} />
      <SagaKamera styr={styr} />
      <KameraRam styr={styr} />
      <KameraFokus styr={styr} plats={ANG_PLATS} />
    </>
  );
}

export function Angen3D({ natt, saga = false, onGrind, aktivPlats = "ang", onValjPlats, onVagvisarePunkter, vyFlygAktiv = false, resaMal = null, dalEtiketter = false }: { natt: number; saga?: boolean; onGrind?: () => boolean; aktivPlats?: VagvisarePlatsId; onValjPlats?: (id: VagvisarePlatsId) => void; onVagvisarePunkter?: (p: VagvisareSkarmPunkt[]) => void; vyFlygAktiv?: boolean; resaMal?: VagvisarePlatsId | null; dalEtiketter?: boolean }) {
  const djur = useMinne((s) => s.ang);
  const garden = useMinne((s) => s.garden);
  const interagerat = useMinne((s) => s.dragit);
  const plats = useMinne((s) => s.plats);
  const [prat, setPrat] = useState(false);
  const [dpr, setDpr] = useState<[number, number] | number>([1, KV.dpr_max]);
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
  useEffect(() => {
    brygga.registrera("ang", {
      platser: () => {
        const s = useMinne.getState();
        const lista = s.plats === START_PLATS ? s.ang : (s.platsSkapelser[s.plats] ?? []);
        return lista.map((a) => {
          const p = malTillDuk(a.uid);
          const x = p?.x ?? 0.5;
          const y = p?.y ?? 0.5;
          return { uid: a.uid, x, y, topp: p ? Math.max(0.08, p.y - 0.14) : 0.45 };
        });
      },
      skapa: () => undefined,
      taBort: () => undefined,
      puff: () => undefined,
      tom: () => undefined,
      visa: () => undefined,
    });
    return () => {
      brygga.registrera("ang", null);
    };
  }, []);
  const onSnart = useCallback(() => {
    if (onGrind && onGrind()) return;
    setPrat(true);
    if (dolj.current) window.clearTimeout(dolj.current);
    dolj.current = window.setTimeout(() => setPrat(false), 2400);
  }, [onGrind]);
  return (
    <div ref={rot} className="angen-3d" data-testid="angen-3d" data-v9b-r3f="adaptive-bvh" data-v9b-dpr={Array.isArray(dpr) ? dpr.join("-") : String(dpr)} style={{ "--grad-m": KV.farggrad ? MILJO.farggrad.mattnad : 1, "--grad-k": KV.farggrad ? MILJO.farggrad.kontrast : 1, "--vinjett": MILJO.vinjett.styrka } as React.CSSProperties} data-djur={djur.length} data-byggen={garden.length} data-saga={saga ? "ja" : "nej"} data-plats={plats}>
      {!saga && !interagerat && djur.length > 0 ? (
        <p className="tred-hint" data-testid="tred-hint">
          {HINT}
        </p>
      ) : null}
      {prat ? (
        <p className="teaser-bubbla" data-testid="kommer-snart">
          {SNART}
        </p>
      ) : null}
      <TredGren>
        <Canvas
          camera={{ position: [0, 4.15, 9.8], fov: 58, near: 0.1, far: 90 }}
          dpr={dpr}
          shadows
          gl={{ antialias: true, powerPreference: "high-performance", toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1 }}
          onCreated={({ gl }) => {
            gl.shadowMap.type = THREE.PCFShadowMap; // three 0.186: PCFSoftShadowMap är borttagen; mjukheten styrs av shadow-radius på ljuset
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                useStart.getState().redo(); // försidan (index.html) väntar på första bilden
                startaBakgrundsForladdning();
              });
            });
          }}
        >
          <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr([1, KV.dpr_max])}>
            <Bvh firstHitOnly>
              <Scen natt={natt} onSnart={onSnart} saga={saga} aktivPlats={aktivPlats} onValjPlats={onValjPlats} onVagvisarePunkter={onVagvisarePunkter} vyFlygAktiv={vyFlygAktiv} resaMal={resaMal} dalEtiketter={dalEtiketter} />
            </Bvh>
          </PerformanceMonitor>
          <IdPass />
        </Canvas>
      </TredGren>
      <div className="vinjett" aria-hidden />
    </div>
  );
}
