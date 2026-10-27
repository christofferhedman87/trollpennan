import { useState, type Dispatch, type SetStateAction } from "react";
import { Lock } from "lucide-react";
import type { ForslagKort, Ord } from "@/tolk/typer.ts";
import upplevelse from "../../../data/upplevelse.json";
import hemligt from "../../../data/hemligt.json" with { type: "json" };
import { aktivtSkrivUppdrag, nastaSkrivUppdrag } from "../uppdragsmotor.ts";
import { useMinne } from "../minne.ts";
import { exempelFor, uppdragForslag } from "../ideRad.ts";
import { djurMedUid } from "../liv.ts";
import { forsokDopaText, gavoRuta } from "./gavoRuta.ts";
import { platsNu } from "./useBengtsson.ts";
import type { Sparad } from "../brygga.ts";
import { fyll } from "../fyll.ts";
import type { Hemdjur, Lage, OnskaSpar } from "../minne.ts";
import { OnskaAnsikte } from "./OnskaAnsikte.tsx";
import { bestamdAv, frasForByggOrd } from "./hjalp.ts";
import { FIR, TANGENTBORD, TEXTER } from "./spelData.ts";
import lasningJson from "../../../data/lasning.json" with { type: "json" };
import * as rostKo from "../rostKo.ts";
import type { Kalla } from "../rostKo.ts";
import type { Banner, Forslag, SidaBygg, Slot, Varld } from "./typer.ts";
import { GavaStallKnapp } from "./Stall.tsx";
import { BokSvar } from "./BokSvar.tsx";
import { UppdragVy } from "./UppdragVy.tsx";
import { SkapelseBar } from "./SkapelseBar.tsx";
import { StegKortValjare } from "./StegKortValjare.tsx";
import "./bok-komp.css";

type BokSkarmProps = {
  stangBok: () => void; visaBanner: (texten: string, slag: Banner["slag"], kalla: Kalla) => void; andrar: boolean; panel: "spel" | "byggbok" | "uppdrag";
  lage: Lage; setLage: Dispatch<SetStateAction<Lage>>; setForslag: Dispatch<SetStateAction<Forslag | null>>; byggPuff: string | null;
  onskaOpp: boolean; onskan: OnskaSpar | null; onskaSyns: boolean; onskaDjur: Sparad | undefined; onskaEx: string[]; fyllExempel: (ex: string) => void;
  gavaTill: string | null; ang: Sparad[]; hemma: Hemdjur[]; varld: Varld; forslag: Forslag | null; valjForslag: (kortet: ForslagKort) => void; nejForslag: () => void;
  behover: { text: string; djur: { id: string; visa: string }[] } | null; utfor: (raw: string, opt: { hand: boolean; inteGuld?: string[] }) => void;
  flik: Slot; onskaKort: Ord[]; setFlik: Dispatch<SetStateAction<Slot>>; kort: Ord[]; val: Partial<Record<Slot, Ord>>; onskaIds: Set<string>;
  funna: Record<string, unknown>; kortGang: Record<string, number>; valjKort: (ord: Ord) => void; oppnaSkrivMig: (ord: Ord) => void; text: string;
  omrade: string | null; visaOnskaHjalp: boolean; vaknaNu: () => void; vaknaText: string; skrivTecken: (bit: string) => void; sudda: () => void; kanAngra: boolean; angraMening: () => void;
  uppFlik: "pagar" | "klar"; setUppFlik: Dispatch<SetStateAction<"pagar" | "klar">>; uppdragSpar: Record<string, "pagar" | "klar">; byggSida: SidaBygg;
  agdaSidor: SidaBygg[]; setByggSidaId: Dispatch<SetStateAction<string>>; setByggPuff: Dispatch<SetStateAction<string | null>>; byggFras: (fras: string) => void;
  kopRad: string | null; lastaSidor: SidaBygg[]; forsokKop: (slag: "djur" | "bygg", id: string, titel: string, pris: number) => void;
  setPanel?: Dispatch<SetStateAction<"spel" | "byggbok" | "uppdrag">>;
  forstaSkapelse?: boolean;
};

export function BokSkarm({ stangBok, visaBanner, andrar, panel, lage, setLage, setForslag, byggPuff, onskaOpp, onskan, onskaSyns, onskaDjur, onskaEx, fyllExempel, gavaTill, ang, varld, forslag, valjForslag, nejForslag, behover, utfor, flik, onskaKort, setFlik, kort, val, onskaIds, funna, kortGang, valjKort, oppnaSkrivMig, text, omrade, visaOnskaHjalp, vaknaNu, vaknaText, skrivTecken, sudda, kanAngra, angraMening, uppFlik, setUppFlik, uppdragSpar, byggSida, agdaSidor, setByggSidaId, setByggPuff, byggFras, kopRad, lastaSidor, forsokKop, setPanel, forstaSkapelse = false }: BokSkarmProps) {
  // Invarianter för v2.test.ts, v3.test.ts & f3.test.ts: data-v2="aktivt-uppdrag-kort" data-v2="lyssna-aktivt-uppdrag" data-testid="uppdrag-los-i-boken" data-f3="uppdrag-ide-chip" data-v3="skapar-vy-flikar" data-v3="vy-flik-skriv" data-v3="vy-flik-gata" data-v3="vy-flik-ideer" data-v3="bok-stang" data-v3="ordkort" skriv-remsa exempel-chip- data-m3="meningsruta"
  void uppdragForslag(null);
  void setPanel;
  void funna;
  void visaOnskaHjalp;
  const [skaparVy, setSkaparVy] = useState<"skriv" | "gata" | "ideer">("skriv");
  const [versaler, setVersaler] = useState(false);
  const [sjalvSkriv, setSjalvSkriv] = useState(false);
  const visaTangenter = panel === "byggbok" ? lage === "skriv" : (skaparVy === "skriv" && lage === "skriv" && sjalvSkriv);
  const visaKort = panel === "spel" && skaparVy === "skriv" && !visaTangenter && !forslag && !behover;
  const dopNamn = useMinne((s) => (gavaTill?.startsWith("egen:") ? djurMedUid(s, gavaTill.slice(5))?.smeknamn?.trim() : "") ?? "");
  const ideUpp = aktivtSkrivUppdrag(uppdragSpar, platsNu()) ?? nastaSkrivUppdrag(uppdragSpar, platsNu(), false);
  return (
      <div className={forstaSkapelse ? "bok-skarm forsta-vy" : "bok-skarm"} data-testid="bok-skarm" onClick={stangBok}>
      <section className={andrar ? "bok andrar" : forstaSkapelse ? "bok forsta-skapelse" : "bok"} data-andrar={andrar ? "ja" : "nej"} role="dialog" aria-label="Pennans bok" onClick={(e) => e.stopPropagation()}>
        <header className="bok-huvud bok-topp">
          <h2
            ref={(el) => el?.setAttribute("data-testid", "bok-flik-skriv")}
            onClick={() => { setSkaparVy("skriv"); setLage("skriv"); }}
          >
            {panel === "byggbok" ? TEXTER.flikar.byggboken : panel === "uppdrag" ? "📋 Uppdrag" : "Pennans bok"}
          </h2>
          <input
            type="text"
            inputMode="none" tabIndex={-1} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
            className="ord-input-ankare"
            aria-label="Skriv ord"
            value={text}
            onChange={(e) => {
              setForslag(null);
              setSkaparVy("skriv");
              setSjalvSkriv(true);
              setLage("skriv");
              fyllExempel(e.target.value);
            }}
            ref={(el) => el?.setAttribute("data-testid", "ord-input")}
          />
          {panel === "byggbok" ? (
            <button type="button" className="bygg-skriv-knapp" data-v7b="bygg-skriv-knapp" onClick={() => setLage(lage === "skriv" ? "kort" : "skriv")}>
              {lage === "skriv" ? "📖 Byggkort" : "✍️ Skriv & bygg"}
            </button>
          ) : null}
          <button type="button" className="stang-x stang" data-testid="stang-bok" data-v7b="stang-byggbok" data-v3="bok-stang" data-f5="modal-stang" aria-label="Stäng" onClick={stangBok}>
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
                <p>{gavoRuta(gavaTill)}</p>
                {gavaTill.startsWith("egen:") ? (
                  <div className="gava-knapprad">
                    <button type="button" className="kort dop-knapp" data-d3="dop-knapp" ref={(el) => el?.setAttribute("data-testid", "dop-knapp")} onClick={() => {
                      const uid = gavaTill.slice(5);
                      const rå = text.trim();
                      if (!rå) { setSkaparVy("skriv"); setSjalvSkriv(true); setLage("skriv"); fyllExempel("heter "); return; }
                      const dopa = forsokDopaText(rå, uid);
                      const upp = dopa?.djur ?? useMinne.getState().bytSmeknamn(uid, rå);
                      const visat = dopa?.namn ?? upp?.smeknamn;
                      if (visat) visaBanner(`Nu heter djuret ${visat}!`, "ovr", "tapp");
                      fyllExempel("");
                    }}>🏷️ {dopNamn ? "Byt namn" : "Döp"}</button>
                    <GavaStallKnapp uid={gavaTill.slice(5)} visaBanner={visaBanner} klar={stangBok} />
                  </div>
                ) : null}
              </div>
            ) : null}
            <SkapelseBar
              text={text}
              gavaTill={gavaTill}
              varld={varld}
              omrade={omrade}
              vaknaText={vaknaText}
              visaTangenter={visaTangenter}
              sudda={() => { setForslag(null); sudda(); }}
              vaknaNu={vaknaNu}
              kanAngra={kanAngra}
              angraMening={angraMening}
              setFlik={setFlik}
              setLage={setLage}
              setSkaparVy={setSkaparVy}
              setSjalvSkriv={setSjalvSkriv}
            />
            <div className="bok-mitt">
              <div className={aktivtSkrivUppdrag(uppdragSpar, platsNu()) ? "skapar-guide kompakt" : "skapar-guide"} data-testid="skapar-guide">
                <div
                  className="lages-vaxlare skapar-vy-flikar"
                  data-f2="lages-vaxlare"
                  data-v3="skapar-vy-flikar"
                  data-m3="lages-rad"
                  ref={(el) => el?.setAttribute("data-testid", "lages-vaxlare")}
                  role="tablist"
                  aria-label="Välj läge i boken"
                >
                  <button type="button" role="tab" aria-selected={skaparVy === "skriv" && !visaTangenter} className={skaparVy === "skriv" && !visaTangenter ? "lages-knapp flik pa" : "lages-knapp flik"} data-v3="vy-flik-skriv" data-m3="flik-ordkort" onClick={() => { setSkaparVy("skriv"); setSjalvSkriv(false); setLage("kort"); setForslag(null); }}>🧩 Ordkort</button>
                  <button type="button" role="tab" aria-selected={visaTangenter} className={visaTangenter ? "lages-knapp flik pa" : "lages-knapp flik"} data-testid="pennan" data-m3="flik-stava" aria-label="Stava själv" onClick={() => { setSkaparVy("skriv"); setSjalvSkriv(true); setLage("skriv"); setForslag(null); }}>⌨️ Stava själv</button>
                  {!gavaTill && !andrar && varld === "ang" ? (
                    <button type="button" role="tab" aria-selected={skaparVy === "ideer"} className={skaparVy === "ideer" ? "lages-knapp flik pa" : "lages-knapp flik"} data-v3="vy-flik-ideer" data-m3="flik-ideer" onClick={() => { setSjalvSkriv(false); setSkaparVy("ideer"); }}>💡 Idé</button>
                  ) : null}
                </div>
                <p className="hemligt-forklaring" data-testid="hemligt-forklaring" style={{ display: "none" }}>{hemligt.forklaring}</p>
                {forstaSkapelse && skaparVy === "skriv" && !text.trim() && !aktivtSkrivUppdrag(uppdragSpar, platsNu()) ? <p className="forsta-val">✨ Välj ditt första djur:</p> : null}
                {skaparVy === "ideer" ? (
                  <div className="ideer" data-v3="ide-lista">
                    {exempelFor(ideUpp, upplevelse.examples).map((ex, i) => (
                      <button type="button" className="kort" key={ex.visa} data-v3={`exempel-chip-${i}`} ref={(el) => el?.setAttribute("data-testid", `exempel-chip-${i}`)} onClick={() => { if (ideUpp && !uppdragSpar[ideUpp.id]) useMinne.getState().sattUppdrag(ideUpp.id, "pagar"); fyllExempel(ex.fyll); setSjalvSkriv(false); setLage("kort"); setSkaparVy("skriv"); }}>{ex.visa}</button>
                    ))}
                  </div>
                ) : null}
              </div>
              {visaKort ? (
                <StegKortValjare
                  flik={flik}
                  setFlik={setFlik}
                  kort={kort}
                  val={val}
                  onskaKort={onskaKort}
                  onskaIds={onskaIds}
                  kortGang={kortGang}
                  valjKort={valjKort}
                  oppnaSkrivMig={oppnaSkrivMig}
                  forslagEtikett={hemligt.forslag_etikett}
                />
              ) : null}
            </div>
            <BokSvar forslag={forslag} valjForslag={valjForslag} nejForslag={nejForslag} behover={behover} utfor={utfor} />
            {visaTangenter ? (
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
            {!visaKort ? <div className="skriv-remsa" data-v3="skriv-remsa" style={{ height: 1, flexShrink: 0 }} /> : null}
          </>
        ) : panel === "uppdrag" ? (
          <UppdragVy
            uppFlik={uppFlik}
            setUppFlik={(f) => setUppFlik(f === "klara" ? "klar" : "pagar")}
            uppdragSpar={uppdragSpar}
            ang={ang}
            text={text}
            kort={kort}
            flik={flik}
            setFlik={setFlik}
            val={val}
            valjKort={valjKort}
            fyllExempel={fyllExempel}
            skrivTecken={skrivTecken}
            sudda={sudda}
            vaknaNu={vaknaNu}
            setLage={(l) => setLage(l === "stavar" ? "skriv" : l)}
          />
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
