// P3: kameran visar den nya skapelsen – mjukt närmare (miljo.json landning.fokus), en stund kvar och tillbaka.
// Bara skapelser som kommer till medan ängen visas (inte de sparade när sidan laddas). Av vid prefers-reduced-motion och i sagan.
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useMinne } from "../minne.ts";
import { sagaNu } from "../saga.ts";
import type { Plats } from "../platser.ts";
import { LANDNING } from "../landning.ts";
import { malhojd, takSkala } from "../entiteter.ts";
import { djurPlats } from "./delat.ts";
import type { OrbitStyr } from "./saga.tsx";

declare global {
  interface Window {
    /** P3, för prov: senaste fokus (skapelsens uid, fas och tid). */
    __tredFokus?: { uid: string; fas: "in" | "kvar" | "ut" | "klar"; mal: [number, number, number] };
  }
}

type Anim = { uid: string; t0: number; fran: { pos: THREE.Vector3; mal: THREE.Vector3 }; till: { pos: THREE.Vector3; mal: THREE.Vector3 } | null; punkt: THREE.Vector3 };

const mjuk = (u: number) => u * u * (3 - 2 * u);

function lugnt(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function KameraFokus({ styr, plats }: { styr: { current: OrbitStyr | null }; plats?: Plats }) {
  const djur = useMinne((s) => s.ang);
  const kanda = useRef<Set<string> | null>(null);
  const anim = useRef<Anim | null>(null);
  useEffect(() => {
    const nu = new Set(djur.map((d) => d.uid));
    const fore = kanda.current;
    kanda.current = nu;
    if (!fore) return;
    const nya = djur.filter((d) => !fore.has(d.uid) && Date.now() - d.skapad < 10000);
    const sista = nya[nya.length - 1];
    if (!sista || lugnt()) return;
    const [x, y, z] = djurPlats(sista, djur, plats);
    const h = malhojd(sista.kropp) * takSkala(sista.kropp, sista.skala || 1);
    anim.current = { uid: sista.uid, t0: -1, fran: { pos: new THREE.Vector3(), mal: new THREE.Vector3() }, till: null, punkt: new THREE.Vector3(x, y + h * 0.5, z) };
  }, [djur, plats]);
  useFrame(({ camera, clock }) => {
    const a = anim.current;
    const c = styr.current;
    if (!a || !c) return;
    if (sagaNu.aktiv) {
      anim.current = null;
      return;
    }
    const F = LANDNING.fokus;
    const t = clock.elapsedTime * 1000;
    if (a.t0 < 0) {
      a.t0 = t;
      a.fran.pos.copy(camera.position);
      a.fran.mal.copy(c.target);
      const mal = a.fran.mal.clone().lerp(a.punkt, F.mot);
      const pos = mal.clone().add(a.fran.pos.clone().sub(a.fran.mal).multiplyScalar(1 - F.narmare));
      a.till = { pos, mal };
    }
    const till = a.till!;
    const dt = t - a.t0;
    let u: number;
    let fas: "in" | "kvar" | "ut" | "klar";
    if (dt < F.in_ms) [u, fas] = [mjuk(dt / F.in_ms), "in"];
    else if (dt < F.in_ms + F.stanna_ms) [u, fas] = [1, "kvar"];
    else if (dt < F.in_ms + F.stanna_ms + F.ut_ms) [u, fas] = [1 - mjuk((dt - F.in_ms - F.stanna_ms) / F.ut_ms), "ut"];
    else [u, fas] = [0, "klar"];
    camera.position.lerpVectors(a.fran.pos, till.pos, u);
    c.target.lerpVectors(a.fran.mal, till.mal, u);
    c.update();
    if (typeof window !== "undefined") window.__tredFokus = { uid: a.uid, fas, mal: [a.punkt.x, a.punkt.y, a.punkt.z] };
    if (fas === "klar") anim.current = null;
  });
  return null;
}
