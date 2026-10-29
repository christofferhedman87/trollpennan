// Block 4 (byggnaderna lever): djuren som flyttat in i ett bygge (byggmenyn → "Vem ska bo här?") bor vid sitt hem
// i dalen. På dagen strövar de runt bygget eller inne i hagen; på kvällen går de in genom dörren, fönsterljuset tänds
// och "Zzz" svävar över taket. I hagen somnar de där de står. Glada hjärtan stiger ibland ur en hage med djur.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Group } from "three";
import type { SparatBygge } from "../bygge.ts";
import { GardEtt } from "../gard/GardDjur.tsx";
import { samlaGardDjur } from "../gard/vandra.ts";
import { arKantBygge } from "../gard/rutnat.ts";
import { useMinne } from "../minne.ts";
import { BO, boLage, somnighet } from "./boende.ts";
import { TOMTER, tomtKarta } from "./tomter.ts";

type Refs = { grupp: { current: Group | null }; kropp: { current: Group | null }; signal: { current: { klapp: number; ror: number; hopp: number } } };
const ingen = () => undefined;

function tecken(text: string, farg: string): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const x = c.getContext("2d");
  if (!x) return null;
  x.fillStyle = farg;
  x.font = "800 96px Fredoka, system-ui, sans-serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.lineWidth = 10;
  x.strokeStyle = "#FFFFFF";
  x.strokeText(text, 64, 68);
  x.fillText(text, 64, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const arHage = (b: SparatBygge) => b.bygg === "hage" || arKantBygge(b.bygg);

/** Zzz över ett hem där någon sover, och varmt ljus vid dörren. */
function Hemljus({ b, x, z, natt, hage }: { b: SparatBygge; x: number; z: number; natt: number; hage: boolean }) {
  const zzz = useMemo(() => tecken("z", BO.zzz), []);
  const hjarta = useMemo(() => tecken("♥", BO.hjarta), []);
  const grupp = useRef<THREE.Group>(null);
  const hjartor = useRef<THREE.Group>(null);
  const ljus = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const s = somnighet(natt);
    grupp.current?.children.forEach((c, i) => {
      const u = (t * 0.35 + i / 3) % 1;
      c.position.set(Math.sin(t + i) * 0.15 + i * 0.12, (hage ? 1.0 : 2.0) + u * 0.8, 0);
      c.scale.setScalar((0.18 + u * 0.22) * (s > 0.6 ? 1 : 0));
    });
    hjartor.current?.children.forEach((c, i) => {
      const u = (t * 0.25 + i / 2) % 1;
      const synlig = hage && s < 0.3 && Math.floor(t * 0.25 + i / 2) % 3 === 0;
      c.position.set((i ? 0.3 : -0.25) + Math.sin(t * 2 + i) * 0.08, 0.8 + u * 1.0, 0);
      c.scale.setScalar(synlig ? 0.22 * Math.sin(u * Math.PI) + 0.01 : 0);
    });
    if (ljus.current) ljus.current.opacity = hage ? 0 : 0.5 * s;
  });
  void b;
  return (
    <group position={[x, 0, z]}>
      <group ref={grupp}>
        {[0, 1, 2].map((i) => (
          <sprite key={i} raycast={ingen}>
            <spriteMaterial map={zzz} transparent depthWrite={false} />
          </sprite>
        ))}
      </group>
      <group ref={hjartor}>
        {[0, 1].map((i) => (
          <sprite key={i} raycast={ingen}>
            <spriteMaterial map={hjarta} transparent depthWrite={false} />
          </sprite>
        ))}
      </group>
      <mesh position={[0, 0.08, 0.95]} rotation={[-Math.PI / 2, 0, 0]} raycast={ingen}>
        <circleGeometry args={[0.6, 20]} />
        <meshBasicMaterial ref={ljus} color={BO.ljus} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

export function Boende({ natt }: { natt: number }) {
  const garden = useMinne((s) => s.garden);
  const hemma = useMinne((s) => s.hemma);
  const ang = useMinne((s) => s.ang);
  const karta = useMemo(() => tomtKarta(garden), [garden]);
  const boende = useMemo(() => {
    const paAngen = new Set(ang.map((a) => String(a.uid)));
    return samlaGardDjur(garden, hemma, []).filter((d) => !paAngen.has(d.uid));
  }, [garden, hemma, ang]);
  const refs = useRef(new Map<string, Refs>());
  const hamta = (uid: string): Refs => {
    let r = refs.current.get(uid);
    if (!r) {
      r = { grupp: { current: null }, kropp: { current: null }, signal: { current: { klapp: 0, ror: 0, hopp: 0 } } };
      refs.current.set(uid, r);
    }
    return r;
  };
  const bas = BO.skala / 0.48;
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    boende.forEach((d, i) => {
      const b = garden.find((g) => g.uid === d.hemUid);
      const k = b ? karta.get(b.uid) : undefined;
      const tomt = k == null ? undefined : TOMTER[k];
      const r = refs.current.get(d.uid);
      const g = r?.grupp.current;
      if (!b || !tomt || !g) return;
      const l = boLage(t, i, tomt, arHage(b), natt);
      g.position.set(l.x, 0, l.z);
      g.rotation.y = l.rotY;
      g.scale.setScalar(bas * Math.max(0.001, l.skala));
      g.visible = !l.inne;
      if (r) r.signal.current.ror = l.sover || l.inne ? 0 : 1;
    });
  });
  const hem = useMemo(() => {
    const m = new Map<string, SparatBygge>();
    for (const d of boende) {
      const b = garden.find((g) => g.uid === d.hemUid);
      if (b) m.set(b.uid, b);
    }
    return [...m.values()];
  }, [boende, garden]);
  return (
    <group name="boende">
      {boende.map((d, i) => {
        const r = hamta(d.uid);
        return <GardEtt key={d.uid} spec={d.spec} signal={r.signal} grupp={r.grupp} kropp={r.kropp} index={i} />;
      })}
      {hem.map((b) => {
        const k = karta.get(b.uid);
        const t = k == null ? undefined : TOMTER[k];
        return t ? <Hemljus key={b.uid} b={b} x={t.x} z={t.z} natt={natt} hage={arHage(b)} /> : null;
      })}
    </group>
  );
}
