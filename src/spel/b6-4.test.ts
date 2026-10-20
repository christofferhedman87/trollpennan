// B6.4: utan färgord visar GLB-kroppen modellens egna färger (ingen palett, inget farg-/ljus-material, ingen glans över kroppen).
// Med färgord gäller samma som före B6.4 (färgfrågan R9C är pausad).
import assert from "node:assert/strict";
import { test } from "node:test";
import { fargning } from "./fargning.ts";

const ljusare = (h: string) => `ljus(${h})`;
const ingen = { farg: null, palettByte: false, glans: false };

test("B6.4: utan färgord rörs inget material – inte heller med guldordets glans", () => {
  for (const roll of [undefined, "farg", "ljus"]) {
    for (const harRoller of [false, true]) {
      for (const harPalett of [false, true]) {
        for (const glans of [false, true]) {
          assert.deepEqual(fargning({ hex: null, roll, harRoller, harPalett, harKarta: true, glans, ljusare }), ingen, `${roll} ${harRoller} ${harPalett} ${glans}`);
        }
      }
    }
  }
});

test("B6.4: med färgord samma som förut (palettbyte, farg/ljus-material, glans)", () => {
  const hex = "#1E88E5";
  assert.deepEqual(fargning({ hex, harRoller: false, harPalett: true, harKarta: true, glans: true, ljusare }), { farg: null, palettByte: true, glans: true });
  assert.deepEqual(fargning({ hex, harRoller: false, harPalett: true, harKarta: false, glans: false, ljusare }), { farg: null, palettByte: false, glans: false });
  assert.deepEqual(fargning({ hex, harRoller: false, harPalett: false, harKarta: true, glans: true, ljusare }), ingen);
  assert.deepEqual(fargning({ hex, roll: "farg", harRoller: true, harPalett: false, harKarta: false, glans: true, ljusare }), { farg: hex, palettByte: false, glans: true });
  assert.deepEqual(fargning({ hex, roll: "ljus", harRoller: true, harPalett: false, harKarta: false, glans: true, ljusare }), { farg: `ljus(${hex})`, palettByte: false, glans: false });
  assert.deepEqual(fargning({ hex, roll: undefined, harRoller: true, harPalett: true, harKarta: true, glans: true, ljusare }), ingen);
});
