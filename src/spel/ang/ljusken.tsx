// B4.1: skenet från det barnet skapat (en lykta, en lampa …).
// Shadrarna i three.js byggs om när antalet ljus i scenen ändras, och det hackar på mobil. Därför har platsscenen
// en FAST pool med MAX_LJUS punktljus (`LjusPool`), som alltid finns på platser med ljuskälla. Lediga ljus har
// intensitet 0 och ligger långt under marken. `DjurIScen` ritar bara `Ljusken`: en markör där ljuset ska sitta och
// en mjuk ljuspöl på marken. Poolen läser markörernas läge varje bildruta. Ängen och kvalitet låg har ingen pool.
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { kvalitetsniva } from "../miljo.ts";
import { MAX_LJUS, type Ljuskalla } from "../ljuskalla.ts";

export const LJUS_LAG = kvalitetsniva() === "lag";
/** uid → markören (Object3D) där djurets ljus sitter. Fylls av `Ljusken`, läses av `LjusPool`. */
const markorer = new Map<string, THREE.Object3D>();
const raknare = () => (window.__ljus ??= { ljus: 0, pol: 0, aktiva: 0, program: 0 });

let polTextur: THREE.Texture | null = null;
/** En radiell gradient (vit i mitten, genomskinlig i kanten), ritad en gång och delad av alla ljuspölar. */
function pol(): THREE.Texture | null {
  if (polTextur || typeof document === "undefined") return polTextur;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  if (!g) return null;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.45, "rgba(255,255,255,0.45)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  polTextur = new THREE.CanvasTexture(c);
  return polTextur;
}

/** I DjurIScen: markör på `hojd` över marken (vid saken) + ljuspöl. Inget eget ljus, alltså ingen shader-ombyggnad. */
export function Ljusken({ uid, kalla, hojd }: { uid: string; kalla: Ljuskalla; hojd: number }) {
  const karta = useMemo(() => pol(), []);
  const markor = useRef<THREE.Group>(null);
  const storlek = kalla.avstand * 1.1;
  useEffect(() => {
    const o = markor.current;
    if (o) markorer.set(uid, o);
    const r = raknare();
    r.pol++;
    return () => {
      if (markorer.get(uid) === o) markorer.delete(uid);
      r.pol--;
    };
  }, [uid]);
  return (
    <group name="ljusken">
      <group ref={markor} position={[0, hojd, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]} renderOrder={2}>
        <planeGeometry args={[storlek, storlek]} />
        <meshBasicMaterial map={karta} color={kalla.farg} transparent opacity={LJUS_LAG ? 0.5 : 0.32} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

const GOMT = new THREE.Vector3(0, -60, 0);
/** I PlatsScen (bara platser med ljuskälla, inte kvalitet låg): alltid MAX_LJUS punktljus. `uids` = de som ska lysa, senaste först. */
export function LjusPool({ kalla, uids }: { kalla: Ljuskalla; uids: string[] }) {
  const ljus = useRef<(THREE.PointLight | null)[]>([]);
  const sist = useRef(-1);
  useEffect(() => {
    const r = raknare();
    r.ljus += MAX_LJUS;
    return () => {
      r.ljus -= MAX_LJUS;
      r.aktiva = 0;
    };
  }, []);
  useFrame(({ scene, gl, clock }) => {
    let aktiva = 0;
    for (let i = 0; i < MAX_LJUS; i++) {
      const l = ljus.current[i];
      if (!l) continue;
      const o = uids[i] ? markorer.get(uids[i]) : undefined;
      if (o) {
        o.getWorldPosition(l.position);
        l.intensity = kalla.intensitet;
        aktiva++;
      } else {
        l.position.copy(GOMT);
        l.intensity = 0;
      }
    }
    // Provräknare, fyra gånger i sekunden: punktljus i hela scenen och antal shaderprogram.
    if (clock.elapsedTime - sist.current >= 0.25) {
      sist.current = clock.elapsedTime;
      const r = raknare();
      let n = 0;
      scene.traverse((x) => {
        if ((x as THREE.PointLight).isPointLight) n++;
      });
      r.scen = n;
      r.aktiva = aktiva;
      r.program = gl.info.programs?.length ?? 0;
    }
  });
  return (
    <group name="ljuspool">
      {Array.from({ length: MAX_LJUS }, (_, i) => (
        <pointLight key={i} ref={(l) => void (ljus.current[i] = l)} position={GOMT} color={kalla.farg} intensity={0} distance={kalla.avstand} decay={1.2} />
      ))}
    </group>
  );
}
