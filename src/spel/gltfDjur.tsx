import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";
import type { Sparad } from "./brygga.ts";

/** Kodbyggd reserv om en GLB saknas. Komponenten skickas in utifrån så den här filen inte drar in hela ängen. */
export type DjurSignal = { klapp: number; ror: number };

const FIL: Record<string, string> = {
  kanin: "/models/animal-bunny.glb",
  katt: "/models/animal-cat.glb",
  hund: "/models/animal-dog.glb",
  fisk: "/models/animal-fish.glb",
  fågel: "/models/animal-chick.glb",
  uggla: "/models/animal-chick.glb",
  drake: "/models/drake.glb",
  groda: "/models/groda.glb",
  häst: "/models/hast.glb",
};

const MAL_HOJD: Record<string, number> = {
  kanin: 1,
  katt: 1,
  hund: 1.05,
  fisk: 0.7,
  fågel: 0.8,
  uggla: 0.8,
  drake: 1.35,
  groda: 0.85,
  häst: 1.5,
};

type Palett = { from: number; range: number; bodyL: number };

const PALETT: Record<string, Palett> = {
  kanin: { from: 25, range: 22, bodyL: 0.55 },
  hund: { from: 25, range: 22, bodyL: 0.55 },
  fisk: { from: 25, range: 22, bodyL: 0.55 },
  fågel: { from: 50, range: 12, bodyL: 0.55 },
  uggla: { from: 50, range: 12, bodyL: 0.55 },
  häst: { from: 30, range: 25, bodyL: 0.4 },
  katt: { from: 0, range: -1, bodyL: 0.5 },
};

const texCache = new Map<string, THREE.CanvasTexture>();

function paletteSwap(tex: THREE.Texture, fromHue: number, range: number, toHex: string, bodyL: number) {
  const nyckel = `${fromHue}|${range}|${bodyL}|${toHex}|${tex.uuid}`;
  const finns = texCache.get(nyckel);
  if (finns) return finns;
  const img = tex.image as CanvasImageSource | undefined;
  if (!img) return tex;
  const w = (img as HTMLImageElement).width || (img as ImageBitmap).width;
  const h = (img as HTMLImageElement).height || (img as ImageBitmap).height;
  if (!w || !h) return tex;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d", { willReadFrequently: true });
  if (!x) return tex;
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, w, h);
  const to = new THREE.Color(toHex);
  const th = { h: 0, s: 0, l: 0 };
  to.getHSL(th);
  const tmp = new THREE.Color();
  const hsl = { h: 0, s: 0, l: 0 };
  for (let i = 0; i < d.data.length; i += 4) {
    const a = d.data[i + 3] ?? 0;
    if (a < 8) continue;
    tmp.setRGB((d.data[i] ?? 0) / 255, (d.data[i + 1] ?? 0) / 255, (d.data[i + 2] ?? 0) / 255);
    tmp.getHSL(hsl);
    let dh = Math.abs(hsl.h * 360 - fromHue);
    dh = Math.min(dh, 360 - dh);
    const hit = range < 0 ? hsl.s < 0.2 && hsl.l > 0.2 && hsl.l < 0.85 : dh <= range && hsl.s > 0.25;
    if (!hit) continue;
    tmp.setHSL(th.h, th.s, THREE.MathUtils.clamp(th.l + (hsl.l - bodyL) * 0.6, 0.06, 0.95));
    d.data[i] = tmp.r * 255;
    d.data[i + 1] = tmp.g * 255;
    d.data[i + 2] = tmp.b * 255;
  }
  x.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.flipY = tex.flipY;
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = tex.magFilter;
  t.minFilter = tex.minFilter;
  t.wrapS = tex.wrapS;
  t.wrapT = tex.wrapT;
  t.needsUpdate = true;
  texCache.set(nyckel, t);
  return t;
}

function ljusare(hex: string) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, Math.min(1, hsl.s * 0.85), THREE.MathUtils.clamp(hsl.l + 0.22, 0.2, 0.92));
  return "#" + c.getHexString();
}

function fargAv(spec: Sparad) {
  if (spec.farg?.startsWith("#")) return spec.farg;
  if (spec.kropp === "drake") return "#ff8a3c";
  return null;
}

function klippNamn(actions: Record<string, THREE.AnimationAction | null>, suffix: string) {
  const re = new RegExp(`(^|\\|)${suffix}$`, "i");
  return Object.keys(actions).find((n) => re.test(n)) ?? null;
}

function utanRot(clip: THREE.AnimationClip) {
  const tracks = clip.tracks.filter((t) => {
    const n = t.name.toLowerCase();
    if (!n.endsWith(".position")) return true;
    return !(n.startsWith("root.") || n.startsWith("all.") || n.includes("|all.position"));
  });
  if (tracks.length === clip.tracks.length) return clip;
  return new THREE.AnimationClip(clip.name + "-rot", clip.duration, tracks);
}

const KLIPP = new Map<string, THREE.AnimationClip>();

function tryggKlipp(clip: THREE.AnimationClip) {
  const finns = KLIPP.get(clip.uuid);
  if (finns) return finns;
  const ny = utanRot(clip);
  KLIPP.set(clip.uuid, ny);
  return ny;
}

function metallNoll(rot: THREE.Object3D) {
  rot.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const lista = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of lista) {
      const std = m as THREE.MeshStandardMaterial;
      if (std && "metalness" in std) {
        std.metalness = 0;
        std.roughness = Math.max(std.roughness ?? 1, 0.75);
      }
    }
  });
}

function fargaKlon(rot: THREE.Object3D, spec: Sparad) {
  const hex = fargAv(spec);
  const pal = PALETT[spec.kropp];
  const glans = spec.glans;
  rot.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const lista = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshStandardMaterial[];
    const nya = lista.map((src) => {
      const m = src.clone();
      m.metalness = 0;
      m.roughness = Math.max(m.roughness ?? 1, 0.75);
      const namn = m.name || "";
      if (spec.kropp === "drake") {
        if (namn === "Dragon_Main" && hex) m.color.set(hex);
        if (namn === "Dragon_Secondary") m.color.set(hex ? ljusare(hex) : "#ffd27a");
      } else if (spec.kropp === "groda") {
        if (namn === "4CAF50" && hex) m.color.set(hex);
      } else if (pal && hex && m.map) {
        m.map = paletteSwap(m.map, pal.from, pal.range, hex, pal.bodyL);
        m.color.set("#ffffff");
      }
      if (glans && (namn === "Dragon_Main" || namn === "4CAF50" || pal)) {
        m.emissive = new THREE.Color("#FFE082");
        m.emissiveIntensity = 0.28;
      }
      return m;
    });
    mesh.material = Array.isArray(mesh.material) ? nya : (nya[0] ?? mesh.material);
  });
}

const KRO_GEO = {
  cyl: new THREE.CylinderGeometry(0.5, 0.55, 0.28, 6),
  kon: new THREE.ConeGeometry(0.16, 0.42, 5),
  box: new THREE.BoxGeometry(1, 1, 1),
};
const KRO_MAT = new THREE.MeshStandardMaterial({ color: "#F2B632", metalness: 0.15, roughness: 0.45 });
const HALS_MAT = new THREE.MeshStandardMaterial({ color: "#E57373", metalness: 0, roughness: 0.8 });
const HATT_MAT = new THREE.MeshStandardMaterial({ color: "#5C6BC0", metalness: 0, roughness: 0.7 });

function KronaMesh() {
  const g = new THREE.Group();
  const bas = new THREE.Mesh(KRO_GEO.cyl, KRO_MAT);
  bas.scale.set(0.22, 0.22, 0.22);
  g.add(bas);
  for (const x of [-0.1, 0, 0.1]) {
    const t = new THREE.Mesh(KRO_GEO.kon, KRO_MAT);
    t.position.set(x, 0.1, 0);
    t.scale.setScalar(x === 0 ? 1 : 0.8);
    g.add(t);
  }
  return g;
}

function HalsdukMesh() {
  const g = new THREE.Group();
  const a = new THREE.Mesh(KRO_GEO.box, HALS_MAT);
  a.scale.set(0.28, 0.08, 0.12);
  g.add(a);
  const b = new THREE.Mesh(KRO_GEO.box, HALS_MAT);
  b.position.set(0.06, -0.1, 0.04);
  b.scale.set(0.07, 0.14, 0.05);
  g.add(b);
  return g;
}

const _onskad = new THREE.Matrix4();
const _benInv = new THREE.Matrix4();
const _lokal = new THREE.Matrix4();
const _bas = new THREE.Vector3();
const _off = new THREE.Vector3();
const _rotQ = new THREE.Quaternion();
const _skala = new THREE.Vector3(1, 1, 1);

/** Offset i den färdigskalade modellens rum (Y upp), inte i benets egna axlar.
 *  Quaternius-riggar har Y längs benet och scale 100, så en rå ben-offset hamnar utanför kameran. */
function faestPaBen(ben: THREE.Object3D, rot: THREE.Object3D, obj: THREE.Object3D, ox: number, oy: number, oz: number, skala = 1) {
  rot.updateWorldMatrix(true, true);
  rot.getWorldQuaternion(_rotQ);
  ben.getWorldPosition(_bas);
  _off.set(ox, oy, oz).applyQuaternion(_rotQ);
  _bas.add(_off);
  _skala.set(skala, skala, skala);
  _onskad.compose(_bas, _rotQ, _skala);
  _benInv.copy(ben.matrixWorld).invert();
  _lokal.multiplyMatrices(_benInv, _onskad);
  _lokal.decompose(obj.position, obj.quaternion, obj.scale);
  ben.add(obj);
}

function fastAnkare(rot: THREE.Object3D, spec: Sparad, s: number) {
  const hit = { huvud: null as THREE.Object3D | null, kropp: null as THREE.Object3D | null, hals: null as THREE.Object3D | null };
  rot.traverse((o) => {
    if (o.name === "Head") hit.huvud = o;
    if (o.name === "body") hit.kropp = o;
    if (o.name === "Neck") hit.hals = o;
  });
  const huvud = hit.huvud;
  const kropp = hit.kropp;
  const hals = hit.hals;
  const ankare = huvud ?? kropp ?? rot;
  const harKrona = spec.tillbehor.some((t) => t.id === "krona" || t.id === "guldkrona");
  const harHals = spec.tillbehor.some((t) => t.id === "halsduk");
  const harHatt = spec.tillbehor.some((t) => t.id === "hatt" || t.id === "trollkarlshatt");
  const inv = 1 / Math.max(0.001, s);
  if (harKrona) {
    const k = KronaMesh();
    if (spec.kropp === "drake" && huvud) {
      // Hornspetsarna ligger ~0.38 över benet. Kronan sitter mellan dem.
      faestPaBen(huvud, rot, k, 0, 0.4, 0.08, 1.45);
    } else if (spec.kropp === "häst" && huvud) {
      faestPaBen(huvud, rot, k, 0, 0.4, -0.02, 1.35);
    } else if (spec.kropp === "groda") {
      const box = new THREE.Box3().setFromObject(rot);
      const top = new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y - 0.05, (box.min.z + box.max.z) / 2);
      rot.worldToLocal(top);
      k.position.copy(top);
      k.scale.setScalar(inv * 0.75);
      rot.add(k);
    } else if (kropp) {
      const b = new THREE.Box3().setFromObject(kropp);
      const top = new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2);
      kropp.worldToLocal(top);
      top.y += 0.02 * inv;
      k.position.copy(top);
      k.scale.setScalar(inv);
      kropp.add(k);
    } else {
      k.scale.setScalar(inv);
      k.position.set(0, 0.2 * inv, 0);
      ankare.add(k);
    }
  }
  if (harHals) {
    const h = HalsdukMesh();
    if ((spec.kropp === "drake" || spec.kropp === "häst") && (hals || huvud)) {
      faestPaBen(hals ?? huvud!, rot, h, 0, -0.06, 0.1);
    } else if (kropp) {
      const b = new THREE.Box3().setFromObject(kropp);
      const p = new THREE.Vector3((b.min.x + b.max.x) / 2, b.min.y + (b.max.y - b.min.y) * 0.35, b.max.z);
      kropp.worldToLocal(p);
      h.position.copy(p);
      h.scale.setScalar(inv);
      kropp.add(h);
    } else {
      h.scale.setScalar(inv);
      (hals ?? kropp ?? rot).add(h);
    }
  }
  if (harHatt) {
    const hatt = new THREE.Mesh(KRO_GEO.cyl, HATT_MAT);
    if ((spec.kropp === "drake" || spec.kropp === "häst") && huvud) {
      const g = new THREE.Group();
      hatt.scale.set(0.18, 0.28, 0.18);
      g.add(hatt);
      faestPaBen(huvud, rot, g, 0, 0.34, 0.04);
    } else {
      hatt.scale.set(0.18 * inv, 0.28 * inv, 0.18 * inv);
      hatt.position.set(0, 0.16 * inv, 0);
      ankare.add(hatt);
    }
  }
}

export function harModell(kropp: string) {
  return Boolean(FIL[kropp]);
}

export function modellUrl(kropp: string) {
  return FIL[kropp] ?? null;
}

for (const url of new Set(Object.values(FIL))) useGLTF.preload(url);

export function GltfDjur({ spec, signal }: { spec: Sparad; signal: { current: DjurSignal } }) {
  const url = FIL[spec.kropp] ?? FIL.kanin!;
  const gltf = useGLTF(url);
  const rot = useRef<THREE.Group>(null);
  const inre = useRef<THREE.Group>(null);
  const fas = useRef<"skapas" | "idle" | "gar" | "klapp">("skapas");
  const senKlapp = useRef(0);
  const klappTid = useRef(0);
  const sign = `${spec.kropp}|${spec.farg ?? ""}|${spec.glans ? 1 : 0}|${spec.tillbehor.map((t) => t.id).join(",")}`;
  const klon = useMemo(() => {
    const c = SkeletonUtils.clone(gltf.scene) as THREE.Object3D;
    metallNoll(c);
    fargaKlon(c, spec);
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    const h = Math.max(0.001, box.max.y - box.min.y);
    const mal = MAL_HOJD[spec.kropp] ?? 1;
    const s = mal / h;
    c.scale.setScalar(s);
    c.position.y = -box.min.y * s;
    c.updateMatrixWorld(true);
    fastAnkare(c, spec, s);
    return c;
    // spec läses via sign så klonen inte byggs om varje render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltf.scene, sign]);
  const klipp = useMemo(() => gltf.animations.map(tryggKlipp), [gltf.animations]);
  const { actions, mixer } = useAnimations(klipp, rot);

  const spela = useMemo(() => {
    return (suffix: string, enGang: boolean) => {
      const namn = klippNamn(actions, suffix);
      const next = namn ? actions[namn] : null;
      if (!next) return false;
      const prevNamn = Object.keys(actions).find((n) => actions[n]?.isRunning());
      const prev = prevNamn ? actions[prevNamn] : null;
      next.enabled = true;
      next.setLoop(enGang ? THREE.LoopOnce : THREE.LoopRepeat, enGang ? 1 : Infinity);
      next.clampWhenFinished = enGang;
      if (!enGang) next.time = Math.random() * Math.max(0.01, next.getClip().duration);
      else next.time = 0;
      next.reset().fadeIn(0.25).play();
      if (prev && prev !== next) prev.crossFadeTo(next, 0.25, false);
      return true;
    };
  }, [actions]);

  useLayoutEffect(() => {
    const k = spec.kropp;
    const skapa = k === "drake" ? "Fast_Flying" : k === "häst" ? "Jump_Start" : k === "groda" ? "" : "dance";
    const idle = k === "drake" ? "Flying_Idle" : k === "häst" ? "Idle" : "idle";
    if (skapa) spela(skapa, k !== "drake");
    const ms = k === "drake" ? 1000 : k === "häst" ? 700 : 0;
    let timer = 0;
    const tillIdle = () => {
      fas.current = "idle";
      if (k !== "groda") spela(idle, false);
    };
    if (ms > 0) timer = window.setTimeout(tillIdle, ms);
    const onFin = () => {
      if (fas.current === "skapas" && ms === 0) tillIdle();
      else if (fas.current === "klapp") {
        fas.current = "idle";
        if (k !== "groda") spela(idle, false);
      }
    };
    mixer.addEventListener("finished", onFin);
    return () => {
      if (timer) window.clearTimeout(timer);
      mixer.removeEventListener("finished", onFin);
    };
  }, [mixer, spela, spec.kropp]);

  const hals = useRef(0);
  useLayoutEffect(() => {
    if (spec.kropp !== "groda") return;
    const t = window.setInterval(() => {
      hals.current = 1;
    }, 6000);
    return () => window.clearInterval(t);
  }, [spec.kropp]);

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.1);
    const g = inre.current;
    const k = spec.kropp;
    const kl = signal.current.klapp;
    if (kl !== senKlapp.current) {
      senKlapp.current = kl;
      fas.current = "klapp";
      const suffix =
        k === "drake" ? "Yes" : k === "häst" ? "Jump_Start" : k === "hund" || k === "fågel" ? "dance" : kl % 2 === 0 ? "dance" : "gesture-positive";
      if (k === "groda") klappTid.current = 0.4;
      else if (!spela(suffix, true)) fas.current = "idle";
    }
    if (g && k === "groda") {
      const t = state.clock.elapsedTime;
      const andas = 1 + Math.sin((t * Math.PI * 2) / 2.5) * 0.03;
      if (hals.current > 0) hals.current = Math.max(0, hals.current - d / 0.8);
      const puff = Math.sin(Math.min(1, 1 - hals.current) * Math.PI) * 0.08;
      let sy = andas + puff;
      let sx = 1 + puff;
      if (klappTid.current > 0) {
        const u = 1 - klappTid.current / 0.4;
        const sq = u < 0.45 ? 0.8 + (1.1 - 0.8) * (u / 0.45) : 1.1 + (1 - 1.1) * ((u - 0.45) / 0.55);
        sy *= sq;
        sx *= 2 - sq;
        klappTid.current = Math.max(0, klappTid.current - d);
        if (klappTid.current === 0) fas.current = "idle";
      }
      g.scale.set(sx, sy, 1 + puff * 0.4);
      return;
    }
    if (fas.current === "skapas" || fas.current === "klapp") return;
    const gar = signal.current.ror > 0.2 && k !== "drake";
    const vill: "gar" | "idle" = gar ? "gar" : "idle";
    if (vill === fas.current) return;
    fas.current = vill;
    const suffix = vill === "gar" ? (k === "häst" ? "Walk" : "walk") : k === "drake" ? "Flying_Idle" : k === "häst" ? "Idle" : "idle";
    spela(suffix, false);
  });

  return (
    <group ref={rot}>
      <group ref={inre}>
        <primitive object={klon} />
      </group>
    </group>
  );
}
