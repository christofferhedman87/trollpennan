// P4c: olåst karta och meny. upplast och bytPlats på tom sparning ska förbli låsta.
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import menyJson from "../../data/meny.json" with { type: "json" };
import { useMinne } from "./minne.ts";
import { OLAST_KARTA, kanResaTill, mattUr, upplast } from "./platser.ts";
import { forstaUpplasta } from "./resa.ts";

test("P4c: kanResaTill öppnar alla platser vid 0 skapade djur", () => {
  useMinne.getState().aterstall();
  const s = useMinne.getState();
  const m = mattUr(s);
  assert.equal(s.ang.length + s.sovande.length, 0);
  assert.equal(OLAST_KARTA, true);
  for (const id of ["ang", "skogen", "sjon", "grottan"]) {
    assert.equal(kanResaTill(id, m), true, id);
  }
  assert.equal(kanResaTill("finns-ej", m), false);
  assert.equal(upplast("skogen", m), false);
});

test("P4c: oppnaPlats öppnar grottan medan bytPlats fortfarande låser skogen", () => {
  useMinne.getState().aterstall();
  assert.equal(useMinne.getState().ang.length, 0);
  assert.equal(useMinne.getState().oppnaPlats("grottan"), true);
  assert.equal(useMinne.getState().plats, "grottan");
  assert.ok(useMinne.getState().oppnadePlatser.includes("grottan"));
  useMinne.getState().aterstall();
  assert.equal(useMinne.getState().ang.length, 0);
  assert.equal(useMinne.getState().bytPlats("skogen"), false);
  assert.equal(useMinne.getState().plats, "ang");
  assert.equal(forstaUpplasta(mattUr(useMinne.getState())), null);
  assert.equal(useMinne.getState().oppnaPlats("finns-ej"), false);
});

test("P4c: meny.json öppnar verktygen utan hårdkodat data-last", () => {
  assert.equal(menyJson.oppen.gard, true);
  assert.equal(menyJson.oppen.byggbok, true);
  assert.equal(menyJson.oppen.album, true);
  assert.equal(menyJson.oppen.ordbok, true);
  // Nya Skapa (fas E): hamburgermenyn är borta. Karta ligger uppe till höger; album, ordbok, mark, stall och låda i Min bok.
  const hud = fs.readFileSync("src/spel/ui/Hud.tsx", "utf8");
  const bok = fs.readFileSync("src/spel/ui/MinBok.tsx", "utf8");
  assert.equal(hud.includes('data-last="ja"'), false);
  assert.equal(bok.includes('data-last="ja"'), false);
  assert.equal(hud.includes('data-testid="ut-pa-aventyr"'), true);
  for (const id of ["album", "ordjakten", "guldord", "mark", "stall", "lada"]) assert.match(bok, new RegExp(`id: "${id}"`), id);
});
