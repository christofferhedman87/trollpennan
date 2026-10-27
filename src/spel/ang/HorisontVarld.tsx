import { Component, Suspense, useEffect, type ReactNode } from "react";
import { InstansModell } from "../kenneyNatur.tsx";
import { forladdaNarLedig } from "../modeller/forladda.ts";

export const MIN_HORISONT_RADIE = 5.2;

export type HorisontZon = "skogen" | "sjon" | "grottan" | "garden";

/** x, y, z, skala, rotation. InstansModell tar [x, z, skala, rotation, sänkning]. */
type Rad = readonly [number, number, number, number, number];

type ModellRad = { url: string; platser: readonly Rad[]; farger?: Record<string, string> };

type ZonRad = { zon: HorisontZon; rader: readonly ModellRad[] };

const SKOG: ModellRad[] = [
  {
    url: "/models/natur/tree_oak.glb",
    farger: { leaves: "#357a38", leafsGreen: "#357a38" },
    platser: [[-7.2, 0, -6.5, 3.2, 0.2], [-9.4, 0, -8.1, 3.8, 1.1], [-11.8, 0, -6.2, 3.5, 2.0], [-6.4, 0, -9.8, 3.1, 0.7], [-13.2, 0, -10.5, 4.1, 1.6], [-8.8, 0, -12.4, 3.9, 2.5]],
  },
  {
    url: "/models/natur/tree_pineRoundA.glb",
    farger: { leaves: "#2b6832", leafsDark: "#2b6832" },
    platser: [[-6.0, 0, -7.8, 3.4, 0.4], [-8.1, 0, -6.0, 3.0, 1.4], [-10.5, 0, -9.6, 4.0, 2.2], [-12.6, 0, -8.0, 3.7, 0.9], [-7.5, 0, -11.2, 3.6, 1.8], [-14.2, 0, -12.0, 4.3, 2.8], [-5.6, 0, -10.4, 3.3, 0.5]],
  },
  {
    url: "/models/bulk/w-gran-1-cc0.glb",
    farger: { leaves: "#2e6f36", leafsDark: "#2e6f36" },
    platser: [[-6.8, 0, -8.6, 3.1, 0.3], [-9.9, 0, -7.2, 3.5, 1.7], [-11.2, 0, -11.4, 3.9, 2.4]],
  },
  {
    url: "/models/natur/mushroom_redGroup.glb",
    platser: [[-5.6, 0, -5.8, 0.85, 0.3], [-6.9, 0, -5.4, 0.75, 1.5], [-8.2, 0, -7.1, 0.9, 2.1]],
  },
];

const SJO: ModellRad[] = [
  {
    url: "/models/natur/lily_large.glb",
    platser: [[6.5, -0.06, -3.5, 1.2, 0.3], [7.8, -0.06, -4.8, 1.4, 1.2], [8.9, -0.06, -2.6, 1.1, 2.4], [10.2, -0.06, -3.9, 1.3, 0.8]],
  },
  {
    url: "/models/natur/rock_smallA.glb",
    platser: [[5.8, 0, -4.6, 1.1, 0.5], [7.2, 0, -5.9, 1.5, 1.8], [9.4, 0, -1.8, 1.3, 2.6], [11.0, 0, -4.4, 1.7, 0.9]],
  },
  { url: "/models/bulk/w-trabro-cc0.glb", platser: [[8.6, -0.04, -3.2, 2.8, 0.35]] },
  { url: "/models/bulk/w-kanot-cc0.glb", platser: [[7.4, -0.05, -2.2, 1.9, 1.15]] },
];

const GROTTA: ModellRad[] = [
  {
    url: "/models/natur/rock_largeA.glb",
    farger: { rock: "#6e7385", stone: "#6e7385", dirt: "#6e7385", grass: "#868b9c" },
    platser: [[5.6, 0, -6.8, 2.4, 0.4], [7.4, 0, -8.2, 3.2, 1.3], [9.6, 0, -9.8, 4.1, 2.1], [6.2, 0, -10.5, 3.6, 0.8], [11.5, 0, -7.6, 3.8, 1.9], [8.8, 0, -12.2, 4.6, 2.7]],
  },
  { url: "/models/bulk/w-grottport-cc0.glb", platser: [[9.2, -0.1, -10.4, 3.8, -0.65]] },
  {
    url: "/models/bulk/w-kristall-kluster-cc0.glb",
    farger: { crystal: "#b88cff", stone: "#9d72f2", rock: "#9d72f2", rockTrack: "#cbb6ee" },
    platser: [[5.4, 0, -6.1, 1.2, 0.2], [6.8, 0, -7.5, 1.45, 1.4], [8.1, 0, -9.0, 1.6, 2.3], [4.9, 0, -7.4, 1.15, 0.9]],
  },
];

const GARD: ModellRad[] = [
  {
    url: "/models/natur/fence_simple.glb",
    farger: { wood: "#c89658" },
    platser: [[-6.2, 0, -2.4, 1.4, 0.35], [-7.4, 0, -3.1, 1.4, 0.35], [-8.6, 0, -3.8, 1.4, 0.35], [-6.8, 0, -1.2, 1.4, -1.2], [-7.5, 0, -0.1, 1.4, -1.2]],
  },
  { url: "/models/natur/fence_gate.glb", platser: [[-5.6, 0, -1.8, 1.45, 0.35]] },
  { url: "/models/bulk/w-lada-liten-cc0.glb", platser: [[-11.8, -0.08, -3.2, 3.8, 0.45]] },
  { url: "/models/bulk/w-vaderkvarn-cc0.glb", platser: [[-14.5, -0.1, -6.4, 5.4, 0.55]] },
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8.2, -0.14, -3.4]}>
        <circleGeometry args={[3.8, 32]} />
        <meshStandardMaterial color="#5aa9e6" roughness={0.45} metalness={0} />
      </mesh>
      <ModellRader rader={KULLAR} />
    </group>
  );
}

function HorisontScen() {
  return (
    <>
      {ZONER.map((grupp) => (
        <group key={grupp.zon} userData={{ "data-w2-zon": grupp.zon }}>
          <ModellRader rader={grupp.rader} />
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

export function HorisontVarld() {
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
        <HorisontScen />
      </Suspense>
    </HorisontGren>
  );
}
