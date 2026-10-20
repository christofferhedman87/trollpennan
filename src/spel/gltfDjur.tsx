import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";
import { fargning } from "./fargning.ts";
import { byttPixel, graNiva, hexTillHsl, ljusTint, malAlbedo, rgbTillHsl, traffarPalett } from "./palett.ts";
import { MILJO } from "./miljo.ts";
import { belysScen } from "./belys.ts";

const LJUSTINT = ljusTint(MILJO.ljus, MILJO.farg.ljusforstark);
import type { Sparad } from "./brygga.ts";
import { entitet, forladdaUrls, framVinkel, modellUrl as modellUrlAv, skalaFor } from "./entiteter.ts";
import { faestTillbehor } from "./tillbehor/index.ts";

/** Kodbyggd reserv om en GLB saknas. Komponenten skickas in utifrån så den här filen inte drar in hela ängen. */
export type DjurSignal = { klapp: number; ror: number };

const texCache = new Map<string, THREE.CanvasTexture>();

function graTextur(tex: THREE.Texture, bodyL: number): THREE.Texture {
  const nyckel = `gra|${bodyL.toFixed(3)}|${tex.uuid}`;
  const finns = texCache.get(nyckel);
  if (finns) return finns;
  const img = tex.image as CanvasImageSource | undefined;
  const w = (img as HTMLImageElement | undefined)?.width || (img as ImageBitmap | undefined)?.width;
  const h = (img as HTMLImageElement | undefined)?.height || (img as ImageBitmap | undefined)?.height;
  if (!img || !w || !h) return tex;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d", { willReadFrequently: true });
  if (!x) return tex;
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = graNiva(d.data[i] ?? 0, d.data[i + 1] ?? 0, d.data[i + 2] ?? 0, bodyL);
    d.data[i] = v;
    d.data[i + 1] = v;
    d.data[i + 2] = v;
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

/** R8 färgrundan: bulkmodeller delar en standardpalett (nyans 25), men Kenney-modeller är en gemensam färgatlas där isbjörnen är vit/gräddvit och inte alls brun, så ingen pixel träffas och färgen "tas inte". Därför mäter vi vilken färg just den här kroppen använder (texeln vid nätets UV, vanligaste färgen) och ställer in paletten efter den. */
function karnfarg(mesh: THREE.Mesh, tex: THREE.Texture): { from: number; range: number; bodyL: number } | null {
  const img = tex.image as CanvasImageSource | undefined;
  const uv = mesh.geometry?.attributes?.uv;
  if (!img || !uv) return null;
  const w = (img as HTMLImageElement).width || (img as ImageBitmap).width;
  const h = (img as HTMLImageElement).height || (img as ImageBitmap).height;
  if (!w || !h) return null;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d", { willReadFrequently: true });
  if (!x) return null;
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, w, h).data;
  const rakna = new Map<number, { n: number; r: number; g: number; b: number }>();
  const steg = Math.max(1, Math.floor(uv.count / 1500));
  for (let i = 0; i < uv.count; i += steg) {
    const px = Math.min(w - 1, Math.max(0, Math.floor(uv.getX(i) * w)));
    const py = Math.min(h - 1, Math.max(0, Math.floor((tex.flipY ? 1 - uv.getY(i) : uv.getY(i)) * h)));
    const o = (py * w + px) * 4;
    if ((d[o + 3] ?? 0) < 8) continue;
    const r = d[o] ?? 0;
    const g = d[o + 1] ?? 0;
    const b = d[o + 2] ?? 0;
    const k = (r >> 4) * 256 + (g >> 4) * 16 + (b >> 4);
    const p = rakna.get(k) ?? { n: 0, r: 0, g: 0, b: 0 };
    p.n++;
    p.r += r;
    p.g += g;
    p.b += b;
    rakna.set(k, p);
  }
  let bast: { n: number; r: number; g: number; b: number } | null = null;
  for (const p of rakna.values()) if (!bast || p.n > bast.n) bast = p;
  if (!bast) return null;
  const [kh, ks, kl] = rgbTillHsl(bast.r / bast.n, bast.g / bast.n, bast.b / bast.n);
  const hsl = { h: kh / 360, s: ks, l: kl };
  // låg färgmättnad (vit, grå, gräddvit): neutralt läge (range < 0), annars färgens egen nyans
  return hsl.s < 0.35 ? { from: 0, range: -1, bodyL: hsl.l } : { from: Math.round(hsl.h * 360), range: 22, bodyL: hsl.l };
}

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
  const mal = hexTillHsl(toHex);
  const pal = { from: fromHue, range, bodyL };
  for (let i = 0; i < d.data.length; i += 4) {
    const a = d.data[i + 3] ?? 0;
    if (a < 8) continue;
    const px = rgbTillHsl(d.data[i] ?? 0, d.data[i + 1] ?? 0, d.data[i + 2] ?? 0);
    if (!traffarPalett(px, pal)) continue;
    const [r, g, bl] = byttPixel(px, pal, mal, LJUSTINT);
    d.data[i] = r;
    d.data[i + 1] = g;
    d.data[i + 2] = bl;
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

/** R9K: byt färg på material med de namnen. Materialet klonas först så att originalet (delat via useGLTF) är orört. */
function fargaOm(rot: THREE.Object3D, farger: Record<string, string>) {
  rot.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const byt = (m: THREE.Material) => {
      const f = farger[m.name];
      if (!f || !("color" in m)) return m;
      const k = m.clone() as THREE.MeshStandardMaterial;
      k.color.set(f);
      return k;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(byt) : byt(mesh.material);
  });
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

/** Animerade modeller (skinnade nät) har en omslutande sfär för vilopositionen; utan det här kan de klippas bort mitt i en rörelse. */
function ingenKulling(rot: THREE.Object3D) {
  rot.traverse((o) => {
    const sm = o as THREE.SkinnedMesh;
    if (!sm.isSkinnedMesh) return;
    o.frustumCulled = false;
    // B6.1: ett skinnat nät räknar sin träffsfär EN gång, vid första strålen. Kommer den medan djuret poppar fram
    // (t.ex. ett djur som hämtas ut ur stallet på en plats) blir sfären 0 och djuret går aldrig mer att trycka på.
    // Räkna om sfären vid varje stråle; strålar skjuts bara vid pekarhändelser och näten är små.
    sm.raycast = (stral, traffar) => {
      sm.computeBoundingSphere();
      THREE.SkinnedMesh.prototype.raycast.call(sm, stral, traffar);
    };
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
      // B6.4: utan färgord (hex null) blir allt false/null – modellens egna färger, ingen glans över kroppen (se fargning.ts).
      const f = fargning({ hex, roll, harRoller: !!ent?.material, harPalett: !!pal, harKarta: !!m.map, glans: !!glans, ljusare });
      if (f.farg) m.color.set(f.farg);
      if (f.palettByte && pal && hex && m.map) {
        const egen = ent?.inlagd ? karnfarg(mesh, m.map) : null;
        if (egen && egen.range < 0) {
          // R9: vit/grå kropp (isbjörn, elefant, lamm): texturen blir gråskala och färgen läggs i materialet. Då blandas inga kvarvarande
          // gräddvita texlar in (det gjorde röd till orange och grön till gulgrön), och ljusets förstärkning är förkompenserad.
          m.map = graTextur(m.map, egen.bodyL);
          const [r, g, b] = malAlbedo(hex, LJUSTINT);
          m.color.setRGB(r, g, b);
        } else {
          m.map = egen ? paletteSwap(m.map, egen.from, egen.range, hex, egen.bodyL) : paletteSwap(m.map, pal.from, pal.range, hex, pal.bodyL);
          m.color.set("#ffffff");
        }
      }
      if (f.glans && "emissive" in m) {
        m.emissive = new THREE.Color("#FFE082");
        m.emissiveIntensity = 0.28;
      }
      // B6.4: provräknare (bara när ett prov har lagt dit listan): materialets färg före och efter.
      if (typeof window !== "undefined") window.__tredFarg?.push({ kropp: spec.kropp, mat: namn, fore: "#" + src.color.getHexString(), efter: "#" + m.color.getHexString(), sjalvlyse: "#" + m.emissive.getHexString(), egenKarta: m.map === src.map });
      return m;
    });
    mesh.material = Array.isArray(mesh.material) ? nya : (nya[0] ?? mesh.material);
  });
}

function fastAnkare(rot: THREE.Object3D, spec: Sparad) {
  faestTillbehor(rot, spec.kropp, spec.tillbehor, "modell");
}

for (const url of forladdaUrls()) useGLTF.preload(url);

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
    belysScen(gltf.scene);
    const c = SkeletonUtils.clone(gltf.scene) as THREE.Object3D;
    metallNoll(c);
    ingenKulling(c);
    fargaKlon(c, spec);
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    const h = Math.max(0.001, box.max.y - box.min.y);
    const s = skalaFor(spec.kropp, h, box.max.x - box.min.x, box.max.z - box.min.z);
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

/** R3G: en sak (entitet med modell, inte djur) bredvid ett djur – "en kanin med en hink". Hämtas först när den används (lazyload). */
/** `vand` (R8-2b): modellen vänds upp och ner med botten kvar på marken (droppsten → stalagmit). */
/** R9K: `farger` = materialnamn → färg ur platsens data (klonat material, delas inte med andra kopior). */
export function GltfSak({ id, vand = false, farger }: { id: string; vand?: boolean; farger?: Record<string, string> }) {
  const gltf = useGLTF(modellUrlAv(id)!);
  const fargNyckel = farger ? JSON.stringify(farger) : "";
  const klon = useMemo(() => {
    belysScen(gltf.scene);
    const c = SkeletonUtils.clone(gltf.scene) as THREE.Object3D;
    if (farger) fargaOm(c, farger);
    metallNoll(c);
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    const s = skalaFor(id, box.max.y - box.min.y, box.max.x - box.min.x, box.max.z - box.min.z);
    c.scale.setScalar(s);
    if (vand) {
      c.rotation.x = Math.PI;
      c.position.set(-((box.min.x + box.max.x) / 2) * s, box.max.y * s, ((box.min.z + box.max.z) / 2) * s);
    } else c.position.set(-((box.min.x + box.max.x) / 2) * s, -box.min.y * s, -((box.min.z + box.max.z) / 2) * s);
    return c;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fargNyckel bär innehållet i farger
  }, [gltf.scene, id, vand, fargNyckel]);
  return <primitive object={klon} />;
}
