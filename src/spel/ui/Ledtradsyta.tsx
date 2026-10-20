import { useEffect, useMemo } from "react";
import hemligt from "../../../data/hemligt.json" with { type: "json" };
import { fyll } from "../fyll.ts";
import { aktivGata, gatUrval, nastaGata } from "../gata.ts";
import { platsMed } from "../platser.ts";
import { useMinne } from "../minne.ts";
import { sag } from "../rost.ts";
import { LED } from "./spelData.ts";
import { hemligaDjur } from "./hemliga.ts";

/**
 * Synlig ledtrådsyta: en gåta om ett hemligt djur som inte är hittat, med första bokstaven och ett streck per bokstav.
 * R9G: gåtan är låst (minne.gataId) tills ordet hittats eller barnet trycker "Ny gåta". Under ett uppdrag visas ingen gåta
 * alls (R9I), så den gamla hopfällda (`kompakt`) varianten är borttagen (B6.1).
 * B6.1: på en plats väljs platsens egna hemliga djur först (`hemliga` i data/platser.json), sedan alla andra.
 */
export function Ledtradsyta({ funna }: { funna: Record<string, unknown> }) {
  const alla = useMemo(() => hemligaDjur(), []);
  const gataId = useMinne((s) => s.gataId);
  const sattGataId = useMinne((s) => s.sattGataId);
  const plats = useMinne((s) => s.plats);
  const kvar = alla.filter((o) => !funna[o.id]);
  const kvarIds = gatUrval(
    kvar.map((o) => o.id),
    platsMed(plats)?.hemliga,
  );
  const id = aktivGata(kvarIds, gataId);
  useEffect(() => {
    if (id && id !== gataId) sattGataId(id);
  }, [id, gataId, sattGataId]);
  // TTS-2: gåtan läses upp en gång per gåta och spelomgång (Trollpennans röst)
  const gataText = id ? LED[id]?.gata : undefined;
  useEffect(() => {
    if (id && gataText) sag(gataText, `gata:${id}`);
  }, [id, gataText]);
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
  return (
    <div className="ledtrad" data-testid="ledtrad" data-hemligt={id}>
      {rubrik}
      {kropp}
    </div>
  );
}
