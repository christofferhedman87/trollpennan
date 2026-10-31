// Samma tolk och meningsdelning som det riktiga skapandet. Ingen rå ordträff godkänner ett krav.
import entiteterJson from "../../data/entiteter.json" with { type: "json" };
import egenJson from "../../data/egenskaper.json" with { type: "json" };
import { delaOchMening } from "../tolk/ochMening.ts";
import { ordFranForm } from "../tolk/lexikon.ts";
import { tolkaMedReserv } from "../tolk/reserv.ts";
import type { Varelse } from "../tolk/typer.ts";
import { taggarAv } from "./taggar.ts";
import type { TolkadSkapelse } from "./krav.ts";
import { medTemperatur, temperaturer, temperaturFranOrd } from "./temperatur.ts";
type Entitet = { typ: string; ord?: string[]; rorelse?: string };
const ENT = entiteterJson.entiteter as Record<string, Entitet>;
const E = egenJson as typeof egenJson & { sak?: Record<string, string[]> };

function sakTaggar(taggar: Set<string>, id: string): void {
  const e = ENT[id];
  const plagg = (egenJson.tillbehor as Record<string, string[]>)[id];
  if (!e && !plagg) return;
  for (const ord of new Set([id, ...(e?.ord ?? [])])) taggar.add(`ord:${ord}`);
  for (const t of E.sak?.[id] ?? []) taggar.add(t);
  for (const t of plagg ?? []) taggar.add(t);
}

/** Färg gäller kroppen. En röd mössa får aldrig göra en blå hund röd. */
export function betydelseAv(v: Varelse, antal = 1): TolkadSkapelse {
  const taggar = taggarAv(v, true);
  // Exempel som "en myra" och "en elefant" har en naturlig storlek även utan adjektiv.
  if ((egenJson.storlek.liten.arter as readonly string[]).includes(v.kropp)) taggar.add("liten");
  if ((egenJson.storlek.stor.arter as readonly string[]).includes(v.kropp)) taggar.add("stor");
  // Barnets uttryckliga skala går före artens standardstorlek.
  if (v.skala <= 0.75) taggar.delete("stor");
  if (v.skala >= 1.3) taggar.delete("liten");
  const e = ENT[v.kropp];
  const djur = e?.typ === "djur";
  if (djur && e.rorelse === "flyg") taggar.add("flyga");
  if (djur && e.rorelse === "sim") { taggar.add("simma"); taggar.add("vatten"); }
  sakTaggar(taggar, v.kropp);
  for (const t of v.tillbehor) {
    sakTaggar(taggar, t.id);
    for (const tagg of (egenJson.tillbehor as Record<string, string[]>)[t.id] ?? []) taggar.add(tagg);
  }
  // Beskrivande egenskaper saknar eget sparfält. Läs bara tolkarens färdiga formel,
  // och bara dess huvudfras, så att en varm mössa inte blir en varm kropp.
  const huvud = v.formel.split(/\s+(?:med|som|på|under|i|vid|bredvid)\s+/i)[0] ?? "";
  for (const token of huvud.toLocaleLowerCase("sv").match(/[a-zåäöéü]+/g) ?? []) {
    const ord = ordFranForm(token);
    if (ord?.klass === "egenskap") taggar.add(`egenskap:${ord.id}`);
  }
  return { taggar, antal, djur };
}

export function betydelseFranText(text: string): TolkadSkapelse[] {
  return delaOchMening(text).flatMap((del) => {
    const u = tolkaMedReserv(del, { kalla: "kort", noteraBlandning: false });
    if (u.typ !== "skapad" || u.varelse.kropp === "agg") return [];
    const v = u.varelse;
    // Riktiga medföljande modeller är också saker. Räkna dem var för sig när
    // uppdraget ber om två saker, men gör aldrig ett påklätt djur till två djur.
    const saker = v.tillbehor.flatMap((t, i) => ENT[t.id]?.typ === "djur" ? [] : [{ ...medTemperatur(betydelseAv({
      ...v, kropp: t.id, farg: t.farg, monster: null, monsterfarg: null,
      formagor: [], tillbehor: [], skala: 1, alpha: 1, kontur: false,
      glans: t.glans, formel: "", reserv: [],
    }, u.antal * (t.antal ?? 1)), temperaturFranOrd(t.egenskaper ?? [])), relation: t.relation ?? "med", ...(u.osakraRelationer?.includes(i) ? { osakerRelation: true } : {}) }]);
    const huvudfras = v.formel.split(/\s+(?:med|som|på|under|i|vid|bredvid)\s+/i)[0] ?? "";
    const huvud = medTemperatur(betydelseAv({ ...v, tillbehor: [] }, u.antal), temperaturer(huvudfras, v).get(v.kropp));
    const taggar = new Set(huvud.taggar);
    if (u.skrivenKroppsFarg) taggar.add(`skriven_farg:${u.skrivenKroppsFarg}`);
    for (const sak of saker) for (const t of sak.taggar) {
      if (t !== "farg" && !t.startsWith("farg:") && !t.startsWith("kropp:")) taggar.add(t);
    }
    for (const t of v.tillbehor) taggar.add(`tillbehor:${t.id}`);
    return [{ ...huvud, egnaTaggar: huvud.taggar, taggar }, ...saker];
  });
}
