// R6A: alla uppdrag ges av Doktor Bengtsson. Målen och reglerna är oförändrade; originaltexterna rörs inte.
import assert from "node:assert/strict";
import { test } from "node:test";
import { NPC, OMR, SKATTER, UPP, nyttUppdragRad, uppdragKlart, uppdragText, type Uppdrag } from "./aventyr.ts";

/** Ögonblicksbild av uppdrag.json före R6A (mål, regler och de ursprungliga, granskade texterna). */
const FORE: Record<string, { omrade: string; typ: string; mal: unknown; stjarnor: number; skatt: string | null; text: string; klart: string }> = {
 "hitta-kotte": {
  "omrade": "skogen",
  "typ": "hitta",
  "mal": {
   "tryck": "silverkotte",
   "gomd_vid": "svamparna"
  },
  "stjarnor": 2,
  "skatt": "silverkotte",
  "text": "Hitta Ekorrens silverkotte bland svamparna.",
  "klart": "Min kotte! Tack, nu kan jag sova gott i natt. /Ekorren"
 },
 "mossugglan": {
  "omrade": "skogen",
  "typ": "van",
  "mal": {
   "van": "mossugglan"
  },
  "stjarnor": 3,
  "skatt": null,
  "text": "Väck Mossugglan med något blått och bli hennes vän.",
  "klart": "Hu-hu! Jag har aldrig haft en vän som dig."
 },
 "svampring": {
  "omrade": "skogen",
  "typ": "skicka",
  "mal": {
   "skicka_tagg": "hoppa",
   "plats": "svampringen"
  },
  "stjarnor": 2,
  "skatt": "fyrklöver",
  "text": "Någon har lagt svampar i en ring. Det sägs att den som hoppar i ringen får tur. Skicka dit ett djur som kan hoppa!",
  "klart": "Boing, boing! Det känns som tur!"
 },
 "bavern": {
  "omrade": "sjon",
  "typ": "ge",
  "mal": {
   "van": "gamla-bavern"
  },
  "stjarnor": 3,
  "skatt": null,
  "text": "Ge Gamla bävern pinnar eller löv till hans nya damm.",
  "klart": "Dammen är klar! Kom och bada när du vill."
 },
 "parlhajen": {
  "omrade": "sjon",
  "typ": "van",
  "mal": {
   "van": "parlhajen"
  },
  "stjarnor": 3,
  "skatt": "parla",
  "text": "Bli vän med Pärlhajen vid bryggan.",
  "klart": "Jag simmar runt och visar alla min nya vän!"
 },
 "fyren": {
  "omrade": "sjon",
  "typ": "skicka",
  "mal": {
   "skicka_tagg": "lysa",
   "plats": "on"
  },
  "stjarnor": 3,
  "skatt": "fyrlampa",
  "text": "Fyren på ön har slocknat. Ta med ett djur som lyser ut till ön.",
  "klart": "Fyren lyser igen! Nu hittar båtarna hem."
 },
 "vindhasten": {
  "omrade": "sjon",
  "typ": "van",
  "mal": {
   "van": "vindhasten"
  },
  "stjarnor": 4,
  "skatt": null,
  "text": "Någon stor och vit har landat på ön. Vad tycker hästar om att äta?",
  "klart": "Vill du flyga en sväng någon gång? Säg bara till!"
 },
 "kristallgrodan": {
  "omrade": "grottan",
  "typ": "van",
  "mal": {
   "van": "kristallgrodan"
  },
  "stjarnor": 3,
  "skatt": "kristall",
  "text": "Få Kristallgrodan att sjunga.",
  "klart": "Kvack-la-la-la! Det ekar så fint i grottan."
 },
 "nattdraken": {
  "omrade": "grottan",
  "typ": "van",
  "mal": {
   "van": "nattdraken"
  },
  "stjarnor": 4,
  "skatt": null,
  "text": "Bli vän med Nattdraken längst in i grottan.",
  "klart": "Jag har väntat så länge på en vän. Tack för att du kom."
 },
 "skatten": {
  "omrade": "grottan",
  "typ": "hitta",
  "mal": {
   "tryck": "skattkista",
   "gomd_vid": "lila kristaller"
  },
  "stjarnor": 3,
  "skatt": "skattkista",
  "text": "Hitta skattkistan där kristallerna är lila.",
  "klart": "Skattkistan är full av guldmynt och en gammal karta!"
 }
};

test("samma tio uppdrag, samma mål och regler, ursprungstexterna orörda", () => {
  assert.deepEqual(UPP.uppdrag.map((u) => u.id).sort(), Object.keys(FORE).sort());
  for (const u of UPP.uppdrag) {
    const f = FORE[u.id]!;
    for (const k of ["omrade", "typ", "mal", "stjarnor", "skatt", "text", "klart"] as const) {
      assert.deepEqual(u[k], f[k], `${u.id}.${k} ändrades`);
    }
  }
});

test("varje uppdrag har Bengtsson som givare och ett utkast som inte är granskat", () => {
  assert.ok(NPC.bengtsson);
  assert.equal(NPC.bengtsson!.granskad, false);
  for (const u of UPP.uppdrag) {
    assert.equal(u.givare, "bengtsson", u.id);
    assert.ok(u.text_bengtsson && u.klart_bengtsson, `${u.id} saknar text`);
    assert.equal(u.granskad, false, `${u.id} får inte vara markerat granskat förrän Copilot granskat`);
    assert.notEqual(u.text_bengtsson, u.text);
    assert.notEqual(u.klart_bengtsson, u.klart);
  }
});

test("utkasten är korta och bär den ledtråd som uppdraget kräver", () => {
  const ledtrad: Record<string, RegExp> = {
    "hitta-kotte": /svamp/i,
    mossugglan: /blått/i,
    svampring: /hoppa/i,
    bavern: /pinnar/i,
    parlhajen: /vän/i,
    fyren: /lysa/i,
    vindhasten: /häst/i,
    kristallgrodan: /sjunga/i,
    nattdraken: /vän/i,
    skatten: /lila/i,
  };
  for (const u of UPP.uppdrag) {
    assert.ok(u.text_bengtsson!.length <= 130, `${u.id}: för lång (${u.text_bengtsson!.length})`);
    assert.ok(u.klart_bengtsson!.length <= 100, `${u.id}: klart för långt`);
    assert.match(u.text_bengtsson!, ledtrad[u.id]!, `${u.id}: ledtråden saknas`);
    assert.doesNotMatch(u.text_bengtsson! + u.klart_bengtsson!, /\/[A-ZÅÄÖ]/, `${u.id}: signatur av ett djur`);
  }
});

test("texthjälparna: Bengtssons text när givare finns, annars den ursprungliga", () => {
  const u = UPP.uppdrag[0]!;
  assert.equal(uppdragText(u), u.text_bengtsson);
  assert.equal(uppdragKlart(u), u.klart_bengtsson);
  const gammal: Uppdrag = { ...u, givare: undefined };
  assert.equal(uppdragText(gammal), u.text);
  assert.equal(uppdragKlart(gammal), u.klart);
  assert.equal(nyttUppdragRad(gammal), UPP.texter.nytt.replace("{text}", u.text));
  assert.equal(nyttUppdragRad(u), `Nytt uppdrag från ${NPC.bengtsson!.namn}: ${u.text_bengtsson}`);
});

test("varje område och skatt som uppdragen pekar på finns", () => {
  for (const u of UPP.uppdrag) {
    assert.ok(OMR.omraden.some((o) => o.id === u.omrade), `${u.id}: område ${u.omrade}`);
    if (u.skatt) assert.ok(SKATTER.skatter.some((s) => s.id === u.skatt), `${u.id}: skatt ${u.skatt}`);
  }
});
