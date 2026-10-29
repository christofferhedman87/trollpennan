import { Html } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { Component, Suspense, useEffect, useMemo, type ReactNode } from "react";
import { InstansModell } from "../kenneyNatur.tsx";
import { forladdaNarLedig } from "../modeller/forladda.ts";
import { DAL_ETIKETTER } from "./IntroFlygning.tsx";
import { DAL_ETIKETT_POS, RESMAL, type ResmalId } from "./varldsKarta.ts";

export const MIN_HORISONT_RADIE = 5.2;

export type HorisontZon = "skogen" | "sjon" | "grottan" | "garden";

/** x, y, z, skala, rotation. InstansModell tar [x, z, skala, rotation, sänkning]. */
type Rad = readonly [number, number, number, number, number];

type ModellRad = { url: string; platser: readonly Rad[]; farger?: Record<string, string> };

type ZonRad = { zon: HorisontZon; rader: readonly ModellRad[] };

// Platserna ligger i en solfjäder bakom ängen så att de syns i startvyn (se varldsKarta.ts). Rad: x, y, z, höjd (m), rotation.
const SKOG: ModellRad[] = [
  {
    url: "/models/bulk/w-gran-1-cc0.glb",
    farger: { leaves: "#2e6f36", leafsDark: "#2e6f36" },
    platser: [[-1.6, 0, -13.6, 2.7, 0.3], [-2.6, 0, -14.4, 3.2, 1.7], [-3.7, 0, -13.5, 2.9, 2.4], [-4.5, 0, -15.6, 3.5, 0.9], [-2.0, 0, -16.4, 3.4, 2.0], [-3.4, 0, -17.2, 3.7, 1.1]],
  },
  {
    url: "/models/natur/tree_pineRoundA.glb",
    farger: { leaves: "#2b6832", leafsDark: "#2b6832" },
    platser: [[-1.1, 0, -15.0, 2.4, 0.4], [-4.9, 0, -14.0, 2.7, 1.4], [-2.9, 0, -18.4, 3.2, 2.2]],
  },
  {
    url: "/models/natur/mushroom_redGroup.glb",
    platser: [[-2.05, 0, -11.9, 0.55, 0.3], [-3.0, 0, -12.1, 0.5, 1.5]],
  },
];

const SJO: ModellRad[] = [
  { url: "/models/bulk/segelbat.glb", platser: [[2.95, -0.02, -10.3, 1.7, 0.6]] },
  { url: "/models/bulk/brygga.glb", platser: [[1.95, 0, -9.15, 1.1, 0.2]] },
  { url: "/models/bulk/vass.glb", platser: [[3.75, 0, -9.1, 0.75, 0.4], [1.55, 0, -10.3, 0.65, 1.8], [3.6, 0, -11.0, 0.7, 2.6]] },
  { url: "/models/natur/lily_large.glb", platser: [[2.2, 0.02, -10.0, 0.55, 0.3], [3.2, 0.02, -9.4, 0.6, 1.2]] },
  { url: "/models/natur/rock_smallA.glb", platser: [[1.35, 0, -9.3, 0.6, 0.5], [4.05, 0, -10.1, 0.7, 1.8]] },
];

const GROTTA: ModellRad[] = [
  { url: "/models/bulk/w-grottport-cc0.glb", platser: [[2.5, -0.05, -15.2, 3.0, 0]] },
  {
    url: "/models/natur/rock_largeA.glb",
    farger: { rock: "#6e7385", stone: "#6e7385", dirt: "#6e7385", grass: "#868b9c" },
    platser: [[0.8, 0, -14.4, 1.9, 0.4], [4.3, 0, -14.1, 2.3, 1.3], [4.9, 0, -16.2, 3.0, 2.1]],
  },
  {
    url: "/models/bulk/w-kristall-kluster-cc0.glb",
    farger: { crystal: "#b88cff", stone: "#9d72f2", rock: "#9d72f2", rockTrack: "#cbb6ee" },
    platser: [[1.45, 0, -12.9, 0.95, 0.2], [3.35, 0, -13.1, 1.15, 1.4], [1.0, 0, -13.6, 0.7, 2.3]],
  },
];

const GARD: ModellRad[] = [
  { url: "/models/bulk/w-lada-cc0.glb", platser: [[-3.3, 0, -9.4, 2.6, 0.45]] },
  { url: "/models/bulk/w-vaderkvarn-cc0.glb", platser: [[-4.5, 0, -12.0, 4.6, 0.35]] },
  {
    url: "/models/natur/fence_simple.glb",
    farger: { wood: "#c89658" },
    platser: [[-2.2, 0, -8.1, 1.0, 0.25], [-2.95, 0, -7.9, 1.0, 0.1], [-1.9, 0, -8.85, 1.0, -1.3]],
  },
];

const KULLAR: ModellRad[] = [
  {
    url: "/models/bulk/w-kulle-cc0.glb",
    farger: { grass: "#6d9256", default: "#6d9256", material: "#6d9256" },
    platser: [[-18, -0.25, -18, 14, 0.4], [0, -0.3, -23, 18, 1.2], [18, -0.25, -17, 15, 2.1], [-22, -0.25, -5, 13, 0.8], [22, -0.25, -5, 12, 1.7], [-11, -0.25, -21, 16, 2.6], [11, -0.25, -20, 16, 0.2]],
  },
  {
    url: "/models/bulk/w-berg-cc0.glb",
    farger: { material: "#7d8794" },
    platser: [[14, -0.3, -24, 18, 0.5], [-15, -0.3, -25, 17, 1.9], [2, -0.35, -28, 20, 1.1]],
  },
];

const ZONER: readonly ZonRad[] = [
  { zon: "skogen", rader: SKOG },
  { zon: "sjon", rader: SJO },
  { zon: "grottan", rader: GROTTA },
  { zon: "garden", rader: GARD },
];

const HORISONT_URLS = [...ZONER.flatMap((z) => z.rader.map((r) => r.url)), ...KULLAR.map((r) => r.url)];

function somPlats(rader: readonly Rad[]): [number, number, number, number, number][] {
  return rader.map(([x, y, z, skala, rot]) => {
    const hojd = skala === 0 ? 1 : skala;
    const plats: [number, number, number, number, number] = [x, z, hojd, rot, -y / hojd];
    return plats;
  });
}

export function horisontPositioner(): { zon: HorisontZon; x: number; z: number }[] {
  const ut: { zon: HorisontZon; x: number; z: number }[] = [];
  for (const grupp of ZONER) {
    for (const rad of grupp.rader) {
      for (const [x, , z] of rad.platser) ut.push({ zon: grupp.zon, x, z });
    }
  }
  return ut;
}

function ModellRader({ rader }: { rader: readonly ModellRad[] }) {
  return (
    <>
      {rader.map((rad) => (
        <InstansModell key={rad.url} url={rad.url} platser={somPlats(rad.platser)} farger={rad.farger} cull />
      ))}
    </>
  );
}

function HorisontKullar() {
  return (
    <group userData={{ "data-w2-zon": "kullar" }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
        <ringGeometry args={[4.8, 46, 64]} />
        <meshStandardMaterial color="#68b04c" roughness={0.95} metalness={0} />
      </mesh>
      <ModellRader rader={KULLAR} />
    </group>
  );
}

type ValjPlats = (id: ResmalId) => void;

/** Ett tryck på platsen i fjärran reser dit, precis som skylten. Ett drag (vrida vyn) räknas inte som tryck. */
function tryckPa(id: ResmalId, onValj?: ValjPlats) {
  return (e: ThreeEvent<MouseEvent>) => {
    if (!onValj || e.delta > 12) return;
    e.stopPropagation();
    onValj(id);
  };
}

function pekare(pa: boolean) {
  if (typeof document !== "undefined") document.body.style.cursor = pa ? "pointer" : "";
}

/** Träffytans radie och höjd per plats. Sjön är platt och får en låg yta, annars tar den tryck som är menade för
 *  grottan bakom den i bild. */
const TRAFF: Record<ResmalId, { r: number; h: number }> = {
  skogen: { r: 1.9, h: 4.2 },
  grottan: { r: 1.9, h: 4.2 },
  garden: { r: 1.6, h: 3.0 },
  sjon: { r: 1.9, h: 0.7 },
};

/** Osynlig, större träffyta runt varje plats så att även ett barnfinger på en liten plats i fjärran träffar. */
function Traffyta({ id, onValj }: { id: ResmalId; onValj?: ValjPlats }) {
  const r = RESMAL.find((x) => x.id === id);
  if (!r || !onValj) return null;
  const { r: radie, h } = TRAFF[id];
  return (
    <mesh position={[r.mal[0], h / 2, r.mal[1]]} onClick={tryckPa(id, onValj)} onPointerOver={() => pekare(true)} onPointerOut={() => pekare(false)}>
      <cylinderGeometry args={[radie, radie, h, 12]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
  );
}

/** Sjöns vatten (förut en skiva långt utanför bild). */
function SjoVatten() {
  const r = RESMAL.find((x) => x.id === "sjon");
  if (!r) return null;
  return (
    <group position={[r.mal[0], 0.05, r.mal[1]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.65, 32]} />
        <meshStandardMaterial color="#4FC3E8" roughness={0.25} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[1.5, 1.75, 32]} />
        <meshBasicMaterial color="#B3E5FC" />
      </mesh>
    </group>
  );
}

/** Platsnamnen i flygvyn ("Se hela dalen" och introts flygning) sitter fast i platserna i stället för på fasta skärmprocent. */
// drei Html väljer sitt mål-element (events.connected ?? canvasens förälder) vid montering. När målet byts direkt
// efter monteringen skapar Html en ny React-rot i samma element och den gamla rotens avmontering kastar
// "removeChild … is not a child of this node". Ett fast mål (canvasens förälder) undviker det. Etiketterna monteras
// dessutom alltid och visar bara texten när flygvyn är på.
function DalEtiketter({ synlig }: { synlig: boolean }) {
  const gl = useThree((s) => s.gl);
  const mal = useMemo(() => ({ current: gl.domElement.parentElement as HTMLElement }), [gl]);
  return (
    <>
      {DAL_ETIKETTER.filter((e) => e.id !== "garden").map((e) => {
        const pos = DAL_ETIKETT_POS[e.id];
        return (
          <Html key={e.id} position={[pos[0], pos[1], pos[2]]} center portal={mal} zIndexRange={[4, 0]} style={{ pointerEvents: "none" }}>
            {synlig ? <span className="tp-dal-etikett" data-w4="flyg-etikett" data-plats={e.id}>{e.namn}</span> : null}
          </Html>
        );
      })}
    </>
  );
}

function HorisontScen({ onValj }: { onValj?: ValjPlats }) {
  return (
    <>
      {ZONER.map((grupp) => (
        <group key={grupp.zon} userData={{ "data-w2-zon": grupp.zon }} onClick={grupp.zon === "garden" ? undefined : tryckPa(grupp.zon, onValj)}>
          <ModellRader rader={grupp.rader} />
          {grupp.zon === "sjon" ? <SjoVatten /> : null}
          <Traffyta id={grupp.zon} onValj={onValj} />
        </group>
      ))}
      <HorisontKullar />
    </>
  );
}

class HorisontGren extends Component<{ children: ReactNode }, { fel: boolean }> {
  state = { fel: false };
  static getDerivedStateFromError() {
    return { fel: true };
  }
  render() {
    return this.state.fel ? null : this.props.children;
  }
}

export function HorisontVarld({ onValjPlats, etiketter = false }: { onValjPlats?: ValjPlats; etiketter?: boolean }) {
  useEffect(() => {
    forladdaNarLedig(HORISONT_URLS);
    const w = window as unknown as { __tredHorisont?: Record<string, boolean> };
    w.__tredHorisont = { skogen: true, sjon: true, grottan: true, garden: true, kullar: true };
    return () => {
      delete w.__tredHorisont;
    };
  }, []);
  return (
    <HorisontGren>
      <Suspense fallback={null}>
        <HorisontScen onValj={onValjPlats} />
      </Suspense>
      <DalEtiketter synlig={etiketter} />
    </HorisontGren>
  );
}
