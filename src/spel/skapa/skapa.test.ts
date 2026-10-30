// Nya Skapa: beteendeprov för meningens logik (ersätter källtextproven för den gamla boken).
import assert from "node:assert/strict";
import { test } from "node:test";
import uiJson from "../../../data/skapa-ui.json" with { type: "json" };
import { autoBoj } from "./bojning.ts";
import { hylla, hyllaMedOnskan, onskeKort, prefixKort } from "./hjalpord.ts";
import { ideKort, ideText } from "./idetarning.ts";
import { laggKort, taBort } from "./insattning.ts";
import { arFrasStart } from "./lexikon.ts";
import { delaText, justera, platta, tillText, type MOrd } from "./mening.ts";
import { harVad, meningsbrickor } from "./meningsbrickor.ts";
import { kollaOrd } from "./ordKoll.ts";

const skrivet = (s: string, k: MOrd["k"] = "skriv"): MOrd[] => (s ? s.split(" ").map((t) => ({ t, k })) : []);
const text = (o: MOrd[]) => o.map((x) => x.t).join(" ");
const kort = (typ: "djur" | "bygg", id: string, sektion?: string) => {
  const k = hylla(typ).filter((s) => !sektion || s.id === sektion).flatMap((s) => s.kort).find((x) => x.id === id);
  assert.ok(k, `kortet ${id} finns`);
  return k;
};
const brickor = (s: string, k: MOrd["k"] = "skriv") => meningsbrickor(skrivet(s, k)).map((b) => `${b.t}:${b.klass}${b.guld ? "*" : ""}${b.boj ? `!${b.boj}` : ""}`).join(" ");

test("Skapa A: en grön drake skriven för hand ger tre brickor i rätt färg, två guld", () => {
  assert.equal(brickor("en grön drake"), "en:smaord grön:hurdan* drake:vad*");
  assert.equal(brickor("en grön drake", "kort"), "en:smaord grön:hurdan drake:vad");
});

test("Skapa A: frågan ordet svarar på följer sammanhanget", () => {
  assert.equal(brickor("en grön drake med krona som sprutar eld"), "en:smaord grön:hurdan* drake:vad* med:smaord krona:har* som:smaord sprutar eld:gor*");
  assert.match(brickor("ett hus av is med torn"), /is:hurdan\*.*torn:har\*/);
  assert.match(brickor("ett stall som ser ut som ett slott"), /stall:vad\*.*slott:hurdan\*/);
  assert.match(brickor("ett hus som flyger"), /flyger:gor\*/);
  assert.match(brickor("en katt som heter Bosse"), /Bosse:smaord/);
});

test("Skapa A: ett stor hus ger böjningshjälp, aldrig tyst rättning", () => {
  assert.match(brickor("ett stor hus"), /stor:hurdan\*!stort/);
  assert.match(brickor("en rött bil"), /rött:hurdan\*!röd/);
  assert.match(brickor("ett kanin"), /ett:smaord!en/);
  assert.doesNotMatch(brickor("två stora hus"), /!/);
  assert.doesNotMatch(brickor("ett stort hus"), /!/);
});

test("Skapa A: Pennan väntar på ett Vad", () => {
  assert.equal(harVad(meningsbrickor(skrivet("en grön"))), false);
  assert.equal(harVad(meningsbrickor(skrivet("en grön katt"))), true);
  assert.equal(harVad(meningsbrickor(skrivet("ett slott"))), true);
});

test("Skapa A: mellanslag kollar ordet med tolken (Menade du / ordägg / känt)", () => {
  const k = kollaOrd("en liten kanim", "kanim", []);
  assert.equal(k.typ, "forslag");
  assert.equal(k.typ === "forslag" && k.forslag[0]!.id, "kanin");
  assert.equal(kollaOrd("ett slot", "slot", []).typ, "forslag");
  assert.equal(kollaOrd("en flurp", "flurp", []).typ, "okand");
  assert.equal(kollaOrd("ett trähus", "trähus", []).typ, "kand");
  assert.equal(kollaOrd("en kanim", "kanim", ["kanim"]).typ, "okand", "Behåll mitt ord frågar inte igen");
  assert.equal(arFrasStart("sprutar"), true, "sprutar väntar på eld");
});

test("Skapa A: texten och källorna hålls ihop", () => {
  assert.deepEqual(delaText("en grön dra"), { ord: ["en", "grön"], skriv: "dra" });
  assert.deepEqual(delaText("en grön "), { ord: ["en", "grön"], skriv: "" });
  const meta: MOrd[] = [{ t: "en", k: "auto" }, { t: "sprutar eld", k: "kort" }];
  assert.deepEqual(justera(["en", "sprutar", "eld", "x"], meta).map((o) => o.k), ["auto", "kort", "kort", "skriv"]);
  assert.equal(tillText(platta(meta)), "en sprutar eld ");
});

test("Skapa B: ett hus + kortet röd ger ett rött hus; byte hus → stall vänder rött → röd", () => {
  let m = laggKort(skrivet("ett hus"), kort("bygg", "röd")).ord;
  assert.equal(text(m), "ett rött hus");
  const r = laggKort(m, kort("bygg", "stall", "hus"));
  m = r.ord;
  assert.equal(text(m), "ett rött stall", "ett stall: skrivet ett står kvar");
  const lada = laggKort(laggKort([], kort("bygg", "hus", "hus")).ord, kort("bygg", "röd"));
  const byt = laggKort(lada.ord, kort("bygg", "lada", "hus"));
  assert.equal(text(byt.ord), "en röd lada");
  assert.ok(byt.bojda.length >= 2, "artikel och adjektiv vände sig");
});

test("Skapa B: korten sätts in där grammatiken säger, skrivna ord flyttas aldrig", () => {
  let m: MOrd[] = [];
  for (const [t, id] of [["djur", "kanin"], ["djur", "röd"], ["djur", "stor"], ["djur", "hatt"], ["djur", "flyger"], ["djur", "prickig"]] as const) m = laggKort(m, kort(t, id)).ord;
  assert.equal(text(m), "en stor röd prickig kanin med hatt som flyger");
  const b = meningsbrickor(m).findIndex((x) => x.t === "hatt");
  assert.equal(text(taBort(m, b)), "en stor röd prickig kanin som flyger", "med följer med hatten");
  const skr = laggKort(skrivet("en drake som flyger"), kort("djur", "krona")).ord;
  assert.equal(text(skr), "en drake med krona som flyger");
  assert.equal(laggKort(skr, kort("djur", "krona")).bort, true, "samma kort igen tar bort ordet");
  let hus = laggKort(skrivet("ett blått hus"), kort("bygg", "slott", "form")).ord;
  hus = laggKort(hus, kort("bygg", "flygande")).ord;
  assert.equal(text(hus), "ett blått hus som ser ut som ett slott och som flyger");
});

test("Skapa B: byte från djur till bygge tar bort kortord som inte passar, aldrig skrivna", () => {
  let m = laggKort(laggKort(laggKort([], kort("djur", "kanin")).ord, kort("djur", "prickig")).ord, kort("djur", "hatt")).ord;
  m = laggKort(m, kort("bygg", "hus", "hus")).ord;
  assert.equal(text(m), "ett hus");
  const s = laggKort(skrivet("en prickig kanin"), kort("bygg", "hus", "hus")).ord;
  assert.match(text(s), /prickig/);
});

test("Skapa B: automatisk böjning gäller bara kortens ord", () => {
  const m = autoBoj([{ t: "en", k: "auto" }, { t: "stor", k: "kort" }, { t: "hus", k: "skriv" }]);
  assert.equal(text(m.ord), "ett stort hus");
  const s = autoBoj(skrivet("en stor hus"));
  assert.equal(text(s.ord), "en stor hus");
});

test("Skapa B: hyllan har hjälporden med bilder och Skriv fler", () => {
  const djur = hylla("djur");
  assert.deepEqual(djur.map((s) => s.id), ["djur", "hus", "natur", "lek", "storlek", "farg", "monster", "klader", "kan"]);
  assert.equal(djur[0]!.kort.length, 8);
  assert.ok((djur[0]!.fler as number) > 300);
  const ui = uiJson as unknown as { hjalpord: Record<string, string[]> };
  const bygg = hylla("bygg");
  assert.deepEqual(bygg.find((s) => s.id === "material")!.kort.map((k) => k.id), ui.hjalpord.material);
  for (const s of [...djur, ...bygg]) for (const k of s.kort) assert.ok(k.bild && !k.bild.includes("/agg."), `bild för ${k.id}`);
  assert.equal(bygg.find((s) => s.id === "gor")!.kort.map((k) => k.visa).join(","), "flyger,snurrar");
  assert.equal(kort("djur", "flyger").visa, "flyger");
  assert.equal(djur.find((s) => s.id === "kan")!.kort.some((k) => k.id === "sprutar eld"), false, "beslut F: skrivord");
});

test("Skapa B: prefixhjälpen och önskans kort", () => {
  assert.deepEqual(prefixKort(hylla("djur"), "dr").map((k) => k.visa), ["drake"]);
  assert.deepEqual(prefixKort(hylla("djur"), "zz"), []);
  const o = onskeKort(["en drake som sprutar eld", "ett hus som ser ut som ett äpple"]);
  assert.ok(o.some((k) => k.id === "sprutar eld"), "önskan gör ett skrivord till kort");
  assert.ok(o.some((k) => k.slot === "form" && k.id === "äpple"));
  const h = hyllaMedOnskan("djur", o);
  assert.equal(h.find((s) => s.id === "kan")!.kort[0]!.id, "sprutar eld");
});

test("Skapa D: idétärningen skriver aldrig, men läser upp en riktig mening", () => {
  assert.equal(ideText(["drake", "grön", "krona", "sprutar eld"]), "en grön drake med krona som sprutar eld");
  assert.equal(ideText(["stall", "lila", "slott"]), "ett lila stall som ser ut som ett slott");
  assert.equal(ideText(["hus", "godis", "torn"]), "ett hus av godis med torn");
  assert.equal(ideKort(["lada", "svamp", "dansande"]).length, 3);
});
