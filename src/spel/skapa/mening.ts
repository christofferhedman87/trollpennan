// Nya Skapa: meningen är fortsatt text (textRef), men varje färdigt ord har en källa.
// "skriv" = barnet skrev ordet med tangenterna (kan bli guld), "kort" = ett hjälpkort eller ett förslag,
// "auto" = ett småord som ett kort la till (en, ett, med, som …) och som följer med kortet när det tas bort.
export type OrdKalla = "skriv" | "kort" | "auto";
export type MOrd = { t: string; k: OrdKalla };

/** Dela texten i färdiga ord och det ord som skrivs just nu (efter sista mellanslaget). */
export function delaText(text: string): { ord: string[]; skriv: string } {
  const ren = text.replace(/^\s+/, "");
  if (!ren) return { ord: [], skriv: "" };
  const slutar = /\s$/.test(ren);
  const delar = ren.split(/\s+/).filter(Boolean);
  if (slutar) return { ord: delar, skriv: "" };
  return { ord: delar.slice(0, -1), skriv: delar.at(-1) ?? "" };
}

/** Para ihop textens ord med sparade källor. Ord som ändrats utanför Skapa (prov, Ordboken) räknas som skrivna,
 *  precis som förut när hela meningen fick hand = true. Ett sparat ord kan bestå av flera ("sprutar eld"). */
export function justera(ord: string[], meta: readonly MOrd[]): MOrd[] {
  const ut: MOrd[] = [];
  let j = 0;
  for (let i = 0; i < ord.length; ) {
    let hittad = false;
    for (let s = j; s < meta.length && s < j + 4; s++) {
      const delar = meta[s]!.t.split(" ");
      if (delar.every((d, n) => (ord[i + n] ?? "").toLocaleLowerCase("sv") === d.toLocaleLowerCase("sv"))) {
        for (let n = 0; n < delar.length; n++) ut.push({ t: ord[i + n]!, k: meta[s]!.k });
        i += delar.length;
        j = s + 1;
        hittad = true;
        break;
      }
    }
    if (!hittad) {
      ut.push({ t: ord[i]!, k: "skriv" });
      i++;
    }
  }
  return ut;
}

export function tillText(ord: readonly MOrd[], skriv = ""): string {
  const bas = ord.map((o) => o.t).join(" ");
  if (!skriv) return bas ? `${bas} ` : "";
  return bas ? `${bas} ${skriv}` : skriv;
}

/** Ord för ord, med flerordsfraser delade, så att justera() kan läsa dem. */
export function platta(ord: readonly MOrd[]): MOrd[] {
  return ord.flatMap((o) => o.t.split(" ").filter(Boolean).map((t) => ({ t, k: o.k })));
}
