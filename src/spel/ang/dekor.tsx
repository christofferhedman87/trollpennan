import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { BLOMMOR, GRAN, TRAD, _blomE, _blomM, _blomP, _blomQ, _blomS, _dir } from "./delat.ts";
import { TOON_MAP } from "./djur.tsx";
import { DAMM } from "./damm.ts";

const _damm = new THREE.Vector3();

export function Sond() {
  const fps = useRef({ n: 0, t: 0 });
  useFrame((state) => {
    const p = state.camera.position;
    const t = window.__tred ?? { x: 0, y: 0, z: 0, zoom: 0 };
    t.x = Math.round(p.x * 100) / 100;
    t.y = Math.round(p.y * 100) / 100;
    t.z = Math.round(p.z * 100) / 100;
    t.zoom = Math.round(p.length() * 100) / 100;
    state.camera.getWorldDirection(_dir);
    t.dx = Math.round(_dir.x * 100) / 100;
    t.dy = Math.round(_dir.y * 100) / 100;
    t.dz = Math.round(_dir.z * 100) / 100;
    const cam = state.camera as THREE.PerspectiveCamera;
    t.fov = cam.fov;
    // B6.3 (G), för prov: skärmpunkter (CSS-px) på dammens vatten – mitten och fyra punkter halvvägs ut
    window.__damm = { x: DAMM.x, z: DAMM.z, r: DAMM.r };
    if (fps.current.n % 10 === 0) {
      const rekt = state.gl.domElement.getBoundingClientRect();
      t.damm = [[0, 0], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]].map(([dx, dz]) => {
        _damm.set(DAMM.x + (dx ?? 0) * DAMM.r, DAMM.y, DAMM.z + (dz ?? 0) * DAMM.r).project(cam);
        return { x: Math.round(rekt.left + ((_damm.x + 1) / 2) * rekt.width), y: Math.round(rekt.top + ((1 - _damm.y) / 2) * rekt.height) };
      });
    }
    t.calls = state.gl.info.render.calls;
    t.tris = state.gl.info.render.triangles;
    const nu = state.clock.elapsedTime;
    const r = fps.current;
    r.n += 1;
    if (nu - r.t >= 0.5) {
      t.fps = Math.round(r.n / Math.max(0.001, nu - r.t));
      r.n = 0;
      r.t = nu;
    }
    window.__tred = t;
  });
  return null;
}

export function Moln({ position, fart }: { position: [number, number, number]; fart: number }) {
  const ref = useRef<THREE.Group>(null);
  const basY = position[1];
  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    const d = Math.min(delta, 0.1);
    g.position.x += d * fart;
    if (g.position.x > 6) g.position.x = -6;
    g.position.y = basY + Math.sin(state.clock.elapsedTime * 0.12 + position[0]) * 0.06;
  });
  return (
      <group ref={ref} position={position} scale={0.48}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.05, 20, 16]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0.95, -0.12, 0.15]}>
        <sphereGeometry args={[0.78, 20, 16]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[-0.9, -0.18, 0.05]}>
        <sphereGeometry args={[0.62, 20, 16]} />
        <meshBasicMaterial color="#E7F3FC" />
      </mesh>
    </group>
  );
}

export function TradOchBlommor() {
  const stam = useRef<THREE.InstancedMesh>(null);
  const krona = useRef<THREE.InstancedMesh>(null);
  const topp = useRef<THREE.InstancedMesh>(null);
  const sidoKrona = useRef<THREE.InstancedMesh>(null);
  const blom = useRef<THREE.InstancedMesh>(null);
  const mitt = useRef<THREE.InstancedMesh>(null);
  const stjalk = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    TRAD.forEach(([x, z, s], i) => {
      _blomQ.identity();
      _blomP.set(x, 0.5, z);
      _blomS.set(s, s, s);
      _blomM.compose(_blomP, _blomQ, _blomS);
      stam.current?.setMatrixAt(i, _blomM);
      _blomP.set(x, 1.42, z);
      _blomS.set(1.02 * s, 0.92 * s, 1.02 * s);
      _blomM.compose(_blomP, _blomQ, _blomS);
      krona.current?.setMatrixAt(i, _blomM);
      _blomP.set(x + 0.12 * s, 1.92, z);
      _blomS.set(0.9 * s, 0.78 * s, 0.9 * s);
      _blomM.compose(_blomP, _blomQ, _blomS);
      topp.current?.setMatrixAt(i, _blomM);
      _blomP.set(x - 0.48 * s, 1.28, z + 0.06 * s);
      _blomS.set(1.05 * s, 0.9 * s, 1.05 * s);
      _blomM.compose(_blomP, _blomQ, _blomS);
      sidoKrona.current?.setMatrixAt(i, _blomM);
    });
    if (stam.current) stam.current.instanceMatrix.needsUpdate = true;
    if (krona.current) krona.current.instanceMatrix.needsUpdate = true;
    if (topp.current) topp.current.instanceMatrix.needsUpdate = true;
    if (sidoKrona.current) sidoKrona.current.instanceMatrix.needsUpdate = true;
    const c = new THREE.Color();
    BLOMMOR.forEach(([x, z, farg], i) => {
      m.makeTranslation(x, 0.28, z);
      blom.current?.setMatrixAt(i, m);
      blom.current?.setColorAt(i, c.set(farg));
      m.makeTranslation(x, 0.36, z);
      mitt.current?.setMatrixAt(i, m);
      m.makeTranslation(x, 0.14, z);
      stjalk.current?.setMatrixAt(i, m);
    });
    if (blom.current) {
      blom.current.instanceMatrix.needsUpdate = true;
      if (blom.current.instanceColor) blom.current.instanceColor.needsUpdate = true;
    }
    if (mitt.current) mitt.current.instanceMatrix.needsUpdate = true;
    if (stjalk.current) stjalk.current.instanceMatrix.needsUpdate = true;
  }, []);
  useFrame((state) => {
    const mesh = blom.current;
    const ben = stjalk.current;
    const nav = mitt.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < BLOMMOR.length; i++) {
      const blomma = BLOMMOR[i];
      if (!blomma) continue;
      const [x, z] = blomma;
      const svaj = Math.sin(t * 1.35 + i * 0.7) * 0.08;
      _blomP.set(x + svaj, 0.3 + Math.sin(t * 2.1 + i) * 0.02, z);
      _blomE.set(svaj * 0.4, t * 0.15 + i, svaj * 0.5);
      _blomQ.setFromEuler(_blomE);
      _blomS.set(1.6, 1.3, 1.6);
      _blomM.compose(_blomP, _blomQ, _blomS);
      mesh.setMatrixAt(i, _blomM);
      if (nav) {
        _blomP.set(x + svaj, 0.4, z);
        _blomS.set(0.07, 0.07, 0.07);
        _blomM.compose(_blomP, _blomQ, _blomS);
        nav.setMatrixAt(i, _blomM);
      }
      if (ben) {
        _blomP.set(x + svaj * 0.35, 0.14, z);
        _blomE.set(svaj * 0.4, 0, svaj);
        _blomQ.setFromEuler(_blomE);
        _blomS.set(1, 1, 1);
        _blomM.compose(_blomP, _blomQ, _blomS);
        ben.setMatrixAt(i, _blomM);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (nav) nav.instanceMatrix.needsUpdate = true;
    if (ben) ben.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={stam} args={[undefined, undefined, TRAD.length]}>
        <cylinderGeometry args={[0.10, 0.16, 1.0, 14]} />
        <meshToonMaterial color="#8D6E63" gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={krona} args={[undefined, undefined, TRAD.length]}>
        <sphereGeometry args={[0.88, 20, 16]} />
        <meshToonMaterial color="#7CB342" gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={topp} args={[undefined, undefined, TRAD.length]}>
        <sphereGeometry args={[0.72, 20, 16]} />
        <meshToonMaterial color="#9CCC65" gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={sidoKrona} args={[undefined, undefined, TRAD.length]}>
        <sphereGeometry args={[0.62, 20, 16]} />
        <meshToonMaterial color="#A5D856" gradientMap={TOON_MAP} />
      </instancedMesh>
      <Granar />
      <instancedMesh ref={stjalk} args={[undefined, undefined, BLOMMOR.length]}>
        <cylinderGeometry args={[0.02, 0.035, 0.32, 4]} />
        <meshToonMaterial color="#7CB342" gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={blom} args={[undefined, undefined, BLOMMOR.length]}>
        <sphereGeometry args={[0.10, 12, 10]} />
        <meshToonMaterial color="#ffffff" gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={mitt} args={[undefined, undefined, BLOMMOR.length]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshBasicMaterial color="#FFF59D" />
      </instancedMesh>
    </>
  );
}

export function Granar() {
  const kjol = useRef<THREE.InstancedMesh>(null);
  const ovre = useRef<THREE.InstancedMesh>(null);
  const topp = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3(1, 1, 1);
    GRAN.forEach(([x, z], i) => {
      p.set(x, 0.68, z);
      m.compose(p, q, s);
      kjol.current?.setMatrixAt(i, m);
      p.set(x, 1.42, z);
      s.set(0.82, 0.88, 0.82);
      m.compose(p, q, s);
      ovre.current?.setMatrixAt(i, m);
      p.set(x, 2.02, z);
      s.set(1, 1, 1);
      m.compose(p, q, s);
      topp.current?.setMatrixAt(i, m);
    });
    if (kjol.current) kjol.current.instanceMatrix.needsUpdate = true;
    if (ovre.current) ovre.current.instanceMatrix.needsUpdate = true;
    if (topp.current) topp.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <>
      <instancedMesh ref={kjol} args={[undefined, undefined, GRAN.length]}>
        <coneGeometry args={[0.78, 1.36, 16]} />
        <meshToonMaterial color="#2F6B32" gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={ovre} args={[undefined, undefined, GRAN.length]}>
        <coneGeometry args={[0.56, 1.12, 16]} />
        <meshToonMaterial color="#3E7A32" gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={topp} args={[undefined, undefined, GRAN.length]}>
        <sphereGeometry args={[0.18, 14, 12]} />
        <meshToonMaterial color="#8BC34A" gradientMap={TOON_MAP} />
      </instancedMesh>
    </>
  );
}

const FJARIL: { x: number; z: number; f: string; s: number }[] = [
  { x: -1.2, z: -0.3, f: "#FFB74D", s: 0.7 },
  { x: 1.5, z: 0.5, f: "#F48FB1", s: 0.8 },
  { x: -1.6, z: -0.55, f: "#FFF59D", s: 0.6 },
];

export function Fjarilar() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < g.children.length; i++) {
      const b = FJARIL[i];
      const c = g.children[i];
      if (!b || !c) continue;
      c.position.set(
        b.x + Math.sin(t * b.s + i) * 0.45,
        2.15 + Math.sin(t * 2.1 + i * 2) * 0.22,
        b.z + Math.cos(t * b.s * 0.75 + i) * 0.35,
      );
      c.rotation.y = Math.sin(t * b.s + i);
      const ving = Math.sin(t * 14 + i) * 0.4;
      const vanster = c.children[0];
      const hoger = c.children[1];
      if (vanster) vanster.rotation.z = 0.7 + ving;
      if (hoger) hoger.rotation.z = -0.7 - ving;
    }
  });
  return (
    <group ref={ref}>
      {FJARIL.map((b) => (
        <group key={b.f}>
          <group position={[-0.1, 0, 0]}>
            <mesh position={[-0.02, 0, 0.03]} scale={[1.35, 0.14, 0.95]}>
              <sphereGeometry args={[0.11, 18, 14]} />
              <meshBasicMaterial color={b.f} />
            </mesh>
            <mesh position={[0.02, 0.02, 0.06]}>
              <sphereGeometry args={[0.035, 12, 10]} />
              <meshBasicMaterial color="#FFFDF7" />
            </mesh>
            <mesh position={[0.01, 0, -0.09]} scale={[1.15, 0.14, 0.85]}>
              <sphereGeometry args={[0.08, 16, 12]} />
              <meshBasicMaterial color={b.f} />
            </mesh>
          </group>
          <group position={[0.1, 0, 0]}>
            <mesh position={[0.02, 0, 0.03]} scale={[1.35, 0.14, 0.95]}>
              <sphereGeometry args={[0.11, 18, 14]} />
              <meshBasicMaterial color={b.f} />
            </mesh>
            <mesh position={[-0.02, 0.02, 0.06]}>
              <sphereGeometry args={[0.035, 12, 10]} />
              <meshBasicMaterial color="#FFFDF7" />
            </mesh>
            <mesh position={[-0.01, 0, -0.09]} scale={[1.15, 0.14, 0.85]}>
              <sphereGeometry args={[0.08, 16, 12]} />
              <meshBasicMaterial color={b.f} />
            </mesh>
          </group>
          <mesh>
            <sphereGeometry args={[0.04, 14, 12]} />
            <meshBasicMaterial color="#3B2F2F" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Ringar() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < g.children.length; i++) {
      const m = g.children[i] as THREE.Mesh | undefined;
      if (!m) continue;
      const u = (t * 0.33 + i * 0.33) % 1;
      m.scale.set(0.35 + u * 0.9, 0.35 + u * 0.9, 1);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - u) * 0.5;
    }
  });
  return (
    <group ref={ref} position={[DAMM.x, DAMM.y + 0.02, DAMM.z]} rotation={[-Math.PI / 2, 0, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <ringGeometry args={[0.55, 0.64, 20]} />
          <meshBasicMaterial color="#E1F5FE" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

export function Nackrosor() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < g.children.length; i++) {
      const c = g.children[i];
      if (c) c.position.y = Math.sin(t * 1.2 + i) * 0.012;
    }
  });
  const pads: [number, number, string, boolean][] = [
    [-0.28, 0.12, "#66BB6A", true],
    [0.22, -0.1, "#7CB342", false],
    [0.02, 0.26, "#66BB6A", false],
    [-0.18, -0.2, "#7CB342", false],
  ];
  return (
    <group ref={ref} position={[DAMM.x, DAMM.y + 0.04, DAMM.z]}>
      {pads.map(([x, z, f, blomma]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh rotation={[-Math.PI / 2, 0, x]}>
            <circleGeometry args={[0.16, 10]} />
            <meshStandardMaterial color={f} roughness={0.85} />
          </mesh>
          {blomma ? (
            <mesh position={[0, 0.05, 0]}>
              <sphereGeometry args={[0.055, 6, 4]} />
              <meshStandardMaterial color="#F48FB1" roughness={0.55} />
            </mesh>
          ) : null}
        </group>
      ))}
    </group>
  );
}

const FLUGOR: [number, number][] = [
  [-1.8, 0.5],
  [-0.3, -1.1],
  [0.7, 1.5],
  [2.0, -0.5],
  [-2.1, -2.2],
  [1.3, -3.0],
];

export function Eldflugor({ natt }: { natt: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const syns = natt > 0.35;
    g.visible = syns;
    if (!syns) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < g.children.length; i++) {
      const bas = FLUGOR[i];
      const c = g.children[i] as THREE.Mesh | undefined;
      if (!bas || !c) continue;
      c.position.set(
        bas[0] + Math.sin(t * 0.7 + i) * 0.4,
        0.6 + (i % 3) * 0.22 + Math.sin(t * 1.4 + i * 1.7) * 0.3,
        bas[1] + Math.cos(t * 0.55 + i) * 0.35,
      );
      const mat = c.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 + Math.sin(t * 3.2 + i) * 0.4;
    }
  });
  return (
    <group ref={ref} visible={false}>
      {FLUGOR.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.05, 6, 5]} />
          <meshBasicMaterial color="#FFF59D" transparent opacity={0.8} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

const TUVOR: [number, number][] = [
  [-1.7, 0.95],
  [-0.85, 1.15],
  [-1.15, 1.85],
  [-1.55, 1.7],
  [0.75, 1.05],
  [1.55, 1.2],
  [1.05, 1.75],
  [1.6, 1.7],
  [-0.2, 2.15],
  [0.4, 2.35],
];

const STENAR: [number, number, number][] = [[1.7, -0.05, 0.14]];

export function GrasTuvor() {
  const ref = useRef<THREE.InstancedMesh>(null);
  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < TUVOR.length; i++) {
      const p = TUVOR[i];
      if (!p) continue;
      const svaj = Math.sin(t * 1.2 + i) * 0.18;
      _blomP.set(p[0], 0.16, p[1]);
      _blomE.set(svaj, 0, svaj * 0.65);
      _blomQ.setFromEuler(_blomE);
      const h = 0.85 + (i % 4) * 0.12;
      _blomS.set(0.85, h, 0.85);
      _blomM.compose(_blomP, _blomQ, _blomS);
      mesh.setMatrixAt(i, _blomM);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, TUVOR.length]}>
      <coneGeometry args={[0.16, 0.38, 6]} />
      <meshToonMaterial color="#8BC34A" gradientMap={TOON_MAP} />
    </instancedMesh>
  );
}

export function Stenar() {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    STENAR.forEach(([x, z, r], i) => {
      p.set(x, r * 0.45, z);
      e.set(0.2 * i, i * 0.7, 0.15 * i);
      q.setFromEuler(e);
      s.set(r, r * 0.72, r * 0.9);
      m.compose(p, q, s);
      ref.current?.setMatrixAt(i, m);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, STENAR.length]} castShadow receiveShadow>
      <sphereGeometry args={[1, 20, 16]} />
      <meshStandardMaterial color="#B0BEC5" roughness={0.95} />
    </instancedMesh>
  );
}

export function Ljusflackar() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    TRAD.forEach(([x, z], i) => {
      p.set(x, 0.045, z + 0.5);
      const r = 0.7 + (i % 3) * 0.12;
      s.set(r, r, 1);
      m.compose(p, q, s);
      ref.current?.setMatrixAt(i, m);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  useFrame((s) => {
    if (mat.current) mat.current.opacity = 0.13 + Math.sin(s.clock.elapsedTime * 0.7) * 0.04;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, TRAD.length]}>
      <circleGeometry args={[1, 10]} />
      <meshBasicMaterial ref={mat} color="#FFF4C2" transparent opacity={0.16} depthWrite={false} />
    </instancedMesh>
  );
}

export function Glitter() {
  const geo = useMemo(() => {
    const n = 16;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.2;
      const rad = 0.22 + (i % 5) * 0.18;
      pos[i * 3] = Math.cos(a) * rad;
      pos[i * 3 + 1] = (i % 3) * 0.01;
      pos[i * 3 + 2] = Math.sin(a) * rad * 0.75;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  const ref = useRef<THREE.Points>(null);
  useFrame((s) => {
    const p = ref.current;
    if (!p) return;
    const mat = p.material as THREE.PointsMaterial;
    mat.opacity = 0.25 + Math.abs(Math.sin(s.clock.elapsedTime * 3.2)) * 0.75;
  });
  return (
    <points ref={ref} position={[1.12, 0.12, -0.35]} geometry={geo}>
      <pointsMaterial color="#FFFFFF" size={0.045} transparent opacity={0.85} depthWrite={false} sizeAttenuation />
    </points>
  );
}

export function FagelFlyg() {
  const ref = useRef<THREE.Group>(null);
  const vL = useRef<THREE.Mesh>(null);
  const vR = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const cykel = 50;
    const u = t % cykel;
    const syns = u > 4 && u < 14;
    g.visible = syns;
    if (!syns) return;
    const p = (u - 4) / 10;
    g.position.set(-6 + p * 12, 3.7 + Math.sin(p * Math.PI) * 0.45, -3.2);
    g.rotation.y = -Math.PI / 2;
    const flap = Math.sin(t * 14) * 0.7;
    if (vL.current) vL.current.rotation.z = flap;
    if (vR.current) vR.current.rotation.z = -flap;
  });
  return (
    <group ref={ref} visible={false}>
      <mesh>
        <sphereGeometry args={[0.16, 20, 16]} />
        <meshStandardMaterial color="#FFB74D" />
      </mesh>
      <mesh ref={vL} position={[-0.2, 0, 0]} scale={[1.5, 0.18, 0.85]}>
        <sphereGeometry args={[0.12, 20, 16]} />
        <meshStandardMaterial color="#FFE0B2" />
      </mesh>
      <mesh ref={vR} position={[0.2, 0, 0]} scale={[1.5, 0.18, 0.85]}>
        <sphereGeometry args={[0.12, 20, 16]} />
        <meshStandardMaterial color="#FFE0B2" />
      </mesh>
    </group>
  );
}

export function Hanglas({ gung }: { gung: { current: number } }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    const g = ref.current;
    const tid = gung.current;
    if (!g || tid == null) return;
    const d = Math.min(delta, 0.1);
    if (tid > 0) gung.current = Math.max(0, tid - d);
    const kvar = gung.current ?? 0;
    g.rotation.z = Math.sin((1 - kvar) * Math.PI * 6) * kvar * 0.85;
    const p = 1 + Math.sin(state.clock.elapsedTime * 2.3) * 0.08;
    g.scale.setScalar(p);
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.07, 0]}>
        <torusGeometry args={[0.07, 0.02, 5, 8, Math.PI]} />
        <meshStandardMaterial color="#F2B632" metalness={0.35} roughness={0.35} flatShading />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[0.12, 0.11, 0.05]} />
        <meshStandardMaterial color="#E6B325" roughness={0.4} flatShading />
      </mesh>
    </group>
  );
}

export function Rok() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < g.children.length; i++) {
      const m = g.children[i] as THREE.Mesh | undefined;
      if (!m) continue;
      const u = (t * 0.18 + i * 0.34) % 1;
      m.position.set(0.15 + Math.sin(t * 0.55 + i) * u * 0.28, 1.7 + u * 2.1, 0.85);
      const s = 0.16 + u * 0.55;
      m.scale.setScalar(s);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - u) * 0.62;
    }
  });
  return (
    <group ref={ref} raycast={() => null}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} scale={0.05} position={[0.38, 1.7, 0]}>
          <sphereGeometry args={[1, 6, 4]} />
          <meshBasicMaterial color="#F7FBFF" transparent opacity={0.2} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

const HORISONT_STANDARD = ["#8FB4C6", "#7E9E92", "#3F6E34"] as const;

/** `typ` (R8-2b): "skog" = kullar med trädkoner (ängen, skogen, sjön), "berg" = kantiga mörka bergväggar längre bak, inga träd. */
export function Horisont({ farger, typ = "skog" }: { farger?: [string, string, string]; typ?: "skog" | "berg" } = {}) {
  const [himlen, kullen, skogen] = farger ?? HORISONT_STANDARD;
  if (typ === "berg") return <BergHorisont farger={[himlen, kullen, skogen]} />;
  return <SkogHorisont farger={[himlen, kullen, skogen]} />;
}

function BergHorisont({ farger }: { farger: [string, string, string] }) {
  const [bak, mitt, fram] = farger;
  return (
    <group>
      <mesh position={[0, 0, -13.5]} scale={[26, 5.2, 1]}>
        <circleGeometry args={[1, 7, 0, Math.PI]} />
        <meshBasicMaterial color={bak} />
      </mesh>
      <mesh position={[-3, 0, -12]} scale={[14, 4.1, 1]} rotation={[0, 0, 0.05]}>
        <circleGeometry args={[1, 5, 0, Math.PI]} />
        <meshBasicMaterial color={mitt} />
      </mesh>
      <mesh position={[5, 0, -11.2]} scale={[11, 3.3, 1]} rotation={[0, 0, -0.06]}>
        <circleGeometry args={[1, 4, 0, Math.PI]} />
        <meshBasicMaterial color={fram} />
      </mesh>
    </group>
  );
}

function SkogHorisont({ farger }: { farger: [string, string, string] }) {
  const [himlen, kullen, skogen] = farger;
  const trad = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = trad.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const platser: [number, number, number][] = [
      [-4.2, 1.15, -6.15],
      [-2.4, 1.45, -6.2],
      [-0.6, 1.25, -6.1],
      [1.6, 1.5, -6.25],
      [3.4, 1.2, -6.15],
      [5.1, 0.95, -6.3],
    ];
    platser.forEach(([x, y, z], i) => {
      p.set(x, y, z);
      s.set(0.55, 0.9 + (i % 3) * 0.15, 0.55);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group>
      <mesh position={[0, 0, -10.6]} scale={[24, 3.6, 1]}>
        <circleGeometry args={[1, 14, 0, Math.PI]} />
        <meshBasicMaterial color={himlen} />
      </mesh>
      <mesh position={[0, 0, -8.3]} scale={[18, 2.7, 1]}>
        <circleGeometry args={[1, 16, 0, Math.PI]} />
        <meshBasicMaterial color={kullen} />
      </mesh>
      <mesh position={[0, 0, -6.35]} scale={[13, 2.15, 1]}>
        <circleGeometry args={[1, 18, 0, Math.PI]} />
        <meshBasicMaterial color={skogen} />
      </mesh>
      <instancedMesh ref={trad} args={[undefined, undefined, 6]}>
        <coneGeometry args={[0.45, 1.3, 5]} />
        <meshBasicMaterial color="#2C5228" />
      </instancedMesh>
    </group>
  );
}

export function Forgrund() {
  const buske = useRef<THREE.InstancedMesh>(null);
  const svampFot = useRef<THREE.InstancedMesh>(null);
  const svampHatt = useRef<THREE.InstancedMesh>(null);
  const svampPrick = useRef<THREE.InstancedMesh>(null);
  const sten = useRef<THREE.InstancedMesh>(null);
  const blom = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const buskar: [number, number, number, number][] = [
      [-1.85, 0.22, 2.55, 0.42],
      [-1.45, 0.16, 2.85, 0.3],
      [1.75, 0.2, 2.7, 0.4],
      [1.35, 0.14, 3.05, 0.26],
      [-0.55, 0.12, 3.15, 0.22],
    ];
    buskar.forEach(([x, y, z, r], i) => {
      p.set(x, y, z);
      s.set(r * 1.3, r, r);
      m.compose(p, q, s);
      buske.current?.setMatrixAt(i, m);
    });
    if (buske.current) buske.current.instanceMatrix.needsUpdate = true;
    const svampar: [number, number, number][] = [
      [0.95, 0.08, 2.55],
      [1.2, 0.07, 2.9],
      [0.7, 0.06, 2.85],
    ];
    const prickar: [number, number, number][] = [
      [0.05, 0.05, 0.03],
      [-0.045, 0.03, 0.04],
      [0.01, 0.06, -0.045],
    ];
    let prickI = 0;
    svampar.forEach(([x, , z], i) => {
      p.set(x, 0.07, z);
      s.set(1, 1, 1);
      m.compose(p, q, s);
      svampFot.current?.setMatrixAt(i, m);
      p.set(x, 0.16, z);
      s.set(1.25, 0.72, 1.25);
      m.compose(p, q, s);
      svampHatt.current?.setMatrixAt(i, m);
      for (const [dx, dy, dz] of prickar) {
        p.set(x + dx, 0.16 + dy, z + dz);
        s.set(1, 1, 1);
        m.compose(p, q, s);
        svampPrick.current?.setMatrixAt(prickI, m);
        prickI += 1;
      }
    });
    if (svampFot.current) svampFot.current.instanceMatrix.needsUpdate = true;
    if (svampHatt.current) svampHatt.current.instanceMatrix.needsUpdate = true;
    if (svampPrick.current) svampPrick.current.instanceMatrix.needsUpdate = true;
    const stigar: [number, number][] = [
      [0.05, 3.25],
      [0.22, 2.85],
      [0.4, 2.45],
      [0.55, 2.05],
      [0.7, 1.65],
      [0.82, 1.25],
      [0.95, 0.9],
    ];
    stigar.forEach(([x, z], i) => {
      p.set(x, 0.04, z);
      s.set(0.22, 0.06, 0.16);
      m.compose(p, q, s);
      sten.current?.setMatrixAt(i, m);
    });
    if (sten.current) sten.current.instanceMatrix.needsUpdate = true;
    const rabatt: [number, number, string][] = [
      [-0.95, 2.35, "#F48FB1"],
      [-0.7, 2.55, "#FDD835"],
      [-1.15, 2.6, "#CE93D8"],
      [-0.85, 2.75, "#FFFFFF"],
      [-0.5, 2.4, "#F48FB1"],
    ];
    const col = new THREE.Color();
    rabatt.forEach(([x, z, f], i) => {
      p.set(x, 0.1, z);
      s.set(0.12, 0.1, 0.12);
      m.compose(p, q, s);
      blom.current?.setMatrixAt(i, m);
      blom.current?.setColorAt(i, col.set(f));
    });
    if (blom.current) {
      blom.current.instanceMatrix.needsUpdate = true;
      if (blom.current.instanceColor) blom.current.instanceColor.needsUpdate = true;
    }
  }, []);
  return (
    <group>
      <instancedMesh ref={buske} args={[undefined, undefined, 5]}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshToonMaterial color="#43A047" gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={svampFot} args={[undefined, undefined, 3]}>
        <cylinderGeometry args={[0.04, 0.055, 0.14, 12]} />
        <meshToonMaterial color="#FFFDF7" gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={svampHatt} args={[undefined, undefined, 3]}>
        <sphereGeometry args={[0.16, 20, 16]} />
        <meshToonMaterial color="#FF5252" gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={svampPrick} args={[undefined, undefined, 9]}>
        <sphereGeometry args={[0.028, 12, 10]} />
        <meshToonMaterial color="#FFFDF7" gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={sten} args={[undefined, undefined, 7]}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshToonMaterial color="#B0A090" gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={blom} args={[undefined, undefined, 5]}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshToonMaterial vertexColors gradientMap={TOON_MAP} />
      </instancedMesh>
    </group>
  );
}

/** 180 tuvor, en draw call. uTime svajar toppen. Fryser när __PAUSE_ANIM är sant. */
export function VindGras({ antal = 180 }: { antal?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const mat = useMemo(() => {
    const m = new THREE.MeshToonMaterial({ color: "#7ED35C", gradientMap: TOON_MAP });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;")
        .replace(
          "#include <begin_vertex>",
          `vec3 transformed = vec3(position);
          float fas = uTime * 1.7 + instanceMatrix[3].x * 1.4 + instanceMatrix[3].z;
          float svaj = sin(fas) * max(position.y, 0.0) * 1.15;
          transformed.x += svaj;
          transformed.z += svaj * 0.4;`,
        );
      m.userData.uTime = shader.uniforms.uTime;
    };
    return m;
  }, []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < antal; i++) {
      const a = i * 2.399963;
      const rad = 0.7 + (i % 11) * 0.38;
      let x = Math.cos(a) * rad * 0.95;
      let z = Math.sin(a) * rad * 0.62 + 0.15;
      const dx = x - DAMM.x;
      const dz = z - DAMM.z;
      if (dx * dx + dz * dz < (DAMM.r + 0.25) * (DAMM.r + 0.25)) {
        x += Math.cos(a) * 1.6;
        z += 1.15;
      }
      dummy.position.set(x, 0.16, z);
      dummy.rotation.set(0, i * 0.37, 0);
      const h = 0.75 + (i % 5) * 0.12;
      dummy.scale.set(0.85 + (i % 3) * 0.08, h, 0.85);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = antal;
  }, [antal]);
  useFrame((state) => {
    const u = mat.userData.uTime as { value: number } | undefined;
    if (!u) return;
    u.value = (window as any).__PAUSE_ANIM === true ? 0 : state.clock.elapsedTime;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, antal]} frustumCulled={false}>
      <coneGeometry args={[0.045, 0.32, 6]} />
      <primitive object={mat} attach="material" />
    </instancedMesh>
  );
}

/** 35 svävande solkorn i en enda point-ritning. */
export function Solkorn({ antal = 35 }: { antal?: number }) {
  const geo = useMemo(() => {
    const pos = new Float32Array(antal * 3);
    for (let i = 0; i < antal; i++) {
      const a = (i / antal) * Math.PI * 2 + i * 0.17;
      const rad = 1.1 + (i % 6) * 0.55;
      pos[i * 3] = Math.cos(a) * rad;
      pos[i * 3 + 1] = 1.35 + (i % 5) * 0.62;
      pos[i * 3 + 2] = Math.sin(a * 1.17) * rad * 0.62;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [antal]);
  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    const p = ref.current;
    if (!p) return;
    const paus = (window as any).__PAUSE_ANIM === true;
    p.rotation.y = paus ? 0 : state.clock.elapsedTime * 0.08;
    p.position.y = paus ? 0 : Math.sin(state.clock.elapsedTime * 0.35) * 0.08;
  });
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial color="#FFF3B0" size={0.07} transparent opacity={0.92} depthWrite={false} sizeAttenuation />
    </points>
  );
}
