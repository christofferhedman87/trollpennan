// R6A-2: den generella kontrollen "räcker det barnet skrev för uppdraget?" (ren, ingen React, ingen Zustand).
// Kravet är data (data/bengtsson.json `krav`): ett nytt uppdrag är en datarad, ingen kod.
import bengtssonJson from "../../data/bengtsson.json" with { type: "json" };
import { ALLA_UPPDRAG, SKRIV, type Uppdrag } from "./aventyr.ts";

export const TAKT = bengtssonJson.takt;

export type Krav = { ord: string[]; min?: number };
export type Status = Record<string, "pagar" | "klar">;

/** Orden i en text, små bokstäver, utan skiljetecken. */
export function ordIText(text: string): string[] {
  return text.toLowerCase().match(/[a-zåäöéü]+/g) ?? [];
}

/** Rättvis träff: exakt, böjt ("filten", "filtar") eller ingår i ett sammansatt ord ("ullmössa"). Ord under 4 bokstäver måste vara exakta. */
export function ordTraffar(token: string, ord: string): boolean {
  if (token === ord) return true;
  return ord.length >= 4 && (token.startsWith(ord) || token.endsWith(ord));
}

/** Vilka ord ur kravet barnet skrev (distinkta ur kravlistan). */
export function kravTraffar(krav: Krav, text: string): string[] {
  const tokens = ordIText(text);
  return krav.ord.filter((o) => tokens.some((t) => ordTraffar(t, o)));
}

export function kravUppfyllt(krav: Krav, text: string): boolean {
  return kravTraffar(krav, text).length >= (krav.min ?? 1);
}

/** Uppdraget som är igång på ängen (status "pagar"), annars undefined. */
export function aktivtSkrivUppdrag(status: Status): Uppdrag | undefined {
  return SKRIV.find((u) => status[u.id] === "pagar");
}

/** Nästa skriv-uppdrag som inte är startat, i datans ordning. */
export function nastaSkrivUppdrag(status: Status): Uppdrag | undefined {
  return SKRIV.find((u) => !status[u.id]);
}

/** Finns det äventyrsuppdrag (uppdrag.json) som inte är klara? */
export function aventyrKvar(status: Status): boolean {
  return ALLA_UPPDRAG.some((u) => !SKRIV.includes(u) && status[u.id] !== "klar");
}

/** Lägena Bengtsson kan vara i (nycklar i data/npc.json `miner`), utan de tillfälliga (fel, klar_nyss). */
export function bengtssonLagen(status: Status): string[] {
  const lagen: string[] = [];
  if (aktivtSkrivUppdrag(status)) lagen.push("pagar");
  else if (!nastaSkrivUppdrag(status)) lagen.push(aventyrKvar(status) ? "bara_aventyr" : "alla_klara");
  return lagen;
}

/** R9: takten för när Bengtsson själv bjuder in (data/bengtsson.json `takt`). Knappen med hans huvud ger alltid ett uppdrag direkt. */
export type OnskaTakt = { forst_efter_uppdrag: number; efter_klart_sekunder: number; mellan_sekunder: number };
export type Takt = { forsta: { efter_djur: number; eller_sekunder: number }; mellan_sekunder: number; onskan?: OnskaTakt };
export type Matt = { djur: number; spelSek: number; sekSedanKlart: number | null };

/** Sekunder tills Bengtsson bjuder in nästa uppdrag: 0 = redo nu, null = inget att bjuda in till (pågår eller slut). */
export function sekTillRedo(status: Status, m: Matt, takt: Takt = TAKT): number | null {
  if (aktivtSkrivUppdrag(status) || !nastaSkrivUppdrag(status)) return null;
  if (!SKRIV.some((u) => status[u.id] === "klar")) {
    if (m.djur >= takt.forsta.efter_djur) return 0;
    return Math.max(0, Math.ceil(takt.forsta.eller_sekunder - m.spelSek));
  }
  return m.sekSedanKlart === null ? 0 : Math.max(0, Math.ceil(takt.mellan_sekunder - m.sekSedanKlart));
}

/** R9D: får ett djur visa en ny önskan nu (data/bengtsson.json `takt.onskan`)? Ett uppdrag i taget: aldrig medan Bengtssons uppdrag pågår,
 *  aldrig före hans första regel, först efter hans första uppdrag och med luft efter klart uppdrag och förra önskan. */
export function onskaFarKomma(status: Status, m: Matt & { sekSedanOnska: number | null }, takt: Takt = TAKT): boolean {
  if (aktivtSkrivUppdrag(status)) return false;
  const o = takt.onskan ?? { forst_efter_uppdrag: 1, efter_klart_sekunder: takt.mellan_sekunder, mellan_sekunder: takt.mellan_sekunder };
  if (m.djur < takt.forsta.efter_djur && m.spelSek < takt.forsta.eller_sekunder) return false;
  const klara = SKRIV.filter((u) => status[u.id] === "klar").length;
  if (nastaSkrivUppdrag(status) && klara < o.forst_efter_uppdrag) return false;
  if (m.sekSedanKlart !== null && m.sekSedanKlart < o.efter_klart_sekunder) return false;
  if (m.sekSedanOnska !== null && m.sekSedanOnska < o.mellan_sekunder) return false;
  return true;
}
