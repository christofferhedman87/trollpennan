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
  assert.deepEqual(djurIds(), ["kanin", "katt", "hund", "drake", "häst", "fågel", "fisk", "groda", "gris", "dinosaurie", "uggla", "ekorre", "bäver", "haj"]);
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
  assert.ok(djurIds().every((k) => entitet(k)?.framAxel === undefined), "inget av de 14 djuren behöver framAxel");
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
  assert.deepEqual(djurIds().filter(nattvaken), ["uggla"]);
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
