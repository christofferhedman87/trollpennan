// V6: en pratbubbla, medaljong utan ERROR-bild, Bengtsson som CC0-GLB.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const las = (fil: string) => fs.readFileSync(fil, "utf8");

test("V6: useBannrar klämmer bubblan och rensar vid handling", () => {
  const k = las("src/spel/styr/useBannrar.ts");
  assert.match(k, /function rensaVidHandling\(\)/);
  assert.match(k, /rensaVidHandling/);
  assert.match(k, /Math\.min\(0\.78, Math\.max\(0\.22, x\)\)/);
  assert.match(k, /Math\.min\(0\.76, Math\.max\(0\.18, y\)\)/);
  assert.match(k, /\.slice\(-1\)/);
  assert.equal(k.includes(".slice(-2)"), false);
  assert.match(k, /kalla === "skapad"/);
  assert.match(k, /kalla === "uppdrag_klart"/);
  assert.match(k, /return \{[^}]*rensaVidHandling/);
});

test("V6: NpcFigur byter automat mot tankande och behåller skylten", () => {
  const n = las("src/spel/ui/NpcFigur.tsx");
  assert.match(n, /data-v6="bengtsson-medaljong"/);
  assert.match(n, /data-testid="npc-figur"/);
  assert.match(n, /data-mine=\{mine\}/);
  assert.match(n, /data-testid="inte-riktigt-an"/);
  assert.match(n, /Inte riktigt än/);
  assert.match(n, /mine === "automat" \? "tankande" : mine/);
  assert.match(n, /if \(k === "automat"\) continue/);
  const resa = las("src/spel/ui/PlatsResa.tsx");
  assert.match(resa, /intro\.min === "automat" \? "tankande" : intro\.min/);
});

test("V6: Bengtsson3D laddar CC0-GLB utan box-primitiver", () => {
  const b = las("src/spel/ang/Bengtsson3D.tsx");
  assert.match(b, /useGLTF\("\/models\/bulk\/bengtsson\.glb", true, true, kopplaMeshopt\)/);
  assert.match(b, /useGLTF\.preload\(BENGTSSON_GLB, true, true, kopplaMeshopt\)/);
  assert.equal(b.includes("<boxGeometry"), false);
  assert.equal(b.includes("BoxGeometry"), false);
  assert.match(b, /name="bengtsson-3d"/);
  assert.match(b, /trollNpc: "bengtsson"/);
  const ang = las("src/spel/angen3d.tsx");
  assert.match(ang, /<Bengtsson3D \/>/);
});

test("V6: bubbla, banner och medaljong har läsbar stil", () => {
  const css = las("src/spel/ui/hud-p2.css");
  assert.match(css, /font-size:\s*1\.125rem/);
  assert.match(css, /color:\s*#3B2F2F/);
  assert.match(css, /background:\s*#FFF6E5/);
  assert.match(css, /data-v6="bengtsson-medaljong"/);
  assert.match(css, /width:\s*64px/);
  assert.match(css, /height:\s*64px/);
  const lager = las("src/spel/ui/AngLager.tsx");
  assert.match(lager, /banners\.slice\(0,\s*1\)/);
  assert.match(lager, /bubblor\.slice\(-1\)/);
  const djur = las("src/spel/ang/djur.tsx");
  assert.match(djur, /malTillDuk\(spec\.uid\)/);
  assert.match(djur, /function StjarnPuff/);
  assert.match(djur, /#F2B632/);
  assert.match(djur, /emissive="#FFE082"/);
});
