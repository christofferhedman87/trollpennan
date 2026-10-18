import type { Dispatch, SetStateAction } from "react";
import { Lock, Pencil } from "lucide-react";
import type { ForslagKort, Ord } from "@/tolk/typer.ts";
import upplevelse from "../../../data/upplevelse.json";
import { NPC, TEXTER_AV, UPP, VILDA, uppdragText } from "../aventyr.ts";
import type { Sparad } from "../brygga.ts";
import { fyll } from "../fyll.ts";
import type { Hemdjur, Lage, OnskaSpar } from "../minne.ts";
import { OnskaAnsikte } from "./OnskaAnsikte.tsx";
import { bestamdAv, frasForByggOrd, kanEtikett, kortIkon } from "./hjalp.ts";
import { FIR, FLIKAR, RADER, TEXTER } from "./spelData.ts";
import type { Forslag, SidaBygg, Slot, Varld } from "./typer.ts";

type BokSkarmProps = {
  stangBok: () => void;
  andrar: boolean;
  panel: "spel" | "byggbok" | "uppdrag";
  lage: Lage;
  setLage: Dispatch<SetStateAction<Lage>>;
  setForslag: Dispatch<SetStateAction<Forslag | null>>;
  byggPuff: string | null;
  onskaOpp: boolean;
  onskan: OnskaSpar | null;
  onskaSyns: boolean;
  onskaDjur: Sparad | undefined;
  onskaEx: string[];
  fyllExempel: (ex: string) => void;
  gavaTill: string | null;
  ang: Sparad[];
  hemma: Hemdjur[];
  varld: Varld;
  forslag: Forslag | null;
  valjForslag: (kortet: ForslagKort) => void;
  nejForslag: () => void;
  behover: { text: string; djur: { id: string; visa: string; }[]; } | null;
  utfor: (raw: string, opt: { hand: boolean; inteGuld?: string[]; }) => void;
  flik: Slot;
  onskaKort: Ord[];
  setFlik: Dispatch<SetStateAction<Slot>>;
  kort: Ord[];
  val: Partial<Record<Slot, Ord>>;
  onskaIds: Set<string>;
  kortGang: Record<string, number>;
  valjKort: (ord: Ord) => void;
  oppnaSkrivMig: (ord: Ord) => void;
  text: string;
  omrade: string | null;
  visaOnskaHjalp: boolean;
  vaknaNu: () => void;
  vaknaText: string;
  skrivTecken: (bit: string) => void;
  sudda: () => void;
  uppFlik: "pagar" | "klar";
  setUppFlik: Dispatch<SetStateAction<"pagar" | "klar">>;
  uppdragSpar: Record<string, "pagar" | "klar">;
  byggSida: SidaBygg;
  agdaSidor: SidaBygg[];
  setByggSidaId: Dispatch<SetStateAction<string>>;
  setByggPuff: Dispatch<SetStateAction<string | null>>;
  byggFras: (fras: string) => void;
  kopRad: string | null;
  lastaSidor: SidaBygg[];
  forsokKop: (slag: "djur" | "bygg", id: string, titel: string, pris: number) => void;
};

export function BokSkarm({ stangBok, andrar, panel, lage, setLage, setForslag, byggPuff, onskaOpp, onskan, onskaSyns, onskaDjur, onskaEx, fyllExempel, gavaTill, ang, hemma, varld, forslag, valjForslag, nejForslag, behover, utfor, flik, onskaKort, setFlik, kort, val, onskaIds, kortGang, valjKort, oppnaSkrivMig, text, omrade, visaOnskaHjalp, vaknaNu, vaknaText, skrivTecken, sudda, uppFlik, setUppFlik, uppdragSpar, byggSida, agdaSidor, setByggSidaId, setByggPuff, byggFras, kopRad, lastaSidor, forsokKop }: BokSkarmProps) {
  return (
      <div className="bok-skarm" data-testid="bok-skarm" onClick={stangBok}>
      <section className={andrar ? "bok andrar" : "bok"} data-andrar={andrar ? "ja" : "nej"} role="dialog" aria-label="Pennans bok" onClick={(e) => e.stopPropagation()}>
        <header className="bok-huvud">
          <h2>{panel === "byggbok" ? TEXTER.flikar.byggboken : "Pennans bok"}</h2>
          <button
            type="button"
            className={lage === "skriv" ? "penna pa" : "penna"}
            aria-label={lage === "skriv" ? "Visa ordkort" : "Skriv själv"}
            data-testid="pennan"
            onClick={() => {
              setLage((l) => (l === "skriv" ? "kort" : "skriv"));
              setForslag(null);
            }}
          >
            <Pencil aria-hidden />
          </button>
          <button type="button" className="stang-x" data-testid="stang-bok" aria-label="Stäng" onClick={stangBok}>
            ×
          </button>
        </header>
        {byggPuff ? (
          <p className="bygg-puff" data-testid="bygg-puff">
            {byggPuff}
          </p>
        ) : null}

        {panel === "spel" || (panel === "byggbok" && lage === "skriv") ? (
          <>
            <div className="bok-mitt">
            {(onskaOpp || (onskan && !onskaSyns)) && onskan ? (
              <div className="onska-remsa" data-testid="onska-remsa">
                {andrar && onskaDjur ? (
                  <div className="onska-topp" data-testid="onska-topp">
                    <OnskaAnsikte djur={onskaDjur} />
                    <p className="onska-text">
                      {fyll(FIR.onskan.onskar, { djur: bestamdAv(onskaDjur.kropp, true) })} {onskan.text}
                    </p>
                  </div>
                ) : (
                  <p className="onska-text">
                    ★ {FIR.onskan.rubrik} {onskan.text}
                  </p>
                )}
                {onskaEx.length ? (
                  <div className="onska-hjalp" data-testid="onska-hjalp">
                    <p className="onska-led">{FIR.onskan.led}</p>
                    <div className="rad-kort">
                      {onskaEx.map((ex, i) => (
                        <button
                          key={ex}
                          type="button"
                          className="onska-chip"
                          data-testid={`onska-ex-${i}`}
                          onClick={() => fyllExempel(ex)}
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {gavaTill ? (
              <div className="onska-remsa" data-testid="gava-remsa">
                <p>
                  {fyll(VILDA.regler.ruta, {
                    namn: gavaTill.startsWith("egen:")
                      ? (ang.find((a) => a.uid === gavaTill.slice(5))?.formel ??
                        hemma.find((h) => h.spec.uid === gavaTill.slice(5))?.spec.formel ??
                        "")
                      : (VILDA.djur.find((d) => d.id === gavaTill)?.namn ?? ""),
                  })}
                </p>
              </div>
            ) : null}
            {!gavaTill && !andrar && varld === "ang" ? (
              <div className="skapar-guide" data-testid="skapar-guide">
                <p>{upplevelse.guide}</p>
                <details>
                  <summary>{upplevelse.examplesTitle}</summary>
                  <div className="ideer">
                    {upplevelse.examples.map(ex => <button type="button" className="kort" key={ex} onClick={() => fyllExempel(ex)}>{ex}</button>)}
                  </div>
                </details>
              </div>
            ) : null}
            {forslag ? (
              <div className="forslag" data-testid="forslag">
                <p>{forslag.text}</p>
                <div className="rad-kort">
                  {forslag.forslag.map((f) => (
                    <button key={f.id} type="button" className="kort" data-testid={`forslag-${f.id}`} onClick={() => valjForslag(f)}>
                      {f.visa}
                    </button>
                  ))}
                  <button type="button" className="nej" data-testid="nej" onClick={nejForslag}>
                    Nej
                  </button>
                </div>
              </div>
            ) : null}
            {behover && !forslag ? (
              <div className="behover" data-testid="behover">
                <p>{behover.text}</p>
                <div className="rad-kort">
                  {behover.djur.map((d) => (
                    <button key={d.id} type="button" className="kort" data-testid={`prova-${d.id}`} onClick={() => utfor(d.id, { hand: false })}>
                      {d.visa}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {lage === "kort" && !forslag && !behover ? (
              <>
                <div className="flikar" role="tablist">
                  {FLIKAR.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      role="tab"
                      aria-selected={flik === f.id}
                      className={["flik", flik === f.id ? "pa" : "", onskaKort.some((o) => o.klass === f.id) ? "traff" : ""].filter(Boolean).join(" ")}
                      onClick={() => {
                        setFlik(f.id);
                        document.querySelector(".kort-yta")?.scrollTo(0, 0);
                      }}
                    >
                      {f.namn}
                    </button>
                  ))}
                </div>
                <div className="kort-yta">
                  <div className="rutnat">
                    {kort.map((ord) => {
                      const vald = val[ord.klass as Slot]?.id === ord.id;
                      const markerad = onskaIds.has(ord.id);
                      const gang = kortGang[ord.id] ?? 0;
                      return (
                        <div key={ord.id} className="kort-cell">
                          <button
                            type="button"
                            className={vald ? "kort vald" : markerad ? "kort markerad" : "kort"}
                            data-testid={`kort-${ord.id}`}
                            onClick={() => valjKort(ord)}
                          >
                            {ord.klass === "djur" && kortIkon(ord.id) ? (
                              <img className="kort-ikon" alt="" src={kortIkon(ord.id) ?? ""} />
                            ) : null}
                            {kanEtikett(ord)}
                          </button>
                          {gang >= 3 ? (
                            <button type="button" className="skriv-mig" onClick={() => oppnaSkrivMig(ord)}>
                              Skriv mig! {ord.visa.slice(0, 2)}…
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : null}
            </div>
            <div className="remsa" data-testid="remsa">
              {text ? (
                text
              ) : (
                <span className="tom">
                  {gavaTill
                    ? TEXTER_AV.gavoruta.placeholder
                    : varld === "gard" && !omrade
                      ? TEXTER.penna_bygg.placeholder
                      : " "}
                </span>
              )}
              {lage === "skriv" ? <i className="caret" /> : null}
            </div>
            <button type="button" className={visaOnskaHjalp && text.trim() ? "vakna redo" : "vakna"} data-testid="vakna" onClick={vaknaNu}>
              {vaknaText}
            </button>
            {lage === "skriv" && !forslag && !behover ? (
              <div className="tangenter" data-testid="tangentbord">
                {RADER.slice(0, 2).map((rad) => (
                  <div className="rad" key={rad[0]}>
                    {rad.map((t) => (
                      <button key={t} type="button" className="tangent" onClick={() => skrivTecken(t)}>
                        {t}
                      </button>
                    ))}
                  </div>
                ))}
                <div className="rad">
                  <button type="button" className="tangent radera" aria-label="Sudda" onClick={sudda}>
                    ⌫
                  </button>
                  {RADER[2]!.map((t) => (
                    <button key={t} type="button" className="tangent" onClick={() => skrivTecken(t)}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="rad">
                  <button type="button" className="tangent mellanslag" data-testid="mellanslag" aria-label="Mellanslag" onClick={() => skrivTecken(" ")}>
                    mellanslag
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : panel === "uppdrag" ? (
          <div className="kort-yta uppdrag" data-testid="uppdragbok">
            <h2>{UPP.texter.rubrik}</h2>
            <div className="rad-kort">
              <button type="button" className={uppFlik === "pagar" ? "kort" : "nej"} data-testid="flik-pagar" onClick={() => setUppFlik("pagar")}>
                {UPP.texter.flik_pagaende}
              </button>
              <button type="button" className={uppFlik === "klar" ? "kort" : "nej"} data-testid="flik-klara" onClick={() => setUppFlik("klar")}>
                {UPP.texter.flik_klara}
              </button>
            </div>
            {UPP.uppdrag.filter((u) => (uppFlik === "klar" ? uppdragSpar[u.id] === "klar" : uppdragSpar[u.id] === "pagar")).length === 0 ? (
              <p>{UPP.texter.inga}</p>
            ) : null}
            {UPP.uppdrag
              .filter((u) => (uppFlik === "klar" ? uppdragSpar[u.id] === "klar" : uppdragSpar[u.id] === "pagar"))
              .map((u) => (
                <p key={u.id} className="uppdrag-rad" data-testid={`uppdrag-${u.id}`} data-givare={u.givare ?? ""}>
                  {u.givare && NPC[u.givare] ? <b>{NPC[u.givare]!.namn}: </b> : null}
                  {uppdragText(u)}
                </p>
              ))}
          </div>
        ) : (
          <div className="byggbok-wrap" data-testid="byggbok">
            <div className="kort-yta byggbok">
              {onskan?.kalla === "bygg" ? (
                <p className="onska-text">
                  ★ {FIR.onskan.rubrik} {onskan.text}
                </p>
              ) : null}
              <h2>{byggSida.titel}</h2>
              <p className="bygg-beskriv">{byggSida.beskrivning}</p>
              {agdaSidor.length > 1 ? (
                <div className="rad-kort bygg-sidor">
                  {agdaSidor.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={s.id === byggSida.id ? "kort vald" : "kort"}
                      data-testid={`bygg-sida-${s.id}`}
                      onClick={() => {
                        setByggSidaId(s.id);
                        setByggPuff(null);
                      }}
                    >
                      {s.titel}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="rutnat">
                <button type="button" className="kort bygg-exempel" data-testid="bygg-exempel" onClick={() => byggFras(byggSida.exempel)}>
                  {byggSida.exempel}
                </button>
                {byggSida.ord.map((id) => {
                  const fras = frasForByggOrd(id);
                  return (
                    <button key={id} type="button" className="kort" data-testid={`byggord-${id}`} onClick={() => byggFras(fras)}>
                      {fras}
                    </button>
                  );
                })}
              </div>
              {kopRad ? (
                <p className="bygg-puff inne" data-testid="for-fa">
                  {kopRad}
                </p>
              ) : null}
            </div>
            {lastaSidor.length ? (
              <div className="last-rad" data-testid="bygg-last">
                {lastaSidor.map((sida) => (
                  <button
                    key={sida.id}
                    type="button"
                    className="last-ikon"
                    data-testid={`bygg-${sida.id}`}
                    onClick={() => forsokKop("bygg", sida.id, sida.titel, sida.kostnad)}
                  >
                    <Lock aria-hidden />
                    <span className="last-pris">★ {sida.kostnad}</span>
                    <span>{sida.titel}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </section>
      </div>
  );
}
