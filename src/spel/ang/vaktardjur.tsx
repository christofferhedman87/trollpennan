import { useArkLapp } from "../skapa/arkLapp.ts";
import { useGLTF } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import data from "../../../data/vaktardjur.json" with { type: "json" };
import { lasVaktarSteg, lyssnaVaktar, sparaStjarnor, sparaVaktarSteg } from "../../persist/spara.ts";
import type { Sparad } from "../brygga.ts";
import { GltfDjur, type DjurSignal } from "../gltfDjur.tsx";
import { ljud } from "../ljud.ts";
import { useMinne } from "../minne.ts";
import { lasUpp } from "../rostKo.ts";
import { AnsiktsUttryck } from "../tillbehor/AnsiktsUttryck.tsx";

export const SKATTKISTA_URL = "/models/bulk/s-vaktar-skattkista-cc0.glb";

export type VaktarSpec = (typeof data)[keyof typeof data];

export function vaktarForPlats(plats: string): VaktarSpec | undefined {
  if (plats === "skogen" || plats === "sjon" || plats === "grottan") return data[plats];
  return undefined;
}

function kroppAv(djur: string): string {
  return djur.replaceAll("ä", "a").replaceAll("ö", "o").replaceAll("å", "a");
}

function trippel(p: number[]): [number, number, number] {
  return [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0];
}

function harMat(v: VaktarSpec, utsaga: string): boolean {
  const låg = utsaga.toLocaleLowerCase("sv");
  const ord = låg.split(/[^a-zåäöé0-9]+/i).filter((w) => w.length >= 2);
  if (v.favoriter.some((f) => låg.includes(f.toLocaleLowerCase("sv")))) return true;
  if (ord.length >= 2) return true;
  return ["mat", "frukt", "godis", "leksak", "gåva", "present", "sak"].some((m) => låg.includes(m));
}

export function bedomVaktarMatning(plats: string, utsaga: string, nuvarandeSteg = 0) {
  const v = vaktarForPlats(plats);
  const godkand = Boolean(v && utsaga.trim() && harMat(v, utsaga));
  const krav = v?.kravAntal ?? 3;
  const nastaSteg = v ? Math.min(krav, nuvarandeSteg + (godkand ? 1 : 0)) : nuvarandeSteg;
  const nyVackt = nuvarandeSteg < krav && nastaSteg >= krav;
  return {
    godkand,
    nastaSteg,
    vackt: nastaSteg >= krav,
    nyVackt,
    skala: (v?.skala ?? 2.1) * (1 + nastaSteg * (v?.svallFaktor ?? 0.12)),
    stjarnorBonus: nyVackt ? 5 : 0,
    ritning: nyVackt && v ? v.beloning.ritning : null,
  };
}

export function mataVaktardjur(plats: string, utsaga: string): boolean {
  const v = vaktarForPlats(plats);
  if (!v) return false;
  const b = bedomVaktarMatning(plats, utsaga, lasVaktarSteg(v.id));
  if (!b.godkand) return false;
  sparaVaktarSteg(v.id, b.nastaSteg);
  ljud.plopp();
  if (b.nyVackt) {
    sparaStjarnor(5);
    ljud.stjarna();
    if (b.ritning && !useMinne.getState().byggSidor.includes(b.ritning)) {
      useMinne.setState({ byggSidor: [...useMinne.getState().byggSidor, b.ritning] });
    }
  }
  return true;
}

function useSteg(id: string): number {
  return useSyncExternalStore(lyssnaVaktar, () => lasVaktarSteg(id));
}

function specAv(v: VaktarSpec): Sparad {
  return {
    uid: v.id, skapad: 0, kropp: kroppAv(v.djur), farg: null, monster: null, monsterfarg: null,
    formagor: [], tillbehor: v.tillbehor.map((id) => ({ id, farg: null, glans: false })),
    skala: 1, alpha: 1, kontur: false, glans: false, formel: v.namn, beskrivning: v.namn, overraskningar: [],
  };
}

function SkattKista() {
  const gltf = useGLTF(SKATTKISTA_URL);
  const klon = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  return <primitive object={klon} position={[1.1, 0, 0.35]} scale={0.95} />;
}

export function VaktarDjur({ plats }: { plats: string }) {
  const v = vaktarForPlats(plats);
  const steg = useSteg(v?.id ?? "");
  const rot = useRef<THREE.Group>(null);
  const signalRef = useRef<DjurSignal>({ klapp: 0, ror: 0, humör: "somnig" });
  const spec = useMemo(() => (v ? specAv(v) : null), [v]);
  if (v) signalRef.current.humör = steg <= 0 ? "somnig" : steg >= v.kravAntal ? "fortjust" : "hungrig";
  useFrame(({ clock }) => {
    if (typeof window !== "undefined" && (window as any).__PAUSE_ANIM === true) return;
    const g = rot.current;
    if (!g || !v) return;
    const vaken = steg >= v.kravAntal;
    g.position.y = Math.sin(clock.elapsedTime * (vaken ? 2.4 : 1.4)) * (vaken ? 0.08 : 0.03);
  });
  if (!v || !spec) return null;
  const skala = v.skala * (1 + steg * v.svallFaktor);
  const klick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent("trollpennan:vaktar-oppna", { detail: plats }));
    useArkLapp.getState().satt("vaktare");
    document.querySelector<HTMLButtonElement>('[data-testid="pennans-bok"]')?.click();
  };
  return (
    <group position={trippel(v.position)}>
      <group ref={rot} scale={skala} onClick={klick}>
        <Suspense fallback={null}>
          <GltfDjur spec={spec} signal={signalRef} />
          <AnsiktsUttryck ankare={null} signal={signalRef} />
        </Suspense>
      </group>
      {steg >= v.kravAntal ? <Suspense fallback={null}><SkattKista /></Suspense> : null}
    </group>
  );
}

export function VaktarAptitBubbla({ plats }: { plats: string }) {
  const v = vaktarForPlats(plats);
  const steg = useSteg(v?.id ?? "");
  const [stangd, setStangd] = useState(false);
  useEffect(() => {
    setStangd(false);
    const fn = (e: Event) => {
      const d = (e as CustomEvent<string>).detail;
      if (!d || d === plats) setStangd(false);
    };
    window.addEventListener("trollpennan:vaktar-oppna", fn);
    return () => window.removeEventListener("trollpennan:vaktar-oppna", fn);
  }, [plats]);
  if (!v || stangd) return null;
  const stj = Array.from({ length: v.kravAntal }, (_, i) => (i < steg ? "★" : "○")).join("");
  return (
    <div data-s4="vaktar-aptitbubbla">
      <span data-s4-progress={`${steg}/${v.kravAntal}`}>{stj} {steg}/{v.kravAntal}</span>
      <p>{v.gata}</p>
      <button type="button" data-s4="vaktar-lyssna" aria-label="Lyssna" onClick={() => lasUpp(v.gata)}>🔊</button>
      <button type="button" data-s4="vaktar-stang" aria-label="Stäng" onClick={() => setStangd(true)}>×</button>
    </div>
  );
}

useGLTF.preload(SKATTKISTA_URL);
