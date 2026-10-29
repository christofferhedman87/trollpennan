// Block 3 (formsystemet): delar och egenskaper som läggs på stommen. Allt ritas i samma mjuka toon-stil som
// djuren, utan nya modeller: torn, flaggor, kupoler, skorstenar, vingar, hjul, balkonger, trappor, dörr och fönster
// på former (så att man ser att ett äpple eller en ko går att bo i), och moln, gnistor, noter och rök.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { TOON_MAP } from "../ang/djur.tsx";
import { BYGGDATA, modulPlatser, type ModulId, type Ritplan } from "./ritplan.ts";
import type { Matt } from "./Stomme.tsx";

const F = BYGGDATA.farger;
const ingen = () => undefined;

function Toon({ farg, ...rest }: { farg: string; children: React.ReactNode; position?: [number, number, number]; rotation?: [number, number, number]; scale?: number | [number, number, number] }) {
  return (
    <mesh castShadow raycast={ingen} {...rest}>
      {rest.children}
      <meshToonMaterial color={farg} gradientMap={TOON_MAP} />
    </mesh>
  );
}

function Flagga({ farg, fas }: { farg: string; fas: number }) {
  const duk = useRef<THREE.Mesh>(null);
  const form = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(0.26, -0.07);
    s.lineTo(0, -0.15);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);
  useFrame(({ clock }) => {
    if (duk.current) duk.current.rotation.y = Math.sin(clock.elapsedTime * 3 + fas) * 0.35;
  });
  return (
    <group>
      <Toon farg={F.stang} position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.48, 6]} />
      </Toon>
      <mesh ref={duk} geometry={form} position={[0.01, 0.47, 0]} raycast={ingen}>
        <meshToonMaterial color={farg} gradientMap={TOON_MAP} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Vinge({ sida }: { sida: 1 | -1 }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.z = sida * (0.25 + Math.sin(clock.elapsedTime * 4) * 0.3);
  });
  return (
    <group ref={g}>
      <Toon farg={F.vinge} position={[sida * 0.3, 0, 0]} scale={[0.36, 0.07, 0.2]}>
        <sphereGeometry args={[1, 12, 8]} />
      </Toon>
      <Toon farg={F.vinge} position={[sida * 0.5, -0.08, 0.06]} scale={[0.22, 0.05, 0.14]}>
        <sphereGeometry args={[1, 10, 6]} />
      </Toon>
    </group>
  );
}

function Modul({ id, farg, s, fas }: { id: ModulId; farg: string | null; s: number; fas: number }) {
  switch (id) {
    case "torn":
      return (
        <group scale={s}>
          <Toon farg={farg ?? F.torn} position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.12, 0.14, 0.6, 10]} />
          </Toon>
          <Toon farg={F.torntak} position={[0, 0.75, 0]}>
            <coneGeometry args={[0.19, 0.32, 10]} />
          </Toon>
        </group>
      );
    case "flagga":
      return (
        <group scale={s}>
          <Flagga farg={farg ?? F.flagga} fas={fas} />
        </group>
      );
    case "kupol":
      return (
        <Toon farg={farg ?? F.kupol} scale={s}>
          <sphereGeometry args={[0.24, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </Toon>
      );
    case "skorsten":
      return (
        <Toon farg={farg ?? F.skorsten} position={[0, 0.15 * s, 0]} scale={s}>
          <boxGeometry args={[0.16, 0.32, 0.16]} />
        </Toon>
      );
    case "vingar":
      return <Vinge sida={fas < 0.5 ? -1 : 1} />;
    case "hjul":
      return (
        <group position={[0, 0.17, 0]} rotation={[0, 0, Math.PI / 2]}>
          <Toon farg={farg ?? F.hjul}>
            <cylinderGeometry args={[0.17, 0.17, 0.07, 14]} />
          </Toon>
          <Toon farg={F.nav}>
            <cylinderGeometry args={[0.06, 0.06, 0.09, 8]} />
          </Toon>
        </group>
      );
    case "balkong":
      return (
        <group scale={s}>
          <Toon farg={farg ?? F.balkong}>
            <boxGeometry args={[0.4, 0.05, 0.18]} />
          </Toon>
          <Toon farg={farg ?? F.balkong} position={[0, 0.09, 0.085]}>
            <boxGeometry args={[0.4, 0.13, 0.02]} />
          </Toon>
        </group>
      );
    case "trappa":
      return (
        <group>
          {[0, 1, 2].map((k) => (
            <Toon key={k} farg={farg ?? F.trappa} position={[0, 0.035 + k * 0.07, -k * 0.07]}>
              <boxGeometry args={[0.36, 0.07, 0.12]} />
            </Toon>
          ))}
        </group>
      );
  }
}

/** Dörr och fönster på framsidan av en form, och hö vid djurhem – så att man ser vad byggnaden är till för. */
function Framsida({ plan, w, h, d }: { plan: Ritplan; w: number; h: number; d: number }) {
  const s = Math.min(1, h / 1.4);
  const z = d / 2 + 0.02;
  const n = plan.fonster ?? (plan.djurhem ? 0 : 2);
  return (
    <group>
      <Toon farg={F.dorrkarm} position={[0, 0.25 * s, z - 0.005]} scale={s}>
        <boxGeometry args={[0.36, 0.5, 0.04]} />
      </Toon>
      <Toon farg={F.dorr} position={[0, 0.23 * s, z + 0.012]} scale={s}>
        <boxGeometry args={[0.28, 0.44, 0.03]} />
      </Toon>
      {Array.from({ length: Math.min(4, n) }, (_, i) => (
        <mesh key={i} position={[n === 1 ? w * 0.25 : -w * 0.3 + (i * w * 0.6) / Math.max(1, n - 1), h * 0.62, z]} raycast={ingen}>
          <boxGeometry args={[0.15, 0.15, 0.03]} />
          <meshBasicMaterial color={F.fonster} />
        </mesh>
      ))}
      {plan.djurhem ? (
        <Toon farg={F.hö} position={[w * 0.42, 0.11, z + 0.08]}>
          <boxGeometry args={[0.26, 0.22, 0.2]} />
        </Toon>
      ) : null}
    </group>
  );
}

/** Moln under en svävande byggnad, gnistor runt en magisk, noter över en sjungande och rök ur skorstenen. */
function Effekter({ plan, w, h, d }: { plan: Ritplan; w: number; h: number; d: number }) {
  const gnistor = useRef<THREE.Group>(null);
  const noter = useRef<THREE.Group>(null);
  const rok = useRef<THREE.Group>(null);
  const magisk = plan.egenskaper.has("magisk");
  const sjung = plan.egenskaper.has("sjungande");
  const skorsten = plan.moduler.find((m) => m.id === "skorsten");
  const roker = !!skorsten || plan.egenskaper.has("varm") || plan.egenskaper.has("mysig");
  const rokPos = skorsten ? modulPlatser("skorsten", 1, w, h, d)[0]! : ([0, h, 0] as const);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (gnistor.current) gnistor.current.rotation.y = t * 0.8;
    noter.current?.children.forEach((c, i) => {
      const u = (t * 0.45 + i * 0.5) % 1;
      c.position.set(Math.sin(t * 2 + i) * 0.2 + (i ? 0.2 : -0.2), h + 0.2 + u * 0.8, 0);
      c.scale.setScalar(Math.sin(u * Math.PI) * 1.1);
    });
    rok.current?.children.forEach((c, i) => {
      const u = (t * 0.35 + i / 3) % 1;
      c.position.set(rokPos[0] + Math.sin(t + i) * 0.06, rokPos[1] + 0.35 + u * 0.9, rokPos[2]);
      c.scale.setScalar(0.06 + u * 0.14);
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = 0.75 * (1 - u);
    });
  });
  return (
    <group>
      {plan.svavar
        ? [-0.35, 0, 0.35].map((x, i) => (
            <Toon key={i} farg={F.moln} position={[x * w, -0.12 - (i % 2) * 0.06, (i - 1) * 0.15]} scale={[0.32, 0.18, 0.28]}>
              <sphereGeometry args={[1, 12, 8]} />
            </Toon>
          ))
        : null}
      {magisk ? (
        <group ref={gnistor}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[Math.cos((i * Math.PI) / 2) * w * 0.7, h * (0.4 + 0.15 * i), Math.sin((i * Math.PI) / 2) * d * 0.7]} raycast={ingen}>
              <octahedronGeometry args={[0.07, 0]} />
              <meshBasicMaterial color={F.gnista} />
            </mesh>
          ))}
        </group>
      ) : null}
      {sjung ? (
        <group ref={noter}>
          {[0, 1].map((i) => (
            <group key={i}>
              <Toon farg={F.not} scale={[1, 0.8, 1]}>
                <sphereGeometry args={[0.06, 8, 6]} />
              </Toon>
              <Toon farg={F.not} position={[0.05, 0.1, 0]}>
                <boxGeometry args={[0.015, 0.2, 0.015]} />
              </Toon>
            </group>
          ))}
        </group>
      ) : null}
      {roker ? (
        <group ref={rok}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} raycast={ingen}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshBasicMaterial color={F.rok} transparent depthWrite={false} />
            </mesh>
          ))}
        </group>
      ) : null}
    </group>
  );
}

export function Byggdelar({ plan, matt }: { plan: Ritplan; matt: Matt }) {
  const [w, h, d] = matt;
  const s = Math.min(1.2, Math.max(0.7, Math.min(w, d) / 1.2));
  return (
    <group>
      {plan.moduler.flatMap((m) =>
        modulPlatser(m.id, m.antal, w, h, d).map((p, i) => (
          <group key={`${m.id}${i}`} position={p}>
            <Modul id={m.id} farg={m.farg ?? (m.material ? m.material.farg : null)} s={s} fas={m.id === "vingar" ? i : i * 1.3} />
          </group>
        )),
      )}
      {plan.arForm ? <Framsida plan={plan} w={w} h={h} d={d} /> : null}
      <Effekter plan={plan} w={w} h={h} d={d} />
    </group>
  );
}
