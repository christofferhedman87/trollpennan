import { useState } from "react";
import { aterstallArkiv, listaArkiv, type VarldsArkiv } from "../arkiv.ts";
import { laddaOmRent } from "../start.ts";
import { fyll } from "../fyll.ts";
import { TEXTER } from "./spelData.ts";
export function ArkivVal() {
  const [arkiv] = useState(() => { try { return listaArkiv(window.localStorage); } catch { return []; } });
  const [vald, setVald] = useState<VarldsArkiv | null>(null);
  const [fel, setFel] = useState(false);
  function aterstall() {
    if (!vald) return;
    try {
      if (!aterstallArkiv(window.localStorage, vald.nyckel)) { setFel(true); return; }
      laddaOmRent(window.localStorage, vald.data);
    } catch { setFel(true); }
  }
  return <section data-arkiv="lista">
    <h3>{TEXTER.backup.arkiv_rubrik}</h3>
    <p>{TEXTER.backup.arkiv_hjalp}</p>
    {!arkiv.length ? <p>{TEXTER.backup.arkiv_tom}</p> : null}
    {arkiv.map((x) => <button key={x.nyckel} type="button" className="kort" onClick={() => { setVald(x); setFel(false); }}>
      {fyll(TEXTER.backup.arkiv_knapp, { datum: new Date(x.tid).toLocaleString("sv-SE") })}
    </button>)}
    {vald ? <div role="group" data-arkiv="fraga">
      <p>{TEXTER.backup.arkiv_fraga}</p>
      <button type="button" className="kort" onClick={aterstall}>{TEXTER.backup.arkiv_ja}</button>
      <button type="button" className="nej" onClick={() => setVald(null)}>{TEXTER.backup.arkiv_nej}</button>
    </div> : null}
    {fel ? <p role="status">{TEXTER.backup.arkiv_fel}</p> : null}
  </section>;
}
