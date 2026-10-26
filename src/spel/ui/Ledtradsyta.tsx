import { useEffect, useMemo, useState } from "react";
import hemligt from "../../../data/hemligt.json" with { type: "json" };
import lasningJson from "../../../data/lasning.json" with { type: "json" };
import { fyll } from "../fyll.ts";
import { aktivGata, nastaGata } from "../gata.ts";
import { aktuellLasniva, lasnivaUrval, ledtradsSteg } from "../lasniva.ts";
import { platsMed } from "../platser.ts";
import { useMinne } from "../minne.ts";
import * as rostKo from "../rostKo.ts";
import { LED } from "./spelData.ts";
import { hemligaDjur } from "./hemliga.ts";

/**
 * Synlig ledtrådsyta: en gåta om ett hemligt djur som inte är hittat, med första bokstaven och ett streck per bokstav.
 * R9G: gåtan är låst (minne.gataId) tills ordet hittats eller barnet trycker "Ny gåta".
 * V3: parametern `kompakt` finns kvar. F2: kortet är alltid öppet; barnet byter flik i stället för att fälla ihop gåtan.
 */
export function Ledtradsyta({ funna, kompakt = false }: { funna: Record<string, unknown>; kompakt?: boolean }) {
  const alla = useMemo(() => hemligaDjur(), []);
  const gataId = useMinne((s) => s.gataId);
  const sattGataId = useMinne((s) => s.sattGataId);
  const plats = useMinne((s) => s.plats);
  const lasnivaVal = useMinne((s) => s.lasnivaVal);
  const hittade = alla.filter((o) => Boolean(funna[o.id])).map((o) => o.id);
  const allaOhittade = alla.filter((o) => !funna[o.id]).map((o) => o.id);
  const niva = aktuellLasniva(hittade, lasnivaVal);
  const kvar = lasnivaUrval(allaOhittade, platsMed(plats)?.hemliga, niva);
  const vald = aktivGata(kvar, gataId);
  useEffect(() => {
    if (vald && vald !== gataId) sattGataId(vald);
  }, [vald, gataId, sattGataId]);
  const [steg, setSteg] = useState<0 | 1 | 2>(0);
  useEffect(() => {
    setSteg(0);
  }, [vald]);
  const gataText = vald ? LED[vald]?.gata : undefined;
  useEffect(() => {
    if (!vald || !gataText) return;
    rostKo.anmal({ text: gataText, kalla: "gata", nyckel: `gata:${vald}` });
    return () => rostKo.stryk(gataText);
  }, [vald, gataText]);
  const stegData = vald ? ledtradsSteg(vald, steg) : null;
  if (!vald) return <p className="ledtrad-klar" data-testid="ledtrad">{hemligt.alla_hittade}</p>;
  const led = LED[vald]!;
  const streck = `${led.forsta} ${Array.from({ length: Math.max(0, led.langd - 1) }, () => "_").join(" ")}`.trim();
  const framsteg = fyll(hemligt.hittade, { n: hittade.length, total: alla.length });
  const lasText = steg >= 1 && stegData?.extraText ? `${led.gata} ${stegData.extraText}` : led.gata;
  return (
    <div className="ledtrad" data-testid="ledtrad" data-hemligt={vald} data-v3={kompakt ? "ledtrad-kompakt" : "ledtrad-full"} data-kompakt={kompakt ? "ja" : "nej"}>
      <b>
        {hemligt.ledtrad_rubrik} <span className="ledtrad-framsteg">{framsteg}</span>{" "}
        <span className="ledtrad-niva" data-p4="lasniva-badge">Nivå {niva}</span>
      </b>
      <p className="ledtrad-gata" data-testid="ledtrad-gata">{led.gata}</p>
      <div className="ledtrad-rad">
        <span className="ledtrad-streck" data-testid="ledtrad-streck" aria-label={`${led.langd} bokstäver, börjar på ${led.forsta}`}>{stegData?.streck ?? streck}</span>
        <button type="button" className="nej" data-testid="ledtrad-ny" onClick={() => { setSteg(0); sattGataId(nastaGata(kvar, vald)); }}>{hemligt.ny_gata}</button>
      </div>
      {stegData?.extraText ? <p className="ledtrad-extra" data-p4="ledtrad-extra">{stegData.extraText}</p> : null}
      {stegData?.ljudText ? <p className="ledtrad-ljud" data-p4="ledtrad-ljud">{stegData.ljudText}</p> : null}
      <div className="ledtrad-knappar">
        <button type="button" className="lyssna-knapp" data-p4="lyssna-gata" aria-label={lasningJson.lyssna.aria_gata} onClick={() => rostKo.lasUpp(lasText)}>🔊 {lasningJson.lyssna.knapp}</button>
        {steg < 2 && (
          <button type="button" className="lyssna-knapp ledtrad-knapp" data-p4="ledtrad-knapp" onClick={() => setSteg((s) => (s < 2 ? ((s + 1) as 0 | 1 | 2) : s))}>
            {lasningJson.ledtrad.knapp} ({steg + 1}/2)
          </button>
        )}
      </div>
      <p className="ledtrad-hint" data-testid="ledtrad-hint">{hemligt.skriv_hint}</p>
    </div>
  );
}
