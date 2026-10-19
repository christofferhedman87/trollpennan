import { useMemo, useState } from "react";
import { ordLista } from "@/tolk/tolka.ts";
import hemligt from "../../../data/hemligt.json" with { type: "json" };
import { fyll } from "../fyll.ts";
import { LED } from "./spelData.ts";

/** R9: hemliga djur = ord med nivå "fritt" och klass djur som har en gåta i data/ledtradar.json. */
export function hemligaDjur() {
  return ordLista().filter((o) => o.klass === "djur" && o.niva === "fritt" && LED[o.id]);
}

/** Synlig ledtrådsyta: en gåta om ett hemligt djur som inte är hittat, med första bokstaven och ett streck per bokstav. */
export function Ledtradsyta({ funna }: { funna: Record<string, unknown> }) {
  const alla = useMemo(() => hemligaDjur(), []);
  const [nr, setNr] = useState(() => Math.floor(Math.random() * 1000));
  const kvar = alla.filter((o) => !funna[o.id]);
  const hittade = alla.length - kvar.length;
  if (!kvar.length) return <p className="ledtrad-klar" data-testid="ledtrad">{hemligt.alla_hittade}</p>;
  const o = kvar[nr % kvar.length]!;
  const led = LED[o.id]!;
  const streck = `${led.forsta} ${Array.from({ length: Math.max(0, led.langd - 1) }, () => "_").join(" ")}`.trim();
  return (
    <div className="ledtrad" data-testid="ledtrad" data-hemligt={o.id}>
      <b>
        {hemligt.ledtrad_rubrik} <small>{fyll(hemligt.hittade, { n: hittade, total: alla.length })}</small>
      </b>
      <p className="ledtrad-gata" data-testid="ledtrad-gata">{led.gata}</p>
      <div className="ledtrad-rad">
        <span className="ledtrad-streck" data-testid="ledtrad-streck" aria-label={`${led.langd} bokstäver, börjar på ${led.forsta}`}>{streck}</span>
        <button type="button" className="nej" data-testid="ledtrad-ny" onClick={() => setNr((n) => n + 1)}>
          {hemligt.ny_gata}
        </button>
      </div>
    </div>
  );
}
