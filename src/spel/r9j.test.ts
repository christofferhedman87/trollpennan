// R9J: humöret uppdateras för djur på alla platser (skogen, sjön, grottan) precis som på ängen och gården.
import assert from "node:assert/strict";
import { test } from "node:test";
import type { Sparad } from "./brygga.ts";
import { dagIndex, djurMedUid, tickLiv } from "./liv.ts";
import type { Data } from "./minne.ts";

const djur = (uid: string) => ({ uid, kropp: "kanin", formagor: [], tillbehor: [], skapad: 0 }) as unknown as Sparad;

function lager(platsSkapelser: Record<string, Sparad[]>): Data {
  return {
    dygnMs: 0,
    liv: {},
    ang: [djur("a1")],
    hemma: [],
    platsSkapelser,
    mossaLista: [{ id: "x", klar: false }],
    mossaDag: dagIndex(0),
    mossaExtra: false,
    mossaRakn: { onskan: 0, hemligt: 0, guld: 0 },
  } as unknown as Data;
}

test("R9J: djur i skogen, sjön och grottan får liv och humör av tickLiv", () => {
  const d = lager({ skogen: [djur("s1")], sjon: [djur("j1"), djur("j2")], grottan: [djur("g1")], ny_plats: [djur("n1")] });
  const ut = tickLiv(d, 1000);
  for (const uid of ["a1", "s1", "j1", "j2", "g1", "n1"]) assert.ok(ut.liv?.[uid]?.humor, `${uid} saknar humör`);
});

test("R9J: humöret byts på en plats när tiden gått, och 'sugen' kan uppstå där", () => {
  let sugen = false;
  let byten = 0;
  for (let i = 0; i < 400 && !sugen; i++) {
    const d = lager({ grottan: [djur("g1")] });
    const forsta = tickLiv(d, 1000);
    const har = forsta.liv!.g1!;
    const andra = tickLiv({ ...d, ...forsta } as Data, har.humorLangd + 1000);
    if (andra.liv!.g1!.humorMs !== har.humorMs) byten++;
    if (andra.liv!.g1!.humor === "sugen" || har.humor === "sugen") sugen = true;
  }
  assert.ok(byten > 0, "humöret byts aldrig i grottan");
  assert.ok(sugen, "sugen uppstod aldrig i grottan på 400 försök");
});

test("R9J: ett tryck på ett djur på en plats hittar djuret (humörreplik och gåvoinbjudan)", () => {
  const d = lager({ grottan: [djur("g1")] });
  assert.equal(djurMedUid(d, "g1")?.uid, "g1");
  assert.equal(djurMedUid(d, "a1")?.uid, "a1");
  assert.equal(djurMedUid(d, "finns-inte"), undefined);
});
