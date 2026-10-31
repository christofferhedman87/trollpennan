import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Sparad } from "../brygga.ts";
import { GltfDjur, GltfSak, type DjurSignal } from "../gltfDjur.tsx";
import { harDjurGltf, harModell } from "../entiteter.ts";
import { AGG_KROPP, OrdAgg } from "../ordagg.tsx";
import { skapelsePlan, modellMatt } from "../skapelsePlan.ts";
import { DjurForm, ModellGren } from "./djurForm.tsx";
import { matSkapelseProv } from "./skapelseGeometriProv.ts";
import type { Ljuskalla } from "../ljuskalla.ts";
import { Ljusken } from "./ljusken.tsx";

import { byggTillbehor } from "../tillbehor/bygg.ts";
import { tillbehorRad } from "../tillbehor/data.ts";
import type { TillbehorSpec } from "../../tolk/typer.ts";

function FriTillbehor({ t }: { t: TillbehorSpec }) {
  const klon = useMemo(() => {
    const g = byggTillbehor(t.id, tillbehorRad(t.id, "standard")!, t.farg);
    const b = new THREE.Box3().setFromObject(g), s = b.getSize(new THREE.Vector3()), m = modellMatt(t.id);
    g.scale.set(m[0] / Math.max(0.001, s.x), m[1] / Math.max(0.001, s.y), m[2] / Math.max(0.001, s.z));
    g.position.set(-(b.min.x + b.max.x) * g.scale.x / 2, -b.min.y * g.scale.y, -(b.min.z + b.max.z) * g.scale.z / 2);
    return g;
  }, [t]);
  return <primitive object={klon} />;
}

export function SammansattDjur({ spec, signal, index = 0, holo = false, ljus }: {
  spec: Sparad; signal: { current: DjurSignal }; index?: number; holo?: boolean; ljus?: { kalla: Ljuskalla; vad: string };
}) {
  const plan = skapelsePlan(spec);
  const rot = useRef<THREE.Group>(null), kropp = useRef<THREE.Group>(null);
  const saker = useRef<(THREE.Group | null)[]>([]), ram = useRef(0);
  useFrame((state) => {
    if (++ram.current % 12 || !rot.current || !kropp.current) return;
    matSkapelseProv(spec.uid, rot.current, kropp.current, plan.saker.map((d, i) => ({ id: d.t.id, nod: saker.current[i] ?? null })), state.camera, state.gl.domElement.getBoundingClientRect(), holo);
  });
  return <group ref={rot}>
    <group ref={kropp} position={plan.kropp}>
      {harDjurGltf(spec.kropp) ? <ModellGren spec={spec}><Suspense fallback={<DjurForm spec={spec} signal={signal} index={index} />}><GltfDjur spec={spec} signal={signal} index={index} /></Suspense></ModellGren>
        : spec.kropp === AGG_KROPP ? <OrdAgg spec={spec} /> : <DjurForm spec={spec} signal={signal} index={index} />}
    </group>
    {plan.saker.map((d, i) => <group key={`${d.index}-${d.exemplar}`} ref={(nod) => { saker.current[i] = nod; }} position={d.position} scale={d.skala}>
      <ModellGren spec={{ ...spec, kropp: d.t.id }}><Suspense fallback={null}>{harModell(d.t.id) ? <GltfSak id={d.t.id} farg={d.t.farg} glans={d.t.glans} alpha={d.alpha} /> : <FriTillbehor t={d.t} />}</Suspense></ModellGren>
      {ljus?.vad === d.t.id ? <Ljusken uid={spec.uid} kalla={ljus.kalla} hojd={0.5} /> : null}
    </group>)}
  </group>;
}
