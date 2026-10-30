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
  l.setItem("trollpennan-spel", JSON.stringify({ introSedd: true, ang: [], stjarnor: 17 }));
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
  const nekadLokal = new Minne(); nekadLokal.getItem = () => { throw new Error("SecurityError"); };
  assert.equal(harKopia(nekadLokal), false);
});

test("T-13: börja om bevarar beständig kopia, och återställning konsumerar inte arkivet", () => {
  const l = varld();
  const fore = l.getItem("trollpennan-spel");
  assert.deepEqual(spelNycklar(l).sort(), ["trollpennan-ljud", "trollpennan-spel"]);
  assert.equal(borjaOmMedKopia(l, null), true);
  assert.deepEqual(spelNycklar(l), []);
  assert.equal(l.getItem("annat"), "rör inte");
  assert.equal(harKopia(l), true);
  l.setItem("trollpennan-spel", JSON.stringify({ introSedd: true, ang: [] }));
  assert.equal(angraBorjaOm(l), true);
  assert.equal(l.getItem("trollpennan-spel"), fore);
  assert.equal(l.getItem("trollpennan-ljud"), "på");
  assert.equal(harKopia(l), true);
});

test("T-13: får arkivet inte plats börjar spelet inte om", () => {
  const l = varld();
  const fore = [...l.m];
  l.tak = 10;
  assert.equal(borjaOmMedKopia(l, null), false);
  assert.deepEqual([...l.m], fore);
  assert.equal(harKopia(l), false);
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
