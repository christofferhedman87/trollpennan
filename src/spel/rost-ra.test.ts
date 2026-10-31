// R-A (röstinspelningar 2026-10-31): Bengtssons kända uppdragsrepliker (uppdrag, tack, andra djur-varianter och nästan),
// byggönskningarna och de fem hjälpfraserna ska spelas som EN hel inspelning med rätt talare – inte tyst, inte ihopsatt av
// främmande klipp och inte ersatt av en annan replik. Granskad-flaggorna ändras inte här.
import assert from "node:assert/strict";
import { test } from "node:test";
import bengtssonJson from "../../data/bengtsson.json" with { type: "json" };
import byggJson from "../../data/onskningar-bygg.json" with { type: "json" };
import manifestJson from "../../data/rost-manifest.json" with { type: "json" };
import rostJson from "../../data/rost.json" with { type: "json" };
import { sammanhallenRostText } from "./rost.ts";
import { normalisera, nyckel, rostPlan } from "./rostManifest.ts";

type Variant = { text: string; granskad: boolean };
type U = { id: string; givare?: string; text_bengtsson?: string; klart_bengtsson?: string; nastan?: string; text_bengtsson_annat_djur?: Variant; klart_bengtsson_annat_djur?: Variant };
const UPPDRAG = (bengtssonJson as unknown as { uppdrag: U[] }).uppdrag;
const RADER = (manifestJson as unknown as { rader: Record<string, { f: string; r: string }> }).rader;
const VANTAR = new Set(((rostJson as { vantar_rost?: string[] }).vantar_rost ?? []).map(normalisera));

const HJALPFRASER = ["en hund med strumpor", "en hund med halsduk", "en katt med tröja", "en liten myra", "en stor giraff"];

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
  return ut;
}

test("R-A: varje känd uppdragsreplik, byggönskan och hjälpfras spelas som en hel inspelning med rätt talare", () => {
  const fel: string[] = [];
  for (const { kalla, t, talare } of rader()) {
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

test("R-A: inga R-A-texter står kvar i vantar_rost när de har en hel inspelning", () => {
  const kvar = rader().filter(({ t }) => VANTAR.has(normalisera(t)) && RADER[nyckel(t)]).map(({ kalla }) => kalla);
  assert.deepEqual(kvar, []);
});

test("R-A: kanin-fryser:s varianter för andra djur förblir granskad:false", () => {
  const u = UPPDRAG.find((x) => x.id === "kanin-fryser")!;
  assert.equal(u.text_bengtsson_annat_djur?.granskad, false);
  assert.equal(u.klart_bengtsson_annat_djur?.granskad, false);
});
