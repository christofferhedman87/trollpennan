// R-A (röstinspelningar 2026-10-31): Bengtssons kända uppdragsrepliker (uppdrag, tack, andra djur-varianter och nästan),
// byggönskningarna och uppdragens hjälpfraser ska spelas som EN hel inspelning med rätt talare – inte tyst, inte ihopsatt av
// främmande klipp och inte ersatt av en annan replik. Granskad-flaggorna ändras inte här.
// Avgränsning: R-A spelade in de 76 texterna i roster-1031/texter-R-A.txt. De 24 hjälpfraser som står i R_C_HJALP nedan har
// ännu ingen inspelning (block R-C); provet kräver att det är exakt de som saknas, så att varken ett nytt glapp eller en
// färdig R-C-fras kan passera tyst.
import assert from "node:assert/strict";
import { test } from "node:test";
import bengtssonJson from "../../data/bengtsson.json" with { type: "json" };
import byggJson from "../../data/onskningar-bygg.json" with { type: "json" };
import manifestJson from "../../data/rost-manifest.json" with { type: "json" };
import platserJson from "../../data/platser.json" with { type: "json" };
import rostJson from "../../data/rost.json" with { type: "json" };
import { sammanhallenRostText } from "./rost.ts";
import { normalisera, nyckel, rostPlan } from "./rostManifest.ts";

type Variant = { text: string; granskad: boolean };
type U = { id: string; givare?: string; text_bengtsson?: string; klart_bengtsson?: string; nastan?: string; hjalp?: string[]; text_bengtsson_annat_djur?: Variant; klart_bengtsson_annat_djur?: Variant };
const UPPDRAG = (bengtssonJson as unknown as { uppdrag: U[] }).uppdrag;
const RADER = (manifestJson as unknown as { rader: Record<string, { f: string; r: string }> }).rader;
const VANTAR = new Set(((rostJson as { vantar_rost?: string[] }).vantar_rost ?? []).map(normalisera));

const HJALPFRASER = [...new Set(UPPDRAG.flatMap((u) => u.hjalp ?? []))];

/** Block R-C: hjälpfraser utan inspelning efter R-A (står i vantar_rost). Ta bort härifrån när R-C har spelat in dem. */
const R_C_HJALP = [
  "en kanin som lyser", "en hund som flyger", "en katt med vingar", "en kanin med halsduk", "en kanin med en ficklampa",
  "en katt vid en lampa", "en röd kanin och en blå häst", "en jättestor kanin och en pytteliten häst",
  "en varm tröja och en kall glass", "en hund med tröja och en glass", "en filt och en snöhög", "en liten uggla",
  "en katt på en sten", "en räv med en lykta", "en hund med en lampa", "en jättestor anka", "en stor gås",
  "en röd fisk och en blå katt", "en röd anka och en blå kanin", "en röd groda och en blå gås", "en hund med en ficklampa",
  "en grön groda och en gul mus", "en grön kanin och en gul katt", "en grön hund och en gul kanin",
];

/** R-A-rader som har en inspelning men som maskinkontrollen inte godkände (whisper eller ljudnivå, se docs/codex/beslut.md).
 *  De står kvar i vantar_rost tills en människa har lyssnat eller ett nytt försök har klarat kontrollen. */
const R_A_EJ_GODKANDA = [
  "Ditt djur vill se bättre i kvällsmörkret! Kan du ge det en lampa?", // whisper hör "ge dig"
  "Din skapelse får stanna! Jag letar efter en liten vän, som en pytteliten igelkott.", // hårt g i igelkott, −18,8 LUFS
  "en hund med halsduk", // whisper hör "hälsduk" (som i den befintliga "med halsduk")
  "Så skönt! Nu kan öronen sluta huttra.", // −20,9 LUFS
  "Så skönt! Nu kan ditt djur sluta huttra.", // −22,7 LUFS
  "Skapa två skogsvänner: en stor och en liten!", // −21,0 LUFS
];

function rader(): { kalla: string; t: string; talare: string }[] {
  const ut: { kalla: string; t: string; talare: string }[] = [];
  for (const u of UPPDRAG) {
    if (u.givare !== "bengtsson") continue;
    const lagg = (falt: string, t?: string) => t && ut.push({ kalla: `${u.id}.${falt}`, t, talare: "bengtsson" });
    lagg("text_bengtsson", u.text_bengtsson);
    lagg("klart_bengtsson", u.klart_bengtsson);
    lagg("text_bengtsson_annat_djur", u.text_bengtsson_annat_djur?.text);
    lagg("klart_bengtsson_annat_djur", u.klart_bengtsson_annat_djur?.text);
    lagg("nastan", u.nastan);
  }
  for (const o of (byggJson as unknown as { onskningar: { id: string; text: string; tack: string }[] }).onskningar) {
    ut.push({ kalla: `bygg:${o.id}.text`, t: o.text, talare: "pennan" }, { kalla: `bygg:${o.id}.tack`, t: o.tack, talare: "pennan" });
  }
  for (const h of HJALPFRASER) ut.push({ kalla: `hjalp:${h}`, t: h, talare: "pennan" });
  // #310: den rättade formeln (entiteter.json) – ett värde, läses av pennan.
  ut.push({ kalla: "formel:klippblock", t: "ett klippblock", talare: "pennan" });
  return ut;
}

test("R-A: varje känd uppdragsreplik, byggönskan och hjälpfras spelas som en hel inspelning med rätt talare (utom R-C:s 24 hjälpfraser)", () => {
  const fel: string[] = [];
  for (const { kalla, t, talare } of rader()) {
    if (R_C_HJALP.includes(t)) continue;
    const k = nyckel(t);
    const rad = RADER[k];
    const plan = rostPlan(sammanhallenRostText(t));
    if (!rad) fel.push(`${kalla}: ingen inspelning – "${t}"`);
    else if (rad.r !== talare) fel.push(`${kalla}: talare ${rad.r}, väntat ${talare} – "${t}"`);
    else if (!plan || plan.delar.length !== 1 || !("f" in plan.delar[0]!) || plan.delar[0].f !== rad.f) {
      fel.push(`${kalla}: spelas inte som sin hela fil (${plan ? `${plan.delar.length} delar` : "tyst"}) – "${t}"`);
    }
  }
  assert.deepEqual(fel, [], `${fel.length} R-A-repliker saknar hel inspelning`);
});

test("R-C: exakt de 24 listade hjälpfraserna saknar inspelning, och alla står i vantar_rost", () => {
  const saknas = HJALPFRASER.filter((h) => !RADER[nyckel(h)]);
  assert.deepEqual([...saknas].sort(), [...R_C_HJALP].sort());
  assert.deepEqual(R_C_HJALP.filter((h) => !VANTAR.has(normalisera(h))), []);
});

test("R-A: inga R-A-texter står kvar i vantar_rost när de har en hel inspelning, utom de uttryckligen ej godkända", () => {
  const kvar = rader().filter(({ t }) => VANTAR.has(normalisera(t)) && RADER[nyckel(t)]).map(({ t }) => t);
  assert.deepEqual([...new Set(kvar)].sort(), [...R_A_EJ_GODKANDA].sort());
});

test("R-A: kanin-fryser:s varianter för andra djur förblir granskad:false", () => {
  const u = UPPDRAG.find((x) => x.id === "kanin-fryser")!;
  assert.equal(u.text_bengtsson_annat_djur?.granskad, false);
  assert.equal(u.klart_bengtsson_annat_djur?.granskad, false);
});

test("R-A: nästan (bengtsson) och hjälpfraser (pennan) är egna generatorkällor, bara fasta fält i bengtsson.json", () => {
  type Kalla = { fil?: string; talare?: string; falt?: string[] };
  const lista = (rostJson as unknown as { kallor: { lista: Kalla[] } }).kallor.lista;
  const hitta = (re: string) => lista.filter((k) => k.falt?.includes(re)).map((k) => `${k.fil}:${k.talare}`);
  assert.deepEqual(hitta("^\\.uppdrag\\[\\]\\.nastan$"), ["bengtsson.json:bengtsson"]);
  assert.deepEqual(hitta("^\\.uppdrag\\[\\]\\.hjalp\\[\\]$"), ["bengtsson.json:pennan"]);
});

test("R-A: kartans 🔊 spelar en hel fil – skogen, sjön och grottan med platsens egen inbjudan (Bengtsson), ängen och gården med pennan", () => {
  // V1 (#204) valde rost_text bland befintliga inspelningar. För skogen, sjön och grottan är det platsens intro.text, som
  // Bengtsson säger när barnet kommer fram och som platslappen (#278) läser. Nyckeln är bara texten, så samma replik = samma röst.
  const P = (platserJson as unknown as { varldskarta: { id: string; rost_text: string }[]; platser: { id: string; intro?: { text?: string } }[] });
  const intro = new Map(P.platser.map((p) => [p.id, p.intro?.text]));
  const fel: string[] = [];
  for (const o of P.varldskarta) {
    const rad = RADER[nyckel(o.rost_text)];
    const plan = rostPlan(sammanhallenRostText(o.rost_text));
    const vantat = intro.get(o.id) === o.rost_text ? "bengtsson" : "pennan";
    if (!rad || !plan || plan.delar.length !== 1 || !("f" in plan.delar[0]!) || plan.delar[0].f !== rad.f) fel.push(`${o.id}: inte en hel fil`);
    else if (rad.r !== vantat) fel.push(`${o.id}: ${rad.r}, väntat ${vantat}`);
  }
  assert.deepEqual(fel, []);
});
