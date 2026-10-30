import { useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import lasningJson from "../../../data/lasning.json" with { type: "json" };
import { fyll } from "../fyll.ts";
import { ForalderLagring } from "./ForalderLagring.tsx";
import { ArkivVal } from "./ArkivVal.tsx";
import { ljud } from "../ljud.ts";
import { useMinne } from "../minne.ts";
import type { Lage } from "../minne.ts";
import { ForalderLiv } from "../samling.tsx";
import { SaknadeOrd } from "./SaknadeOrd.tsx";
import skapaUi from "../../../data/skapa-ui.json" with { type: "json" };
import { useSkapaInst } from "../skapa/installning.ts";
import { LJUD_AV, LJUD_PA, TEXTER } from "./spelData.ts";

type ForalderDialogProps = {
  startLage: Lage;
  setLage: Dispatch<SetStateAction<Lage>>;
  ljudPa: boolean;
  sparaKopia: () => void;
  filRef: RefObject<HTMLInputElement | null>;
  lasFil: (fil: File) => Promise<void>;
  foralderRad: string | null;
  kopia: unknown;
  lasInKopia: () => void;
  setKopia: Dispatch<unknown>;
  onskelista: string[];
  setSaker: Dispatch<SetStateAction<boolean>>;
  saker: boolean;
  borjaOm: () => void;
  setForalder: Dispatch<SetStateAction<boolean>>;
};

const SKAPA_UI = skapaUi as unknown as { foralder: Record<string, string> };

export function ForalderDialog({ startLage, setLage, ljudPa, sparaKopia, filRef, lasFil, foralderRad, kopia, lasInKopia, setKopia, onskelista, setSaker, saker, borjaOm, setForalder }: ForalderDialogProps) {
  const bokstavsljud = useSkapaInst((x) => x.bokstavsljud);
  const sattBokstavsljud = useSkapaInst((x) => x.sattBokstavsljud);
  const rostPa = useMinne((s) => s.rostPa);
  const effektPa = useMinne((s) => s.effektPa);
  const lasnivaVal = useMinne((s) => s.lasnivaVal);
  const [tal] = useState(() => [10 + Math.floor(Math.random() * 90), 10 + Math.floor(Math.random() * 90)]);
  const [lasSvar, setLasSvar] = useState("");
  const [upplast, setUpplast] = useState(false);
  return (
        <div className="skarm" role="dialog" aria-label="För vuxna" data-testid="foralder">
          <div className="ark sida foralder-ark" ref={(el) => el?.setAttribute("data-testid", "foralder-dialog")}>
            <div className="foralder-topp">
              <h2>För vuxna</h2>
              <button type="button" className="foralder-kryss" data-f5="modal-stang" aria-label="Stäng" ref={(el) => el?.setAttribute("data-testid", "modal-stang")} onClick={() => { setSaker(false); setForalder(false); }}>×</button>
            </div>
            {!upplast ? (
              <div className="vuxen-las">
                <label className="vuxen-las-fraga">
                  {fyll(TEXTER.backup.vuxenlas, { a: tal[0], b: tal[1] })}
                  <input type="text" inputMode="numeric" autoComplete="off" value={lasSvar} onChange={(e) => setLasSvar(e.target.value)} ref={(el) => el?.setAttribute("data-testid", "foralder-svar")} />
                </label>
                <button type="button" className="kort" ref={(el) => el?.setAttribute("data-testid", "foralder-oppna")} onClick={() => { if (Number(lasSvar.trim()) === tal[0] * tal[1]) setUpplast(true); }}>Öppna</button>
              </div>
            ) : null}
            {upplast ? (
            <>
            <ForalderLiv />
            <h3>{SKAPA_UI.foralder.startlage_rubrik}</h3>
            <div className="valj-lage">
              <button
                type="button"
                className={startLage === "skriv" ? "pa" : ""}
                onClick={() => {
                  useMinne.getState().sattStart("skriv");
                  setLage("skriv");
                }}
              >
                {SKAPA_UI.foralder.startlage_skriv}
              </button>
              <button
                type="button"
                className={startLage === "kort" ? "pa" : ""}
                onClick={() => {
                  useMinne.getState().sattStart("kort");
                  setLage("kort");
                }}
              >
                {SKAPA_UI.foralder.startlage_kort}
              </button>
            </div>
            <h3>{SKAPA_UI.foralder.ljuda_rubrik}</h3>
            <div className="valj-lage" data-dal="bokstavsljud">
              <button type="button" className={bokstavsljud ? "pa" : ""} onClick={() => sattBokstavsljud(true)}>
                {SKAPA_UI.foralder.ljuda_pa}
              </button>
              <button type="button" className={bokstavsljud ? "" : "pa"} onClick={() => sattBokstavsljud(false)}>
                {SKAPA_UI.foralder.ljuda_av}
              </button>
            </div>
            <h3>Läsnivå</h3>
            <p>Auto följer hur många djur som hittats. En vuxen kan låsa nivån.</p>
            <div className="valj-lage" data-p4="lasniva-knapp">
              <button type="button" className={lasnivaVal === "auto" ? "pa" : ""} data-p4="lasniva-auto" onClick={() => useMinne.getState().sattLasniva("auto")}>Auto</button>
              <button type="button" className={lasnivaVal === 1 ? "pa" : ""} data-p4="lasniva-1" onClick={() => useMinne.getState().sattLasniva(1)}>Nivå 1</button>
              <button type="button" className={lasnivaVal === 2 ? "pa" : ""} data-p4="lasniva-2" onClick={() => useMinne.getState().sattLasniva(2)}>Nivå 2</button>
              <button type="button" className={lasnivaVal === 3 ? "pa" : ""} data-p4="lasniva-3" onClick={() => useMinne.getState().sattLasniva(3)}>Nivå 3</button>
            </div>
            <h3>Ljud</h3>
            <div className="rad-kort">
            <button
              type="button"
              className={ljudPa ? "pa ljud-knapp" : "ljud-knapp"}
              data-testid="ljud-knapp"
              aria-pressed={ljudPa}
              onClick={() => {
                const nasta = !useMinne.getState().ljudPa;
                useMinne.getState().sattLjud(nasta);
                ljud.satt(nasta);
              }}
            >
              {ljudPa ? LJUD_PA : LJUD_AV}
            </button>
            <button
              type="button"
              className={rostPa ? "pa ljud-knapp" : "ljud-knapp"}
              data-p4="rost-knapp"
              aria-pressed={rostPa}
              onClick={() => useMinne.getState().sattRost(!useMinne.getState().rostPa)}
            >
              {rostPa ? lasningJson.ljud.rost_pa : lasningJson.ljud.rost_av}
            </button>
            <button
              type="button"
              className={effektPa ? "pa ljud-knapp" : "ljud-knapp"}
              data-p4="effekt-knapp"
              aria-pressed={effektPa}
              onClick={() => {
                const nasta = !useMinne.getState().effektPa;
                useMinne.getState().sattEffekt(nasta);
                ljud.satt(nasta);
              }}
            >
              {effektPa ? lasningJson.ljud.effekt_pa : lasningJson.ljud.effekt_av}
            </button>
            </div>
            <ForalderLagring />
            <h3>{TEXTER.backup.rubrik}</h3>
            <p>{TEXTER.backup.spara_hjalp}</p>
            <button type="button" className="kort" data-testid="spara-kopia" onClick={sparaKopia}>
              {TEXTER.backup.spara}
            </button>
            <button type="button" className="kort" data-testid="las-kopia" onClick={() => filRef.current?.click()}>
              {TEXTER.backup.las_in}
            </button>
            <input
              ref={filRef}
              className="dold-fil"
              type="file"
              accept="application/json,.json"
              data-testid="kopia-fil"
              onChange={(e) => {
                const fil = e.target.files?.[0];
                e.target.value = "";
                if (fil) void lasFil(fil);
              }}
            />
            {foralderRad ? <p data-testid="backup-rad">{foralderRad}</p> : null}
            {kopia ? (
              <div data-testid="backup-fraga" role="dialog" aria-label="Bekräfta import">
                <p>{TEXTER.backup.las_in_fraga}</p>
                <div className="rad-kort">
                  <button type="button" className="kort" data-testid="backup-ja" onClick={lasInKopia}>
                    {TEXTER.backup.las_in_ja}
                  </button>
                  <button type="button" className="nej" data-dialog-close onClick={() => setKopia(null)}>
                    {TEXTER.backup.las_in_nej}
                  </button>
                </div>
              </div>
            ) : null}
            <h3>Önskelista</h3>
            <p>Ord som Trollpennan inte kunde än.</p>
            {onskelista.length === 0 ? <p>Inget nytt ord sparat än.</p> : null}
            <ul className="onske-lista" data-testid="onskelista">
              {onskelista.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
            <SaknadeOrd />
            <ArkivVal />
            <h3>{TEXTER.borja_om.knapp}</h3>
            <button type="button" className="farlig" data-testid="borja-om" data-v2="foralder-borja-om" style={{ width: "100%" }} onClick={() => { setSaker(true); requestAnimationFrame(() => requestAnimationFrame(() => document.querySelector("[data-testid=borja-fraga]")?.scrollIntoView({ block: "end" }))); }}>
              {TEXTER.borja_om.knapp}
            </button>
            {saker ? (
              <div data-testid="borja-fraga" role="dialog" aria-label="Bekräfta återställning">
                <p>{TEXTER.borja_om.fraga}</p>
                <div className="rad-kort">
                  <button type="button" className="kort" data-testid="borja-ja" data-v2="foralder-borja-ja" onClick={borjaOm}>
                    {TEXTER.borja_om.ja}
                  </button>
                  <button type="button" className="nej" data-testid="borja-nej" data-v2="foralder-borja-nej" data-dialog-close onClick={() => setSaker(false)}>
                    {TEXTER.backup.las_in_nej}
                  </button>
                </div>
              </div>
            ) : null}
            <h3>{TEXTER.backup.tack_till}</h3>
            <p className="kredit" data-testid="groda-kredit">{TEXTER.backup.groda_kredit}</p>
            <button
              type="button"
              className="stang"
              ref={(el) => el?.setAttribute("data-testid", "foralder-stang")}
              onClick={() => {
                setSaker(false);
                setForalder(false);
              }}
            >
              Stäng
            </button>
            </>
            ) : null}
          </div>
        </div>
  );
}
