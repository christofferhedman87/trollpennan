// P2-2: titelskärmen (förslag A) – när den visas, "Börja om med en ny värld" med ångra inom sessionen, texterna i data.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ANGRA_NYCKEL, PROV_NYCKEL, angraBorjaOm, borjaOmMedKopia, harKopia, spelNycklar, sessionLagring, visaTitelVidStart } from "./start.ts";
import { FORSTA } from "./forstaStunden.ts";
import introJson from "../../data/intro.json" with { type: "json" };

class Minne implements Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length"> {
  m = new Map<string, string>();
  tak = Infinity;
  get length() {
    return this.m.size;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    if (v.length > this.tak) throw new Error("QuotaExceededError");
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

const varld = () => {
  const l = new Minne();
  l.setItem("trollpennan-spel", JSON.stringify({ introSedd: true, ang: [{ uid: "a1", formel: "en katt" }] }));
  l.setItem("trollpennan-ljud", "på");
  l.setItem("annat", "rör inte");
  return l;
};

test("P2-2: titelskärmen visas för barn och vid nekad lagring, i vanliga prov bara med flagga", () => {
  assert.equal(visaTitelVidStart(false, null), true);
  assert.equal(visaTitelVidStart(true, null), true, "nekad lagring visar den riktiga titeln");
  const s = new Minne();
  assert.equal(visaTitelVidStart(true, s), false);
  s.setItem(PROV_NYCKEL, "1");
  assert.equal(visaTitelVidStart(true, s), true);
});

test("start: nekad sessionsgetter och nekad läsning kraschar inte eller hoppar över titeln", () => {
  const nekad = { get sessionStorage(): Storage { throw new Error("SecurityError"); } };
  const session = sessionLagring(() => nekad.sessionStorage);
  assert.equal(session, null);
  assert.equal(visaTitelVidStart(false, session), true);
  assert.equal(visaTitelVidStart(true, session), true);
  assert.equal(harKopia(session), false);
  assert.equal(visaTitelVidStart(true, { getItem() { throw new Error("SecurityError"); } }), true);
  assert.equal(harKopia({ getItem() { throw new Error("SecurityError"); } }), false);
});

test("P2-2: börja om tömmer bara spelets nycklar och sparar en kopia i sessionen", () => {
  const l = varld();
  const s = new Minne();
  assert.deepEqual(spelNycklar(l).sort(), ["trollpennan-ljud", "trollpennan-spel"]);
  assert.equal(borjaOmMedKopia(l, s), true);
  assert.deepEqual(spelNycklar(l), []);
  assert.equal(l.getItem("annat"), "rör inte");
  assert.equal(harKopia(s), true);
});

test("P2-2: ångra lägger tillbaka den gamla världen exakt och tar bort kopian", () => {
  const l = varld();
  const fore = l.getItem("trollpennan-spel");
  const s = new Minne();
  borjaOmMedKopia(l, s);
  l.setItem("trollpennan-spel", JSON.stringify({ introSedd: true, ang: [] }));
  assert.equal(angraBorjaOm(l, s), true);
  assert.equal(l.getItem("trollpennan-spel"), fore);
  assert.equal(l.getItem("trollpennan-ljud"), "på");
  assert.equal(harKopia(s), false);
  assert.equal(angraBorjaOm(l, s), false);
});

test("P2-2: får kopian inte plats börjar spelet ändå om (ingen ångra-knapp)", () => {
  const l = varld();
  const s = new Minne();
  s.tak = 10;
  assert.equal(borjaOmMedKopia(l, s), false);
  assert.deepEqual(spelNycklar(l), []);
  assert.equal(harKopia(s), false);
  assert.equal(borjaOmMedKopia(varld(), null), false);
});

test("P2-2: titelns texter ligger i data och är som Christoffer bestämde", () => {
  const t = FORSTA.titel;
  assert.equal(t.borja_om, "Börja om med en ny värld");
  assert.equal(t.fraga, "Din värld med alla djur försvinner. Är du säker?");
  assert.equal(t.nej, "Nej, tillbaka");
  assert.equal(t.ja, "Ja, börja om");
  for (const [k, v] of Object.entries(t)) if (!k.startsWith("_")) assert.ok(typeof v === "string" && v.length > 0, k);
  assert.equal(new Minne().getItem(ANGRA_NYCKEL), null);
});

test("P2-2: ljudraden k – a – tt stavar ordet", () => {
  const s = introJson.skriv as { ord: string; ljud?: string[] };
  assert.equal(s.ljud?.join(""), s.ord);
});
