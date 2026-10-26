// B1.3b: scenen för andra platser än ängen (Skogen, Sjön, Grottan …), helt ur data/platser.json.
// Ängen ritas som förut i angen3d.tsx; här finns bara miljö (himmel, dis, ljus, mark), startobjekt och platsens skapelser.
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { belysScen } from "../belys.ts";
import { GltfSak } from "../gltfDjur.tsx";
import { InstansModell } from "../kenneyNatur.tsx";
import { KV, miljoFor } from "../miljo.ts";
import { useMinne } from "../minne.ts";
import { DEKOR_SKALA, dekorFor, horisontFor, spridDekor, vattenytor, type SpriddDekor } from "../platsDekor.ts";
import { platsMed } from "../platser.ts";
import { PLATS_MAX_AVSTAND } from "../skarm.ts";
import { ljuskallaFor, valjLjus } from "../ljuskalla.ts";
import { LJUS_LAG, LjusPool } from "./ljusken.tsx";
import { DjurIScen } from "./djur.tsx";
import { Horisont } from "./dekor.tsx";
import { SvajMark } from "./himmel.tsx";
import { SagaPenna } from "./saga.tsx";
import { KameraRam } from "./kamera.tsx";
import type { OrbitStyr } from "./saga.tsx";


/** Kameran börjar närmare platsens dekor (ängen har egen start). */
function PlatsKamera() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 3.05, 6.8);
    camera.near = 0.1;
    camera.far = 90;
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

const INGA: never[] = [];
const sagt = new Set<string>();

/** En modell som inte går att hämta ska inte släcka hela scenen: den saken hoppas över. */
class SakGren extends Component<{ children: ReactNode }, { fel: boolean }> {
  state = { fel: false };
  static getDerivedStateFromError() {
    return { fel: true };
  }
  render() {
    return this.state.fel ? null : this.props.children;
  }
}

const BIOM_GLB: Record<string, string> = {
  skogen: "/models/bulk/s-biom-svampkluster-cc0.glb",
  sjon: "/models/bulk/s-biom-nackros-cc0.glb",
  grottan: "/models/bulk/s-plort-kristall-cc0.glb",
};

function BiomModell({ url }: { url: string }) {
  const gltf = useGLTF(url);
  const klon = useMemo(() => {
    belysScen(gltf.scene);
    return gltf.scene.clone(true);
  }, [gltf.scene]);
  return <primitive object={klon} position={[1.15, 0, 0.4]} scale={1.2} />;
}

function BiomRekvisita({ plats }: { plats: string }) {
  const url = BIOM_GLB[plats];
  if (!url) return null;
  return (
    <SakGren>
      <Suspense fallback={null}>
        <BiomModell url={url} />
      </Suspense>
    </SakGren>
  );
}

function loggaSaknas(plats: string, ord: string) {
  const nyckel = `${plats}:${ord}`;
  if (sagt.has(nyckel)) return;
  sagt.add(nyckel);
  console.info(`[plats] ${plats}: "${ord}" har ingen modell, hoppas över`);
}

/** En platt skugga per dekorsak. Radie ≈ 0,35 × höjd. En instancedMesh för hela raden av rader. */
function DekorSkuggor({ rader }: { rader: SpriddDekor[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const alla = useMemo(() => rader.filter((r) => r.url && r.platser.length).flatMap((r) => r.platser), [rader]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const sv = new THREE.Vector3();
    q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    alla.forEach(([x, z, hojd], i) => {
      const radie = 0.35 * hojd;
      pos.set(x, 0.02, z);
      sv.set(radie, radie, radie);
      m.compose(pos, q, sv);
      mesh.setMatrixAt(i, m);
    });
    mesh.count = alla.length;
    mesh.instanceMatrix.needsUpdate = true;
  }, [alla]);
  if (!alla.length) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, alla.length]} frustumCulled={false}>
      <circleGeometry args={[1, 12]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.16} depthWrite={false} />
    </instancedMesh>
  );
}

/** Startobjekten (ord → entitet via samma uppslag som barnets ord), dekor ur data och vattenytorna. */
export function PlatsDekor({ plats }: { plats: string }) {
  const p = platsMed(plats);
  const { saker, saknas } = useMemo(() => dekorFor(p), [p]);
  const vatten = useMemo(() => vattenytor(p), [p]);
  const spridd = useMemo(() => spridDekor(p), [p]);
  for (const ord of saknas) loggaSaknas(plats, ord);
  for (const rad of spridd) if (rad.saknas) loggaSaknas(plats, rad.saknas);
  return (
    <group name={`plats-${plats}`} scale={DEKOR_SKALA}>
      {vatten.map((v) => (
        <mesh key={v.id} name="vattenyta" rotation={[-Math.PI / 2, 0, 0]} position={v.mitt}>
          <planeGeometry args={v.storlek} />
          <meshStandardMaterial color="#4FC3F7" transparent opacity={0.85} roughness={0.22} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {saker.map((s, i) => (
        <group key={`${s.kropp}-${i}`} name={s.ord} position={s.pos} scale={s.skala}>
          <SakGren>
            <Suspense fallback={null}>
              <GltfSak id={s.kropp} vand={s.vand} farger={s.farger} />
            </Suspense>
          </SakGren>
        </group>
      ))}
      <DekorSkuggor rader={spridd} />
      <BiomRekvisita plats={plats} />
      {spridd.map((rad, i) =>
        rad.url && rad.platser.length ? (
          <SakGren key={`${rad.url}-${i}`}>
            <Suspense fallback={null}>
              <InstansModell url={rad.url} platser={rad.platser} vand={rad.vand} farger={rad.farger} />
            </Suspense>
          </SakGren>
        ) : null,
      )}
    </group>
  );
}

/** Hela scenen för en plats som inte är ängen. */
export function PlatsScen({ plats }: { plats: string }) {
  const djur = useMinne((s) => s.platsSkapelser[plats] ?? INGA);
  const styr = useRef<OrbitStyr>(null);
  const { miljo, ljusSkala, mark } = useMemo(() => miljoFor(platsMed(plats)?.miljo), [plats]);
  const platsData = platsMed(plats);
  const horisont = useMemo(() => horisontFor(platsMed(plats)?.miljo), [plats]);
  // B4.1: platsens ljuskälla (data) och de högst 4 senast skapade sakerna som lyser. Ljusen är en fast pool (inga shader-ombyggen).
  const kalla = useMemo(() => ljuskallaFor(platsMed(plats)), [plats]);
  const lysande = useMemo(() => (kalla ? valjLjus(djur, kalla) : null), [djur, kalla]);
  const tanda = useMemo(() => [...(lysande?.keys() ?? [])], [lysande]);
  const L = miljo.ljus;
  const k = ljusSkala;
  return (
    <>
      <color attach="background" args={[miljo.himmel.bakgrund]} />
      <fog attach="fog" args={[miljo.dis.farg, miljo.dis.nara, miljo.dis.fjarran]} />
      <ambientLight intensity={L.ambient.styrka * k} color={L.ambient.farg} />
      <hemisphereLight args={[L.hemi.himmel, L.hemi.mark, L.hemi.styrka * k]} />
      <directionalLight
        color={L.nyckel.farg}
        position={L.nyckel.position as [number, number, number]}
        intensity={L.nyckel.styrka * k}
        castShadow
        shadow-mapSize-width={KV.skuggkarta}
        shadow-mapSize-height={KV.skuggkarta}
        shadow-camera-near={0.5}
        shadow-camera-far={28}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <directionalLight color={L.fyll.farg} position={[-6, 3, 4]} intensity={L.fyll.styrka * k} />
      <directionalLight color={L.kant.farg} position={[-2, 4, -5]} intensity={L.kant.styrka * k} />
      <SvajMark color={mark} natt={0} utanTextur={mark !== "#ffffff"} />
      {horisont ? <Horisont farger={horisont.farger} typ={horisont.typ} /> : null}
      <PlatsKamera />
      <PlatsDekor plats={plats} />
      {kalla && !LJUS_LAG ? <LjusPool kalla={kalla} uids={tanda} /> : null}
      {djur.map((spec) => (
        <DjurIScen key={spec.uid} spec={spec} alla={djur} plats={platsData} ljus={kalla && lysande?.has(spec.uid) ? { kalla, vad: lysande.get(spec.uid)! } : undefined} />
      ))}
      <SagaPenna />
      <OrbitControls
        ref={styr as never}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={1.42}
        minPolarAngle={1.1}
        minAzimuthAngle={-1.05}
        maxAzimuthAngle={1.05}
        minDistance={3.6}
        maxDistance={PLATS_MAX_AVSTAND}
        target={[0, 0.7, 0.5]}
        rotateSpeed={0.7}
        zoomSpeed={0.75}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />
      <KameraRam styr={styr} />
    </>
  );
}
