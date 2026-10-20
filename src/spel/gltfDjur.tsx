import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";
import { fargning, kroppsRoller, tillLinjar, valjKarna, type Anvandning, type Klump, type KroppRoll, type MatInfo } from "./fargning.ts";
import { byttPixel, hexTillHsl, hslTillRgb, ljusTint, malAlbedo, rgbTillHsl, traffarPalett, type Hsl, type Palett } from "./palett.ts";
import { kroppsMonsterFor } from "./attribut.ts";
import { fargaHorn, harHornfarg, kroppsTextur, monsterFarger, monsterKoordinater, monsterPa } from "./kroppsfarg.ts";
import { MILJO } from "./miljo.ts";
import { belysScen } from "./belys.ts";

const LJUSTINT = ljusTint(MILJO.ljus, MILJO.farg.ljusforstark);
import type { Sparad } from "./brygga.ts";
import { entitet, forladdaUrls, framVinkel, modellUrl as modellUrlAv, skalaFor } from "./entiteter.ts";
import { faestTillbehor } from "./tillbehor/index.ts";

/** Kodbyggd reserv om en GLB saknas. Komponenten skickas in utifrån så den här filen inte drar in hela ängen. */
export type DjurSignal = { klapp: number; ror: number };

const texCache = new Map<string, THREE.CanvasTexture>();

/** R8 färgrundan: bulkmodeller delar en standardpalett (nyans 25), men Kenney-modeller är en gemensam färgatlas där isbjörnen är vit/gräddvit och inte alls brun, så ingen pixel träffas och färgen "tas inte". Därför mäter vi vilken färg just den här kroppen använder (texeln vid nätets UV, vanligaste färgen) och ställer in paletten efter den. */
type Karn = Palett & { hsl: Hsl; anv?: Anvandning };
const KARN = new Map<string, Karn | null>();
function karnfarg(mesh: THREE.Mesh, tex: THREE.Texture): Karn | null {
  const nyckel = `${mesh.geometry?.uuid}|${tex.uuid}`;
  if (KARN.has(nyckel)) return KARN.get(nyckel) ?? null;
  const svar = karnfargMat(mesh, tex);
  KARN.set(nyckel, svar);
  return svar;
}

function karnfargMat(mesh: THREE.Mesh, tex: THREE.Texture): Karn | null {
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
  const rakna = new Map<number, Klump>();
  const anvI: number[] = [], anvN: number[] = []; // R8-3a2: var modellen använder texturen (för kroppsmasken)
  // R8-3a: texeln i varje triangels mitt, viktad med triangelns yta (se valjKarna i fargning.ts)
  const pos = mesh.geometry.attributes.position;
  const idx = mesh.geometry.index;
  const n = idx ? idx.count : uv.count;
  const steg = Math.max(1, Math.floor(n / 3 / 3000)) * 3;
  const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
  for (let i = 0; i + 2 < n; i += steg) {
    const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
    const u = (uv.getX(i0) + uv.getX(i1) + uv.getX(i2)) / 3;
    const v = (uv.getY(i0) + uv.getY(i1) + uv.getY(i2)) / 3;
    const yta = pos ? B.fromBufferAttribute(pos, i1).sub(A.fromBufferAttribute(pos, i0)).cross(C.fromBufferAttribute(pos, i2).sub(A)).length() : 1;
    if (!(yta > 0)) continue;
    const px = Math.min(w - 1, Math.max(0, Math.floor((((u % 1) + 1) % 1) * w)));
    const py = Math.min(h - 1, Math.max(0, Math.floor((((tex.flipY ? 1 - v : v) % 1 + 1) % 1) * h)));
    const o = (py * w + px) * 4;
    if ((d[o + 3] ?? 0) < 8) continue;
    anvI.push(py * w + px);
    anvN.push(yta);
    const r = d[o] ?? 0;
    const g = d[o + 1] ?? 0;
    const b = d[o + 2] ?? 0;
    const k = (r >> 4) * 256 + (g >> 4) * 16 + (b >> 4);
    const p = rakna.get(k) ?? { n: 0, r: 0, g: 0, b: 0 };
    p.n += yta;
    p.r += r * yta;
    p.g += g * yta;
    p.b += b * yta;
    rakna.set(k, p);
  }
  const karna = valjKarna([...rakna.values()]);
  if (!karna) return null;
  const hsl = karna.hsl;
  // neutral kropp (vit, grå, gräddvit): neutralt läge (range < 0), annars kroppens egen nyans
  const anv = { i: anvI, n: anvN };
  return karna.neutral ? { from: 0, range: -1, bodyL: hsl[2], hsl, anv } : { from: Math.round(hsl[0]), range: 22, bodyL: hsl[2], hsl, anv };
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

/** R8-3a: ytan (världsenheter²) per materialindex i ett nät. */
function ytaPerMaterial(mesh: THREE.Mesh, antal: number): number[] {
  const ut = new Array<number>(antal).fill(0);
  const pos = mesh.geometry?.attributes?.position;
  if (!pos) return ut;
  const idx = mesh.geometry.index;
  const n = idx ? idx.count : pos.count;
  const grupper = mesh.geometry.groups.length > 0 ? mesh.geometry.groups : [{ start: 0, count: n, materialIndex: 0 }];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const steg = Math.max(1, Math.floor(n / 3 / 4000)) * 3;
  for (const g of grupper) {
    const mi = Math.min(antal - 1, g.materialIndex ?? 0);
    for (let i = g.start; i + 2 < Math.min(n, g.start + g.count); i += steg) {
      const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
      a.fromBufferAttribute(pos, i0).applyMatrix4(mesh.matrixWorld);
      b.fromBufferAttribute(pos, i1).applyMatrix4(mesh.matrixWorld);
      c.fromBufferAttribute(pos, i2).applyMatrix4(mesh.matrixWorld);
      ut[mi] = (ut[mi] ?? 0) + b.sub(a).cross(c.sub(a)).length() * 0.5 * (steg / 3);
    }
  }
  return ut;
}

type Kalla = { src: THREE.MeshStandardMaterial; yta: number; karn: Karn | null; mesh: THREE.Mesh; horn: boolean; anv: Anvandning[] };

/** R8-3a: ett färgord färgar HELA kroppen på alla modeller (textur, materialfärger eller båda); ögon, hud och detaljer behålls.
 *  1) Samla modellens material med yta och kärnfärg. 2) `kroppsRoller()` (fargning.ts) avgör kropp/ljus/detalj – ur datans
 *  "material"-tabell om den finns, annars generellt. 3) Kroppsmaterial: textur → kroppens texlar byts till färgordets nyans
 *  (vit/grå kropp: gråskala × färg); materialfärg → färgordets nyans med materialets ljushet relativt kroppens (skuggor och
 *  ljusare mage bevaras), förkompenserad för scenens ljus. Glansen (guldord) lyser i färgordets egen nyans och bara på kroppen.
 *  Utan färgord (hex null): ingenting ändras (B6.4). */
function fargaKlon(rot: THREE.Object3D, spec: Sparad) {
  const hex = fargAv(spec);
  const ent = entitet(spec.kropp);
  const pal = ent?.palett && !ent.inlagd ? ent.palett : null; // de handjusterade första djuren (katt, hund …) behåller sin palett
  // R8-3a2: ett mönster på kroppen (regnbåge, ränder, prickar) ur data/attribut.json "kroppsmonster" – också utan färgord.
  const km = kroppsMonsterFor({ monster: spec.monster ?? null, monsterfarg: spec.monsterfarg ?? null });
  const andra = !!hex || !!km;
  rot.updateMatrixWorld(true);
  const kallor = new Map<string, Kalla>();
  if (andra) {
    rot.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const lista = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshStandardMaterial[];
      const ytor = ytaPerMaterial(mesh, lista.length);
      lista.forEach((src, i) => {
        const k = kallor.get(src.uuid) ?? { src, yta: 0, karn: null, mesh, horn: false, anv: [] };
        const y = ytor[i] ?? 0;
        if (src.map && (!k.karn || y > k.yta)) k.karn = karnfarg(mesh, src.map) ?? k.karn;
        const ka = src.map ? karnfarg(mesh, src.map)?.anv : undefined; // R8-3a2: alla näts användning av texturen (kroppsmasken)
        if (ka) k.anv.push(ka);
        k.yta += y;
        k.horn = k.horn || harHornfarg(mesh, src);
        kallor.set(src.uuid, k);
      });
    });
  }
  const lista0 = [...kallor.values()];
  const total = lista0.reduce((s, k) => s + k.yta, 0) || 1;
  const infos: MatInfo[] = lista0.map((k) => ({
    namn: k.src.name || "",
    yta: k.yta / total,
    hsl: k.src.map ? (k.karn?.hsl ?? [0, 0, 0.5]) : hexTillHsl("#" + k.src.color.getHexString(THREE.SRGBColorSpace)),
  }));
  const roller = kroppsRoller(infos, ent?.material);
  const rollAv = new Map<string, KroppRoll>();
  lista0.forEach((k, i) => rollAv.set(k.src.uuid, roller[i]?.roll ?? "detalj"));
  const huvud = infos[roller[0]?.huvud ?? -1];
  const kroppL = huvud ? (lista0[roller[0]!.huvud]?.karn?.bodyL ?? huvud.hsl[2]) : 0.5;
  const klonade = new Map<string, THREE.MeshStandardMaterial>();
  // R8-3a2: kroppsmaterial som får mönster (mask och kroppens luminans), hörnens kroppsvikt per nät
  const monsterMat = new Map<THREE.MeshStandardMaterial, { mask: THREE.Texture | null; ref: number; kropp: string }>();
  const vikter = new Map<THREE.Mesh, Map<number, number>>();
  const monsterNat = new Set<THREE.Mesh>();
  rot.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const lista = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshStandardMaterial[];
    const nya = lista.map((src, mi) => {
      const roll0 = andra ? rollAv.get(src.uuid) : undefined;
      const arKropp = roll0 === "kropp" || roll0 === "ljus";
      const malH = hex ? (roll0 === "ljus" ? ljusare(hex) : hex) : null;
      // R8-3a2: hörnfärger på kroppen – per nät (geometrin), också när materialet redan är klonat av ett annat nät
      if (arKropp && kallor.get(src.uuid)?.horn) {
        const v = fargaHorn(mesh, mi, src.color, malH, !!src.map, LJUSTINT);
        if (v) vikter.set(mesh, new Map([...(vikter.get(mesh) ?? []), ...v]));
      }
      const finns = klonade.get(src.uuid);
      if (finns) {
        if (monsterMat.has(finns)) monsterNat.add(mesh);
        return finns;
      }
      const m = src.clone();
      m.metalness = 0;
      m.roughness = Math.max(m.roughness ?? 1, 0.75);
      const namn = m.name || "";
      const roll = hex ? roll0 : undefined;
      const horn = !!kallor.get(src.uuid)?.horn && arKropp;
      // B6.4: utan färgord (hex null) blir allt false/null – modellens egna färger, ingen glans (se fargning.ts).
      const f = fargning({ hex, roll, harKarta: !!m.map, glans: !!spec.glans, ljusare });
      const mal = hex ? malH : null;
      if (horn && mal) m.color.set("#ffffff"); // R8-3a2: färgen sitter nu i hörnfärgerna (fargaHorn), annars färg × hörnfärg = mörkt
      else if (f.farg && mal) {
        // materialfärg: målets nyans, materialets ljushet relativt kroppens, förkompenserad för ljuset
        const [r, g, b] = byttPixel(hexTillHsl("#" + src.color.getHexString(THREE.SRGBColorSpace)), { from: 0, range: 22, bodyL: kroppL }, hexTillHsl(mal), LJUSTINT);
        m.color.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
      }
      const egen = pal ? null : (kallor.get(src.uuid)?.karn ?? null);
      const allaAnv = kallor.get(src.uuid)?.anv ?? [];
      const anv = { i: allaAnv.flatMap((a) => Array.from(a.i)), n: allaAnv.flatMap((a) => Array.from(a.n)) };
      const karnaAv = (k: Karn) => ({ hsl: k.hsl, neutral: k.range < 0, bodyL: k.bodyL, anv, nyckel: src.uuid });
      let mask: THREE.Texture | null = null;
      let maskAndel: number | undefined;
      if (f.palettByte && mal && m.map) {
        if (egen) {
          // R8-3a2: bara kroppens texlar byts (kroppsMask: kärnan + mjuk gradient inom familjen); betar, ögon, näbb behålls.
          // Vit/grå kropp: gråskala × färg inbakat i texturen (förut i materialet, då blev hela texturen färgad).
          const t = kroppsTextur(m.map, karnaAv(egen), mal, LJUSTINT);
          if (t?.map) {
            m.map = t.map;
            m.color.set("#ffffff");
            mask = t.mask;
            maskAndel = t.andel;
          }
        } else if (pal) {
          m.map = paletteSwap(m.map, pal.from, pal.range, mal, pal.bodyL);
          m.color.set("#ffffff");
        }
      }
      if (km && arKropp) {
        const karn = kallor.get(src.uuid)?.karn ?? null;
        if (!mask && src.map && karn) {
          const t = kroppsTextur(src.map, karnaAv(karn), null, LJUSTINT);
          mask = t?.mask ?? null;
          maskAndel = t?.andel;
        }
        const kroppHex = mal ?? (src.map && karn ? hslHex(karn.hsl) : "#" + m.color.getHexString(THREE.SRGBColorSpace));
        const ref = mal ? lumAv(malAlbedo(mal, LJUSTINT)) : src.map && karn ? lumAv(linAv(karn.hsl)) : lumAv([m.color.r, m.color.g, m.color.b]);
        monsterMat.set(m, { mask, ref, kropp: kroppHex });
        monsterNat.add(mesh);
      }
      if (f.glans && mal && "emissive" in m) {
        // R8-3a: glansen i färgordets egen nyans (det gula självlyset gjorde röd till orange och den blå jultomtens mössa orange)
        m.emissive = new THREE.Color(ljusare(mal));
        m.emissiveIntensity = 0.16;
      }
      // B6.4/R8-3a: provräknare (bara när ett prov har lagt dit listan): materialets färg före och efter, roll.
      // R8-3a2: andelen av texturen som är kropp (mask), hörnfärg och mönster.
      if (typeof window !== "undefined") window.__tredFarg?.push({ kropp: spec.kropp, mat: namn, fore: "#" + src.color.getHexString(), efter: "#" + m.color.getHexString(), sjalvlyse: "#" + m.emissive.getHexString(), egenKarta: m.map === src.map, roll, mask: maskAndel, horn: horn || undefined, monster: km && arKropp ? km.typ : undefined });
      klonade.set(src.uuid, m);
      return m;
    });
    mesh.material = Array.isArray(mesh.material) ? nya : (nya[0] ?? mesh.material);
  });
  if (km && monsterMat.size > 0) {
    const k = monsterKoordinater(rot, [...monsterNat], vikter);
    for (const [m, o] of monsterMat) monsterPa(m, km, { farger: monsterFarger(km, o.kropp, LJUSTINT), ref: o.ref, skalaY: k.skalaY, axel: k.axel, mask: o.mask });
  }
}

const lumAv = (c: ArrayLike<number>) => 0.2126 * (c[0] ?? 0) + 0.7152 * (c[1] ?? 0) + 0.0722 * (c[2] ?? 0);
const linAv = (hsl: Hsl) => hslTillRgb(...hsl).map((v) => tillLinjar(v));
const hslHex = (hsl: Hsl) => "#" + hslTillRgb(...hsl).map((v) => v.toString(16).padStart(2, "0")).join("");

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
    // B6.6: mitten av modellens ruta på skapelsens plats (som GltfSak). Förut flyttades bara botten till marken, så en
    // modell med origo vid sidan av kroppen (kratern, raketen, rymdskeppet) ritades långt från sin plats, utanför bilden.
    c.position.set(-((box.min.x + box.max.x) / 2) * s, -box.min.y * s, -((box.min.z + box.max.z) / 2) * s);
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
