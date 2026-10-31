import { useMinne } from "../minne.ts";
import { useSpel } from "../ui/SpelKontext.ts";
import { useArkLapp } from "./arkLapp.ts";
import { aktivtMal, type MalIndata } from "./bokMal.ts";
import { aktivtUppdrag, BENGTSSON_BILD } from "./uppdragLapp.ts";
import { uppdragText } from "../aventyr.ts";
import { uppdragForslag } from "../ideRad.ts";
import { ordFranForm } from "../../tolk/lexikon.ts";
import { ONSK_BYGG } from "../onska.ts";
import { gavoNamn, gavoRuta } from "../ui/gavoRuta.ts";
import { bestamdAv } from "../ui/hjalp.ts";
import { fyll } from "../fyll.ts";
import { dalStyr } from "../dal/dalStyr.ts";
import { ikon, kortBild } from "./ikoner.ts";
import { platsLapp } from "./platsLapp.ts";
import uiJson from "../../../data/skapa-ui.json" with { type: "json" };
import vaktarJson from "../../../data/vaktardjur.json" with { type: "json" };
const UI = uiJson as unknown as { lapp: Record<string, string>; bokmal: { gavo_ideer: string[]; tomt_ideer: string[]; plats_ideer: Record<string, string[]> } };
export function useBokMal() {
  const k = useSpel();
  const ark = useArkLapp((s) => s.lapp);
  const spar = useMinne((s) => s.uppdrag);
  const plats = useMinne((s) => s.plats);
  const { onskan, gavaTill, ang } = k.t;
  const kallor: MalIndata = {};
  if (gavaTill) kallor.gava = { id: gavaTill, lapp: { fran: fyll(UI.lapp.gava_fran, { djur: gavoNamn(gavaTill) }), text: gavoRuta(gavaTill), bild: ikon("ui", "agg") }, losningar: UI.bokmal.gavo_ideer, malDjur: gavaTill.startsWith("egen:") ? gavaTill.slice(5) : null };
  const u = ark === "uppdrag" ? aktivtUppdrag(spar) : undefined;
  if (u) kallor.uppdrag = { id: u.id, lapp: { fran: UI.lapp.uppdrag_fran, text: uppdragText(u, ang[0]?.kropp), bild: BENGTSSON_BILD, portratt: true }, losningar: uppdragForslag(u, ang[0]?.kropp), malDjur: ang[0]?.uid, krav: u.krav };
  if (k.vy.visaOnskaHjalp && onskan) {
    const d = k.vy.onskaDjur;
    const djurord = d ? `${ordFranForm(d.kropp)?.genus === "n" ? "ett" : "en"} ${d.kropp}` : "";
    const exempel = [...k.vy.onskaEx, ...(onskan.kalla === "bygg" ? ONSK_BYGG.onskningar.find((o) => o.id === onskan.id)?.exempel ?? [] : [])]
      .filter((e) => !e.includes("{djur}") || !!djurord).map((e) => fyll(e, { djur: djurord }));
    kallor.onskan = { id: onskan.id, lapp: { fran: fyll(UI.lapp.onskan_fran, { djur: d ? bestamdAv(d.kropp, true) : UI.lapp.djur_reserv }), text: onskan.text, bild: d ? kortBild(d.kropp) : ikon("ui", "stjarna") }, losningar: exempel, malDjur: onskan.uid };
  }
  if (ark === "tomt") {
    const t = dalStyr.lage().vald;
    kallor.tomt = { id: String(t), lapp: { fran: UI.lapp.tomt_fran, text: fyll(UI.lapp.tomt_text, { n: t == null ? "" : t + 1 }), bild: kortBild("hage") }, losningar: UI.bokmal.tomt_ideer };
  }
  const v = vaktarJson[plats as keyof typeof vaktarJson];
  if (ark === "vaktare" && v) kallor.vaktare = { id: v.id, lapp: { fran: v.namn, text: v.gata, bild: kortBild(v.djur) }, losningar: v.hjalp };
  const p = platsLapp(plats);
  if (p) kallor.plats = { id: plats, lapp: { ...p, bild: ikon("ui", "karta") }, losningar: UI.bokmal.plats_ideer[plats] ?? [] };
  return aktivtMal(kallor);
}
