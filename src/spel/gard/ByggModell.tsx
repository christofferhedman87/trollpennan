import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import type { Object3D } from "three";
import gard3d from "../../../data/gard-3d.json" with { type: "json" };
import type { SparatBygge } from "../bygge.ts";
import { belysScen } from "../belys.ts";
import { brygga } from "../brygga.ts";
import { arKantBygge, cellTillVarld, kantNyckel, kantTillVarld, xyTillCell } from "./rutnat.ts";
import {
  arReserv,
  byggRad,
  egnaMaterial,
  kantMitt,
  kanterForEtt,
  passaByggnad,
  skarmPunkt,
  skuggaUtanTraff,
  slappMaterial,
  staketFil,
  type ReservSlag,
} from "./modellPrep.ts";
import { ReservForm, StaketReserv } from "./ReservForm.tsx";

const FILER = new Set<string>([gard3d.staket.enkelFil, gard3d.staket.grindFil]);
for (const rad of Object.values(gard3d.byggnader)) if (rad.fil) FILER.add(rad.fil);
for (const d of gard3d.dekor) FILER.add(d.fil);
for (const fil of FILER) useGLTF.preload(fil);

class ModellGren extends Component<{ children: ReactNode; reserv: ReactNode }, { fel: boolean }> {
  state = { fel: false };
  static getDerivedStateFromError() {
    return { fel: true };
  }
  render() {
    return this.state.fel ? this.props.reserv : this.props.children;
  }
}

function KlonadScen({
  url,
  malhojd,
  fargHex,
  passa,
}: {
  url: string;
  malhojd: number;
  fargHex: string | null;
  passa: boolean;
}) {
  const gltf = useGLTF(url);
  const [scen, setScen] = useState<Object3D | null>(null);
  useEffect(() => {
    belysScen(gltf.scene);
    const k = gltf.scene.clone(true);
    // Staket behåller lokal z = -0.5. Bara byggnader och höbalar passas in.
    if (passa) passaByggnad(k, malhojd);
    egnaMaterial(k, fargHex);
    skuggaUtanTraff(k);
    setScen(k);
    return () => slappMaterial(k);
  }, [gltf.scene, malhojd, fargHex, passa]);
  if (!scen) return null;
  return <primitive object={scen} />;
}

function TryckYta({
  uid,
  formel,
  boende,
  punkt,
  flyttar,
  children,
}: {
  uid: string;
  formel: string;
  boende: number;
  punkt: readonly [number, number, number];
  flyttar: boolean;
  children: ReactNode;
}) {
  const camera = useThree((s) => s.camera);
  const timer = useRef<number | null>(null);
  const skickad = useRef(false);
  const nere = useRef(false);
  useEffect(
    () => () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    },
    [],
  );
  const lang = () => {
    const p = skarmPunkt(punkt[0], punkt[1], punkt[2], camera);
    brygga.skicka({ typ: "byggLang", uid, x: p.x, y: p.y });
    skickad.current = true;
  };
  return (
    <group
      onPointerDown={(e) => {
        if (flyttar) return;
        e.stopPropagation();
        if (nere.current) return;
        nere.current = true;
        skickad.current = false;
        if (timer.current != null) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(lang, 400);
      }}
      onPointerUp={(e) => {
        if (flyttar) return;
        e.stopPropagation();
        if (!nere.current) return;
        nere.current = false;
        if (timer.current != null) window.clearTimeout(timer.current);
        timer.current = null;
        if (skickad.current) {
          skickad.current = false;
          return;
        }
        const p = skarmPunkt(punkt[0], punkt[1], punkt[2], camera);
        if (boende === 0) brygga.skicka({ typ: "byggLang", uid, x: p.x, y: p.y });
        else brygga.skicka({ typ: "hemTryck", uid, text: formel, x: p.x, y: p.y });
      }}
      onPointerCancel={() => {
        nere.current = false;
        if (timer.current != null) window.clearTimeout(timer.current);
        timer.current = null;
      }}
    >
      {children}
    </group>
  );
}

function slagFor(reserv: string | undefined): ReservSlag {
  if (reserv && arReserv(reserv)) return reserv;
  return "hus";
}

function StaketBit({ b, flyttar }: { b: SparatBygge; flyttar: boolean }) {
  const fil = staketFil(b);
  const farg = b.fargHex ?? "#ffffff";
  const boende = b.boende.length;
  return (
    <>
      {kanterForEtt(b).map((k) => {
        const v = kantTillVarld(k);
        const punkt = kantMitt(v.wx, v.wz, v.rotY, 0.45);
        return (
          <TryckYta
            key={kantNyckel(k)}
            uid={b.uid}
            formel={b.formel}
            boende={boende}
            punkt={punkt}
            flyttar={flyttar}
          >
            <group position={[v.wx, 0, v.wz]} rotation={[0, v.rotY, 0]}>
              <Suspense fallback={<StaketReserv farg={farg} />}>
                <ModellGren reserv={<StaketReserv farg={farg} />}>
                  <KlonadScen url={fil} malhojd={0} fargHex={b.fargHex} passa={false} />
                </ModellGren>
              </Suspense>
              <mesh position={[0, 0.35, -0.5]}>
                <boxGeometry args={[0.96, 0.7, 0.28]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
            </group>
          </TryckYta>
        );
      })}
    </>
  );
}

function HusBit({ b, flyttar }: { b: SparatBygge; flyttar: boolean }) {
  const rad = byggRad(b.bygg);
  const hojd = rad?.malhojd ?? 1;
  const farg = b.fargHex ?? rad?.farg ?? "#E57373";
  const slag = slagFor(rad?.reserv);
  const cell = xyTillCell(b.x, b.y);
  const { wx, wz } = cellTillVarld(cell.gx, cell.gz);
  const reserv = <ReservForm slag={slag} farg={farg} hojd={hojd} />;
  return (
    <TryckYta
      uid={b.uid}
      formel={b.formel}
      boende={b.boende.length}
      punkt={[wx, hojd * 0.65, wz]}
      flyttar={flyttar}
    >
      <group position={[wx, 0, wz]}>
        {rad?.fil ? (
          <Suspense fallback={reserv}>
            <ModellGren reserv={reserv}>
              <KlonadScen url={rad.fil} malhojd={hojd} fargHex={b.fargHex} passa />
            </ModellGren>
          </Suspense>
        ) : (
          reserv
        )}
        <mesh position={[0, hojd / 2, 0]}>
          <boxGeometry args={[0.92, Math.max(hojd, 0.4), 0.92]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </TryckYta>
  );
}

export function ByggeModell({ b, flyttar }: { b: SparatBygge; flyttar: boolean }) {
  if (arKantBygge(b.bygg)) return <StaketBit b={b} flyttar={flyttar} />;
  return <HusBit b={b} flyttar={flyttar} />;
}

export function DekorHobalar() {
  return (
    <>
      {gard3d.dekor.map((d) => (
        <group key={`${d.wx},${d.wz}`} position={[d.wx, 0, d.wz]} rotation={[0, d.rotY, 0]}>
          <Suspense fallback={null}>
            <ModellGren reserv={null}>
              <KlonadScen url={d.fil} malhojd={d.malhojd} fargHex={null} passa />
            </ModellGren>
          </Suspense>
        </group>
      ))}
    </>
  );
}
