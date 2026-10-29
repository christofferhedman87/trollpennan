// Block 5 (bygga i världen): Byggboken får "Byggidéer" (tokiga färdiga meningar) och "Bygg själv", där barnet
// väljer kort i fyra steg och ser meningen växa ord för ord innan den byggs. Läsning först, skrivning när hon vill.
import { useState } from "react";
import { useMinne } from "../minne.ts";
import { ordMedId } from "../../tolk/lexikon.ts";
import { ONSK_BYGG } from "../onska.ts";
import { BYGGBOK, START_VAL, byggMening, type ByggVal } from "./byggbok.ts";
import "./byggbok.css";

type Steg = 0 | 1 | 2 | 3;

function Kort({ vald, onClick, children }: { vald: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={vald ? "kort vald" : "kort"} aria-pressed={vald} onClick={onClick}>
      {children}
    </button>
  );
}

export function ByggKomponist({ byggFras }: { byggFras: (fras: string) => void }) {
  const [steg, setSteg] = useState<Steg>(0);
  const [val, setVal] = useState<ByggVal>(START_VAL);
  const satt = (del: Partial<ByggVal>) => setVal((v) => ({ ...v, ...del }));
  const vaxla = <K extends keyof ByggVal>(k: K, varde: ByggVal[K]) => satt({ [k]: val[k] === varde ? null : varde } as Partial<ByggVal>);
  const mening = byggMening(val);
  // Block 8: en byggönskan visar sina egna exempel först bland idéerna.
  const onskan = useMinne((st) => st.onskan);
  const djur = useMinne((st) => (onskan ? (st.ang.find((a) => a.uid === onskan.uid) ?? st.hemma.find((h) => h.spec.uid === onskan.uid)?.spec) : undefined));
  const djurOrd = djur ? ordMedId(djur.kropp) : undefined;
  const djurFras = djurOrd ? `${djurOrd.genus === "n" ? "ett" : "en"} ${djurOrd.visa}` : "";
  const onskeIdeer = onskan?.kalla === "bygg" ? (ONSK_BYGG.onskningar.find((o) => o.id === onskan.id)?.exempel ?? []).map((e) => e.replace("{djur}", djurFras)).filter((e) => !e.includes("{")) : [];
  const ideer = [...new Set([...onskeIdeer, ...BYGGBOK.ideer])];
  return (
    <div className="bygg-komponist" data-dal="bygg-komponist">
      <h3>{BYGGBOK.rubrik_ideer}</h3>
      <div className="bygg-ideer">
        {ideer.map((f) => (
          <button key={f} type="button" className="kort bygg-ide" data-dal="bygg-ide" onClick={() => byggFras(f)}>
            {f}
          </button>
        ))}
      </div>
      <h3>{BYGGBOK.rubrik_sjalv}</h3>
      <p className="bygg-mening" data-dal="bygg-mening" aria-live="polite">
        {mening}
      </p>
      <div className="steg-piller-rad" role="group" aria-label={BYGGBOK.rubrik_sjalv}>
        {BYGGBOK.steg.map((s, i) => (
          <button key={s} type="button" aria-pressed={steg === i} className={steg === i ? "steg-piller aktiv" : "steg-piller"} onClick={() => setSteg(i as Steg)}>
            {s}
          </button>
        ))}
      </div>
      <div className="rutnat bygg-val">
        {steg === 0
          ? BYGGBOK.funktioner.map(([ikon, f]) => (
              <Kort key={f} vald={val.funktion === f} onClick={() => satt({ funktion: f })}>
                {ikon} {f}
              </Kort>
            ))
          : null}
        {steg === 1
          ? BYGGBOK.former.map(([ikon, f]) => (
              <Kort key={f} vald={val.form === f} onClick={() => vaxla("form", f)}>
                {ikon} {f}
              </Kort>
            ))
          : null}
        {steg === 2 ? (
          <>
            {BYGGBOK.material.map(([ikon, m]) => (
              <Kort key={m} vald={val.material === m} onClick={() => vaxla("material", m)}>
                {ikon} {m}
              </Kort>
            ))}
            {BYGGBOK.farger.map((f) => (
              <Kort key={f} vald={val.farg === f} onClick={() => vaxla("farg", f)}>
                🎨 {f}
              </Kort>
            ))}
          </>
        ) : null}
        {steg === 3 ? (
          <>
            {BYGGBOK.delar.map(([ikon, d]) => (
              <Kort key={d} vald={val.del === d} onClick={() => vaxla("del", d)}>
                {ikon} {d}
              </Kort>
            ))}
            {BYGGBOK.egenskaper.map(([ikon, e]) => (
              <Kort key={e} vald={val.egenskap === e} onClick={() => vaxla("egenskap", e)}>
                {ikon} {e}
              </Kort>
            ))}
          </>
        ) : null}
      </div>
      <button type="button" className="bygg-knapp" data-dal="bygg-knapp" onClick={() => byggFras(mening)}>
        🔨 {BYGGBOK.bygg_knapp}
      </button>
    </div>
  );
}
