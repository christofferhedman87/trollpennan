import type { Ord } from "../../tolk/typer.ts";
import * as rostKo from "../rostKo.ts";
import { kanEtikett, kortFargHex, kortIkon, kortStorlekKlass } from "./hjalp.ts";

type BokKortProps = {
  ord: Ord;
  vald: boolean;
  markerad: boolean;
  gang: number;
  valjKort: (ord: Ord) => void;
  oppnaSkrivMig: (ord: Ord) => void;
};

/** Illustrerat ordkort. Lyssnaknappen är ett syskon till väljknappen så HTML förblir giltig. */
export function BokKort({ ord, vald, markerad, gang, valjKort, oppnaSkrivMig }: BokKortProps) {
  const etikett = kanEtikett(ord);
  const ikonSrc = kortIkon(ord.id, ord.klass);
  const fargHex = ikonSrc ? null : kortFargHex(ord.id);
  const storlekKlass = kortStorlekKlass(ord.id);
  const klass = `${vald ? "kort vald" : markerad ? "kort markerad" : "kort"} ord-kort`;

  return (
    <div className="kort-cell" data-c2="kort-cell">
      <div className={klass} data-testid={`kort-${ord.id}`} data-c2="ord-kort" data-ord-id={ord.id} data-ord-klass={ord.klass}>
        <button type="button" aria-pressed={vald} className="kort-valj" onClick={() => valjKort(ord)}>
          {ikonSrc ? (
            <img className={`kort-ikon ${storlekKlass}`} alt="" src={ikonSrc} />
          ) : fargHex ? (
            <span className="kort-farg-swatch" style={{ backgroundColor: fargHex }} aria-hidden="true" />
          ) : null}
          <span className="kort-etikett">{etikett}</span>
          {vald ? (
            <span className="kort-vald-badge" data-c2="kort-vald-text">
              <span data-c2="kort-vald-markering">✓ Vald</span>
            </span>
          ) : null}
        </button>
        <button
          type="button"
          className="kort-lyssna-knapp"
          data-c2="kort-lyssna"
          aria-label={`Lyssna på ${etikett}`}
          onClick={(e) => {
            e.stopPropagation();
            rostKo.lasUpp(etikett);
          }}
        >
          🔊
        </button>
      </div>
      {gang >= 3 ? (
        <button type="button" className="skriv-mig" onClick={() => oppnaSkrivMig(ord)}>
          Skriv mig! {ord.visa.slice(0, 2)}…
        </button>
      ) : null}
    </div>
  );
}
