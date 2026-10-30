import { test } from "node:test";
import assert from "node:assert/strict";
import { borjaOmMedKopia, harKopia } from "./start.ts";
class Minne {
  m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}
test("T-13: återställning kräver en beständig kopia, inte sessionsminne", () => {
  const lokal = new Minne(); lokal.setItem("trollpennan-v2", '{"version":2,"stjarnor":17}');
  assert.equal(borjaOmMedKopia(lokal, null), true);
  assert.equal(harKopia(lokal), true);
});
test("T-13: om arkivet nekas får världen inte raderas", () => {
  const lokal = new Minne(); const raw = '{"version":2,"stjarnor":17}'; lokal.setItem("trollpennan-v2", raw);
  lokal.setItem = () => { throw new Error("QuotaExceededError"); };
  assert.equal(borjaOmMedKopia(lokal, null), false);
  assert.equal(lokal.getItem("trollpennan-v2"), raw);
});

import { ARKIV_PREFIX, arkivera, aterstallArkiv, listaArkiv } from "./arkiv.ts";
test("T-13: minst 30 dagar, dubbla återställningar och sidonycklar bevaras", () => {
  const l = new Minne();
  const fore = '{"version":2,"stjarnor":17,"dal":{"utbyggnader":["backen"]}}';
  l.setItem("trollpennan-v2", fore); l.setItem("trollpennan-skapa-v1", '{"bokstavsljud":false}'); l.setItem("annat", "rör inte");
  const gammal = arkivera(l, Date.now() - 40 * 86400000); assert.ok(gammal);
  assert.equal(borjaOmMedKopia(l), true);
  assert.equal(listaArkiv(l).length, 2);
  const ny = '{"version":2,"stjarnor":99}'; l.setItem("trollpennan-v2", ny);
  assert.equal(aterstallArkiv(l, gammal.nyckel), true);
  assert.equal(l.getItem("trollpennan-v2"), fore);
  assert.equal(l.getItem("trollpennan-skapa-v1"), '{"bokstavsljud":false}');
  const senare = listaArkiv(l).find((x) => x.data["trollpennan-v2"] === ny); assert.ok(senare);
  assert.equal(aterstallArkiv(l, senare.nyckel), true);
  assert.equal(l.getItem("trollpennan-v2"), ny);
  assert.equal(l.getItem("trollpennan-skapa-v1"), null);
  assert.equal(l.getItem("annat"), "rör inte");
  assert.ok(l.getItem(gammal.nyckel), "gammal kopia konsumeras aldrig");
  assert.ok(listaArkiv(l).every((x) => Object.keys(x.data).every((k) => !k.startsWith(ARKIV_PREFIX))), "inga nästlade arkiv");
});
test("T-13: skadat eller främmande arkiv ändrar ingenting", () => {
  const l = new Minne(); l.setItem("trollpennan-v2", '{"version":2}');
  for (const data of [null, [], { annat: "fel" }, { "trollpennan-v2": {} }, { [`${ARKIV_PREFIX}x`]: "fel" }]) {
    const k = `${ARKIV_PREFIX}fel`; l.setItem(k, JSON.stringify({ version: 1, tid: Date.now(), data }));
    const fore = [...l.m]; assert.equal(aterstallArkiv(l, k), false); assert.deepEqual([...l.m], fore);
  }
});
test("T-13: läsfel före arkivering och skrivfel vid import lämnar världen och arkiven kvar", () => {
  const l = new Minne(); const raw = '{"version":2,"stjarnor":17}'; l.setItem("trollpennan-v2", raw);
  const k = arkivera(l); assert.ok(k);
  const ny = '{"version":2,"stjarnor":21}'; l.setItem("trollpennan-v2", ny);
  const skriv = l.setItem.bind(l); let neka = true;
  l.setItem = (namn, v) => { if (namn === "trollpennan-v2" && neka) { neka = false; throw new Error("quota"); } skriv(namn, v); };
  assert.equal(aterstallArkiv(l, k.nyckel), false); assert.equal(l.getItem("trollpennan-v2"), ny); assert.ok(l.getItem(k.nyckel));
  l.getItem = () => { throw new Error("SecurityError"); };
  assert.equal(borjaOmMedKopia(l), false);
});

test("T-13: trasig JSON, felaktig dal och ogiltiga djur i råvärlden avvisas utan mutation", () => {
  const l = new Minne(); l.setItem("trollpennan-v2", '{"version":2,"stjarnor":17}');
  for (const raw of ['{', '{"version":2,"dal":{"utbyggnader":"ogiltig"}}', '{"version":2,"ang":[{"uid":"trasig"}]}', '{"version":99}', 'null']) {
    const k = `${ARKIV_PREFIX}trasig`; l.setItem(k, JSON.stringify({ version: 1, tid: Date.now(), data: { "trollpennan-v2": raw } }));
    const fore = [...l.m]; assert.equal(aterstallArkiv(l, k), false); assert.deepEqual([...l.m], fore);
  }
});
