// Världskartan (2026-10-30): platsernas lägen, vägen längs stigen, vyns zoom/panorering och bilderna.
// Lägena kontrolleras också med skärmbilder (rundans Playwright-prov), här kontrolleras att datan håller ihop.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { KARTPLATSER, KART_ASPEKT, STAM, ZOOM_MAX, avstand, basStorlek, centreraPa, klampa, kartPlats, langd, punktLangs, rutt, stamIndex, startVy, svgBana, zoomaKring } from "./varldskarta.ts";
import { PLATSER } from "./platser.ts";
import bild from "./ui/varldskartaBild.json" with { type: "json" };
import omraden from "../../data/omraden.json" with { type: "json" };

const las = (f: string) => fs.readFileSync(f, "utf8");
const inom = (p: readonly [number, number]) => p[0] > 0 && p[0] < 1 && p[1] > 0 && p[1] < 1;

test("Världskartan: alla fem platser har läge, skylt och en väg som börjar på stigen", () => {
  assert.deepEqual(KARTPLATSER.map((p) => p.id), ["ang", "garden", "skogen", "sjon", "grottan"]);
  for (const id of PLATSER.map((p) => p.id)) assert.ok(kartPlats(id), `${id} saknas på kartan`);
  for (const p of KARTPLATSER) {
    assert.ok(inom(p.pos), `${p.id}: läget ska ligga på bladet`);
    assert.ok(p.stig.length >= 2, p.id);
    assert.ok(avstand(p.stig[0]!, STAM[stamIndex(p.stig[0]!)]!) < 0.002, `${p.id}: vägen ska börja i en punkt på stigen`);
    assert.ok(avstand(p.stig.at(-1)!, p.pos) < 1e-6, `${p.id}: vägen ska sluta vid platsen`);
    for (const q of p.stig) assert.ok(inom(q), p.id);
  }
  // Stigen går nerifrån och upp, från Ängen till Kristallgrottan
  assert.ok(STAM[0]![1] > 0.9 && STAM.at(-1)![1] < 0.2);
  const ordning = KARTPLATSER.map((p) => stamIndex(p.stig[0]!));
  assert.deepEqual([...ordning].sort((a, b) => a - b), ordning, "platsernas ordning följer stigen (och fokusordningen)");
});

test("Världskartan: platserna ligger isär så att 64 px-knapparna inte överlappar ens i 375 px bredd", () => {
  const bas = basStorlek({ w: 375, h: 600 });
  for (const a of KARTPLATSER)
    for (const b of KARTPLATSER) {
      if (a.id >= b.id) continue;
      const d = Math.hypot((a.pos[0] - b.pos[0]) * bas.w, (a.pos[1] - b.pos[1]) * bas.h);
      assert.ok(d >= 64, `${a.id}–${b.id}: ${d.toFixed(0)} px`);
    }
});

test("Världskartan: vägen mellan två platser följer stigen och är sammanhängande", () => {
  for (const a of KARTPLATSER)
    for (const b of KARTPLATSER) {
      const v = rutt(a.id, b.id);
      assert.ok(avstand(v.at(-1)!, b.pos) < 1e-6, `${a.id}→${b.id} slutar vid målet`);
      if (a.id === b.id) continue;
      assert.ok(avstand(v[0]!, a.pos) < 1e-6, `${a.id}→${b.id} börjar vid start`);
      for (let i = 1; i < v.length; i++) assert.ok(avstand(v[i - 1]!, v[i]!) < 0.2, `${a.id}→${b.id}: inga hopp`);
      assert.ok(Math.abs(langd(rutt(b.id, a.id)) - langd(v)) < 1e-9, "samma väg åt båda hållen");
    }
  const v = rutt("ang", "grottan");
  assert.deepEqual(punktLangs(v, 0), v[0]);
  assert.deepEqual(punktLangs(v, 1), v.at(-1));
  const mitt = punktLangs(v, 0.5);
  assert.ok(mitt[1] < v[0]![1] && mitt[1] > v.at(-1)![1], "halvvägs ligger mellan start och mål");
  assert.match(svgBana(STAM), /^M[\d.]+ [\d.]+( C[\d. ]+)+$/);
});

test("Världskartan: vyn zoomar högst 2× och bladet lämnar aldrig vyn", () => {
  const vy = { w: 375, h: 600 };
  const bas = basStorlek(vy);
  assert.ok(Math.abs(bas.w / bas.h - KART_ASPEKT) < 1e-9);
  assert.ok(bas.w >= 375 - 16, "stående: kartan fyller bredden");
  const s0 = startVy(bas, vy);
  assert.equal(s0.s, 1);
  assert.ok(Math.abs(s0.ty - (vy.h - bas.h) / 2) < 1e-9, "centrerad i höjd");
  const z = zoomaKring(s0, 100, 300, 5, bas, vy);
  assert.equal(z.s, ZOOM_MAX);
  const k = klampa({ s: 2, tx: 500, ty: -9999 }, bas, vy);
  assert.equal(k.tx, 0, "vänsterkanten dras inte in");
  assert.ok(k.ty >= vy.h - bas.h * 2 - 1e-9, "underkanten dras inte in");
  const c = centreraPa(kartPlats("sjon")!.pos, 1.6, bas, vy);
  assert.ok(c.tx <= 0 && c.tx >= vy.w - bas.w * 1.6);
  const ligg = basStorlek({ w: 430, h: 360 });
  assert.ok(Math.abs(ligg.h - (360 - 16)) < 1e-9 || ligg.w <= 430 - 16, "liggande: hela kartan syns");
});

test("Världskartan: bilderna finns, är små nog och har samma proportioner som datan", () => {
  for (const b of bild.bredder) {
    for (const f of ["avif", "webp"]) {
      const fil = `public/karta/karta-${b}.${f}`;
      assert.ok(fs.existsSync(fil), fil);
      assert.ok(fs.statSync(fil).size < 700_000, `${fil}: ${fs.statSync(fil).size}`);
    }
  }
  for (const f of ["pergament", "penna", "moln"]) assert.ok(fs.existsSync(`public/karta/${f}.webp`), f);
  assert.ok(fs.existsSync("kallfiler/varldskarta/varldskarta.png"), "originalet ligger kvar utanför bygget");
  assert.ok(Math.abs(bild.bredd / bild.hojd - 2549 / 2154) < 0.01, "CSS aspect-ratio i varldskarta.css");
});

test("Världskartan: knapparna, texterna och förladdningen", () => {
  const tsx = las("src/spel/ui/KartaLager.tsx");
  const css = las("src/spel/ui/varldskarta.css");
  assert.match(css, /\.vk-ring \{[^}]*width: 64px;[^}]*height: 64px;/, "platsens tryckyta 64 px");
  assert.match(css, /\.vk-lyssna \{[^}]*width: 64px;[^}]*height: 64px;/, "lyssna 64 px");
  assert.match(css, /\.vk-knapp \{[^}]*min-height: 64px;/, "stäng och lyssna 64 px");
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(tsx, /aria-label=\{etikett\}/);
  assert.match(tsx, /rostKo\.lasUpp\(o\.rost_text\)/);
  for (const k of ["las_upp", "lyssna", "lyssna_pa", "stang", "stang_aria", "har_ar_du", "besokt", "ny"]) {
    assert.ok(typeof (omraden.karta as Record<string, unknown>)[k] === "string", `omraden.json karta.${k}`);
  }
  assert.doesNotMatch(tsx, /"[^"]*(Lyssna|Stäng|Här är du)[^"]*"/, "inga svenska texter i koden");
  assert.match(las("src/spel/ui/SpelVy.tsx"), /if \(angRedo\) forladdaVarldskartan\(\)/);
  assert.ok(!fs.existsSync("src/spel/ui/karta-v1.css"), "den gamla kartans stil är borttagen");
});
