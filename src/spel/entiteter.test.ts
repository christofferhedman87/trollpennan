import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ordJson from "../../data/ord.json" with { type: "json" };
import {
  ENTITETER,
  TILLGANGAR,
  artFarg,
  djurIds,
  forladdaUrls,
  entitet,
  flyger,
  framVinkel,
  hoppHojd,
  kontrolleraEntiteter,
  malhojd,
  modellUrl,
  nattvaken,
  simmar,
  svavar,
  vikt,
  type FramAxel,
} from "./entiteter.ts";

const publik = path.resolve(import.meta.dirname, "../../public");

test("datan är hel: kontrolleraEntiteter() ger inga fel", () => {
  assert.deepEqual(kontrolleraEntiteter(), []);
});

test("kontrollen hittar trasig data", () => {
  const e = ENTITETER["kanin"]!;
  const gammal = e.modell;
  e.modell = "finns-inte";
  assert.ok(kontrolleraEntiteter().some((f) => f.includes("kanin") && f.includes("finns-inte")));
  e.modell = gammal;
  const ax = e.framAxel;
  e.framAxel = "uppåt" as FramAxel;
  assert.ok(kontrolleraEntiteter().some((f) => f.includes("framAxel")));
  e.framAxel = ax;
  assert.deepEqual(kontrolleraEntiteter(), []);
});

test("djuren i entiteter.json är exakt de kroppar ord.json kan skapa, i albumets ordning", () => {
  const ur: string[] = [];
  const gå = (x: unknown) => {
    if (Array.isArray(x)) x.forEach(gå);
    else if (x && typeof x === "object") {
      const o = x as Record<string, unknown>;
      const del = o["del"] as { kropp?: string } | undefined;
      if (del && typeof del.kropp === "string") ur.push(del.kropp);
      Object.values(o).forEach(gå);
    }
  };
  gå(ordJson);
  assert.deepEqual([...new Set(ur)].sort(), [...djurIds()].sort());
  // De 14 första är albumets ordning; djur som bulkrundorna lägger in (inlagd: "R3C", "R3D") kommer efter dem.
  assert.deepEqual(djurIds().slice(0, 14), ["kanin", "katt", "hund", "drake", "häst", "fågel", "fisk", "groda", "gris", "dinosaurie", "uggla", "ekorre", "bäver", "haj"]);
  assert.ok(djurIds().slice(14).every((k) => arBulk(k)), "djur efter de 14 ska vara inlagda av en bulkrunda (R3C, R3D eller R3F-M1, M2 …)");
});

/** Bulkrundornas rader (data/inlagg.json, scripts/modell-inlagg.mjs): inlagd är rundans namn. */
const arBulk = (k: string) => /^(R3[CD]|R3F-M\d+)$/.test(String(ENTITETER[k]?.inlagd ?? ""));

test("R3D: andra bulkomgången är inne, bara CC0, och varje modellfil finns", () => {
  const r3d = Object.keys(ENTITETER).filter((k) => ENTITETER[k]?.inlagd === "R3D");
  assert.ok(r3d.length >= 200, `R3D ska ha minst 200 rader, har ${r3d.length}`);
  for (const k of r3d) {
    const t = TILLGANGAR[ENTITETER[k]!.modell as string];
    assert.ok(t, `${k}: tillgång saknas`);
    assert.equal(t.licens, "CC0-1.0", `${k}: bara CC0 i R3D (CC-BY väntar på kreditvisning, R3E)`);
    assert.ok(t.fil && fs.existsSync(path.join("public", t.fil)), `${k}: ${t.fil} finns inte`);
  }
});

test("R3F-modellserien (M1, M2 …): bara CC0 och varje modellfil finns", () => {
  const r3f = Object.keys(ENTITETER).filter((k) => /^R3F-M\d+$/.test(String(ENTITETER[k]?.inlagd ?? "")));
  for (const k of r3f) {
    const t = TILLGANGAR[ENTITETER[k]!.modell as string];
    assert.ok(t, `${k}: tillgång saknas`);
    assert.equal(t.licens, "CC0-1.0", `${k}: bara CC0 i R3F (CC-BY väntar på kreditvisning, R3E)`);
    assert.ok(t.fil && fs.existsSync(path.join("public", t.fil)), `${k}: ${t.fil} finns inte`);
  }
});

test("modeller från bulkrundorna hämtas när ordet används: forladda är false och startnedladdningen växer inte", () => {
  const r3c = Object.keys(ENTITETER).filter((k) => arBulk(k));
  assert.ok(r3c.every((k) => ENTITETER[k]?.forladda === false), "alla bulkrader ska ha forladda: false");
  const start = new Set(forladdaUrls());
  for (const k of r3c) {
    const u = modellUrl(k);
    if (u) assert.ok(!start.has(u), `${k}: ${u} ska inte hämtas vid start`);
  }
  assert.ok(start.has("/models/animal-bunny.glb"), "de första djuren hämtas som förut");
});

test("varje modellfil finns, och varje fil i public/models har en rad i tillgangar.json", () => {
  for (const [id, t] of Object.entries(TILLGANGAR)) {
    const sokvag = path.join(publik, t.fil ?? t.mapp ?? "");
    assert.ok(fs.existsSync(sokvag), `${id}: ${sokvag} saknas`);
  }
  const iManifest = new Set(Object.values(TILLGANGAR).flatMap((t) => (t.fil ? [t.fil] : [])));
  for (const f of fs.readdirSync(path.join(publik, "models")).filter((n) => n.endsWith(".glb"))) {
    assert.ok(iManifest.has(`/models/${f}`), `/models/${f} saknar rad i data/tillgangar.json`);
  }
  for (const e of Object.values(ENTITETER)) {
    if (e.modell) assert.ok(TILLGANGAR[e.modell], `${e.modell} saknas i tillgangar.json`);
  }
});

test("saknade fält ger standard: inget fält krävs per djur", () => {
  assert.equal(entitet("okänt-djur"), undefined);
  assert.equal(modellUrl("okänt-djur"), null);
  assert.equal(malhojd("okänt-djur"), 1);
  assert.equal(artFarg("okänt-djur"), "#CE93D8");
  assert.equal(flyger("okänt-djur", []), false);
  assert.equal(simmar("okänt-djur", []), false);
  assert.equal(svavar("okänt-djur"), false);
  assert.equal(vikt("okänt-djur"), 1);
  assert.equal(hoppHojd("okänt-djur"), null);
  assert.equal(nattvaken("okänt-djur"), false);
  assert.equal(framVinkel(entitet("kanin")?.framAxel), 0);
  assert.ok(djurIds().slice(0, 14).every((k) => entitet(k)?.framAxel === undefined), "inget av de 14 djuren behöver framAxel");
});

test("värden som koden hade i tabellerna", () => {
  assert.equal(modellUrl("uggla"), "/models/animal-chick.glb");
  assert.equal(modellUrl("häst"), "/models/hast.glb");
  assert.equal(modellUrl("gris"), null);
  assert.equal(malhojd("häst"), 1.5);
  assert.deepEqual(entitet("katt")?.palett, { from: 0, range: -1, bodyL: 0.5 });
  assert.equal(flyger("fågel", []), true);
  assert.equal(flyger("kanin", ["vingar"]), true);
  assert.equal(simmar("bäver", []), true);
  assert.equal(simmar("hund", ["fenor"]), true);
  assert.equal(svavar("drake"), true);
  assert.deepEqual([vikt("drake"), vikt("häst"), vikt("hund")], [3, 2, 1]);
  assert.equal(hoppHojd("fågel"), 0.32);
  assert.equal(hoppHojd("kanin"), 0.55);
  assert.deepEqual(djurIds().slice(0, 14).filter(nattvaken), ["uggla"]);
});

test("framVinkel lägger vald axel mot +z (där kameran står)", () => {
  const vrid = (x: number, z: number, a: number): [number, number] => [x * Math.cos(a) + z * Math.sin(a), -x * Math.sin(a) + z * Math.cos(a)];
  const axlar: [FramAxel, [number, number]][] = [["+z", [0, 1]], ["-z", [0, -1]], ["+x", [1, 0]], ["-x", [-1, 0]]];
  for (const [axel, [x, z]] of axlar) {
    const [rx, rz] = vrid(x, z, framVinkel(axel));
    assert.ok(Math.abs(rx) < 1e-9 && Math.abs(rz - 1) < 1e-9, `${axel} hamnade på (${rx}, ${rz})`);
  }
});

test("ett nytt djur är en datarad: funktionerna ser det utan kodändring", () => {
  ENTITETER["testdjur"] = { typ: "djur", kategori: "djur", modell: "animal-dog", malhojd: 0.9, art: "#112233", rorelse: "flyg", framAxel: "-z" };
  try {
    assert.deepEqual(kontrolleraEntiteter(), []);
    assert.equal(modellUrl("testdjur"), "/models/animal-dog.glb");
    assert.equal(flyger("testdjur", []), true);
    assert.ok(djurIds().includes("testdjur"));
    assert.equal(framVinkel(entitet("testdjur")?.framAxel), Math.PI);
  } finally {
    delete ENTITETER["testdjur"];
  }
});
