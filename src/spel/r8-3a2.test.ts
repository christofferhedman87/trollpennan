// R8-3a2: kroppens färg följer hela kroppen (gradient i samma färgruta, kedja av material), detaljer i samma textur behålls
// (betar, ögon, näbb), hörnfärger bakas in, och mönster (regnbåge, ränder, prickar) målas på kroppen ur data.
import assert from "node:assert/strict";
import { test } from "node:test";
import attributJson from "../../data/attribut.json" with { type: "json" };
import { ORD } from "../tolk/data.ts";
import { tolka } from "../tolk/tolka.ts";
import { effekterBredvid, effekterFor, kroppsMonsterFor } from "./attribut.ts";
import { fargning, hornKropp, iKarnan, kroppsMask, kroppsRoller, MASK, valjKarna, type MatInfo } from "./fargning.ts";
import { hexTillHsl, hslTillRgb, rgbTillHsl } from "./palett.ts";

const mat = (namn: string, hex: string, yta: number): MatInfo => ({ namn, hsl: hexTillHsl(hex), yta });
const roller = (m: MatInfo[], r?: Record<string, string>) => kroppsRoller(m, r).map((x) => x.roll);

/** En textur med rutor (som Gobkit-atlasen): varje ruta en lodrät gradient mellan två färger. */
function atlas(rutor: [string, string][], rw = 8, h = 32) {
  const w = rutor.length * rw;
  const d = new Uint8ClampedArray(w * h * 4);
  rutor.forEach(([a, b], r) => {
    const A = hexTillHsl(a), B = hexTillHsl(b);
    for (let y = 0; y < h; y++) {
      const t = y / (h - 1);
      const dh = ((B[0] - A[0] + 540) % 360) - 180;
      const [R, G, Bl] = hslTillRgb(A[0] + dh * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
      for (let x = r * rw; x < (r + 1) * rw; x++) {
        const o = (y * w + x) * 4;
        d[o] = R; d[o + 1] = G; d[o + 2] = Bl; d[o + 3] = 255;
      }
    }
  });
  return { d, w, h, rw };
}
/** Användning: stickprov mitt i ruta r, raderna y0..y1 (vikt 1 per texel). */
const anvand = (w: number, rw: number, delar: [number, number, number][]) => {
  const i: number[] = [], n: number[] = [];
  for (const [r, y0, y1] of delar) for (let y = y0; y <= y1; y++) { i.push(y * w + r * rw + Math.floor(rw / 2)); n.push(1); }
  return { i, n };
};
const andelRuta = (mask: Uint8Array, w: number, h: number, rw: number, r: number) => {
  let n = 0;
  for (let y = 0; y < h; y++) for (let x = r * rw; x < (r + 1) * rw; x++) n += mask[y * w + x] ?? 0;
  return n / (rw * h);
};

test("R8-3a2: ankan – hela färgrutan med ryggens gulgröna och magens gröna gradient är kropp, näbbens orange ruta behålls", () => {
  // ruta 0: kroppen (61° → 115°, som ankans atlasruta 13,3), ruta 1: näbb/fötter (20°), ruta 2: ögon (mörka)
  const { d, w, h, rw } = atlas([["#9AA62E", "#2F8C3A"], ["#C2632C", "#D9822E"], ["#1A1A22", "#2A2A33"]]);
  const k = { hsl: hexTillHsl("#9AA62E"), neutral: false };
  // modellen använder ryggens övre del mest (kärnan 61°) och magens nedre del, näbben och ögonen lite
  const mask = kroppsMask(d, w, h, k, anvand(w, rw, [[0, 0, 14], [0, 28, 31], [1, 10, 20], [2, 5, 8]]));
  assert.equal(andelRuta(mask, w, h, rw, 0), 1, "hela kroppsrutan, också magens gröna ände");
  assert.equal(andelRuta(mask, w, h, rw, 1), 0, "näbben");
  assert.equal(andelRuta(mask, w, h, rw, 2), 0, "ögonen");
  // R8-3a tog bara ±22° från kärnan: magens ände (115°) föll utanför
  const p = rgbTillHsl(0x2f, 0x8c, 0x3a);
  assert.equal(iKarnan(p, k), false);
});

test("R8-3a2: elefanten – grå kropp (två gråtoner) byts, gräddvita betar, rosa öron och mörka ögon behålls", () => {
  const { d, w, h, rw } = atlas([["#5E6B73", "#87929A"], ["#EDE3CF", "#F7F1E4"], ["#D98DA0", "#E8A3B4"], ["#14161A", "#202228"]]);
  const mask = kroppsMask(d, w, h, { hsl: rgbTillHsl(0x6b, 0x77, 0x80), neutral: true });
  assert.equal(andelRuta(mask, w, h, rw, 0), 1, "kroppen");
  assert.equal(andelRuta(mask, w, h, rw, 1), 0, "betarna");
  assert.equal(andelRuta(mask, w, h, rw, 2), 0, "öronen");
  assert.equal(andelRuta(mask, w, h, rw, 3), 0, "ögonen");
});

test("R8-3a2: en ruta bredvid i samma familj men med skarp kant växer inte in (steget är för stort)", () => {
  const { d, w, h, rw } = atlas([["#3E8E41", "#3E8E41"], ["#9CCC65", "#9CCC65"]]);
  const mask = kroppsMask(d, w, h, { hsl: hexTillHsl("#3E8E41"), neutral: false });
  assert.equal(andelRuta(mask, w, h, rw, 1), 0);
  assert.ok(MASK.steg < 60);
});

test("R8-3a2: material i kedja – en mage två nyanssteg bort via en mellanton hör till kroppen; hud mot röd dräkt gör det inte", () => {
  const hm = (namn: string, h: number, yta: number): MatInfo => ({ namn, hsl: [h, 0.55, 0.45], yta });
  // rygg 90°, mellanton 108°, mage 126° (36° från ryggen: R8-3a gav magen detalj), näbb 30°, ögon mörka
  assert.deepEqual(roller([hm("rygg", 90, 0.5), hm("mellan", 108, 0.2), hm("mage", 126, 0.15), hm("nabb", 30, 0.1), mat("oga", "#111111", 0.05)]), ["kropp", "kropp", "kropp", "detalj", "detalj"]);
  // R8-3a:s jultomte är oförändrad
  const m = [mat("drakt", "#B71C1C", 0.4), mat("#8E1116", "#8E1116", 0.15), mat("hud", "#F1C27D", 0.1), mat("#FAFAFA", "#FAFAFA", 0.2), mat("#212121", "#212121", 0.1), mat("#FFC107", "#FFC107", 0.05)];
  assert.deepEqual(roller(m), ["kropp", "kropp", "detalj", "detalj", "detalj", "detalj"]);
  // datans behall stoppar kedjan
  assert.deepEqual(roller([hm("rygg", 90, 0.5), hm("mellan", 108, 0.2), hm("mage", 126, 0.15)], { mellan: "behall" }), ["kropp", "detalj", "detalj"]);
});

test("R8-3a2: hörnfärger – kroppens hörn hittas (brun vas), svarta kanter behålls", () => {
  const rgb = [130, 70, 25, 132, 72, 26, 128, 69, 24, 30, 28, 22];
  const hk = hornKropp(rgb);
  assert.ok(hk);
  assert.deepEqual([...hk.kropp], [1, 1, 1, 0]);
  assert.equal(hk.karna.neutral, false);
  // grå hörnfärger (kuvertets skuggning): neutral kärna
  assert.equal(hornKropp([235, 235, 235, 240, 240, 240, 160, 160, 160])?.karna.neutral, true);
});

test("R8-3a2: kroppsmönster ur data – regnbåge band (6 färger, ersätter regnbågen över djuret), ränder och prickar med ordets mönsterfärg", () => {
  const v = (f: string) => {
    const u = tolka(f);
    assert.equal(u.typ, "skapad", f);
    return (u as Extract<typeof u, { typ: "skapad" }>).varelse;
  };
  const rb = kroppsMonsterFor(v("en regnbågsfärgad katt"));
  assert.equal(rb?.typ, "band");
  assert.equal(rb?.farger.length, 6);
  assert.deepEqual(effekterFor(v("en regnbågsfärgad katt")), ["regnbage"], "B6.5 oförändrad");
  assert.deepEqual(effekterBredvid(v("en regnbågsfärgad katt"), true), [], "GLB: mönstret på kroppen i stället");
  assert.deepEqual(effekterBredvid(v("en regnbågsfärgad katt"), false), ["regnbage"], "procedurkropp: effekten kvar");
  assert.deepEqual(effekterBredvid(v("en glittrig katt"), true), ["glitter"]);
  const r = kroppsMonsterFor(v("en röd och blå randig katt"));
  assert.equal(r?.typ, "rander");
  assert.deepEqual(r?.farger, ["#1E88E5"]);
  assert.deepEqual(kroppsMonsterFor(v("en randig katt"))?.farger, [], "utan mönsterfärg: kroppens mörkare ton");
  assert.equal(kroppsMonsterFor(v("en prickig hund"))?.typ, "prickar");
  assert.equal(kroppsMonsterFor(v("en blå katt")), null);
  assert.equal(kroppsMonsterFor({ monster: null, monsterfarg: null }), null);
});

test("R8-3a2: varje kroppsmönster i datan är ett mönster som ett ord kan ge, och har en känd typ", () => {
  const monster = new Set<string>();
  for (const o of ORD.ord) if ((o.del as { monster?: string } | undefined)?.monster) monster.add(`monster:${(o.del as { monster: string }).monster}`);
  const km = (attributJson as { kroppsmonster: Record<string, { typ?: string }> }).kroppsmonster;
  for (const [k, r] of Object.entries(km)) {
    if (k.startsWith("_")) continue;
    assert.ok(monster.has(k), `${k} ges inte av något ord`);
    assert.ok(["band", "rander", "prickar"].includes(r.typ ?? ""), `${k}: okänd typ ${r.typ}`);
  }
});

test("R8-3a2: B6.4 gäller – utan färgord ingen färgning (mönstret är något annat och kräver ett mönsterord)", () => {
  for (const roll of [undefined, "kropp", "ljus", "detalj"]) assert.deepEqual(fargning({ hex: null, roll, harKarta: true, glans: true, ljusare: (x) => x }), { farg: null, palettByte: false, glans: false });
  assert.equal(kroppsMonsterFor({ monster: null, monsterfarg: "#1E88E5" }), null);
  assert.ok(valjKarna([]) === null);
});

test("R8-3a2: en ruta vars gradient bara snuddar vid kroppens nyans (ankans vinge 20° → 45° mot kroppens 61°) behålls", () => {
  const { d, w, h, rw } = atlas([["#9AA62E", "#2F8C3A"], ["#B5482A", "#D9A02E"]]);
  const mask = kroppsMask(d, w, h, { hsl: hexTillHsl("#9AA62E"), neutral: false }, anvand(w, rw, [[0, 0, 14], [1, 0, 31]]));
  assert.equal(andelRuta(mask, w, h, rw, 0), 1, "kroppen");
  assert.equal(andelRuta(mask, w, h, rw, 1), 0, "vingen");
});

test("R8-3a2: en kulör kropp som delas av två nyansfack (bilens röda 9° och 12°) vinner över grå rutor", () => {
  const klump = (hex: string, n: number) => {
    const [r, g, b] = hslTillRgb(...hexTillHsl(hex));
    return { n, r: r * n, g: g * n, b: b * n };
  };
  // bilens kaross: grå rutor 40 %, röd 20 % + 14 % (två fack), däck 15 %, ljus 7 %
  const k = valjKarna([klump("#7A7C86", 0.4), klump("#EE5A3D", 0.2), klump("#F5602A", 0.14), klump("#3A3A40", 0.15), klump("#E6F6FF", 0.07)]);
  assert.ok(k && !k.neutral && (k.hsl[0] < 20 || k.hsl[0] > 350), `kärnan ska vara röd, var ${JSON.stringify(k)}`);
  // två fack långt isär slås inte ihop: grått vinner när ingen kulör familj når 30 %
  const g = valjKarna([klump("#7A7C86", 0.4), klump("#EE5A3D", 0.2), klump("#3D8AEE", 0.2), klump("#3A3A40", 0.2)]);
  assert.ok(g && g.neutral, "grå kärna när de kulöra är olika nyanser");
});
