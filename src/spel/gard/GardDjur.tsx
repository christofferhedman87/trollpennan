import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import type { Group } from "three";
import { DjurForm, ModellGren } from "../ang/djur.tsx";
import { brygga, type Sparad } from "../brygga.ts";
import { harDjurGltf } from "../entiteter.ts";
import { GltfDjur, type DjurSignal } from "../gltfDjur.tsx";
import { sattUttryck } from "../tillbehor/AnsiktsUttryck.tsx";
import { arAttraktionId, hittaNarmasteAttraktion, kompisNu, largoSkala, mumsa } from "../tillbehor/largo.ts";
import { ljud } from "../ljud.ts";
import { useMinne } from "../minne.ts";
import { replik } from "../replik.ts";
import type { SparatBygge } from "../bygge.ts";
import { skarmPunkt } from "./modellPrep.ts";
import {
  samlaGardDjur,
  skapaGardVandrare,
  synkaTestSparning,
  tillatnaCellerForHem,
  uppdateraGardVandrare,
  type GardDjurSnap,
  type GardVandrare,
} from "./vandra.ts";
import type { CellPlats, KantPlats, SlutenHage } from "./rutnat.ts";

type HoppSignal = DjurSignal & { hopp: number };
type SignalRef = { current: HoppSignal };

if (typeof window !== "undefined") synkaTestSparning(useMinne, window.localStorage);

function sammaCeller(a: CellPlats[], b: CellPlats[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const l = a[i];
    const r = b[i];
    if (!l || !r || l.gx !== r.gx || l.gz !== r.gz) return false;
  }
  return true;
}

function GardEtt({
  spec,
  signal,
  grupp,
  kropp,
  index = 0,
}: {
  spec: Sparad;
  signal: SignalRef;
  grupp: { current: Group | null };
  kropp: { current: Group | null };
  index?: number;
}) {
  const nere = useRef<{ x: number; y: number } | null>(null);
  const antal = useRef(0);
  const fod = useRef(performance.now());
  const [lx, ly, lz] = largoSkala(spec);
  useFrame(() => {
    const liv = useMinne.getState();
    sattUttryck(
      signal,
      (performance.now() - fod.current) / 1000,
      signal.current.hopp > 0,
      liv.liv[spec.uid]?.humor,
      liv.sovande.some((d) => d.uid === spec.uid),
      Boolean((spec as { extraKropp?: string }).extraKropp),
    );
  });
  const tryck = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const start = nere.current;
    nere.current = null;
    if (!start) return;
    const dx = e.nativeEvent.clientX - start.x;
    const dy = e.nativeEvent.clientY - start.y;
    if (dx * dx + dy * dy > 24 * 24) return;
    antal.current += 1;
    signal.current.klapp = performance.now();
    signal.current.hopp = 1;
    const g = grupp.current;
    const p = skarmPunkt(g?.position.x ?? e.point.x, (g?.position.y ?? 0) + 0.7, g?.position.z ?? e.point.z, e.camera);
    brygga.skicka({
      typ: "tryck",
      uid: spec.uid,
      text: replik(spec, "tryck"),
      x: p.x,
      y: Math.max(0.12, p.y - 0.08),
      klapp: antal.current,
    });
  };
  return (
    <group
      ref={grupp}
      onPointerDown={(e) => {
        e.stopPropagation();
        nere.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
      }}
      onPointerUp={tryck}
      onPointerCancel={() => {
        nere.current = null;
      }}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.32, 16]} />
        <meshBasicMaterial color="#2F4A22" transparent opacity={0.14} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.46, 12, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <group ref={kropp} scale={[0.48 * lx, 0.48 * ly, 0.48 * lz]}>
        <Suspense fallback={<DjurForm spec={spec} signal={signal} index={index} />}>
          {harDjurGltf(spec.kropp) ? (
            <ModellGren spec={spec}>
              <GltfDjur spec={spec} signal={signal} index={index} />
            </ModellGren>
          ) : (
            <DjurForm spec={spec} signal={signal} index={index} />
          )}
        </Suspense>
      </group>
    </group>
  );
}

export function GardDjurLista({
  garden,
  hagar,
  kanter,
}: {
  garden: SparatBygge[];
  hagar: SlutenHage[];
  kanter: KantPlats[];
}) {
  const hemma = useMinne((s) => s.hemma);
  const ang = useMinne((s) => s.ang);
  const boende = useMemo(() => {
    return samlaGardDjur(garden, hemma, ang).map((d, index) => ({
      ...d,
      index,
      tillatna: tillatnaCellerForHem(d.hemBygge, hagar, kanter),
    }));
  }, [garden, hemma, ang, hagar, kanter]);
  const boendeRef = useRef(boende);
  boendeRef.current = boende;
  const vandrare = useRef(new Map<string, GardVandrare>());
  const grupper = useRef(new Map<string, { current: Group | null }>());
  const kroppar = useRef(new Map<string, { current: Group | null }>());
  const signaler = useRef(new Map<string, SignalRef>());
  const klocka = useRef(0);
  const rader = useRef<GardDjurSnap[]>([]);

  const hamta = (uid: string) => {
    let grupp = grupper.current.get(uid);
    if (!grupp) {
      grupp = { current: null };
      grupper.current.set(uid, grupp);
    }
    let kropp = kroppar.current.get(uid);
    if (!kropp) {
      kropp = { current: null };
      kroppar.current.set(uid, kropp);
    }
    let signal = signaler.current.get(uid);
    if (!signal) {
      signal = { current: { klapp: 0, ror: 0, hopp: 0 } };
      signaler.current.set(uid, signal);
    }
    return { grupp, kropp, signal };
  };

  useFrame((_, delta) => {
    const stegDt = Math.min(Math.max(delta, 0), 0.1);
    klocka.current += stegDt;
    const lista = boendeRef.current;
    const kvar = new Set(lista.map((d) => d.uid));
    for (const id of vandrare.current.keys()) if (!kvar.has(id)) vandrare.current.delete(id);
    const ut = rader.current;
    ut.length = 0;
    const saker: { id: string; wx: number; wz: number }[] = [];
    for (const d of lista) {
      if (!arAttraktionId(d.spec.kropp)) continue;
      const pv = vandrare.current.get(d.uid);
      if (pv) saker.push({ id: d.spec.kropp, wx: pv.wx, wz: pv.wz });
    }
    for (const d of lista) {
      let v = vandrare.current.get(d.uid);
      if (!v || v.hemUid !== d.hemUid || v.hageId !== d.tillatna.hageId || !sammaCeller(v.tillatnaCeller, d.tillatna.celler)) {
        v = skapaGardVandrare(d.uid, d.hemUid, d.tillatna.celler, d.tillatna.hageId, d.index);
        vandrare.current.set(d.uid, v);
      }
      if (arAttraktionId(d.spec.kropp)) v.malPunkt = null;
      else {
        const nara = hittaNarmasteAttraktion([v.wx, v.wz], saker);
        v.malPunkt = nara ? [nara.wx, nara.wz] : null;
      }
      uppdateraGardVandrare(v, stegDt);
      const sig = signaler.current.get(d.uid);
      if (sig) {
        sig.current.ror = v.vantar <= 0 ? 1 : 0;
        if (sig.current.hopp > 0) sig.current.hopp = Math.max(0, sig.current.hopp - stegDt / 0.42);
        if (v.malPunkt) {
          sig.current.malPunkt = v.malPunkt;
          const dist = Math.hypot(v.malPunkt[0] - v.wx, v.malPunkt[1] - v.wz);
          if (dist > 0.18) sig.current.hopp = Math.max(sig.current.hopp, 0.35);
          else if (mumsa(d.uid, v.malPunkt.join(","))) { sig.current.klapp = performance.now(); ljud.plopp(); }
        } else sig.current.malPunkt = null;
      }
      const hopp = sig?.current.hopp ?? 0;
      const gung =
        (hopp > 0 ? Math.sin((1 - hopp) * Math.PI) * 0.32 : 0) +
        (v.vantar <= 0 ? Math.abs(Math.sin(klocka.current * 8)) * 0.045 : 0);
      const nod = grupper.current.get(d.uid)?.current;
      if (nod) {
        nod.position.set(v.wx, 0, v.wz);
        nod.rotation.y = v.rotY;
      }
      const kropp = kroppar.current.get(d.uid)?.current;
      if (kropp) kropp.position.y = gung;
      const iTillatenCell = v.tillatnaCeller.some((c) => c.gx === v.cell.gx && c.gz === v.cell.gz);
      ut.push({
        uid: d.uid,
        ord: d.spec.kropp,
        hemUid: d.hemUid,
        hageId: v.hageId,
        wx: Number(v.wx.toFixed(3)),
        wz: Number(v.wz.toFixed(3)),
        gx: v.cell.gx,
        gz: v.cell.gz,
        forflyttad: Number(v.forflyttad.toFixed(3)),
        iTillatenCell,
      });
    }
    for (let i = 0; i < lista.length; i++) {
      const a = lista[i];
      const va = a ? vandrare.current.get(a.uid) : undefined;
      if (!a || !va || arAttraktionId(a.spec.kropp)) continue;
      for (let j = i + 1; j < lista.length; j++) {
        const b = lista[j];
        const vb = b ? vandrare.current.get(b.uid) : undefined;
        if (!b || !vb || arAttraktionId(b.spec.kropp) || Math.hypot(va.wx - vb.wx, va.wz - vb.wz) > 1.1) continue;
        if (!kompisNu(a.uid, b.uid, klocka.current)) continue;
        const sa = signaler.current.get(a.uid);
        const sb = signaler.current.get(b.uid);
        if (sa) sa.current.hopp = Math.max(sa.current.hopp, 0.45);
        if (sb) sb.current.hopp = Math.max(sb.current.hopp, 0.45);
      }
    }
    const rot = window.__gard3d;
    if (rot) rot.djur = ut;
  });

  return (
    <>
      {boende.map((d) => {
        const refs = hamta(d.uid);
        return <GardEtt key={d.uid} spec={d.spec} signal={refs.signal} grupp={refs.grupp} kropp={refs.kropp} index={d.index} />;
      })}
    </>
  );
}
