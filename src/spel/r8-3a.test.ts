// R8-3a (R9C): färgordet färgar hela kroppen på alla modeller, ögon/hud/detaljer behålls. Utan färgord: ingenting (B6.4).
import assert from "node:assert/strict";
import { test } from "node:test";
import { fargning, kroppsRoller, valjKarna, type MatInfo } from "./fargning.ts";
import { hexTillHsl } from "./palett.ts";
import entJson from "../../data/entiteter.json" with { type: "json" };

const ljusare = (h: string) => `ljus(${h})`;
const mat = (namn: string, hex: string, yta: number): MatInfo => ({ namn, hsl: hexTillHsl(hex), yta });
const roller = (m: MatInfo[], r?: Record<string, string>) => kroppsRoller(m, r).map((x) => x.roll);

test("R8-3a: jultomten – dräkt och mössa (två material i samma röda familj) är kropp, hud, skägg, skor och spänne behålls", () => {
  const m = [mat("drakt", "#B71C1C", 0.4), mat("#8E1116", "#8E1116", 0.15), mat("hud", "#F1C27D", 0.1), mat("#FAFAFA", "#FAFAFA", 0.2), mat("#212121", "#212121", 0.1), mat("#FFC107", "#FFC107", 0.05)];
  assert.deepEqual(roller(m), ["kropp", "kropp", "detalj", "detalj", "detalj", "detalj"]);
});

test("R8-3a: kraken – två lila material blir kropp, svarta och vita ögon behålls (datans farg-material vinner som huvud)", () => {
  const m = [mat("#8E24AA", "#8E24AA", 0.6), mat("#CE93D8", "#CE93D8", 0.3), mat("#212121", "#212121", 0.05), mat("#FAFAFA", "#FAFAFA", 0.05)];
  assert.deepEqual(roller(m), ["kropp", "kropp", "detalj", "detalj"]);
  assert.deepEqual(roller(m, { "#8E24AA": "farg" }), ["kropp", "kropp", "detalj", "detalj"]);
});

test("R8-3a: datans roller gäller (farg, ljus, behall); övriga material automatiskt", () => {
  const m = [mat("Main", "#864B22", 0.6), mat("Sec", "#533344", 0.2), mat("Horn", "#80838F", 0.1), mat("Eye", "#202123", 0.02)];
  assert.deepEqual(roller(m, { Main: "farg", Sec: "ljus" }), ["kropp", "ljus", "detalj", "detalj"]);
  assert.deepEqual(roller(m, { Main: "behall" }), ["detalj", "kropp", "detalj", "detalj"]);
});

test("R8-3a: mörka ögon är aldrig huvudmaterial; en helt svart modell färgas ändå", () => {
  assert.deepEqual(roller([mat("ogon", "#111111", 0.7), mat("kropp", "#9E9E9E", 0.3)]), ["detalj", "kropp"]);
  assert.deepEqual(roller([mat("svart", "#111111", 1)]), ["kropp"]);
});

test("R8-3a: vit/grå kropp – neutrala material med liknande ljushet hör ihop, kulörta (rosa öron) behålls", () => {
  assert.deepEqual(roller([mat("kropp", "#E7E7E7", 0.7), mat("mage", "#FFFFFF", 0.15), mat("ora", "#F48FB1", 0.1), mat("nos", "#333333", 0.05)]), ["kropp", "kropp", "detalj", "detalj"]);
});

test("R8-3a: kärnfärgen i en textur är ytviktad – stor grå kropp vinner över tätt modellerade rosa öron", () => {
  const k = valjKarna([{ n: 70, r: 0xe0 * 70, g: 0xe0 * 70, b: 0xe0 * 70 }, { n: 20, r: 0xf4 * 20, g: 0x8f * 20, b: 0xb1 * 20 }, { n: 10, r: 0x20 * 10, g: 0x20 * 10, b: 0x20 * 10 }]);
  assert.equal(k?.neutral, true);
});

test("R8-3a: kärnfärgen – en kulör dräkt som täcker ≥ 30 % vinner över vitt skägg och hud", () => {
  const k = valjKarna([{ n: 45, r: 0xfa * 45, g: 0xfa * 45, b: 0xfa * 45 }, { n: 35, r: 0xb7 * 35, g: 0x1c * 35, b: 0x1c * 35 }, { n: 20, r: 0xf1 * 20, g: 0xc2 * 20, b: 0x7d * 20 }]);
  assert.equal(k?.neutral, false);
  assert.ok(k && (k.hsl[0] < 15 || k.hsl[0] > 345), String(k?.hsl));
});

test("R8-3a: fargning – kropp med textur byter texturen, kropp utan textur får målfärgen, ljus får ljusare, detalj inget", () => {
  const hex = "#1E88E5";
  assert.deepEqual(fargning({ hex, roll: "kropp", harKarta: true, glans: true, ljusare }), { farg: null, palettByte: true, glans: true });
  assert.deepEqual(fargning({ hex, roll: "kropp", harKarta: false, glans: false, ljusare }), { farg: hex, palettByte: false, glans: false });
  assert.deepEqual(fargning({ hex, roll: "farg", harKarta: false, glans: true, ljusare }), { farg: hex, palettByte: false, glans: true });
  assert.deepEqual(fargning({ hex, roll: "ljus", harKarta: false, glans: true, ljusare }), { farg: `ljus(${hex})`, palettByte: false, glans: false });
  assert.deepEqual(fargning({ hex, roll: "detalj", harKarta: true, glans: true, ljusare }), { farg: null, palettByte: false, glans: false });
});

test("R8-3a: B6.4 gäller – utan färgord ingen färgning för någon roll", () => {
  for (const roll of [undefined, "kropp", "ljus", "farg", "detalj"]) for (const harKarta of [false, true]) for (const glans of [false, true])
    assert.deepEqual(fargning({ hex: null, roll, harKarta, glans, ljusare }), { farg: null, palettByte: false, glans: false });
});

test("R8-3a: datans materialroller är kända värden", () => {
  const ent = (entJson as unknown as { entiteter: Record<string, { material?: Record<string, string> }> }).entiteter;
  for (const [id, e] of Object.entries(ent)) for (const [n, r] of Object.entries(e.material ?? {})) assert.ok(["farg", "ljus", "behall"].includes(r), `${id}.${n}: ${r}`);
});
