// B6.4: utan färgord visar GLB-kroppen modellens egna färger (ingen palett, inget farg-/ljus-material, ingen glans över kroppen).
// Med färgord: R8-3a (r8-3a.test.ts).
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

// R8-3a: "med färgord samma som förut" gällde medan R9C var pausad. Nu färgas hela kroppen; se r8-3a.test.ts.
