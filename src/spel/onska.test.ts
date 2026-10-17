import assert from "node:assert/strict";
import test from "node:test";
import { tolka } from "../tolk/tolka.ts";
import { tolkaBygg } from "../tolk/byggtolk.ts";
import { byggTraff, geTraff, kompisTraff, laggPa, ONSK, ONSK_BYGG } from "./onska.ts";
import type { Varelse } from "../tolk/typer.ts";

function katt(): Varelse {
  const u = tolka("katt");
  if (u.typ !== "skapad") throw new Error("katt");
  return u.varelse;
}

test("varje bygg-exempel uppfyller sin önskan", () => {
  for (const o of ONSK_BYGG.onskningar) {
    for (const ex of o.exempel) {
      const u = tolkaBygg(ex);
      assert.equal(u.typ, "bygge", `${o.id}: ${ex}`);
      if (u.typ !== "bygge") continue;
      const kropp = o.krav.hem_for_djuret ? "katt" : o.krav.bara_for?.[0];
      assert.ok(byggTraff(u.byggen, o, kropp), `${o.id} exempel "${ex}"`);
    }
  }
});

test("varje djur-exempel uppfyller sin önskan", () => {
  const bas = katt();
  for (const o of ONSK.onskningar) {
    for (const ex of o.exempel) {
      if (o.typ === "ge") {
        const efter = laggPa(bas, ex);
        assert.ok(efter, `${o.id} gick inte att lägga ${ex}`);
        if (!efter) continue;
        assert.ok(geTraff(bas, efter, o), `${o.id} exempel "${ex}"`);
      } else {
        const u = tolka(ex);
        assert.equal(u.typ, "skapad", ex);
        if (u.typ !== "skapad") continue;
        assert.ok(kompisTraff(u.varelse, o), `${o.id} exempel "${ex}"`);
      }
    }
  }
});
