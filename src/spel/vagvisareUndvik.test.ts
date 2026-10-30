// Returskylten får inte täcka pratbubblor på utflykterna (2026-10-30, block 4a-fynd): ren beräkning och inkoppling.
// Webbläsarprovet scripts/prov-vagvisare-bubbla.mjs (npm run prov:vagvisare) mäter verkliga rutor i fem format.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { BUBBEL_SVANS, LUFT, undvikBubblor, type Ruta } from "./ang/vagvisareUndvik.ts";

const ruta = (left: number, top: number, right: number, bottom: number): Ruta => ({ left, top, right, bottom });
// Rutorna uppmätta i 375×812 på Skogen med en väntande önskan (provet före rättningen): skylten låg på bubblans nedre del.
const SKYLT = ruta(135, 163, 241, 207);
const BUBBLA = ruta(12, 112, 363, 212);

test("Skylt som står fri flyttas inte", () => {
  assert.equal(undvikBubblor(SKYLT, []), 0);
  assert.equal(undvikBubblor(SKYLT, [ruta(12, 20, 363, 100)]), 0, "bubblan ovanför");
  assert.equal(undvikBubblor(SKYLT, [ruta(300, 112, 363, 212)]), 0, "bubblan vid sidan om");
  assert.equal(undvikBubblor(SKYLT, [ruta(0, 0, 0, 0)]), 0, "tom ruta (dold bubbla) räknas inte");
  assert.equal(undvikBubblor(ruta(135, 230, 241, 274), [BUBBLA]), 0, "redan under svansen");
});

test("Skylt som täcker en bubbla flyttas så att svansen och luften får plats", () => {
  const dy = undvikBubblor(SKYLT, [BUBBLA]);
  assert.equal(dy, BUBBLA.bottom + BUBBEL_SVANS + LUFT - SKYLT.top);
  assert.ok(SKYLT.top + dy >= BUBBLA.bottom + BUBBEL_SVANS, "skyltens överkant ligger under svansen");
  // Även en skylt som bara snuddar vid bubblans underkant flyttas, eftersom svansen annars hamnar under den.
  assert.ok(undvikBubblor(ruta(135, 205, 241, 249), [BUBBLA]) > 0);
});

test("Flera bubblor: skylten hamnar under den lägsta den når", () => {
  const andra = ruta(12, 214, 363, 300);
  const dy = undvikBubblor(SKYLT, [andra, BUBBLA]);
  assert.equal(dy, andra.bottom + BUBBEL_SVANS + LUFT - SKYLT.top);
});

test("Taket: skylten flyttas aldrig lägre än maxBottom, så att den inte hamnar över knapparna", () => {
  const dy = undvikBubblor(SKYLT, [BUBBLA], 240);
  assert.equal(dy, 240 - SKYLT.bottom);
  assert.equal(undvikBubblor(SKYLT, [BUBBLA], 100), 0, "får aldrig bli negativ");
});

test("Inkopplingen: HUD mäter verkliga rutor, flyttar med marginTop och nollställer utan bubbla", () => {
  const tsx = fs.readFileSync("src/spel/ang/Vagvisare3D.tsx", "utf8");
  assert.match(tsx, /querySelectorAll<HTMLElement>\("\.bubbla"\)/, "alla pratbubblor, inte bara önskan");
  assert.match(tsx, /top: r\.top - nu, bottom: r\.bottom - nu/, "mäter skyltens egen plats utan tidigare flytt");
  assert.match(tsx, /marginTop: flytt\[p\.id\]/);
  assert.match(tsx, /if \(!lika\) setFlytt\(nytt\)/, "ingen omritning när inget ändrats");
  assert.match(tsx, /clearInterval/, "mätningen städas bort");
  // Ingen CSS-övergång på margin-top: en halvvägs flyttad ruta skulle ge fel mått och fladder.
  const css = fs.readFileSync("src/spel/ui/plats-resa-v09.css", "utf8");
  assert.doesNotMatch(css, /transition:[^;]*margin/);
});
