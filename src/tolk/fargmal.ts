import type { Ord } from "./typer.ts";
import type { Sem } from "./tolktillstand.ts";

/** Bind ett färgord till nästa tolkade sak eller djur, även genom beskrivande led. */
export function nastaFargmal(sem: Sem[], i: number, ensamSak: Ord | null, huvud: Sem | undefined): "sak" | "huvud" | "annat" | "osakert" | "inget" {
  let osakert = false;
  for (const s of sem.slice(i + 1)) {
    if (s.t === "artikel" || s.t === "antal" || s.t === "boost" || s.t === "led") continue;
    if (s.t === "okand") { osakert = true; continue; }
    if (s.t === "funk") { if (s.v === "och") continue; return osakert ? "osakert" : "inget"; }
    if (s === huvud) return "huvud";
    if (s.t === "komp") return s.suffix.kind === "tillbehor" ? "sak" : "annat";
    if (s.t !== "ord") return osakert ? "osakert" : "inget";
    if (s.o === ensamSak) return "huvud";
    if (s.o.klass === "foremal" || s.o.klass === "tillbehor") return "sak";
    if ((s.o.klass === "formaga" || s.o.klass === "monster") && s.o.efter === "med") return "sak";
    if (s.o.klass === "djur") return "annat";
  }
  return osakert ? "osakert" : "inget";
}
