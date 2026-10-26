import { useState, type Dispatch, type SetStateAction } from "react";
import { Lock, Pencil } from "lucide-react";
import type { ForslagKort, Ord } from "@/tolk/typer.ts";
import upplevelse from "../../../data/upplevelse.json";
import hemligt from "../../../data/hemligt.json" with { type: "json" };
import { Ledtradsyta } from "./Ledtradsyta.tsx";
import { ALLA_UPPDRAG, NPC, TEXTER_AV, UPP, uppdragText } from "../aventyr.ts";
import { aktivtSkrivUppdrag, nastaSkrivUppdrag } from "../uppdragsmotor.ts";
import { useMinne } from "../minne.ts";
import { exempelFor } from "../ideRad.ts";
import { gavoRuta } from "./gavoRuta.ts";
import { platsNu } from "./useBengtsson.ts";
import { UppdragsRemsa } from "./UppdragsRemsa.tsx";
import type { Sparad } from "../brygga.ts";
import { fyll } from "../fyll.ts";
import type { Hemdjur, Lage, OnskaSpar } from "../minne.ts";
import { OnskaAnsikte } from "./OnskaAnsikte.tsx";
import { bestamdAv, frasForByggOrd, kanEtikett, kortIkon } from "./hjalp.ts";
import { FIR, FLIKAR, TANGENTBORD, TEXTER } from "./spelData.ts";
import lasningJson from "../../../data/lasning.json" with { type: "json" };
import * as rostKo from "../rostKo.ts";
import type { Kalla } from "../rostKo.ts";
import type { Banner, Forslag, SidaBygg, Slot, Varld } from "./typer.ts";
import { GavaStallKnapp } from "./Stall.tsx";
import { BokSvar } from "./BokSvar.tsx";

type BokSkarmProps = {
  stangBok: () => void; visaBanner: (texten: string, slag: Banner["slag"], kalla: Kalla) => void; andrar: boolean; panel: "spel" | "byggbok" | "uppdrag";
  lage: Lage; setLage: Dispatch<SetStateAction<Lage>>; setForslag: Dispatch<SetStateAction<Forslag | null>>; byggPuff: string | null;
  onskaOpp: boolean; onskan: OnskaSpar | null; onskaSyns: boolean; onskaDjur: Sparad | undefined; onskaEx: string[]; fyllExempel: (ex: string) => void;
  gavaTill: string | null; ang: Sparad[]; hemma: Hemdjur[]; varld: Varld; forslag: Forslag | null; valjForslag: (kortet: ForslagKort) => void; nejForslag: () => void;
  behover: { text: string; djur: { id: string; visa: string }[] } | null; utfor: (raw: string, opt: { hand: boolean; inteGuld?: string[] }) => void;
  flik: Slot; onskaKort: Ord[]; setFlik: Dispatch<SetStateAction<Slot>>; kort: Ord[]; val: Partial<Record<Slot, Ord>>; onskaIds: Set<string>;
  funna: Record<string, unknown>; kortGang: Record<string, number>; valjKort: (ord: Ord) => void; oppnaSkrivMig: (ord: Ord) => void; text: string;
  omrade: string | null; visaOnskaHjalp: boolean; vaknaNu: () => void; vaknaText: string; skrivTecken: (bit: string) => void; sudda: () => void;
  uppFlik: "pagar" | "klar"; setUppFlik: Dispatch<SetStateAction<"pagar" | "klar">>; uppdragSpar: Record<string, "pagar" | "klar">; byggSida: SidaBygg;
  agdaSidor: SidaBygg[]; setByggSidaId: Dispatch<SetStateAction<string>>; setByggPuff: Dispatch<SetStateAction<string | null>>; byggFras: (fras: string) => void;
  kopRad: string | null; lastaSidor: SidaBygg[]; forsokKop: (slag: "djur" | "bygg", id: string, titel: string, pris: number) => void;
  setPanel?: Dispatch<SetStateAction<"spel" | "byggbok" | "uppdrag">>;
};

export function BokSkarm({ stangBok, visaBanner, andrar, panel, lage, setLage, setForslag, byggPuff, onskaOpp, onskan, onskaSyns, onskaDjur, onskaEx, fyllExempel, gavaTill, varld, forslag, valjForslag, nejForslag, behover, utfor, flik, onskaKort, setFlik, kort, val, onskaIds, funna, kortGang, valjKort, oppnaSkrivMig, text, omrade, visaOnskaHjalp, vaknaNu, vaknaText, skrivTecken, sudda, uppFlik, setUppFlik, uppdragSpar, byggSida, agdaSidor, setByggSidaId, setByggPuff, byggFras, kopRad, lastaSidor, forsokKop, setPanel }: BokSkarmProps) {
  const [skaparVy, setSkaparVy] = useState<"skriv" | "gata" | "ideer">("skriv");
  const [versaler, setVersaler] = useState(false);
  const aktivtUpp = panel === "uppdrag" ? (aktivtSkrivUppdrag(uppdragSpar, platsNu()) ?? nastaSkrivUppdrag(uppdragSpar, platsNu(), false)) : undefined;
  const uppRader = ALLA_UPPDRAG.filter((u) => (uppFlik === "klar" ? uppdragSpar[u.id] === "klar" : uppdragSpar[u.id] === "pagar" && u.id !== aktivtUpp?.id));
  return (
      <div className="bok-skarm" data-testid="bok-skarm" onClick={stangBok}>
      <section className={andrar ? "bok andrar" : "bok"} data-andrar={andrar ? "ja" : "nej"} role="dialog" aria-label="Pennans bok" onClick={(e) => e.stopPropagation()}>
        <header className="bok-huvud bok-topp">
          <h2
            ref={(el) => el?.setAttribute("data-testid", "bok-flik-skriv")}
            onClick={() => { setSkaparVy("skriv"); setLage("skriv"); }}
          >
            {panel === "byggbok" ? TEXTER.flikar.byggboken : panel === "uppdrag" ? "📋 Uppdrag" : "Pennans bok"}
          </h2>
          <input
            type="text"
            className="ord-input-ankare"
            aria-label="Skriv ord"
            value={text}
            onChange={(e) => {
              setForslag(null);
              fyllExempel(e.target.value);
            }}
            ref={(el) => el?.setAttribute("data-testid", "ord-input")}
          />
          <button
            type="button"
            className={lage === "skriv" ? "penna pa" : "penna"}
            aria-label={lage === "skriv" ? "Visa ordkort" : "Skriv själv"}
            data-testid="pennan"
            onClick={() => {
              setSkaparVy("skriv");
              setLage((l) => (l === "skriv" ? "kort" : "skriv"));
              setForslag(null);
            }}
          >
            <Pencil aria-hidden />
          </button>
          {panel === "byggbok" ? (
            <button type="button" className="bygg-skriv-knapp" data-v7b="bygg-skriv-knapp" onClick={() => setLage(lage === "skriv" ? "kort" : "skriv")}>
              {lage === "skriv" ? "📖 Byggkort" : "✍️ Skriv & bygg"}
            </button>
          ) : null}
          <button type="button" className="stang-x stang" data-testid="stang-bok" data-v7b="stang-byggbok" data-v3="bok-stang" aria-label="Stäng" onClick={stangBok}>
            <span ref={(el) => el?.setAttribute("data-testid", "bok-stang")}>×</span>
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
            {panel === "spel" ? <UppdragsRemsa uppdrag={aktivtSkrivUppdrag(uppdragSpar, platsNu())} fyllForslag={fyllExempel} /> : null}
            {(onskaOpp || (onskan && !onskaSyns)) && onskan ? (
              <div className="onska-remsa" data-testid="onska-remsa">
                {andrar && onskaDjur ? (
                  <div className="onska-topp" data-testid="onska-topp">
                    <OnskaAnsikte djur={onskaDjur} />
                    <p className="onska-text">
                      {fyll(FIR.onskan.fran_bengtsson_djur, { djur: bestamdAv(onskaDjur.kropp, true), text: onskan.text })}
                    </p>
                  </div>
                ) : (
                  <p className="onska-text">
                    ★ {fyll(FIR.onskan.fran_bengtsson, { text: onskan.text })}
                  </p>
                )}
                <button
                  type="button"
                  className="lyssna-knapp"
                  data-p4="lyssna-onska"
                  aria-label={lasningJson.lyssna.aria_onska}
                  onClick={() => rostKo.lasUpp(onskan.text)}
                >
                  🔊 {lasningJson.lyssna.knapp}
                </button>
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
                  {gavoRuta(gavaTill)}
                </p>
                {gavaTill.startsWith("egen:") ? <GavaStallKnapp uid={gavaTill.slice(5)} visaBanner={visaBanner} klar={stangBok} /> : null}
              </div>
            ) : null}
            {!gavaTill && !andrar && varld === "ang" ? (
              <div className={aktivtSkrivUppdrag(uppdragSpar, platsNu()) ? "skapar-guide kompakt" : "skapar-guide"} data-testid="skapar-guide">
                <div className="skapar-vy-flikar" data-v3="skapar-vy-flikar" role="tablist" aria-label="Välj vy i boken">
                  <button type="button" role="tab" aria-selected={skaparVy === "skriv"} className={skaparVy === "skriv" ? "flik pa" : "flik"} data-v3="vy-flik-skriv" onClick={() => setSkaparVy("skriv")}>✍️ Skriv</button>
                  <button type="button" role="tab" aria-selected={skaparVy === "gata"} className={skaparVy === "gata" ? "flik pa" : "flik"} data-v3="vy-flik-gata" ref={(el) => el?.setAttribute("data-testid", "bok-flik-gator")} onClick={() => setSkaparVy("gata")}>❓ Gåta</button>
                  <button type="button" role="tab" aria-selected={skaparVy === "ideer"} className={skaparVy === "ideer" ? "flik pa" : "flik"} data-v3="vy-flik-ideer" onClick={() => setSkaparVy("ideer")}>💡 Idéer</button>
                </div>
                {skaparVy === "skriv" && !aktivtSkrivUppdrag(uppdragSpar, platsNu()) ? <Ledtradsyta funna={funna} kompakt /> : null}
                {skaparVy === "gata" && !aktivtSkrivUppdrag(uppdragSpar, platsNu()) ? (
                  <>
                    <p className="hemligt-forklaring" data-testid="hemligt-forklaring">{hemligt.forklaring}</p>
                    <Ledtradsyta funna={funna} kompakt={false} />
                  </>
                ) : null}
                {skaparVy === "ideer" ? (
                  <div className="ideer" data-v3="ide-lista">
                    {exempelFor(aktivtSkrivUppdrag(uppdragSpar, platsNu()), upplevelse.examples).map((ex, i) => (
                      <button type="button" className="kort" key={ex.visa} data-v3="ide-knapp" ref={(el) => el?.setAttribute("data-testid", `exempel-chip-${i}`)} onClick={() => { fyllExempel(ex.fyll); setSkaparVy("skriv"); }}>{ex.visa}</button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            {panel === "spel" && (skaparVy === "skriv" || lage === "kort") && !forslag && !behover ? (
              <>
                <p className="forslag-etikett" data-testid="forslag-etikett">{hemligt.forslag_etikett}</p>
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
                            className={`${vald ? "kort vald" : markerad ? "kort markerad" : "kort"} ord-kort`}
                            data-testid={`kort-${ord.id}`}
                            data-v3="ordkort"
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
            <BokSvar forslag={forslag} valjForslag={valjForslag} nejForslag={nejForslag} behover={behover} utfor={utfor} />
            <div className="skriv-rad">
            <div
              className="remsa skriv-remsa"
              id="troll-ord"
              data-testid="remsa"
              role="textbox"
              aria-label="Skrivrutan"
              onClick={() => { if (lage !== "skriv") setLage("skriv"); }}
            >
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
              <span ref={(el) => el?.setAttribute("data-testid", "vack-knapp")}>{vaknaText}</span>
            </button>
            </div>
            {lage === "skriv" ? (
              <div className="tangenter" data-testid="tangentbord">
                {TANGENTBORD.rader.map((rad, radIdx) => (
                  <div className="rad" key={rad.join("")}>
                    {radIdx === 2 ? (
                      <button type="button" className="tangent skift" data-v5="skift-knapp" aria-pressed={versaler} onClick={() => setVersaler((v) => !v)}>
                        {versaler ? "abc" : "ABC"}
                      </button>
                    ) : null}
                    {rad.map((t) =>
                      t === "{radera}" ? (
                        <button key={t} type="button" className="tangent radera" data-testid="radera" aria-label="Sudda" onClick={sudda}>
                          ⌫
                        </button>
                      ) : t === "{mellanslag}" ? (
                        <button key={t} type="button" className="tangent mellanslag" data-testid="mellanslag" aria-label="Mellanslag" onClick={() => skrivTecken(" ")}>
                          mellanslag
                        </button>
                      ) : (
                        <button key={t} type="button" className="tangent" aria-label={versaler ? t.toLocaleUpperCase("sv") : t} onClick={() => skrivTecken(versaler ? t.toLocaleUpperCase("sv") : t)}>
                          {versaler ? t.toLocaleUpperCase("sv") : t}
                        </button>
                      ),
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : panel === "uppdrag" ? (
          <div className="kort-yta uppdrag" data-testid="uppdragbok">
            <div className="rad-kort">
              <button type="button" className={uppFlik === "pagar" ? "kort" : "nej"} data-testid="flik-pagar" onClick={() => setUppFlik("pagar")}>{UPP.texter.flik_pagaende}</button>
              <button type="button" className={uppFlik === "klar" ? "kort" : "nej"} data-testid="flik-klara" onClick={() => setUppFlik("klar")}>{UPP.texter.flik_klara}</button>
            </div>
            {uppFlik === "pagar" && aktivtUpp ? (
              <div className="aktivt-uppdrag-kort" data-v2="aktivt-uppdrag-kort">
                <div className="aktivt-uppdrag-huvud">
                  <strong>📋 {aktivtUpp.givare && NPC[aktivtUpp.givare] ? NPC[aktivtUpp.givare]!.namn : "Aktuellt uppdrag"}</strong>
                  <button type="button" className="lyssna-knapp" data-v2="lyssna-aktivt-uppdrag" aria-label={lasningJson.lyssna.aria_uppdrag} onClick={() => rostKo.lasUpp(uppdragText(aktivtUpp))}>🔊 {lasningJson.lyssna.knapp}</button>
                </div>
                <p className="aktivt-uppdrag-text">{uppdragText(aktivtUpp)}</p>
                <button type="button" className="kort aktivt-uppdrag-skriv" onClick={() => { if (!uppdragSpar[aktivtUpp.id]) useMinne.getState().sattUppdrag(aktivtUpp.id, "pagar"); setPanel?.("spel"); setLage("skriv"); }}>✍️ Skriv lösningen</button>
              </div>
            ) : null}
            {uppRader.length === 0 && !(uppFlik === "pagar" && aktivtUpp) ? <p>{UPP.texter.inga}</p> : null}
            {uppRader.map((u) => (
              <p key={u.id} className="uppdrag-rad" data-testid={`uppdrag-${u.id}`} data-givare={u.givare ?? ""}>
                <span>{u.givare && NPC[u.givare] ? <b>{NPC[u.givare]!.namn}: </b> : null}{uppdragText(u)}</span>
                <button type="button" className="lyssna-knapp" aria-label={lasningJson.lyssna.aria_uppdrag} onClick={() => rostKo.lasUpp(uppdragText(u))}>🔊</button>
              </p>
            ))}
          </div>
        ) : (
          <div className="byggbok-wrap" data-testid="byggbok">
            <div className="kort-yta byggbok">
              {onskan?.kalla === "bygg" ? (
                <p className="onska-text">
                  ★ {fyll(FIR.onskan.fran_bengtsson, { text: onskan.text })}
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
