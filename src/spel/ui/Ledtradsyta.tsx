import { useEffect, useMemo, useState } from "react";
import hemligt from "../../../data/hemligt.json" with { type: "json" };
import { fyll } from "../fyll.ts";
import { aktivGata, nastaGata } from "../gata.ts";
import { useMinne } from "../minne.ts";
import { LED } from "./spelData.ts";
import { hemligaDjur } from "./hemliga.ts";

/**
 * Synlig ledtrådsyta: en gåta om ett hemligt djur som inte är hittat, med första bokstaven och ett streck per bokstav.
 * R9G: gåtan är låst (minne.gataId) tills ordet hittats eller barnet trycker "Ny gåta". Under ett uppdrag (`kompakt`)
 * syns bara en stängd rubrik; gåtan finns inte i DOM förrän barnet öppnar den.
 */
export function Ledtradsyta({ funna, kompakt = false }: { funna: Record<string, unknown>; kompakt?: boolean }) {
  const alla = useMemo(() => hemligaDjur(), []);
  const gataId = useMinne((s) => s.gataId);
  const sattGataId = useMinne((s) => s.sattGataId);
  const [oppen, setOppen] = useState(false);
  const kvar = alla.filter((o) => !funna[o.id]);
  const kvarIds = kvar.map((o) => o.id);
  const id = aktivGata(kvarIds, gataId);
  useEffect(() => {
    if (id && id !== gataId) sattGataId(id);
  }, [id, gataId, sattGataId]);
  const hittade = alla.length - kvar.length;
  if (!id) return <p className="ledtrad-klar" data-testid="ledtrad">{hemligt.alla_hittade}</p>;
  const led = LED[id]!;
  const streck = `${led.forsta} ${Array.from({ length: Math.max(0, led.langd - 1) }, () => "_").join(" ")}`.trim();
  const rubrik = (
    <b>
      {hemligt.ledtrad_rubrik} <small>{fyll(hemligt.hittade, { n: hittade, total: alla.length })}</small>
    </b>
  );
  const kropp = (
    <>
      <p className="ledtrad-gata" data-testid="ledtrad-gata">{led.gata}</p>
      <div className="ledtrad-rad">
        <span className="ledtrad-streck" data-testid="ledtrad-streck" aria-label={`${led.langd} bokstäver, börjar på ${led.forsta}`}>{streck}</span>
        <button type="button" className="nej" data-testid="ledtrad-ny" onClick={() => sattGataId(nastaGata(kvarIds, id))}>
          {hemligt.ny_gata}
        </button>
      </div>
      <p className="ledtrad-hint" data-testid="ledtrad-hint">{hemligt.skriv_hint}</p>
    </>
  );
  if (kompakt)
    return (
      <details className="ledtrad kompakt" data-testid="ledtrad" data-hemligt={id} open={oppen} onToggle={(e) => setOppen(e.currentTarget.open)}>
        <summary>
          {rubrik} {oppen ? null : <small className="ledtrad-visa">{hemligt.visa_gata}</small>}
        </summary>
        {oppen ? kropp : null}
      </details>
    );
  return (
    <div className="ledtrad" data-testid="ledtrad" data-hemligt={id}>
      {rubrik}
      {kropp}
    </div>
  );
}
