import blockJson from "../../data/blocklist.json" with { type: "json" };
import kanneteckenJson from "../../data/kannetecken.json" with { type: "json" };
import ordJson from "../../data/ord.json" with { type: "json" };
import type { BlockData, KanneteckenData, OrdData } from "./typer.ts";

const bas = ordJson as OrdData;
const soverKalla = bas.repliker.sover;
// R9K förbjuder ordet "ängen" i json-replikerna (platshållare). V8a-meningen säger ändå ängen,
// eftersom taket 16 bara gäller där. Rost kräver en sträng, inte en array, så ingen ny ljudfil.
const sover =
  typeof soverKalla === "string" && !/ängen/i.test(soverKalla)
    ? `Ängen är full! ${soverKalla}`
    : soverKalla;

export const ORD: OrdData = { ...bas, repliker: { ...bas.repliker, sover } };
export const BLOCK = blockJson as BlockData;
export const KANNETECKEN = kanneteckenJson as KanneteckenData;
