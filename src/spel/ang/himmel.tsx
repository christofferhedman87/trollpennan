import { useFrame } from "@react-three/fiber";
import { useCallback, useMemo, useRef } from "react";
import * as THREE from "three";
import { MILJO, markTextur } from "../miljo.ts";
import { sagaNatt } from "../saga.ts";
import { TOON_MAP } from "./djur.tsx";
import { SVAJ_AMP } from "./damm.ts";

const MARK_TEX = markTextur(THREE);
const MARK_GEO = (() => {
  const g = new THREE.PlaneGeometry(160, 160, 28, 28);
  const pos = g.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const ljus = new THREE.Color("#A8DE78");
  const mitt = new THREE.Color("#8FD16A");
  const djup = new THREE.Color("#6DBE45");
  const horisont = new THREE.Color("#6E9A78");
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const n = Math.sin(x * 0.33) * Math.cos(y * 0.27) * 0.5 + 0.5;
    tmp.copy(n > 0.66 ? ljus : n > 0.38 ? mitt : djup);
    const far = Math.min(1, Math.hypot(x, y) / 42);
    tmp.lerp(horisont, far * 0.28);
    cols[i * 3] = tmp.r;
    cols[i * 3 + 1] = tmp.g;
    cols[i * 3 + 2] = tmp.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  return g;
})();

export function SvajMark({ color, natt, utanTextur = false }: { color: string; natt: number; utanTextur?: boolean }) {
  const uTime = useMemo(() => ({ value: 0 }), []);
  const mat = useRef<THREE.MeshToonMaterial>(null);
  const ljus = useRef(new THREE.Color("#ffffff"));
  const mork = useRef(new THREE.Color("#3E5C34"));
  const bland = useRef(new THREE.Color());
  const sag = useRef(false);
  const kompilera = useCallback(
    (shader: { uniforms: Record<string, { value: number }>; vertexShader: string }) => {
      shader.uniforms.uTime = uTime;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
         float svaj = sin(transformed.x * 0.48 + uTime * 1.05) * cos(transformed.y * 0.4 + uTime * 0.75);
         float nara = 1.0 - clamp(length(transformed.xy) / 16.0, 0.0, 1.0);
         transformed.z += svaj * ${SVAJ_AMP.toFixed(3)} * nara;
        `,
        );
    },
    [uTime],
  );
  useFrame((s) => {
    uTime.value = s.clock.elapsedTime;
    const m = mat.current;
    if (!m) return;
    const ov = sagaNatt(natt);
    if (ov == null) {
      if (sag.current) {
        m.color.set(color);
        sag.current = false;
      }
      return;
    }
    sag.current = true;
    bland.current.copy(ljus.current).lerp(mork.current, Math.min(1, ov * 0.85));
    m.color.copy(bland.current);
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <primitive object={MARK_GEO} attach="geometry" />
      <meshToonMaterial ref={mat} color={color} vertexColors={!utanTextur} map={utanTextur ? null : MARK_TEX} gradientMap={TOON_MAP} onBeforeCompile={kompilera} />
    </mesh>
  );
}

const HIMMEL_VERT = `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const HIMMEL_FRAG = `
uniform vec3 uTop;
uniform vec3 uHor;
varying vec3 vDir;
void main() {
  float h = normalize(vDir).y;
  float k = smoothstep(-0.55, 0.35, h);
  gl_FragColor = vec4(mix(uHor, uTop, k), 1.0);
}
`;

/** `natt` styr introts natthimmel (sagaNatt). `kvall` (0..kvall.djup) tonar dagshimlen mot kvällsfärgerna i data/miljo.json. */
export function Himmel({ natt, kvall = 0 }: { natt: number; kvall?: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const dagTop = useMemo(() => new THREE.Color(MILJO.himmel.dag_topp), []);
  const dagHor = useMemo(() => new THREE.Color(MILJO.himmel.dag_horisont), []);
  const nattTop = useMemo(() => new THREE.Color("#1A2344"), []);
  const nattHor = useMemo(() => new THREE.Color("#3A4A72"), []);
  const kvallTop = useMemo(() => new THREE.Color(MILJO.kvall.himmel_topp), []);
  const kvallHor = useMemo(() => new THREE.Color(MILJO.kvall.himmel_horisont), []);
  const top = useRef(new THREE.Color("#7EC8F2"));
  const hor = useRef(new THREE.Color("#A9CDE6"));
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color(MILJO.himmel.dag_topp) },
      uHor: { value: new THREE.Color(MILJO.himmel.dag_horisont) },
    }),
    [],
  );
  useFrame(({ camera }) => {
    const m = mesh.current;
    if (m) m.position.copy(camera.position);
    const saga = sagaNatt(natt);
    if (saga == null && kvall > 0) {
      top.current.copy(dagTop).lerp(kvallTop, Math.min(1, kvall));
      hor.current.copy(dagHor).lerp(kvallHor, Math.min(1, kvall));
    } else {
      const t = Math.min(1, saga ?? natt);
      top.current.copy(dagTop).lerp(nattTop, t);
      hor.current.copy(dagHor).lerp(nattHor, t);
    }
    uniforms.uTop.value.copy(top.current);
    uniforms.uHor.value.copy(hor.current);
  });
  return (
    <mesh ref={mesh} renderOrder={-1} frustumCulled={false} raycast={() => null}>
      <sphereGeometry args={[28, 18, 12]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        vertexShader={HIMMEL_VERT}
        fragmentShader={HIMMEL_FRAG}
        uniforms={uniforms}
      />
    </mesh>
  );
}
