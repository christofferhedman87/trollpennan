// Block 3 (formsystemet): ett bygge på en tomt, ritat ur byggformeln. Stomme (formens modell) + delar + egenskaper.
// Svävar (flygande, moln, vingar), studsar (dansande), snurrar, står upp och ner – och växer fram med en studs när
// det är nytt, som när ett djur skapas. Tryck och långtryck fungerar som förut (byggmenyn).
import { useFrame } from "@react-three/fiber";
import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { SparatBygge } from "../bygge.ts";
import { ModellGren, TryckYta } from "../gard/ByggModell.tsx";
import { ReservForm } from "../gard/ReservForm.tsx";
import { TOON_MAP } from "../ang/djur.tsx";
import { Byggdelar } from "./Byggdelar.tsx";
import { BYGGDATA, ritplan } from "./ritplan.ts";
import { DALEN } from "./tomter.ts";
import { Stomme, type Matt } from "./Stomme.tsx";
import { Stallning } from "./Stallning.tsx";

const mjukStuds = (u: number) => (u >= 1 ? 1 : 1 + Math.sin(u * Math.PI * 1.5) * (1 - u) * 0.35 - (1 - u) ** 3);

export function Byggverk({ b, pos, flyttar, ny }: { b: SparatBygge; pos: { wx: number; wz: number }; flyttar: boolean; ny: boolean }) {
  const plan = useMemo(() => ritplan(b), [b]);
  const [matt, setMatt] = useState<Matt>([1.2, plan.malhojd, 1.2]);
  const onMatt = useCallback((m: Matt) => setMatt((f) => (f[0] === m[0] && f[1] === m[1] && f[2] === m[2] ? f : m)), []);
  const lyft = useRef<THREE.Group>(null);
  const kropp = useRef<THREE.Group>(null);
  const start = useRef<number | null>(ny ? -1 : null);
  const hjul = plan.moduler.some((m) => m.id === "hjul");
  const uppochner = plan.egenskaper.has("upp_och_ner");
  const reserv = <ReservForm slag={plan.reserv} farg={plan.farg ?? plan.standardFarg} hojd={plan.malhojd} />;
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const g = lyft.current;
    const k = kropp.current;
    if (!g || !k) return;
    let y = hjul ? 0.12 : 0;
    if (plan.svavar) y += BYGGDATA.svav_hojd + Math.sin(t * 1.4 + pos.wx) * 0.08;
    let sy = 1;
    if (plan.egenskaper.has("dansande")) {
      const v = Math.sin(t * 6 + pos.wz);
      sy = 1 + v * 0.07;
      y += Math.max(0, v) * 0.08;
    }
    if (plan.egenskaper.has("snurrande")) k.rotation.y += dt * 0.7;
    let s = plan.storlek;
    if (start.current != null) {
      // Block 7: först byggnadsställningen (Stallning.tsx), sedan studsar bygget fram.
      if (start.current < 0) start.current = t;
      const u = (t - start.current - BYGGDATA.stallning.ms / 1000) / (BYGGDATA.studs_ms / 1000);
      s *= u < 0 ? 0.0001 : Math.max(0.05, mjukStuds(Math.min(1, u)));
      if (u >= 1) start.current = null;
    }
    g.position.y = y;
    // För prov: lyfthöjd och skala per bygge.
    const w = window as unknown as { __byggverk?: Record<string, { y: number; s: number; rotY: number }> };
    (w.__byggverk ??= {})[b.uid] = { y: Math.round(y * 100) / 100, s: Math.round(s * 100) / 100, rotY: Math.round(k.rotation.y * 100) / 100 };
    g.scale.set(s / Math.sqrt(sy), s * sy, s / Math.sqrt(sy));
  });
  return (
    <TryckYta uid={b.uid} formel={b.formel} boende={b.boende.length} punkt={[pos.wx, matt[1] * 0.65, pos.wz]} flyttar={flyttar}>
      <group position={[pos.wx, 0, pos.wz]}>
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => undefined}>
          <circleGeometry args={[DALEN.tomt.radie * 0.85, 24]} />
          <meshToonMaterial color={DALEN.tomt.kant} gradientMap={TOON_MAP} transparent opacity={0.35} depthWrite={false} />
        </mesh>
        {ny ? (
          <Suspense fallback={null}>
            <Stallning start={start} />
          </Suspense>
        ) : null}
        <group ref={lyft}>
          <group ref={kropp} rotation={uppochner ? [Math.PI, 0, 0] : [0, 0, 0]} position={uppochner ? [0, matt[1], 0] : [0, 0, 0]}>
            <group position={[0, 0.06, 0]}>
              {plan.url ? (
                <ModellGren reserv={reserv}>
                  <Suspense fallback={reserv}>
                    <Stomme plan={plan as typeof plan & { url: string }} onMatt={onMatt} />
                  </Suspense>
                </ModellGren>
              ) : (
                reserv
              )}
              <Byggdelar plan={plan} matt={matt} />
            </group>
          </group>
        </group>
      </group>
    </TryckYta>
  );
}
