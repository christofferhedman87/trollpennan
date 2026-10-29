// Block 3 (formsystemet): ritplanen ur byggformeln – formens modell, storlek, delar och egenskaper.
import assert from "node:assert/strict";
import test from "node:test";
import { tolkaByggFormel } from "../../tolk/byggform.ts";
import { franTolk } from "../bygge.ts";
import { MODULER, modulPlatser, ritplan } from "./ritplan.ts";

function plan(fras: string) {
  const u = tolkaByggFormel(fras);
  assert.equal(u.typ, "bygge", fras);
  if (u.typ !== "bygge") throw new Error(fras);
  return ritplan(franTolk(u.byggen[0]!, u.formel, 0.5, 0.5));
}

test("Block 3: formen väljer stommens modell – byggord, djur och sak", () => {
  const slott = plan("ett stall som ser ut som ett slott");
  assert.match(slott.url ?? "", /slott/);
  assert.equal(slott.arForm, false, "ett slott är en byggnad, dörr finns i modellen");
  const ko = plan("en lada formad som en ko");
  assert.match(ko.url ?? "", /ko/);
  assert.equal(ko.arForm, true);
  assert.equal(ko.djurhem, true, "ladan är ett djurhem: hö vid dörren");
  const apple = plan("ett hus som ser ut som ett äpple");
  assert.ok(apple.url, "äpplet har en modell");
  assert.ok(apple.arForm);
  const vanligt = plan("ett hus");
  assert.equal(vanligt.arForm, false);
  assert.ok(ko.malhojd > vanligt.malhojd, "en form är lite större än ett vanligt hus, så att den syns");
});

test("Block 3: delar blir moduler, egenskaper och material följer med", () => {
  const p = plan("ett flygande hus av moln med två torn och en flagga");
  assert.deepEqual(p.moduler.map((m) => [m.id, m.antal]), [["torn", 2], ["flagga", 1]]);
  assert.ok(p.svavar);
  assert.equal(p.material?.id, "moln");
  assert.ok(plan("ett hus med vingar").svavar, "vingar lyfter huset");
  assert.ok(plan("ett hus som är upp och ner").egenskaper.has("upp_och_ner"));
  assert.equal(plan("ett stort hus").storlek > 1, true);
  assert.equal(plan("ett litet hus").storlek < 1, true);
});

test("Block 3: modulerna sitter på stommen – torn i hörnen, flaggor på taket, hjul vid marken, trappa framför", () => {
  const [w, h, d] = [1.6, 1.4, 1.2];
  for (const id of MODULER) {
    for (const [x, y, z] of modulPlatser(id, 3, w, h, d)) {
      assert.ok(Math.abs(x) <= w / 2 + 0.01, `${id} x`);
      assert.ok(y >= 0 && y <= h + 0.01, `${id} y`);
      assert.ok(Math.abs(z) <= d / 2 + 0.3, `${id} z`);
    }
  }
  assert.equal(modulPlatser("torn", 9, w, h, d).length, 4, "högst fyra torn");
  assert.ok(modulPlatser("flagga", 1, w, h, d)[0]![1] === h, "flaggan på taket");
  assert.ok(modulPlatser("hjul", 2, w, h, d).every((p) => p[1] === 0), "hjulen vid marken");
  assert.ok(modulPlatser("trappa", 1, w, h, d)[0]![2] > d / 2, "trappan framför dörren");
});
