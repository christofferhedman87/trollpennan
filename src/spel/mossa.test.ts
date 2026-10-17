import assert from "node:assert/strict";
import { test } from "node:test";
import { MOSSA, mossaTraff, nivaAv, poangAv, type Handelse } from "./liv.ts";
import { tolka } from "../tolk/tolka.ts";
import type { ByggeTolk } from "../tolk/byggtolk.ts";

function bygg(del: Partial<ByggeTolk>): ByggeTolk {
  return {
    bygg: "hus",
    ord: "hus",
    antal: 1,
    antalOrd: null,
    adj: [],
    material: null,
    delar: [],
    sida: "start",
    genus: "ett",
    ...del,
  };
}

function exempel(id: string): Handelse {
  const tagg = (t: string): Handelse => ({ taggar: new Set([t]) });
  switch (id) {
    case "djur-flyga":
      return tagg("flyga");
    case "djur-simma":
      return tagg("simma");
    case "djur-lila":
      return tagg("farg:lila");
    case "djur-hatt":
      return tagg("tillbehor:hatt");
    case "djur-prickar":
      return tagg("prickar");
    case "djur-stor":
      return tagg("stor");
    case "djur-liten":
      return tagg("liten");
    case "djur-tre":
      return { antal: 3 };
    case "djur-sammansatt":
      return { sammansatt: true };
    case "djur-gris":
      return tagg("kropp:gris");
    case "bygg-hus":
      return { byggen: [bygg({ bygg: "hus", delar: [{ del: "fönster", antal: 3, antalOrd: null, ord: "fönster", adj: [], material: null }] })] };
    case "bygg-blommor":
      return { byggen: [bygg({ bygg: "blomma", antal: 3, genus: "en" })] };
    case "bygg-tra":
      return { byggen: [bygg({ material: "trä" })] };
    case "bygg-lek":
      return { byggen: [bygg({ bygg: "gunga", genus: "en" })] };
    case "ge-gava":
      return { gavaTaggar: ["frukt"] };
    case "ge-sott":
      return { gavaTaggar: ["sott"] };
    case "ge-favorit":
      return { favorit: true, gavaTaggar: ["sott"] };
    case "onskan":
      return { onskan: 1 };
    case "onskan-tva":
      return { onskan: 2 };
    case "hemligt-ord":
      return { hemligt: 1 };
    case "guldord":
      return { guld: 1 };
    case "aventyr":
      return { aventyr: true };
    case "foto":
      return { foto: true };
    case "sallsynt":
      return { poang: 4 };
    default:
      return {};
  }
}

test("varje Mossa-uppdrag kan bli klart", () => {
  for (const u of MOSSA.uppdrag) {
    assert.equal(mossaTraff(u.id, exempel(u.id)), true, u.id);
    assert.equal(mossaTraff(u.id, {}), false, `${u.id} tom`);
  }
});

test("jättestor glittrig lila drake är minst sällsynt", () => {
  const u = tolka("en jättestor glittrig lila drake med krona som sprutar eld", { kalla: "skriv" });
  assert.equal(u.typ, "skapad");
  if (u.typ !== "skapad") return;
  const p = poangAv(u.varelse);
  const n = nivaAv(p);
  assert.ok(p >= 4, `poäng ${p} formel ${u.varelse.formel}`);
  assert.ok(n.id === "sallsynt" || n.id === "legendarisk");
});
