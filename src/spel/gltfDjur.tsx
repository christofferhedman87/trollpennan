import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";
import type { Sparad } from "./brygga.ts";
import { entitet, framVinkel, malhojd, modellUrl as modellUrlAv, ENTITETER } from "./entiteter.ts";
import { faestTillbehor } from "./tillbehor/index.ts";

/** Kodbyggd reserv om en GLB saknas. Komponenten skickas in utifrån så den här filen inte drar in hela ängen. */
export type DjurSignal = { klapp: number; ror: number };

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
  return entitet(spec.kropp)?.standardfarg ?? null;
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
  const ent = entitet(spec.kropp);
  const pal = ent?.palett;
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
      const roll = ent?.material ? ent.material[namn] : undefined;
      if (ent?.material) {
        if (roll === "farg" && hex) m.color.set(hex);
        if (roll === "ljus") m.color.set(hex ? ljusare(hex) : "#ffd27a");
      } else if (pal && hex && m.map) {
        m.map = paletteSwap(m.map, pal.from, pal.range, hex, pal.bodyL);
        m.color.set("#ffffff");
      }
      if (glans && (roll === "farg" || (!ent?.material && pal))) {
        m.emissive = new THREE.Color("#FFE082");
        m.emissiveIntensity = 0.28;
      }
      return m;
    });
    mesh.material = Array.isArray(mesh.material) ? nya : (nya[0] ?? mesh.material);
  });
}

function fastAnkare(rot: THREE.Object3D, spec: Sparad) {
  faestTillbehor(rot, spec.kropp, spec.tillbehor, "modell");
}

export function harModell(kropp: string) {
  return Boolean(modellUrlAv(kropp));
}

export function modellUrl(kropp: string) {
  return modellUrlAv(kropp);
}

for (const url of new Set(Object.keys(ENTITETER).map(modellUrlAv).filter((u): u is string => Boolean(u)))) useGLTF.preload(url);

export function GltfDjur({ spec, signal }: { spec: Sparad; signal: { current: DjurSignal } }) {
  const url = modellUrlAv(spec.kropp) ?? modellUrlAv("kanin")!;
  const gltf = useGLTF(url);
  const rot = useRef<THREE.Group>(null);
  const inre = useRef<THREE.Group>(null);
  const fas = useRef<"skapas" | "idle" | "gar" | "klapp">("skapas");
  const senKlapp = useRef(0);
  const klappTid = useRef(0);
  const sign = `${spec.kropp}|${spec.farg ?? ""}|${spec.glans ? 1 : 0}|${spec.tillbehor.map((t) => `${t.id}:${t.farg ?? ""}`).join(",")}`;
  const klon = useMemo(() => {
    const c = SkeletonUtils.clone(gltf.scene) as THREE.Object3D;
    metallNoll(c);
    fargaKlon(c, spec);
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    const h = Math.max(0.001, box.max.y - box.min.y);
    const mal = malhojd(spec.kropp);
    const s = mal / h;
    c.scale.setScalar(s);
    c.position.y = -box.min.y * s;
    c.updateMatrixWorld(true);
    fastAnkare(c, spec);
    return c;
    // spec läses via sign så klonen inte byggs om varje render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltf.scene, sign]);
  const fram = framVinkel(entitet(spec.kropp)?.framAxel);
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
        <group rotation={[0, fram, 0]}>
          <primitive object={klon} />
        </group>
      </group>
    </group>
  );
}
