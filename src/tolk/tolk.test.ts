import assert from "node:assert/strict";
import test from "node:test";
import { avstand } from "./avstand.ts";
import { ORD } from "./data.ts";
import { arSparrat } from "./sparr.ts";
import { tolka } from "./tolka.ts";
import fraser from "../../data/test-fraser.json" with { type: "json" };
import { valjStil } from "../spel/beteende.ts";

function skapad(text: string, opts?: { kalla?: "kort" | "skriv"; inteGuld?: string[] }) {
  const u = tolka(text, opts);
  assert.equal(u.typ, "skapad", `${text} → ${u.typ} ${"text" in u ? u.text : ""}`);
  if (u.typ !== "skapad") throw new Error("saknas");
  return u;
}

test("rosa kanin som flyger", () => {
  const u = skapad("rosa kanin som flyger");
  assert.equal(u.varelse.formel, "en rosa kanin som flyger");
  assert.equal(u.varelse.kropp, "kanin");
  assert.equal(u.varelse.farg, "#F48FB1");
  assert.deepEqual(u.varelse.formagor, ["vingar"]);
  assert.equal(u.antal, 1);
  assert.ok(u.guld.includes("rosa"));
  assert.ok(u.guld.includes("kanin"));
  assert.ok(u.guld.includes("flyger"));
});

test("samma djur med böjt adjektiv", () => {
  const u = skapad("stort kanin");
  assert.equal(u.varelse.formel, "en stor kanin");
  assert.equal(u.varelse.skala, 1.35);
});

test("artikel ignoreras och neutrum böjs", () => {
  const u = skapad("ett rött föl");
  assert.equal(u.varelse.formel, "ett rött föl");
  assert.equal(u.varelse.kropp, "häst");
  assert.ok(u.varelse.skala < 1);
});

test("pluralform ger tre", () => {
  const u = skapad("kaniner");
  assert.equal(u.antal, 3);
  assert.equal(u.varelse.formel, "tre kaniner");
});

test("fem drakar", () => {
  const u = skapad("fem drakar");
  assert.equal(u.antal, 5);
  assert.equal(u.varelse.formel, "fem drakar");
  assert.equal(u.varelse.kropp, "drake");
});

test("många blir fem", () => {
  assert.equal(skapad("många fiskar").antal, 5);
});

test("två kanin böjs i formeln", () => {
  const u = skapad("två kanin");
  assert.equal(u.antal, 2);
  assert.equal(u.varelse.formel, "två kaniner");
});

test("valfri ordning", () => {
  const a = skapad("kanin rosa stor");
  const b = skapad("stor rosa kanin");
  assert.equal(a.varelse.formel, "en stor rosa kanin");
  assert.equal(b.varelse.formel, a.varelse.formel);
  assert.equal(a.varelse.farg, b.varelse.farg);
});

test("eldkanin", () => {
  const u = skapad("eldkanin");
  assert.equal(u.varelse.kropp, "kanin");
  assert.ok(u.varelse.formagor.includes("flammor"));
  assert.equal(u.varelse.formel, "en eldkanin");
  assert.ok(!u.guld.includes("kanin"));
  assert.ok(u.funna.includes("eld"));
});

test("regnbågsdrake och eldregnbågsdrake", () => {
  const a = skapad("regnbågsdrake");
  assert.equal(a.varelse.kropp, "drake");
  assert.equal(a.varelse.monster, "regnbåge");
  assert.equal(a.varelse.formel, "en regnbågsdrake");
  const b = skapad("eldregnbågsdrake");
  assert.ok(b.varelse.formagor.includes("flammor"));
  assert.equal(b.varelse.monster, "regnbåge");
  assert.ok(b.varelse.overraskningar.some((o) => o.effekt === "regnbågsflammor"));
});

test("jättestor regnbågsfärgad drake som sprutar eld", () => {
  const u = skapad("jättestor regnbågsfärgad drake som sprutar eld");
  assert.equal(u.varelse.formel, "en jättestor regnbågsfärgad drake som sprutar eld");
  assert.equal(u.varelse.skala, 1.8);
  assert.equal(u.varelse.monster, "regnbåge");
  assert.ok(u.varelse.formagor.includes("flammor"));
  assert.ok(u.varelse.overraskningar.some((o) => o.effekt === "regnbågsflammor"));
  assert.equal(u.varelse.overraskningar[0]?.text, "Regnbågseld! Det har ingen sett förut.");
});

test("jättegroda guldfisk sjöhäst flygfisk drakkatt", () => {
  assert.equal(skapad("jättegroda").varelse.skala, 1.8);
  assert.equal(skapad("jättegroda").varelse.formel, "en jättegroda");
  const g = skapad("guldfisk");
  assert.equal(g.varelse.kropp, "fisk");
  assert.equal(g.varelse.farg, "#FFC107");
  assert.equal(g.varelse.glans, true);
  assert.equal(g.varelse.formel, "en guldfisk");
  assert.ok(skapad("sjöhäst").varelse.formagor.includes("fenor"));
  assert.equal(skapad("sjöhäst").varelse.kropp, "häst");
  assert.ok(skapad("flygfisk").varelse.formagor.includes("vingar"));
  const d = skapad("drakkatt");
  assert.equal(d.varelse.kropp, "katt");
  assert.ok(d.varelse.formagor.includes("vingar"));
  assert.ok(skapad("fågelskatt").varelse.formagor.includes("vingar"));
  assert.equal(skapad("fiskkatt").varelse.kropp, "katt");
  assert.ok(skapad("fiskkatt").varelse.formagor.includes("fenor"));
});

test("med röd hatt färgar hatten inte kroppen", () => {
  const u = skapad("rosa kanin med röd hatt");
  assert.equal(u.varelse.farg, "#F48FB1");
  assert.equal(u.varelse.tillbehor[0]?.id, "hatt");
  assert.equal(u.varelse.tillbehor[0]?.farg, "#E53935");
  assert.equal(u.varelse.formel, "en rosa kanin med röd hatt");
});

test("flera förmågor och flera saker", () => {
  const u = skapad("kanin som flyger och sprutar eld med blå hatt och krona");
  assert.deepEqual(u.varelse.formagor, ["vingar", "flammor"]);
  assert.equal(u.varelse.formel, "en kanin med blå hatt och krona som flyger och sprutar eld");
});

test("kanim föreslår kanin", () => {
  const u = tolka("kanim");
  assert.equal(u.typ, "forslag");
  if (u.typ !== "forslag") return;
  assert.equal(u.text, "Menade du kanin?");
  assert.equal(u.forslag[0]?.id, "kanin");
  assert.equal(u.token, "kanim");
});

test("kannin är ett billigt fel", () => {
  assert.ok(avstand("kannin", "kanin") <= 0.5);
  const u = tolka("kannin");
  assert.equal(u.typ, "forslag");
  if (u.typ !== "forslag") return;
  assert.equal(u.forslag[0]?.visa, "kanin");
});

test("förslag blir inte guld", () => {
  const u = skapad("kanin", { inteGuld: ["kanin"] });
  assert.ok(!u.guld.includes("kanin"));
  assert.ok(u.funna.includes("kanin"));
});

test("ordkort ger inte guld", () => {
  const u = skapad("rosa kanin som flyger", { kalla: "kort" });
  assert.deepEqual(u.guld, []);
  assert.ok(u.funna.includes("kanin"));
});

test("blixtkatt sparar förleden", () => {
  const u = skapad("blixtkatt");
  assert.equal(u.varelse.kropp, "katt");
  assert.ok(u.okanda.includes("blixt"));
  assert.ok(u.meddelanden.some((m) => m.includes("blixt") && m.includes("sparat")));
  assert.ok(!JSON.stringify(u.varelse).includes("blixt"));
});

test("monsterkanin", () => {
  const u = skapad("monsterkanin");
  assert.equal(u.varelse.kropp, "kanin");
  assert.ok(u.meddelanden.some((m) => m.startsWith("Ordet monster")));
});

test("okänt ord utan djur", () => {
  const u = tolka("blobbo");
  assert.equal(u.typ, "behover_djur");
  if (u.typ !== "behover_djur") return;
  assert.equal(u.text, "Pennan behöver ett djur. Prova …");
  assert.deepEqual(
    u.djur.map((d) => d.id),
    ["kanin", "katt", "hund"],
  );
  assert.ok(u.okanda.includes("blobbo"));
});

test("spärrat ord syns inte och kisse gör det", () => {
  for (const w of ["fitta", "FITTA!!!", "fiiitta", "f1tta", "fy fan"]) {
    const u = tolka(w);
    assert.equal(u.typ, "sparr", w);
    assert.equal(JSON.stringify(u).includes("fitta"), false);
    assert.equal(JSON.stringify(u).includes("fan"), false);
  }
  assert.equal(arSparrat("negerkanin"), true);
  assert.equal(tolka("negerkanin").typ, "sparr");
  assert.equal(arSparrat("kisse"), false);
  assert.equal(skapad("kisse").varelse.kropp, "katt");
  assert.equal(arSparrat("kukeliku"), false);
});

test("inga ordformer är spärrade", () => {
  for (const o of ORD.ord) {
    for (const f of o.former) assert.equal(arSparrat(f), false, f);
    assert.equal(arSparrat(o.visa), false, o.visa);
  }
});

test("springer räcker, springer snabbt också", () => {
  assert.ok(skapad("kanin springer").varelse.formagor.includes("fartlinjer"));
  assert.ok(skapad("kanin som springer snabbt").varelse.formagor.includes("fartlinjer"));
  assert.match(skapad("kanin som springer").varelse.formel, /springer snabbt/);
});

test("kattunge valp padda", () => {
  const k = skapad("kattunge");
  assert.equal(k.varelse.kropp, "katt");
  assert.equal(k.varelse.skala, 0.7);
  assert.equal(k.varelse.formel, "en kattunge");
  assert.equal(skapad("padda").varelse.farg, "#8D6E63");
  assert.equal(skapad("padda").varelse.formel, "en padda");
});

test("överraskningar", () => {
  const a = skapad("glittrig kanin som lyser");
  assert.ok(a.varelse.overraskningar.some((o) => o.effekt === "stjarnregn"));
  const b = skapad("osynlig kanin som sprutar eld");
  assert.equal(b.varelse.alpha, 0.25);
  assert.equal(b.varelse.kontur, true);
  assert.ok(b.varelse.overraskningar.some((o) => o.effekt === "svavande_eld"));
  assert.match(b.varelse.formel, /osynlig/);
  const c = skapad("enorm fisk som simmar");
  assert.ok(c.varelse.overraskningar.some((o) => o.effekt === "stora_vagor"));
});

test("tigerrandig och prickar", () => {
  const t = skapad("tigerrandig katt");
  assert.equal(t.varelse.monster, "ränder");
  assert.equal(t.varelse.monsterfarg, "#2B2B2B");
  assert.match(t.varelse.formel, /tigerrandig/);
  const p = skapad("kanin med prickar");
  assert.equal(p.varelse.monster, "prickar");
  assert.match(p.varelse.formel, /prickig kanin/);
});

test("ljusblå är ett hemligt färgord", () => {
  const u = skapad("ljusblå kanin");
  assert.equal(u.varelse.farg, "#90CAF9");
  assert.match(u.varelse.formel, /ljusblå/);
});

test("genomskinlig och osynlig", () => {
  assert.equal(skapad("genomskinlig groda").varelse.alpha, 0.55);
  assert.equal(skapad("genomskinlig groda").varelse.kontur, false);
});

test("kappa och guldkrona", () => {
  const k = skapad("kanin med kappa");
  assert.equal(k.varelse.tillbehor[0]?.id, "mantel");
  assert.match(k.varelse.formel, /kappa/);
  const g = skapad("drake med guldkrona");
  assert.equal(g.varelse.tillbehor[0]?.farg, "#FFC107");
  assert.equal(g.varelse.tillbehor[0]?.glans, true);
});

test("ljuslila kanin blir ljusare lila", () => {
  const ren = skapad("lila kanin");
  const ljus = skapad("ljuslila kanin");
  assert.equal(ljus.varelse.kropp, "kanin");
  assert.notEqual(ljus.varelse.farg, ren.varelse.farg);
  assert.equal(skapad("ljus lila kanin").varelse.farg, ljus.varelse.farg);
});

test("drakhäst", () => {
  const u = skapad("drakhäst");
  assert.equal(u.varelse.kropp, "häst");
  assert.ok(u.varelse.formagor.includes("vingar"));
});

test("test-fraser.json", () => {
  for (const rad of fraser.fraser) {
    const kontroll = rad.kontroll as {
      kropp?: string;
      farg?: string;
      antal?: number;
      antal_pa_angen?: number;
      stil?: string;
      i_dammen?: boolean;
      springer_over_angen?: boolean;
      formagor?: string[];
      monster?: string;
      monsterfarg?: string;
      forslag?: string;
      tillbehor?: (string | { id: string; farg: string | null })[];
    };
    if (rad.formel === "forslag") {
      const u = tolka(rad.fras);
      assert.equal(u.typ, "forslag", rad.fras);
      if (u.typ === "forslag" && kontroll.forslag) {
        assert.ok(
          u.forslag.some((f) => f.id === kontroll.forslag || f.visa === kontroll.forslag) || u.text.includes(kontroll.forslag),
          `${rad.fras} → ${u.text}`,
        );
      }
      continue;
    }
    const u = skapad(rad.fras);
    assert.equal(u.varelse.formel, rad.formel, rad.fras);
    if (kontroll.kropp) assert.equal(u.varelse.kropp, kontroll.kropp, rad.fras);
    if (kontroll.farg) assert.equal(u.varelse.farg, kontroll.farg, rad.fras);
    if (kontroll.antal != null) assert.equal(u.antal, kontroll.antal, rad.fras);
    if (kontroll.antal_pa_angen != null) assert.equal(u.antal, kontroll.antal_pa_angen, rad.fras);
    if (kontroll.monster) assert.equal(u.varelse.monster, kontroll.monster, rad.fras);
    if (kontroll.monsterfarg) assert.equal(u.varelse.monsterfarg, kontroll.monsterfarg, rad.fras);
    if (kontroll.formagor) {
      for (const f of kontroll.formagor) assert.ok(u.varelse.formagor.includes(f), rad.fras);
    }
    if (kontroll.tillbehor) {
      if (typeof kontroll.tillbehor[0] === "string") {
        assert.deepEqual(
          u.varelse.tillbehor.map((t) => t.id),
          kontroll.tillbehor,
          rad.fras,
        );
      } else {
        for (const t of kontroll.tillbehor as { id: string; farg: string | null }[]) {
          const hit = u.varelse.tillbehor.find((x) => x.id === t.id);
          assert.ok(hit, `${rad.fras} saknar ${t.id}`);
          assert.equal(hit?.farg ?? null, t.farg, rad.fras);
        }
      }
    }
    if (kontroll.stil || kontroll.i_dammen || kontroll.springer_over_angen) {
      const s = valjStil(u.varelse, () => 0.99);
      if (kontroll.stil) assert.equal(s.stil, kontroll.stil, rad.fras);
      if (kontroll.i_dammen) assert.equal(s.zon, "damm", rad.fras);
      if (kontroll.springer_over_angen) assert.equal(s.stil, "rus", rad.fras);
    }
  }
});


// R3G: föremål, natur, byggnad, mat och fordon med modell blir egna entiteter (härledda ur entiteter.json, ingen kod per ord).
test("R3G: ett föremål ensamt blir kroppen, inte ett ägg", () => {
  for (const [fras, kropp, formel] of [
    ["ett lok", "lok", "ett lok"],
    ["en hink", "hink", "en hink"],
    ["en ek", "ek", "en ek"],
    ["ambulans", "ambulans", "en ambulans"],
  ] as const) {
    const u = tolka(fras);
    assert.equal(u.typ, "skapad", fras);
    if (u.typ !== "skapad") continue;
    assert.equal(u.varelse.kropp, kropp, fras);
    assert.equal(u.varelse.formel, formel, fras);
  }
});

test("R3G: föremål efter med står bredvid djuret; djuret är kvar som kropp", () => {
  const u = tolka("en kanin med en hink");
  assert.equal(u.typ, "skapad");
  if (u.typ !== "skapad") return;
  assert.equal(u.varelse.kropp, "kanin");
  assert.deepEqual(u.varelse.tillbehor.map((t) => t.id), ["hink"]);
  assert.equal(u.varelse.formel, "en kanin med hink");
  const h = tolka("en hatt");
  assert.notEqual(h.typ === "skapad" ? h.varelse.kropp : "", "hatt", "ord.json-tillbehör ändras inte");
  const t = tolka("tre hinkar");
  assert.equal(t.typ === "skapad" ? t.antal : 0, 3);
});
