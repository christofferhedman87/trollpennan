// R6A: textbevis att de riktiga flödesfunktionerna (avflode.ts) ger Bengtssons texter. Ingen webbläsare.
// Användning: node --experimental-strip-types rundor/R6A-bengtsson/flode-prov.ts   (exit 0 = allt stämde)
import assert from "node:assert/strict";
import { klarUppdrag, lasSkylt } from "../../src/spel/avflode.ts";
import { UPP, uppdragFor } from "../../src/spel/aventyr.ts";

const lapp = lasSkylt("skogen-2");
const klar = klarUppdrag("hitta-kotte");
const u = uppdragFor("hitta-kotte")!;
assert.equal(lapp.nytt, `Nytt uppdrag från Doktor Bengtsson: ${u.text_bengtsson}`);
assert.deepEqual(klar.texter.slice(0, 2), [UPP.texter.klart, u.klart_bengtsson]);
assert.equal(klar.stj, u.stjarnor);
assert.equal(lapp.text.endsWith("/Ekorren"), true, "lappens egen text (djurets) ska vara orörd");
console.log(JSON.stringify({ lapp, klar }, null, 1));
