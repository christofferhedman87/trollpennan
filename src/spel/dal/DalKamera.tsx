// Block 1 (En värld): kameran i Hemdalen. Fast vinkel (beslut A); ett finger panorerar och två zoomar (OrbitControls
// i angen3d.tsx). Här hålls kamerans mål inom dalen (data/dalen.json) och kameran glider mjukt till ett nytt bygge
// eller till tomterna när barnet väljer "Gården".
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { sagaNu } from "../saga.ts";
import type { OrbitStyr } from "../ang/saga.tsx";
import { dalStyr, type Vy } from "./dalStyr.ts";
import { DALEN, klampaMal } from "./tomter.ts";

const mjuk = (u: number) => u * u * (3 - 2 * u);
const _d = new THREE.Vector3();

type Glid = { id: number; t0: number; fran: THREE.Vector3; till: THREE.Vector3; vy: Vy | null; franVy: THREE.Spherical };
const _sf = new THREE.Spherical();

export function DalKamera({ styr, aktiv }: { styr: { current: OrbitStyr | null }; aktiv: boolean }) {
  const glid = useRef<Glid | null>(null);
  useEffect(() => {
    const ta = () => {
      const f = dalStyr.taFokus();
      if (f) {
        glid.current = { id: f.id, t0: -1, fran: new THREE.Vector3(), till: new THREE.Vector3(f.x, 0, f.z), vy: f.vy, franVy: new THREE.Spherical() };
      }
    };
    // Ett fokus som sattes medan Hemdalen inte ritades (bygge från en utflykt) väntar här när scenen visas igen. Ett som redan
    // använts (konsumerat) glider kameran inte till en gång till bara för att scenen byggs om.
    ta();
    return dalStyr.lyssna(ta);
  }, []);
  useFrame(({ camera, clock }) => {
    const c = styr.current;
    // För prov: kamerans mål och om dalkameran är aktiv.
    if (typeof window !== "undefined") (window as unknown as { __dalKamera?: unknown }).__dalKamera = { x: c?.target.x, z: c?.target.z, aktiv, enabled: c?.enabled, saga: sagaNu.aktiv, glid: !!glid.current };
    if (!c || !aktiv || sagaNu.aktiv || !c.enabled) return;
    const g = glid.current;
    if (g) {
      const t = clock.elapsedTime * 1000;
      if (g.t0 < 0) {
        g.t0 = t;
        g.fran.copy(c.target);
        g.franVy.setFromVector3(_d.copy(camera.position).sub(c.target));
        const [x, z] = klampaMal(g.till.x, g.till.z);
        g.till.set(x, c.target.y, z);
      }
      const u = Math.min(1, (t - g.t0) / DALEN.kamera.fokus_ms);
      _d.copy(g.fran).lerp(g.till, mjuk(u)).sub(c.target);
      c.target.add(_d);
      camera.position.add(_d);
      if (g.vy) {
        const k = mjuk(u);
        _sf.set(g.franVy.radius + (g.vy.avstand - g.franVy.radius) * k, g.franVy.phi + (g.vy.polar - g.franVy.phi) * k, g.franVy.theta);
        camera.position.copy(c.target).add(_d.setFromSpherical(_sf));
      }
      c.update();
      if (u >= 1) glid.current = null;
      return;
    }
    const [x, z] = klampaMal(c.target.x, c.target.z);
    if (x !== c.target.x || z !== c.target.z) {
      _d.set(x - c.target.x, 0, z - c.target.z);
      c.target.add(_d);
      camera.position.add(_d);
      c.update();
    }
  });
  return null;
}
