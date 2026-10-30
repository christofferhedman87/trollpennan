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
import { skrivGuldTecken, type Spok } from "./guldchans.ts";
import { platsLapp } from "./platsLapp.ts";
import { platsMed } from "../platser.ts";
import { rostFor } from "../rostManifest.ts";
import { kanTrollas } from "./kanTrollas.ts";
import { tolkaMedReserv } from "../../tolk/reserv.ts";

const skrivet = (s: string, k: MOrd["k"] = "skriv"): MOrd[] => (s ? s.split(" ").map((t) => ({ t, k })) : []);
const text = (o: MOrd[]) => o.map((x) => x.t).join(" ");
const kort = (typ: "djur" | "bygg", id: string, sektion?: string) => {
  const k = hylla(typ).filter((s) => !sektion || s.id === sektion).flatMap((s) => s.kort).find((x) => x.id === id);
  assert.ok(k, `kortet ${id} finns`);
  return k;
};
const brickor = (s: string, k: MOrd["k"] = "skriv") => meningsbrickor(skrivet(s, k)).map((b) => `${b.t}:${b.klass}${b.guld ? "*" : ""}${b.boj ? `!${b.boj}` : ""}`).join(" ");

test("Pennan vaknar för ett ordägg, även utan ett känt Vad", () => {
  assert.equal(harVad(meningsbrickor(skrivet("en månskrutt"))), false);
  assert.equal(kanTrollas("en månskrutt "), true);
  assert.equal(kanTrollas("månskrutt"), true);
  assert.equal(kanTrollas("en grön kanin"), true);
});

test("Pennan vaknar för önskans tillägg utan djurord, med samma djur som Trolla använder", () => {
  const u = tolkaMedReserv("en kanin", { kalla: "kort" });
  assert.equal(u.typ, "skapad");
  if (u.typ !== "skapad") return;
  const fore = JSON.stringify(u.varelse);
  for (const svar of ["lila", "med halsduk", "sprutar eld"]) assert.equal(kanTrollas(svar, u.varelse), true, svar);
  assert.equal(kanTrollas("lila"), false, "fri färg saknar ett Vad");
  assert.equal(kanTrollas("lila", null), false, "ett försvunnet måldjur ger ingen falsk förhandsklar mening");
  assert.equal(JSON.stringify(u.varelse), fore, "tilläggsberäkningen ändrar inte djuret");
});

test("Tomt och ett olöst stavningsförslag gör inte Pennan redo", () => {
  for (const s of ["", "   ", "en kanim", "en"]) assert.equal(kanTrollas(s), false, JSON.stringify(s));
});

test("Barnets aktiva Behåll-val räknas som ordägg, utan att ett olöst förslag rättas tyst", () => {
  assert.equal(kanTrollas("en kanim"), false, "ett olöst förslag väntar på svar");
  assert.equal(kanTrollas("en kanim", undefined, ["kanim"]), true, "Behåll kanim ger en trollbar äggmening");
});

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

test("Skapa B: önskans flerordskort går att skriva klart i guldchansen", () => {
  const onskade = onskeKort(["en drake som sprutar eld", "en kanin som springer snabbt"]);
  for (const fras of ["sprutar eld", "springer snabbt", "kanin"]) {
    const valt = fras === "kanin" ? kort("djur", fras) : onskade.find((k) => k.visa === fras);
    assert.ok(valt, `kortet ${fras} går att välja`);
    let s: Spok = { ord: valt.visa, tokenI: 3, buf: "", fel: 0 };
    for (let i = 0; i < fras.length; i++) {
      s = skrivGuldTecken(s, fras[i]!.toLocaleUpperCase("sv"));
      assert.equal(s.buf, fras.slice(0, i + 1));
      assert.equal(s.buf === s.ord, i === fras.length - 1, "guldchansen blir klar först efter sista bokstaven");
    }
    assert.equal(s.fel, 0);
    assert.equal(s.tokenI, 3, "kortets plats i meningen bevaras");
  }
});

test("Skapa B: guldchansen väntar på rätt mellanrum utan att hoppa över bokstäver", () => {
  let s: Spok = { ord: "sprutar eld", tokenI: 3, buf: "sprutar", fel: 0 };
  s = skrivGuldTecken(s, "e");
  assert.equal(s.buf, "sprutar", "andra ordet kan inte börja innan mellanrummet");
  s = skrivGuldTecken(s, " ");
  assert.equal(s.buf, "sprutar ");
  s = skrivGuldTecken(s, " ");
  assert.equal(s.buf, "sprutar ", "ett extra mellanrum förbrukar ingen bokstav");
  for (const b of "eld") s = skrivGuldTecken(s, b);
  assert.equal(s.buf, "sprutar eld");
  assert.equal(s.fel, 2);
});

test("Skapa D: idétärningen skriver aldrig, men läser upp en riktig mening", () => {
  assert.equal(ideText(["drake", "grön", "krona", "sprutar eld"]), "en grön drake med krona som sprutar eld");
  assert.equal(ideText(["stall", "lila", "slott"]), "ett lila stall som ser ut som ett slott");
  assert.equal(ideText(["hus", "godis", "torn"]), "ett hus av godis med torn");
  assert.equal(ideKort(["lada", "svamp", "dansande"]).length, 3);
});

test("Skapa: utflyktens platslapp återanvänder rätt plats och befintlig inspelad inbjudan", () => {
  for (const [id, namn] of [["skogen", "Skogen"], ["sjon", "Sjön"], ["grottan", "Grottan"]] as const) {
    const lapp = platsLapp(id);
    assert.ok(lapp, `${namn} har en platslapp`);
    assert.equal(lapp.fran, namn);
    const intro = platsMed(id)?.intro as { text: string };
    assert.equal(lapp.text, intro.text, "ingen ny eller hopsatt text som kräver en annan röstfil");
    assert.ok(rostFor(lapp.text)?.fil, `${namn}: den exakta lapptexten finns i klientens röstmanifest`);
  }
});

test("Skapa: Ängen och okända platser får ingen utflyktslapp", () => {
  for (const id of ["ang", "garden", "saknas", ""]) assert.equal(platsLapp(id), null);
});
