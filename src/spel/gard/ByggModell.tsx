import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Box3, Vector3 } from "three";
import { forladdaNarLedig, kopplaMeshopt } from "../modeller/forladda.ts";
import { StjarnPuffReserv } from "../modeller/StjarnPuffReserv.tsx";
import gard3d from "../../../data/gard-3d.json" with { type: "json" };
import { fonsterAntalForBygge, takFargForBygge, type SparatBygge } from "../bygge.ts";
import { belysScen } from "../belys.ts";
import { brygga } from "../brygga.ts";
import { arKantBygge, cellTillVarld, kantNyckel, kantTillVarld, xyTillCell } from "./rutnat.ts";
import {
  arReserv,
  byggRad,
  egnaMaterial,
  inspekteraHus3D,
  kantMitt,
  kanterForEtt,
  passaByggnad,
  skarmPunkt,
  skuggaUtanTraff,
  slappMaterial,
  staketFil,
  type ReservSlag,
} from "./modellPrep.ts";
import { ReservForm, StaketReserv } from "./ReservForm.tsx";
const SKARM_BOX = new Box3();
const SKARM_P = new Vector3();
const FILER = new Set<string>([gard3d.staket.enkelFil, gard3d.staket.grindFil]);
for (const rad of Object.values(gard3d.byggnader)) if (rad.fil) FILER.add(rad.fil);
for (const d of gard3d.dekor) FILER.add(d.fil);
forladdaNarLedig(FILER);

class ModellGren extends Component<{ children: ReactNode; reserv: ReactNode }, { fel: boolean }> {
  state = { fel: false };
  static getDerivedStateFromError() {
    return { fel: true };
  }
  componentDidCatch() {
    /* tyst reserv, ingen pageerror */
  }
  render() {
    return this.state.fel ? this.props.reserv : this.props.children;
  }
}

function KlonadScen({
  url,
  malhojd,
  fargHex,
  passa,
  takFargHex = null,
  fonsterAntal = null,
  uid = null,
  klickbar = false,
  maxBredd = 1.75,
  skala = 1,
}: {
  url: string;
  malhojd: number;
  fargHex: string | null;
  passa: boolean;
  takFargHex?: string | null;
  fonsterAntal?: number | null;
  uid?: string | null;
  klickbar?: boolean;
  maxBredd?: number;
  skala?: number;
}) {
  const gltf = useGLTF(url, false, true, kopplaMeshopt);
  const { camera, gl } = useThree();
  const skarmNyckel = useRef("");
  const scen = useMemo(() => {
    belysScen(gltf.scene);
    const k = gltf.scene.clone(true);
    if (passa) passaByggnad(k, malhojd, maxBredd, skala);
    egnaMaterial(k, fargHex, takFargHex, fonsterAntal);
    skuggaUtanTraff(k, klickbar);
    return k;
  }, [gltf.scene, malhojd, maxBredd, skala, fargHex, passa, takFargHex, fonsterAntal, klickbar]);
  useEffect(() => {
    if (uid && window.__gard3d) {
      const diag = inspekteraHus3D(scen);
      const gard = window.__gard3d;
      window.__gard3d = {
        ...gard,
        byggen: gard.byggen.map((x) =>
          x.uid === uid
            ? {
                ...x,
                wallsColorHex: diag.wallsColorHex ?? x.wallsColorHex,
                roofColorHex: diag.roofColorHex ?? x.roofColorHex,
                synligaFonsterNoder: diag.wallsColorHex ? diag.synligaFonsterNoder : x.synligaFonsterNoder,
                reservAktiv: false,
              }
            : x,
        ),
      };
    }
    return () => slappMaterial(scen);
  }, [scen, uid]);
  useFrame(() => {
    if (!uid || !window.__gard3d) return;
    scen.updateWorldMatrix(true, true);
    SKARM_BOX.setFromObject(scen);
    if (SKARM_BOX.isEmpty()) return;
    const rect = gl.domElement.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const x of [SKARM_BOX.min.x, SKARM_BOX.max.x]) {
      for (const y of [SKARM_BOX.min.y, SKARM_BOX.max.y]) {
        for (const z of [SKARM_BOX.min.z, SKARM_BOX.max.z]) {
          SKARM_P.set(x, y, z).project(camera);
          const px = rect.left + (SKARM_P.x * 0.5 + 0.5) * rect.width;
          const py = rect.top + (-SKARM_P.y * 0.5 + 0.5) * rect.height;
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
        }
      }
    }
    const width = maxX - minX;
    const height = maxY - minY;
    const nyckel = `${minX.toFixed(1)}|${minY.toFixed(1)}|${width.toFixed(1)}|${height.toFixed(1)}`;
    if (nyckel === skarmNyckel.current) return;
    skarmNyckel.current = nyckel;
    const gard = window.__gard3d;
    if (!gard) return;
    window.__gard3d = {
      ...gard,
      byggen: gard.byggen.map((x) =>
        x.uid === uid ? { ...x, reservAktiv: false, skarmBox: { x: minX, y: minY, width, height } } : x,
      ),
    };
  });
  return <primitive object={scen} />;
}

function TryckYta({
  uid,
  formel,
  boende,
  punkt,
  flyttar,
  children,
}: {
  uid: string;
  formel: string;
  boende: number;
  punkt: readonly [number, number, number];
  flyttar: boolean;
  children: ReactNode;
}) {
  const camera = useThree((s) => s.camera);
  const timer = useRef<number | null>(null);
  const skickad = useRef(false);
  const nere = useRef(false);
  useEffect(
    () => () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    },
    [],
  );
  const lang = () => {
    const p = skarmPunkt(punkt[0], punkt[1], punkt[2], camera);
    brygga.skicka({ typ: "byggLang", uid, x: p.x, y: p.y });
    skickad.current = true;
  };
  return (
    <group
      onPointerDown={(e) => {
        if (flyttar) return;
        e.stopPropagation();
        if (nere.current) return;
        nere.current = true;
        skickad.current = false;
        if (timer.current != null) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(lang, 400);
      }}
      onPointerUp={(e) => {
        if (flyttar) return;
        e.stopPropagation();
        if (!nere.current) return;
        nere.current = false;
        if (timer.current != null) window.clearTimeout(timer.current);
        timer.current = null;
        if (skickad.current) {
          skickad.current = false;
          return;
        }
        const p = skarmPunkt(punkt[0], punkt[1], punkt[2], camera);
        if (boende === 0) brygga.skicka({ typ: "byggLang", uid, x: p.x, y: p.y });
        else brygga.skicka({ typ: "hemTryck", uid, text: formel, x: p.x, y: p.y });
      }}
      onPointerCancel={() => {
        nere.current = false;
        if (timer.current != null) window.clearTimeout(timer.current);
        timer.current = null;
      }}
    >
      {children}
    </group>
  );
}
function slagFor(reserv: string | undefined): ReservSlag {
  if (reserv && arReserv(reserv)) return reserv;
  return "hus";
}

function StaketBit({ b, flyttar }: { b: SparatBygge; flyttar: boolean }) {
  const fil = staketFil(b);
  const farg = b.fargHex ?? "#ffffff";
  const boende = b.boende.length;
  return (
    <>
      {kanterForEtt(b).map((k) => {
        const v = kantTillVarld(k);
        const punkt = kantMitt(v.wx, v.wz, v.rotY, 0.45);
        return (
          <TryckYta
            key={kantNyckel(k)}
            uid={b.uid}
            formel={b.formel}
            boende={boende}
            punkt={punkt}
            flyttar={flyttar}
          >
            <group position={[v.wx, 0, v.wz]} rotation={[0, v.rotY, 0]}>
              <Suspense fallback={<StaketReserv farg={farg} />}>
                <ModellGren reserv={<StaketReserv farg={farg} />}>
                  <KlonadScen url={fil} malhojd={0} fargHex={farg} passa={false} klickbar />
                </ModellGren>
              </Suspense>
            </group>
          </TryckYta>
        );
      })}
    </>
  );
}

function HusBit({ b, flyttar }: { b: SparatBygge; flyttar: boolean }) {
  const rad = byggRad(b.bygg);
  const hojd = rad?.malhojd ?? 1;
  const farg = b.fargHex ?? rad?.farg ?? "#D84315";
  const skala = (rad as { skala?: number } | undefined)?.skala ?? 1;
  const rotY = (rad as { rotY?: number } | undefined)?.rotY ?? 0;
  const slag = slagFor(rad?.reserv);
  const cell = xyTillCell(b.x, b.y);
  const { wx, wz } = cellTillVarld(cell.gx, cell.gz);
  const reserv = <ReservForm slag={slag} farg={farg} hojd={hojd} />;
  const storlekSkala = b.storlekId === "liten" ? 0.78 : b.storlekId === "stor" ? 1.28 : 1;
  return (
    <TryckYta
      uid={b.uid}
      formel={b.formel}
      boende={b.boende.length}
      punkt={[wx, hojd * 0.65, wz]}
      flyttar={flyttar}
    >
      <group position={[wx, 0, wz]} scale={storlekSkala}>
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow raycast={() => undefined}>
          <circleGeometry args={[0.74, 24]} />
          <meshBasicMaterial color="#245832" transparent opacity={0.34} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.035, 0]} receiveShadow castShadow raycast={() => undefined}>
          <cylinderGeometry args={[0.58, 0.64, 0.07, 24]} />
          <meshStandardMaterial color="#E6C79C" roughness={0.85} metalness={0.02} />
        </mesh>
        <group position={[0, 0.06, 0]} rotation={[0, rotY, 0]}>
          {rad?.fil ? (
            <ModellGren reserv={reserv}>
              <Suspense fallback={reserv}>
                <KlonadScen
                  url={rad.fil}
                  malhojd={hojd}
                  fargHex={farg}
                  takFargHex={takFargForBygge(b)}
                  fonsterAntal={fonsterAntalForBygge(b)}
                  uid={b.uid}
                  skala={skala}
                  klickbar
                  passa
                />
              </Suspense>
            </ModellGren>
          ) : (
            reserv
          )}
        </group>
      </group>
    </TryckYta>
  );
}

export function ByggeModell({ b, flyttar }: { b: SparatBygge; flyttar: boolean }) {
  if (arKantBygge(b.bygg)) return <StaketBit b={b} flyttar={flyttar} />;
  return <HusBit b={b} flyttar={flyttar} />;
}

export function DekorHobalar() {
  return (
    <>
      {gard3d.dekor.map((d) => (
        <group key={`${d.wx},${d.wz}`} position={[d.wx, 0, d.wz]} rotation={[0, d.rotY, 0]}>
          <Suspense fallback={null}>
            <ModellGren reserv={<StjarnPuffReserv skala={0.7} y={0.3} />}>
              <KlonadScen url={d.fil} malhojd={d.malhojd} fargHex={null} passa />
            </ModellGren>
          </Suspense>
        </group>
      ))}
    </>
  );
}
