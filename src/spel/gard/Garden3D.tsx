import { Bounds, OrthographicCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import gard3dJson from "../../../data/gard-3d.json" with { type: "json" };
import { fonsterAntalForBygge, takFargForBygge } from "../bygge.ts";
import { brygga } from "../brygga.ts";
import { KV, MILJO } from "../miljo.ts";
import { useMinne } from "../minne.ts";
import { GltfSak } from "../gltfDjur.tsx";
import { GARDS_UPPGRADERINGAR, SolstjarnaPlopp } from "../solstjarna.ts";
import { ByggeModell, DekorHobalar } from "./ByggModell.tsx";
import { GardDjurLista } from "./GardDjur.tsx";
import { Solkorn, VindGras } from "../ang/dekor.tsx";
import { MarkPlan } from "./MarkPlan.tsx";
import { useSagomiljo } from "../grafikKvalitet.ts";
import type { VagvisarePlatsId, VagvisareSkarmPunkt } from "../ang/Vagvisare3D.tsx";
import { synkaTestSparning, varldTillNorm, type GardDjurSnap } from "./vandra.ts";
import {
  CELL_STORLEK,
  GARD_BREDD,
  GARD_DJUP,
  arKantBygge,
  cellTillXy,
  hittaSlutnaHagar,
  kantTillXy,
  kanterForByggen,
  varldTillCell,
  varldTillKant,
  xyTillCell,
  xyTillKant,
  type CellPlats,
  type KantPlats,
  type SlutenHage,
} from "./rutnat.ts";

export type Gard3dDiag = {
  aktiv: boolean;
  celler: { bredd: number; djup: number };
  byggen: {
    uid: string;
    bygg: string;
    cell: CellPlats | null;
    kant: KantPlats | null;
    modellFil: string | null;
    fargHex: string | null;
    takFargHex: string | null;
    wallsColorHex: string;
    roofColorHex: string;
    fonsterAntal: number;
    synligaFonsterNoder: string[];
    storlekId: "liten" | "stor" | null;
    formel: string;
    reservAktiv?: boolean;
    skarmBox?: { x: number; y: number; width: number; height: number };
  }[];
  kanter: KantPlats[];
  hagar: SlutenHage[];
  djur: GardDjurSnap[];
};

if (typeof window !== "undefined") synkaTestSparning(useMinne, window.localStorage);

declare global {
  interface Window {
    __gard3d?: Gard3dDiag;
  }
}

class WebbGren extends Component<{ children: ReactNode }, { fel: boolean }> {
  state = { fel: false };
  static getDerivedStateFromError() {
    return { fel: true };
  }
  render() {
    if (this.state.fel) return <p className="garden-reserv">Gården vilar en stund.</p>;
    return this.props.children;
  }
}

const SOL_MODELL: Record<string, string> = {
  "hage-soltak": "parasoll",
  musikfontan: "fontan",
  "kristall-lykta": "lykta",
  "studsbolls-korg": "studsboll",
};

function SolGard() {
  const sol = useMinne((s) => s.solstjarnor ?? 0);
  const sidor = useMinne((s) => s.byggSidor);
  return (
    <group name="Soltak till hagen Musikfontän Kristall-lykta Studsbolls-korg">
      <SolstjarnaPlopp />
      {GARDS_UPPGRADERINGAR.map((u, i) =>
        sidor.includes(u.id) || sidor.includes("solgard") || sol >= u.kostnad ? (
          <group key={u.id} name={u.id} position={[-1.8 + i * 1.15, 0, -3.2]} userData={{ namn: u.namn }}>
            <Suspense fallback={null}>
              <GltfSak id={SOL_MODELL[u.id] ?? "lykta"} />
            </Suspense>
          </group>
        ) : null,
      )}
    </group>
  );
}

function ljusPos(v: readonly number[]): [number, number, number] {
  return [v[0] ?? 3, v[1] ?? 6, v[2] ?? 5];
}

function Scen({
  garden,
  kanter,
  hagar,
  flyttarUid,
  setFlyttarUid,
}: {
  garden: ReturnType<typeof useMinne.getState>["garden"];
  kanter: KantPlats[];
  hagar: SlutenHage[];
  flyttarUid: string | null;
  setFlyttarUid: (uid: string | null) => void;
}) {
  useSagomiljo(false);
  const L = MILJO.ljus;
  return (
    <>
      <color attach="background" args={[MILJO.himmel.bakgrund]} />
      <fog attach="fog" args={[MILJO.dis.farg, MILJO.dis.nara, MILJO.dis.fjarran]} />
      <OrthographicCamera
        makeDefault
        position={[10, 12, 10]}
        zoom={48}
        near={-40}
        far={80}
        onUpdate={(c) => {
          c.position.set(10, 12, 10);
          c.lookAt(0, 0.15, 0.25);
        }}
      />
      <ambientLight intensity={L.ambient.styrka} color={L.ambient.farg} />
      <hemisphereLight args={[L.hemi.himmel, L.hemi.mark, L.hemi.styrka]} />
      <hemisphereLight args={["#FFF8E1", "#7CB342", 0.38]} />
      <VindGras />
      <Solkorn />
      <directionalLight
        color={L.nyckel.farg}
        intensity={L.nyckel.styrka}
        position={ljusPos(L.nyckel.position)}
        castShadow
        shadow-mapSize-width={KV.skuggkarta}
        shadow-mapSize-height={KV.skuggkarta}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0004}
      />
      <directionalLight color={L.fyll.farg} position={[-4, 3, 2]} intensity={L.fyll.styrka} />
      <Bounds fit clip observe margin={0.86} maxDuration={0.01}>
        <mesh visible={false} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[GARD_BREDD * CELL_STORLEK, GARD_DJUP * CELL_STORLEK]} />
        </mesh>
      </Bounds>
      <MarkPlan
        garden={garden}
        hagar={hagar}
        kanter={kanter}
        flyttarUid={flyttarUid}
        onValj={(e) => {
          if (!flyttarUid) return;
          const b = garden.find((x) => x.uid === flyttarUid);
          if (!b) return;
          e.stopPropagation();
          const cell = varldTillCell(e.point.x, e.point.z);
          const pos = arKantBygge(b.bygg)
            ? kantTillXy(varldTillKant(e.point.x, e.point.z))
            : cellTillXy(cell.gx, cell.gz);
          brygga.skicka({ typ: "byggd", uid: flyttarUid, x: pos.x, y: pos.y });
          setFlyttarUid(null);
        }}
      />
      <Suspense fallback={null}>
        <DekorHobalar />
      </Suspense>
      {garden.map((b) => (
        <ByggeModell key={b.uid} b={b} flyttar={flyttarUid !== null} />
      ))}
      <SolGard />
      <GardDjurLista garden={garden} hagar={hagar} kanter={kanter} />
    </>
  );
}

export function Garden3D({ onValjPlats, onVagvisarePunkter }: { onValjPlats?: (id: VagvisarePlatsId) => void; onVagvisarePunkter?: (p: VagvisareSkarmPunkt[]) => void } = {}) {
  if (typeof window !== "undefined") synkaTestSparning(useMinne, window.localStorage);
  const garden = useMinne((s) => s.garden);
  const hemma = useMinne((s) => s.hemma);
  const rotRef = useRef<HTMLDivElement>(null);
  const [flyttarUid, setFlyttarUid] = useState<string | null>(null);
  const kanter = useMemo(() => kanterForByggen(garden), [garden]);
  const hagar = useMemo(() => hittaSlutnaHagar(kanter), [kanter]);

  useEffect(() => {
    rotRef.current?.setAttribute("data-testid", "garden-3d");
    brygga.registrera("gard", {
      flytta: (uid) => setFlyttarUid(uid),
      platser: () => {
        const s = useMinne.getState();
        const djur = window.__gard3d?.djur ?? [];
        if (djur.length > 0) {
          return djur.map((d) => {
            const p = varldTillNorm(d.wx, d.wz);
            return { uid: d.uid, x: p.x, y: p.y, topp: Math.max(0.08, p.y - 0.14) };
          });
        }
        if (s.hemma.length === 0) return [];
        return s.hemma.map((h) => {
          const hem = s.garden.find((g) => g.uid === h.hem);
          const x = hem?.x ?? 0.5;
          const y = hem?.y ?? 0.5;
          return { uid: h.spec.uid, x, y, topp: Math.max(0.08, y - 0.14) };
        });
      },
      skapa: () => undefined,
      taBort: () => undefined,
      puff: () => undefined,
      tom: () => setFlyttarUid(null),
      visa: () => undefined,
      synka: () => undefined,
    });
    brygga.skicka({ typ: "redo" });
    return () => {
      brygga.registrera("gard", null);
    };
  }, []);

  useEffect(() => {
    if (flyttarUid && !garden.some((b) => b.uid === flyttarUid)) setFlyttarUid(null);
  }, [garden, flyttarUid]);

  useEffect(() => {
    const tidigare = window.__gard3d;
    const fore = tidigare?.byggen ?? [];
    window.__gard3d = {
      aktiv: true,
      celler: { bredd: GARD_BREDD, djup: GARD_DJUP },
      byggen: garden.map((b) => {
        const fonsterAntal = fonsterAntalForBygge(b);
        const takFargHex = takFargForBygge(b);
        const gammal = fore.find((x) => x.uid === b.uid);
        return {
          uid: b.uid,
          bygg: b.bygg,
          cell: arKantBygge(b.bygg) ? null : xyTillCell(b.x, b.y),
          kant: arKantBygge(b.bygg) ? xyTillKant(b.x, b.y) : null,
          modellFil: gard3dJson.byggnader[b.bygg as keyof typeof gard3dJson.byggnader]?.fil ?? null,
          fargHex: b.fargHex,
          takFargHex,
          wallsColorHex: gammal?.wallsColorHex ?? (b.fargHex ?? "#e53935").toLowerCase(),
          roofColorHex: gammal?.roofColorHex ?? (takFargHex ?? b.fargHex ?? "#8d6e63").toLowerCase(),
          fonsterAntal,
          synligaFonsterNoder: gammal?.synligaFonsterNoder ?? (["Window_1", "Window_2", "Window_3", "Window_Side"] as const).filter((_, i) => fonsterAntal >= i + 1),
          storlekId: b.storlekId ?? null,
          formel: b.formel,
          reservAktiv: gammal?.reservAktiv,
          skarmBox: gammal?.skarmBox,
        };
      }),
      kanter,
      hagar,
      djur: Array.isArray(tidigare?.djur) ? tidigare.djur : [],
    };
    return () => {
      const nu = window.__gard3d;
      if (nu) window.__gard3d = { ...nu, aktiv: false };
    };
  }, [garden, kanter, hagar, hemma]);

  const dprMax = Math.min(2, KV.dpr_max);
  return (
    <div ref={rotRef} className="angen-3d garden-3d" data-vy="garden-3d">
      <WebbGren>
        <Canvas
          dpr={[1, dprMax]}
          shadows
          gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1 }}
          onCreated={({ gl }) => {
            gl.shadowMap.type = THREE.PCFShadowMap;
            gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), {
              once: false,
            });
          }}
        >
          <Scen
            garden={garden}
            kanter={kanter}
            hagar={hagar}
            flyttarUid={flyttarUid}
            setFlyttarUid={setFlyttarUid}
          />
        </Canvas>
      </WebbGren>
    </div>
  );
}
