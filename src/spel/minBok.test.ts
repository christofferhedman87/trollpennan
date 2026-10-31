// T-22: Min boks rutor och Ordboken räknar samma ord, och Lådan har text även när den är tom.
import assert from "node:assert/strict";
import { test } from "node:test";
import uiJson from "../../data/skapa-ui.json" with { type: "json" };
import gardJson from "../../data/texter-gard.json" with { type: "json" };
import { ordLista } from "../tolk/tolka.ts";
import { raknaOrd } from "./ui/ordRakning.ts";

test("T-22: skrivord och guldord räknas som rutorna i Min bok och listas med sina ord", () => {
  const lista = ordLista();
  const fritt = lista.filter((o) => o.niva === "fritt");
  const kort = lista.find((o) => o.niva !== "fritt")!;
  assert.ok(fritt.length >= 3 && kort);
  const funna = { [fritt[0]!.id]: { guld: true }, [fritt[1]!.id]: { guld: false }, [kort.id]: { guld: true } };
  const r = raknaOrd(funna, lista);
  assert.deepEqual(r.skrivord, [fritt[0]!.visa, fritt[1]!.visa]);
  assert.equal(r.skrivordKvar, fritt.length - 2);
  assert.deepEqual([...r.guldord].sort(), [fritt[0]!.visa, kort.visa].sort());
  assert.deepEqual(raknaOrd({}, lista), { skrivord: [], skrivordKvar: fritt.length, guldord: [] });
});

test("T-22: Ordbokens delar och den tomma Lådan har barntexter i data", () => {
  const t = (uiJson as unknown as { ordbok: Record<string, string> }).ordbok;
  for (const k of ["rubrik", "ordjakten_rubrik", "ordjakten_text", "ordjakten_tom", "guldord_rubrik", "guldord_text", "guldord_tom"]) assert.ok(t[k]?.trim(), k);
  assert.match(t.ordjakten_text!, /\{n\}.*\{kvar\}/);
  assert.match(t.guldord_text!, /\{n\}/);
  const lada = (gardJson as unknown as { lada: Record<string, string> }).lada;
  for (const k of ["rubrik", "tom", "tom_hjalp", "stang"]) assert.ok(lada[k]?.trim(), k);
});
