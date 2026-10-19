// R9: takten för Bengtssons inbjudan, gåtor för alla hemliga djur (utan att avslöja ordet) och stjärnförklaringens siffror.
import assert from "node:assert/strict";
import { test } from "node:test";
import { ordLista } from "../tolk/tolka.ts";
import bengtsson from "../../data/bengtsson.json" with { type: "json" };
import led from "../../data/ledtradar.json" with { type: "json" };
import stj from "../../data/stjarnor.json" with { type: "json" };
import hem from "../../data/hemligt.json" with { type: "json" };
import { TAKT, sekTillRedo } from "./uppdragsmotor.ts";
import { SKRIV } from "./aventyr.ts";

const L = led.ledtradar as Record<string, { gata: string; forsta: string; langd: number }>;

test("takt: första uppdraget efter X djur eller Y sekunder, sedan minst 'mellan' sekunder", () => {
  const T = TAKT;
  assert.ok(T.forsta.efter_djur >= 2 && T.forsta.eller_sekunder >= 120 && T.forsta.eller_sekunder <= 240);
  assert.ok(T.mellan_sekunder >= 60, "minst en minut mellan uppdragen");
  const ingen = {};
  assert.equal(sekTillRedo(ingen, { djur: 0, spelSek: 0, sekSedanKlart: null }), T.forsta.eller_sekunder);
  assert.equal(sekTillRedo(ingen, { djur: T.forsta.efter_djur, spelSek: 1, sekSedanKlart: null }), 0, "efter X djur");
  assert.equal(sekTillRedo(ingen, { djur: 0, spelSek: T.forsta.eller_sekunder, sekSedanKlart: null }), 0, "efter Y sekunder");
  const a = SKRIV[0]!.id;
  assert.equal(sekTillRedo({ [a]: "pagar" }, { djur: 9, spelSek: 999, sekSedanKlart: null }), null, "pågår: ingen ny inbjudan");
  assert.equal(sekTillRedo({ [a]: "klar" }, { djur: 9, spelSek: 999, sekSedanKlart: 5 }), T.mellan_sekunder - 5, "väntar efter klart uppdrag");
  assert.equal(sekTillRedo({ [a]: "klar" }, { djur: 9, spelSek: 999, sekSedanKlart: T.mellan_sekunder }), 0);
  assert.equal(sekTillRedo({ [a]: "klar" }, { djur: 9, spelSek: 999, sekSedanKlart: null }), 0, "uppdrag klart i en tidigare session: redo");
  assert.equal(sekTillRedo(Object.fromEntries(SKRIV.map((u) => [u.id, "klar" as const])), { djur: 9, spelSek: 999, sekSedanKlart: 999 }), null, "inga fler");
  assert.ok(bengtsson.takt.ikon_text.length > 0 && bengtsson.takt.ikon_alt.length > 0);
});

test("alla hemliga djur har en gåta som inte avslöjar ordet", () => {
  const hemliga = ordLista().filter((o) => o.klass === "djur" && o.niva === "fritt");
  assert.ok(hemliga.length >= 100);
  for (const o of hemliga) {
    const l = L[o.id];
    assert.ok(l, `gåta saknas för ${o.id}`);
    assert.equal(l.forsta, o.id[0]!.toUpperCase(), `${o.id}: första bokstaven`);
    assert.equal(l.langd, [...o.id].length, `${o.id}: längd`);
    const g = l.gata.toLowerCase();
    const fonster = o.id.length >= 6 ? Array.from({ length: o.id.length - 5 }, (_, i) => o.id.slice(i, i + 6)) : [o.id];
    assert.ok(!g.includes(o.id) && !fonster.some((f) => g.includes(f)), `${o.id}: gåtan avslöjar ordet: ${l.gata}`);
    assert.ok(l.gata.length >= 10 && l.gata.length <= 110, `${o.id}: gåtans längd`);
  }
});

test("stjärnförklaringen: alla platshållare fylls och texten finns", () => {
  const plats = new Set(stj.ger.flatMap((t) => [...t.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!)));
  assert.deepEqual([...plats].sort(), ["guld", "hemligt", "onskan", "sida", "uppdrag"]);
  assert.ok(stj.gor.includes("Ordboken"));
  for (const k of ["steg", "forklaring", "forslag_etikett", "ledtrad_rubrik", "ny_gata", "hittade"] as const) assert.ok(hem[k].length > 0, k);
});
