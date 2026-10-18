// Tester för de rena delarna av scripts/modell-inlagg.mjs. Verktygsberoende delar (gltf-transform) körs bara om
// scripts/modell-verktyg/node_modules finns (npm ci --prefix scripts/modell-verktyg).
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { axelFranVektor, delaKallor, formerFor, infogaRader, kontrolleraLicens, lasTsv, licenstexter, normRad, ordKandidater, rorelseFor, slug, sammanfatta, sorteraPaket, tillModellRum } from "./modell-inlagg.mjs";

const rot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(fs.readFileSync(path.join(rot, "data", "inlagg.json"), "utf8"));

test("manifest: Modellspanarens kolumner läses och kategorin tas ur batch-kategori eller förslaget", () => {
  const t = "paket\tfilnamn\tlicens\ttrianglar\tföreslaget svenskt ord/kategori\tbatch-kategori\nkenney-food-kit\tapple.glb\tCC0-1.0\t300\tmat: äpple\t\n";
  const r = normRad(lasTsv(t)[0]);
  assert.equal(r.fil, "apple.glb");
  assert.equal(r.tri, 300);
  assert.equal(r.kategori, "mat");
  assert.deepEqual(ordKandidater("mat: äpple").ord, ["äpple"]);
});

test("ord: å/ä/ö blir ASCII i id, flerord blir inte enkla ord, växelord tas bort", () => {
  assert.equal(slug("räv"), "rav");
  assert.equal(slug("flodhäst"), "flodhast");
  assert.deepEqual(ordKandidater("djur: liten grotta").ord, []);
});

test("licens: bara CC0 släpps in; CC-BY och karantänmappar stoppas", () => {
  const rad = { licens: "CC0-1.0", licensUrl: "https://x", kalla: "https://x", forfattare: "A", hamtad: "2026-10-18", paket: "p", fil: "a.glb" };
  assert.deepEqual(kontrolleraLicens(rad, "/x/_prioriterad-batch-1/p/a.glb", cfg), []);
  assert.ok(kontrolleraLicens({ ...rad, licens: "CC-BY-4.0" }, "/x/p/a.glb", cfg).length > 0);
  assert.ok(kontrolleraLicens(rad, "/x/cc-by-karantan/p/a.glb", cfg).length > 0);
});

test("framsida: axel ur riktningsvektor kräver tydlig skillnad; mallpunkter vrids till modellens rum", () => {
  assert.equal(axelFranVektor(0, 1), "+z");
  assert.equal(axelFranVektor(-2, 0.5), "-x");
  assert.equal(axelFranVektor(1, 1), null, "otydlig riktning ska inte gissas");
  assert.deepEqual(tillModellRum([0.2, 0.5, 0.9], "+z"), [0.2, 0.5, 0.9]);
  const [x, y, z] = tillModellRum([0.2, 0.5, 0.9], "-z");
  assert.deepEqual([+x.toFixed(2), y, +z.toFixed(2)], [0.8, 0.5, 0.1]);
});

test("rörelse: ordlistorna går före undertypen (pingvin går, delfin simmar)", () => {
  assert.equal(rorelseFor("djur/fågel", ["pingvin"], cfg), "land");
  assert.equal(rorelseFor("djur/fågel", ["örn"], cfg), "flyg");
  assert.equal(rorelseFor("djur", ["delfin"], cfg), "sim");
  assert.equal(rorelseFor("djur", ["kanin"], cfg), "land");
});

test("böjningar: en/ett och plural följer reglerna i data", () => {
  const u = formerFor("elefant", "u", cfg);
  assert.ok(u.includes("elefanten") && u.includes("elefanter"));
  const n = formerFor("lamm", "n", cfg);
  assert.ok(n.includes("lammet"));
});

test("datafiler: nya rader sätts in som text utan att filens stil ändras", () => {
  const text = '{\n  "entiteter": {\n    "a": { "typ": "djur" }\n  }\n}\n';
  const ut = infogaRader(text, "entiteter", { b: { typ: "djur", modell: "b" } }, "en-rad");
  assert.deepEqual(Object.keys(JSON.parse(ut).entiteter), ["a", "b"]);
  assert.ok(ut.includes('    "a": { "typ": "djur" },\n'));
});

test("sammanfattning: räknar OK, flaggade, hoppade och fel; klarar_procent räknar OK + flaggade", () => {
  const s = sammatta();
  assert.equal(s.rader, 4);
  assert.equal(s.klarar_procent, 50);
  assert.equal(s.klarar_utan_flagga_procent, 25);
  function sammatta() {
    return sammanfatta([
      { status: "OK", flaggor: [], fel: [], ord: ["a"] },
      { status: "OK_FLAGGAD", flaggor: ["stil: x"], fel: [], ord: ["b"] },
      { status: "HOPPAD", flaggor: [], fel: [], hoppa: "x", ord: [] },
      { status: "FEL", flaggor: [], fel: ["fel"], ord: [] },
    ]);
  }
});

test("licensfilerna genereras ur manifestet och märks så att de inte redigeras för hand", () => {
  const t = licenstexter({ tillgangar: { apa: { fil: "/models/bulk/apa.glb", licens: "CC0-1.0", upphov: "Kenney", kalla: "https://kenney.nl", paket: "kenney-cube-pets" } }, licenser: { "CC0-1.0": { namn: "CC0", namnangivelse: false } } });
  assert.match(t.md, /Genereras av `node scripts\/modell-inlagg\.mjs licenser`/);
  assert.match(t.md, /\| apa \| \/models\/bulk\/apa\.glb \| CC0-1\.0 \| Kenney \|/);
});

test("verktygskedjan: en riktig GLB går genom optimize → prune → meshopt (hoppas över utan verktyg)", async (t) => {
  if (!fs.existsSync(path.join(rot, "scripts", "modell-verktyg", "node_modules"))) return t.skip("scripts/modell-verktyg/node_modules saknas");
  const { optimera, matt } = await import("./modell-inlagg.mjs");
  const inn = path.join(rot, "public", "models", "animal-bunny.glb");
  if (!fs.existsSync(inn)) return t.skip("ingen GLB att prova med");
  const tmp = fs.mkdtempSync(path.join(rot, "node_modules", ".inlagg-test-"));
  try {
    const ut = path.join(tmp, "ut.glb");
    const r = await optimera(inn, ut, tmp, 256, cfg);
    assert.ok(r.ok, r.fel);
    const e = await matt(ut);
    const f = await matt(inn);
    assert.equal(e.tri, f.tri, "kedjan ska inte förenkla");
    assert.ok(e.tillagg.includes("EXT_meshopt_compression"));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("R3D: flera inkorgar i ett steg (--mapp/--manifest i par) och paketprioritet för förstkommen-får-ordet", () => {
  const k = delaKallor("/a,/b", "x.tsv,y.tsv");
  assert.deepEqual(k.map((x) => [x.mapp, x.manifest]), [["/a", "x.tsv"], ["/b", "y.tsv"]]);
  assert.throws(() => delaKallor("/a,/b", "x.tsv"), /lika många/);
  const prio = cfg.paket_prioritet;
  assert.ok(Array.isArray(prio) && prio[0].startsWith("kenney"), "Kenney först (stilen finns redan i spelet)");
  assert.deepEqual(sorteraPaket(["gobkit-x/a.glb", "oga-cc0/b.glb", "kenney-y/c.glb", "kenney-y/d.glb", "okand/e.glb"], prio), ["kenney-y/c.glb", "kenney-y/d.glb", "gobkit-x/a.glb", "oga-cc0/b.glb", "okand/e.glb"]);
});
