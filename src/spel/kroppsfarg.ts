// R8-3a2: kroppens färg och mönster på GLB-modeller, generellt (ingen kod per modell). Används av fargaKlon i gltfDjur.tsx.
//  1) Textur: bara KROPPENS texlar byts (kroppsMask i fargning.ts: kärnans färg + allt som når den i en mjuk gradient inom
//     familjen). Ankans gröna mage i samma färgruta som ryggen följer med; elefantens betar, ögon och näbbar (skarp kant,
//     annan familj) behålls. En vit/grå kropp blir gråskala × färg i texturen, inte i materialet (som färgade betarna).
//  2) Hörnfärger: kroppens hörn får färgen i hörnfärgen och materialet blir vitt (förut färg × hörnfärg = mörkt/smutsigt).
//  3) Mönster (data/attribut.json "kroppsmonster"): band, ränder eller prickar i en shader på kroppens material, i modellens
//     egna koordinater (följer med i animationen). Masken (textur) och hörnens kroppsvikt håller ögon och detaljer fria.
import * as THREE from "three";
import type { KroppsMonster } from "./attribut.ts";
import { hornKropp, kroppsMask, tillLinjar, tillSrgb, type Anvandning, type Karna } from "./fargning.ts";
import { byttPixel, graNiva, hexTillHsl, hslTillRgb, malAlbedo, rgbTillHsl, type Tint } from "./palett.ts";

/** Kroppens kärna i texturen, med var modellen använder texturen (`anv`) och vilket nät stickprovet kom från (`nyckel`). */
type Kropp = Karna & { bodyL: number; anv?: Anvandning; nyckel?: string };
const TEX = new Map<string, { map: THREE.Texture | null; mask: THREE.Texture; andel: number }>();

function pixlar(tex: THREE.Texture): { d: Uint8ClampedArray; w: number; h: number; c: HTMLCanvasElement; x: CanvasRenderingContext2D; bild: ImageData } | null {
  const img = tex.image as CanvasImageSource | undefined;
  const w = (img as HTMLImageElement | undefined)?.width || (img as ImageBitmap | undefined)?.width;
  const h = (img as HTMLImageElement | undefined)?.height || (img as ImageBitmap | undefined)?.height;
  if (!img || !w || !h) return null;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d", { willReadFrequently: true });
  if (!x) return null;
  x.drawImage(img, 0, 0);
  const bild = x.getImageData(0, 0, w, h);
  return { d: bild.data, w, h, c, x, bild };
}

function somKalla(t: THREE.Texture, kalla: THREE.Texture, farg: boolean): THREE.Texture {
  t.flipY = kalla.flipY;
  t.colorSpace = farg ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.magFilter = kalla.magFilter;
  t.minFilter = kalla.minFilter;
  t.wrapS = kalla.wrapS;
  t.wrapT = kalla.wrapT;
  t.needsUpdate = true;
  return t;
}

/** Kroppens texlar i texturen bytta mot `mal` (null = bara masken, för ett mönster utan färgord) och masken (R = 255 kropp).
 *  Kulör kropp: målets nyans, texelns ljushet relativt kroppens (byttPixel). Neutral kropp: gråskala × målets albedo, inbakat. */
export function kroppsTextur(tex: THREE.Texture, k: Kropp, mal: string | null, tint: Tint): { map: THREE.Texture | null; mask: THREE.Texture; andel: number } | null {
  const nyckel = `${tex.uuid}|${k.nyckel ?? ""}|${k.neutral ? "n" : "c"}|${k.hsl.map((v) => v.toFixed(3)).join(",")}|${k.bodyL.toFixed(3)}|${mal ?? ""}`;
  const finns = TEX.get(nyckel);
  if (finns) return finns;
  const p = pixlar(tex);
  if (!p) return null;
  const { d, w, h } = p;
  const mask = kroppsMask(d, w, h, k, k.anv);
  const mc = document.createElement("canvas");
  mc.width = w;
  mc.height = h;
  const mx = mc.getContext("2d");
  if (!mx) return null;
  const md = mx.createImageData(w, h);
  let antal = 0;
  const malHsl = mal ? hexTillHsl(mal) : null;
  const alb = mal ? malAlbedo(mal, tint) : null;
  for (let i = 0; i < w * h; i++) {
    const v = mask[i] ? 255 : 0;
    md.data[i * 4] = md.data[i * 4 + 1] = md.data[i * 4 + 2] = v;
    md.data[i * 4 + 3] = 255;
    if (!mask[i]) continue;
    antal++;
    if (!malHsl || !alb) continue;
    const o = i * 4;
    const r = d[o] ?? 0, g = d[o + 1] ?? 0, b = d[o + 2] ?? 0;
    if (k.neutral) {
      const gra = tillLinjar(graNiva(r, g, b, k.bodyL));
      d[o] = tillSrgb(gra * alb[0]);
      d[o + 1] = tillSrgb(gra * alb[1]);
      d[o + 2] = tillSrgb(gra * alb[2]);
    } else {
      const [nr, ng, nb] = byttPixel(rgbTillHsl(r, g, b), { from: k.hsl[0], range: 22, bodyL: k.bodyL }, malHsl, tint);
      d[o] = nr;
      d[o + 1] = ng;
      d[o + 2] = nb;
    }
  }
  mx.putImageData(md, 0, 0);
  let map: THREE.Texture | null = null;
  if (mal) {
    p.x.putImageData(p.bild, 0, 0);
    map = somKalla(new THREE.CanvasTexture(p.c), tex, true);
  }
  const ut = { map, mask: somKalla(new THREE.CanvasTexture(mc), tex, false), andel: antal / (w * h) };
  TEX.set(nyckel, ut);
  return ut;
}

/** Hörnen som en grupp i nätet använder (materialindex `mi`), eller alla. */
function hornFor(mesh: THREE.Mesh, mi: number): number[] {
  const geo = mesh.geometry;
  const idx = geo.index;
  const n = idx ? idx.count : geo.attributes.position?.count ?? 0;
  const grupper = geo.groups.length > 0 ? geo.groups.filter((g) => (g.materialIndex ?? 0) === mi) : [{ start: 0, count: n }];
  const s = new Set<number>();
  for (const g of grupper) for (let i = g.start; i < Math.min(n, g.start + g.count); i++) s.add(idx ? idx.getX(i) : i);
  return [...s];
}

/** Egen kopia av geometrin (delas annars med alla kloner av modellen via useGLTF). */
function egenGeometri(mesh: THREE.Mesh): THREE.BufferGeometry {
  if (!mesh.userData.r83a2Geo) {
    mesh.geometry = mesh.geometry.clone();
    mesh.userData.r83a2Geo = true;
  }
  return mesh.geometry;
}

/** Har nätet hörnfärger som inte bara är vita? (Vita hörnfärger ändrar ingenting och lämnas.) */
export function harHornfarg(mesh: THREE.Mesh, m: THREE.Material): boolean {
  const c = mesh.geometry?.attributes?.color;
  if (!c || !(m as THREE.MeshStandardMaterial).vertexColors) return false;
  for (let i = 0; i < c.count; i++) if (c.getX(i) < 0.98 || c.getY(i) < 0.98 || c.getZ(i) < 0.98) return true;
  return false;
}

/** Hörnfärgerna i ett material med färgord: kroppens hörn får färgen (utan textur: målets nyans med hörnets ljushet relativt
 *  kroppen; med textur: gråskala relativt kroppen, texturen bär färgen), övriga hörn behåller sin färg. Materialets färg bakas in
 *  i hörnen och blir vit. Ger kroppsvikten per hörn (1/0) för mönstret, eller null. */
export function fargaHorn(mesh: THREE.Mesh, mi: number, matFarg: THREE.Color, mal: string | null, harKarta: boolean, tint: Tint): Map<number, number> | null {
  const c0 = mesh.geometry.attributes.color;
  if (!c0) return null;
  const horn = hornFor(mesh, mi);
  const lin: number[] = [];
  const srgb: number[] = [];
  for (const i of horn) {
    const r = c0.getX(i) * matFarg.r, g = c0.getY(i) * matFarg.g, b = c0.getZ(i) * matFarg.b;
    lin.push(r, g, b);
    srgb.push(tillSrgb(r), tillSrgb(g), tillSrgb(b));
  }
  const hk = hornKropp(srgb);
  if (!hk) return null;
  const vikt = new Map<number, number>();
  horn.forEach((i, j) => vikt.set(i, hk.kropp[j] ?? 0));
  if (!mal) return vikt;
  const geo = egenGeometri(mesh);
  const gammal = geo.attributes.color!;
  const ny = new Float32Array(gammal.count * 3);
  for (let i = 0; i < gammal.count; i++) {
    ny[i * 3] = gammal.getX(i);
    ny[i * 3 + 1] = gammal.getY(i);
    ny[i * 3 + 2] = gammal.getZ(i);
  }
  const kroppL = hk.karna.hsl[2];
  const [kr, kg, kb] = hslTillRgb(...hk.karna.hsl);
  const kLum = Math.max(1e-4, 0.2126 * tillLinjar(kr) + 0.7152 * tillLinjar(kg) + 0.0722 * tillLinjar(kb));
  const malHsl = hexTillHsl(mal);
  horn.forEach((i, j) => {
    const r = lin[j * 3]!, g = lin[j * 3 + 1]!, b = lin[j * 3 + 2]!;
    let ut: [number, number, number] = [r, g, b];
    if (hk.kropp[j]) {
      if (harKarta) {
        const v = Math.min(1, (0.2126 * r + 0.7152 * g + 0.0722 * b) / kLum);
        ut = [v, v, v];
      } else {
        const [nr, ng, nb] = byttPixel(rgbTillHsl(srgb[j * 3]!, srgb[j * 3 + 1]!, srgb[j * 3 + 2]!), { from: 0, range: 22, bodyL: kroppL }, malHsl, tint);
        ut = [tillLinjar(nr), tillLinjar(ng), tillLinjar(nb)];
      }
    }
    ny[i * 3] = ut[0];
    ny[i * 3 + 1] = ut[1];
    ny[i * 3 + 2] = ut[2];
  });
  geo.setAttribute("color", new THREE.BufferAttribute(ny, 3));
  return vikt;
}

/** Mönstrets koordinater: `aMonster` = (x, y, z) i modellens rotram (vilopose, normerat med största måttet) och w = kroppsvikt.
 *  Ger skalan för höjden (band) och den längsta vågräta axeln (ränder). */
export function monsterKoordinater(rot: THREE.Object3D, nat: THREE.Mesh[], vikter: Map<THREE.Mesh, Map<number, number>>): { skalaY: number; axel: [number, number, number] } {
  rot.updateMatrixWorld(true);
  const inv = rot.matrixWorld.clone().invert();
  const v = new THREE.Vector3();
  const box = new THREE.Box3();
  const pos = new Map<THREE.Mesh, Float32Array>();
  for (const m of nat) {
    const n = m.geometry.attributes.position?.count ?? 0;
    const a = new Float32Array(n * 3);
    const mw = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
    for (let i = 0; i < n; i++) {
      m.getVertexPosition(i, v).applyMatrix4(mw);
      a[i * 3] = v.x;
      a[i * 3 + 1] = v.y;
      a[i * 3 + 2] = v.z;
      box.expandByPoint(v);
    }
    pos.set(m, a);
  }
  const st = box.getSize(new THREE.Vector3());
  const max = Math.max(1e-6, st.x, st.y, st.z);
  for (const m of nat) {
    const a = pos.get(m)!;
    const n = a.length / 3;
    const ut = new Float32Array(n * 4);
    const vk = vikter.get(m);
    for (let i = 0; i < n; i++) {
      ut[i * 4] = (a[i * 3]! - box.min.x) / max;
      ut[i * 4 + 1] = (a[i * 3 + 1]! - box.min.y) / max;
      ut[i * 4 + 2] = (a[i * 3 + 2]! - box.min.z) / max;
      ut[i * 4 + 3] = vk ? (vk.get(i) ?? 0) : 1;
    }
    egenGeometri(m).setAttribute("aMonster", new THREE.BufferAttribute(ut, 4));
  }
  return { skalaY: max / Math.max(1e-6, st.y), axel: st.x >= st.z ? [1, 0, 0] : [0, 0, 1] };
}

const TYP = { band: 0, rander: 1, prickar: 2 } as const;

/** Mönstret på ett kroppsmaterial (MeshStandardMaterial-klon). `ref` = kroppens luminans (linjär), så att texturens skuggning
 *  följer med; `farger` linjära albedon (förkompenserade för ljuset); `mask` = kroppsmasken om materialet har textur. */
export function monsterPa(m: THREE.MeshStandardMaterial, km: KroppsMonster, o: { farger: [number, number, number][]; ref: number; skalaY: number; axel: [number, number, number]; mask: THREE.Texture | null }) {
  const f = o.farger.slice(0, 6);
  while (f.length < 6) f.push(f[f.length - 1] ?? [0.2, 0.2, 0.2]);
  const typ = TYP[km.typ];
  const harMask = !!(o.mask && m.map);
  m.defines = { ...(m.defines ?? {}), MONSTER_TYP: typ, ...(harMask ? { MONSTER_MASK: "" } : {}) };
  m.customProgramCacheKey = () => `r83a2-monster-${typ}-${harMask ? 1 : 0}`;
  m.userData.monster = km.typ;
  m.onBeforeCompile = (s) => {
    s.uniforms.uMFarg = { value: f.map((c) => new THREE.Vector3(...c)) };
    s.uniforms.uMAntal = { value: km.typ === "band" ? Math.max(1, Math.min(6, km.farger.length || km.antal)) : km.antal };
    s.uniforms.uMRef = { value: Math.max(1e-3, o.ref) };
    s.uniforms.uMSkalaY = { value: o.skalaY };
    s.uniforms.uMAxel = { value: new THREE.Vector3(...o.axel) };
    s.uniforms.uMMask = { value: harMask ? o.mask : null };
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec4 aMonster;\nvarying vec4 vMonster;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvMonster = aMonster;");
    s.fragmentShader = s.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec4 vMonster;\nuniform vec3 uMFarg[6];\nuniform float uMAntal;\nuniform float uMRef;\nuniform float uMSkalaY;\nuniform vec3 uMAxel;\n#ifdef MONSTER_MASK\nuniform sampler2D uMMask;\n#endif",
      )
      .replace("#include <color_fragment>", `#include <color_fragment>
{
  float kv = vMonster.w;
#ifdef MONSTER_MASK
  kv *= texture2D(uMMask, vMapUv).r;
#endif
  if (kv > 0.01) {
    float lum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    float sk = clamp(lum / uMRef, 0.55, 1.3);
    vec3 ny = diffuseColor.rgb;
#if MONSTER_TYP == 0
    float t = clamp(vMonster.y * uMSkalaY, 0.0, 0.9999);
    int bi = int(uMAntal) - 1 - int(floor(t * uMAntal));
    vec3 bc = uMFarg[0];
    for (int k = 1; k < 6; k++) { if (k == bi) bc = uMFarg[k]; }
    ny = bc * sk;
#elif MONSTER_TYP == 1
    float u = dot(vMonster.xyz, uMAxel) + 0.025 * sin(vMonster.y * 18.0);
    float fr = fract(u * uMAntal);
    float rm = smoothstep(0.06, 0.12, fr) * (1.0 - smoothstep(0.44, 0.50, fr));
    ny = mix(diffuseColor.rgb, uMFarg[0] * sk, rm);
#else
    vec3 pp = vMonster.xyz * uMAntal;
    vec3 ce = floor(pp);
    vec3 rr = fract(sin(vec3(dot(ce, vec3(127.1, 311.7, 74.7)), dot(ce, vec3(269.5, 183.3, 246.1)), dot(ce, vec3(113.5, 271.9, 124.6)))) * 43758.5453);
    vec3 fp = fract(pp) - 0.5 - (rr - 0.5) * 0.3;
    float pm = 1.0 - smoothstep(0.30, 0.35, length(fp));
    ny = mix(diffuseColor.rgb, uMFarg[0] * sk, pm);
#endif
    diffuseColor.rgb = mix(diffuseColor.rgb, ny, kv);
  }
}`);
  };
  m.needsUpdate = true;
}

/** Mönstrets färger (linjära albedon): datans/ordets färger förkompenserade för ljuset; utan färger en mörkare ton av
 *  kroppen (ljusare på en mörk kropp). `kropp` = kroppens färg i sRGB-hex. */
export function monsterFarger(km: KroppsMonster, kropp: string, tint: Tint): [number, number, number][] {
  if (km.farger.length) return km.farger.map((h) => malAlbedo(h, tint));
  const [h, s, l] = hexTillHsl(kropp);
  const [r, g, b] = hslTillRgb(h, Math.min(1, s * 1.1), l > 0.3 ? l * 0.35 : Math.min(0.9, l + 0.45));
  return [[tillLinjar(r), tillLinjar(g), tillLinjar(b)]];
}
