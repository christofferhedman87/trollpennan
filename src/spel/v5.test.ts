// V5: fonetisk stavning, ord-i-fras och ledtråd som inte ger bort hela ordet.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ledtradarJson from "../../data/ledtradar.json" with { type: "json" };
import { delaStavelser, ledtradsSteg, stavningsFeedback } from "./lasniva.ts";
import { bytOrd } from "./ui/hjalp.ts";

const facit = JSON.parse(fs.readFileSync("rundor/V4-V6-sprak-stavning-3d/facit-v4-v6.json", "utf8")) as {
  v5: {
    fonetiska_par: { skrivet: string; mal: string; typ: string; rattPrefix: string }[];
    fras_ersattning: { in: string; fran: string; till: string; ut: string }[];
  };
};

const p4 = JSON.parse(fs.readFileSync("rundor/P4-lasning-och-karta/facit-p4.json", "utf8")) as {
  p4b: { stavning_exempel: { skrivet: string; mal: string; typ: string; ratt_prefix: string }[] };
};

function harHelaOrdet(text: string, ord: string): boolean {
  const t = text.toLocaleLowerCase("sv");
  const o = ord.toLocaleLowerCase("sv").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![a-zåäö])${o}(?![a-zåäö])`, "u").test(t);
}

test("V5: fonetiska par ger ljud, utom dubbelkonsonant", () => {
  for (const par of facit.v5.fonetiska_par) {
    const fb = stavningsFeedback(par.skrivet, par.mal);
    if (par.skrivet === par.mal) {
      assert.equal(fb, null, par.skrivet);
      continue;
    }
    assert.ok(fb, par.skrivet);
    assert.equal(fb.typ, par.typ, `${par.skrivet} → ${par.mal}`);
    assert.equal(fb.rattPrefix, par.rattPrefix, par.skrivet);
  }
  assert.equal(stavningsFeedback("tjykling", "kyckling")?.typ, "ljud");
  assert.equal(stavningsFeedback("tjykling", "kyckling")?.rattPrefix, "");
  assert.equal(stavningsFeedback("sjöldpadda", "sköldpadda")?.typ, "ljud");
  assert.equal(stavningsFeedback("sjöldpadda", "sköldpadda")?.rattPrefix, "");
  assert.equal(stavningsFeedback("järta", "hjärta")?.typ, "ljud");
  assert.equal(stavningsFeedback("järta", "hjärta")?.rattPrefix, "");
  assert.equal(stavningsFeedback("kat", "katt")?.typ, "dubbel");
  assert.equal(stavningsFeedback("kat", "katt")?.rattPrefix, "kat");
});

test("V5: p4-facit behåller typ och prefix", () => {
  for (const ex of p4.p4b.stavning_exempel) {
    const fb = stavningsFeedback(ex.skrivet, ex.mal);
    assert.ok(fb, ex.skrivet);
    assert.equal(fb.nara, true);
    assert.equal(fb.typ, ex.typ, ex.skrivet);
    assert.equal(fb.rattPrefix, ex.ratt_prefix);
  }
});

test("V5: bytOrd byter bara det felstavade ordet", () => {
  for (const f of facit.v5.fras_ersattning) {
    assert.equal(bytOrd(f.in, f.fran, f.till), f.ut);
  }
  assert.equal(bytOrd("en röd kat", "kat", "katt"), "en röd katt");
  assert.equal(bytOrd("ett stort slåt", "slåt", "slott"), "ett stort slott");
  assert.equal(bytOrd("En röd kat", "kat", "katt"), "En röd katt");
  assert.equal(bytOrd("Kat", "kat", "katt"), "katt");
});

test("V5: ledtråd i steg 1 och 2 avslöjar inte hela ordet", () => {
  const led = ledtradarJson.ledtradar;
  for (const [id, rad] of Object.entries(led)) {
    for (const steg of [1, 2] as const) {
      const info = ledtradsSteg(id, steg);
      assert.ok(info, `${id} ${steg}`);
      assert.equal(harHelaOrdet(info.extraText ?? "", id), false, `${id} steg ${steg}: ${info.extraText}`);
      const latt = "gata_latt" in rad ? rad.gata_latt : undefined;
      if (!latt) {
        const delar = delaStavelser(id);
        const sista = delar[delar.length - 1] ?? "";
        assert.ok((info.extraText ?? "").includes("_".repeat(Math.max(1, sista.length))), `${id}: ${info.extraText}`);
        assert.match(info.extraText ?? "", /delar/);
      }
    }
  }
});
