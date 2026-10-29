import { useState, type Dispatch, type SetStateAction } from "react";
import type { Ord } from "@/tolk/typer.ts";
import { ALLA_UPPDRAG, OMR, UPP, uppdragText, type Uppdrag } from "../aventyr.ts";
import type { Sparad } from "../brygga.ts";
import { fyll } from "../fyll.ts";
import { uppdragForslag } from "../ideRad.ts";
import { ljud } from "../ljud.ts";
import type { Lage } from "../minne.ts";
import { spelaUpp } from "../rost.ts";
import { aktivtSkrivUppdrag } from "../uppdragsmotor.ts";
import { KATEGORIER, RADER } from "./konstanter.ts";
import type { Slot, Val } from "./typer.ts";
import { platsNu } from "./useBengtsson.ts";

type Flik = "pagar" | "klar" | "klara";

type Props = {
  uppFlik: Flik;
  setUppFlik: (flik: "pagar" | "klara") => void;
  uppdragSpar: Record<string, "pagar" | "klar">;
  ang: Sparad[];
  text: string;
  kort: Ord[];
  flik: Slot;
  setFlik: Dispatch<SetStateAction<Slot>>;
  val: Val;
  valjKort: (ord: Ord) => void;
  fyllExempel: (ex: string) => void;
  skrivTecken: (bit: string) => void;
  sudda: () => void;
  vaknaNu: () => void;
  setLage: (lage: Lage | "stavar") => void;
};

const KORT_PER_SIDA = 6;

function hor(text: string) {
  const ren = text.trim();
  if (!ren) return;
  spelaUpp(ren, { klass: "uppdrag", kalla: "bok", fodd: Date.now() }, () => undefined);
}

function delaUpp(u: Uppdrag, djur?: string): { titel: string; beskrivning: string } {
  const extra = u as Uppdrag & { titel?: string; beskrivning?: string };
  const text = (extra.beskrivning?.trim() || uppdragText(u, djur)).trim();
  if (extra.titel?.trim()) return { titel: extra.titel, beskrivning: text };
  const delar = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (delar.length > 1) return { titel: delar[0]!, beskrivning: delar.slice(1).join(" ") };
  return { titel: "Uppdrag", beskrivning: text };
}

export function UppdragVy({
  uppFlik, setUppFlik, uppdragSpar, ang, text, kort, flik, setFlik, val, valjKort, fyllExempel, skrivTecken, sudda, vaknaNu, setLage,
}: Props) {
  const [svarsLage, setSvarsLage] = useState<"forslag" | "ordkort" | "tangentbord">("forslag");
  const [kortSida, setKortSida] = useState(0);
  const klara = ALLA_UPPDRAG.filter((u) => uppdragSpar[u.id] === "klar");
  const pagar = ALLA_UPPDRAG.filter((u) => uppdragSpar[u.id] !== "klar");
  const grund = aktivtSkrivUppdrag(uppdragSpar, platsNu()) ?? pagar.find((u) => uppdragSpar[u.id] === "pagar");
  const visning = grund ? { ...grund, ...delaUpp(grund, ang[0]?.kropp) } : undefined;
  const aktivtUpp = visning;
  const forslagLista = aktivtUpp ? uppdragForslag(aktivtUpp, ang[0]?.kropp).slice(0, 4) : [];
  const sidor = Math.max(1, Math.ceil(kort.length / KORT_PER_SIDA));
  const nuSida = Math.min(kortSida, sidor - 1);
  const sidKort = kort.slice(nuSida * KORT_PER_SIDA, (nuSida + 1) * KORT_PER_SIDA);
  const karta = OMR.karta as typeof OMR.karta & { uppdrag_pagar?: string; uppdrag_klara?: string };
  const pagarRubrik = fyll(karta.uppdrag_pagar ?? `${UPP.texter.flik_pagaende} ({n})`, { n: pagar.filter((u) => uppdragSpar[u.id] === "pagar").length });
  const klaraRubrik = fyll(karta.uppdrag_klara ?? `${UPP.texter.flik_klara} ({n})`, { n: klara.length });
  const arKlara = uppFlik === "klara" || uppFlik === "klar";
  const rader = (uppFlik === "pagar" ? pagar : klara).filter((u) => arKlara || u.id !== aktivtUpp?.id);
  const lista = arKlara ? rader : rader.filter((u) => uppdragSpar[u.id] === "pagar");

  return (
    <div className="uppdragbok uppdrag-vy-m2" data-testid="uppdragbok" data-m2="uppdrag-vy">
      <div className="flikar uppdrag-flikar">
        <button type="button" className={uppFlik === "pagar" ? "flik aktiv" : "flik"} aria-pressed={uppFlik === "pagar"} data-testid="flik-pagar" onClick={() => setUppFlik("pagar")}>{pagarRubrik}</button>
        <button type="button" className={arKlara ? "flik aktiv" : "flik"} aria-pressed={arKlara} data-testid="flik-klara" onClick={() => setUppFlik("klara")}>{klaraRubrik}</button>
      </div>
      {uppFlik === "pagar" && aktivtUpp ? (
        <>
          <div className="uppdrag-post aktivt-uppdrag-kort" data-v2="aktivt-uppdrag-kort" data-uppdrag={aktivtUpp.id}>
            <div className="aktivt-uppdrag-topp">
              <img src="/npc/bengtsson/glad.webp" alt="" aria-hidden="true" className="uppdrag-bengtsson-portratt" width={36} height={36} />
              <div className="aktivt-uppdrag-info">
                <strong>{aktivtUpp.titel}</strong>
                <p>{aktivtUpp.beskrivning}</p>
              </div>
              <button
                type="button"
                className="lyssna-knapp"
                data-v2="lyssna-aktivt-uppdrag"
                aria-label={`Lyssna på uppdraget: ${aktivtUpp.titel}`}
                onClick={() => { ljud.klick(); hor(uppdragText(aktivtUpp, ang[0]?.kropp)); }}
              >
                🔊
              </button>
            </div>
          </div>
          <div
            className="remsa skriv-remsa uppdrag-svars-remsa"
            data-v3="skriv-remsa"
            data-m2="uppdrag-svarsruta"
            ref={(el) => el?.setAttribute("data-testid", "remsa")}
          >
            <button
              type="button"
              className="lyssna-knapp remsa-lyssna"
              data-p4="lyssna-mening"
              aria-label="Lyssna på meningen"
              disabled={!text.trim()}
              onClick={() => { ljud.klick(); hor(text); }}
            >
              🔊
            </button>
            <span className="uppdrag-svar-text" data-m2="uppdrag-svar-text">
              {text.trim() ? text : "Välj ett svar eller skriv här…"}
            </span>
            <button
              type="button"
              className="radera-knapp"
              data-m2="uppdrag-radera"
              ref={(el) => el?.setAttribute("data-testid", "radera")}
              aria-label="Sudda"
              onClick={sudda}
            >
              ⌫
            </button>
            <button
              type="button"
              className="vakna uppdrag-svara-knapp"
              data-m2="uppdrag-svara"
              ref={(el) => el?.setAttribute("data-testid", "vakna")}
              disabled={!text.trim()}
              onClick={() => vaknaNu()}
            >
              ✨ Gör det!
            </button>
          </div>
          <div className="uppdrag-svarslage" data-m2="uppdrag-svarslage" role="group" aria-label="Svarsläge">
            <button type="button" aria-pressed={svarsLage === "forslag"} className={svarsLage === "forslag" ? "flik aktiv" : "flik"} data-m2="lage-forslag" onClick={() => { ljud.klick(); setSvarsLage("forslag"); }}>
              💡 Förslag
            </button>
            <button type="button" aria-pressed={svarsLage === "ordkort"} className={svarsLage === "ordkort" ? "flik aktiv" : "flik"} data-m2="lage-ordkort" onClick={() => { ljud.klick(); setSvarsLage("ordkort"); }}>
              🧩 Ordkort
            </button>
            <button
              type="button"
              aria-pressed={svarsLage === "tangentbord"}
              className={svarsLage === "tangentbord" ? "flik aktiv" : "flik"}
              data-m2="lage-tangentbord"
              data-v2="aktivt-uppdrag-skapa"
              ref={(el) => el?.setAttribute("data-testid", "uppdrag-los-i-boken")}
              onClick={() => { ljud.klick(); setSvarsLage("tangentbord"); setLage("stavar"); }}
            >
              ⌨️ Skriv själv
            </button>
          </div>
          {svarsLage === "forslag" ? (
            <div className="uppdrag-ide-chips" data-f3="uppdrag-ide-chips">
              {forslagLista.map((fras) => (
                <button key={fras} type="button" className="uppdrag-ide-chip" data-f3="uppdrag-ide-chip" data-m2="uppdrag-forslag-kort" onClick={() => { fyllExempel(fras); hor(fras); }}>
                  💡 {fras}
                </button>
              ))}
            </div>
          ) : null}
          {svarsLage === "ordkort" ? (
            <div className="uppdrag-ordkort-yta" data-m2="uppdrag-ordkort">
              <div className="flikar kategorier uppdrag-kategorier" role="group" aria-label="Ordkategorier">
                {KATEGORIER.map((f) => (
                  <button key={f.id} type="button" aria-pressed={flik === f.id} className={flik === f.id ? "flik aktiv" : "flik"} onClick={() => { ljud.klick(); setFlik(f.id); setKortSida(0); }}>
                    {f.namn}
                  </button>
                ))}
              </div>
              <div className="uppdrag-ordkort-rutnat">
                {sidKort.map((ord) => {
                  const vald = val[ord.klass as Slot]?.id === ord.id;
                  return (
                    <button key={ord.id} type="button" className={vald ? "kort vald uppdrag-ordkort" : "kort uppdrag-ordkort"} onClick={() => { valjKort(ord); hor(ord.visa); }}>
                      {ord.visa}
                    </button>
                  );
                })}
              </div>
              <div className="uppdrag-sidor">
                <button type="button" aria-label="Föregående sida med ordkort" disabled={nuSida <= 0} onClick={() => { ljud.klick(); setKortSida(Math.max(0, nuSida - 1)); }}>◀ Fler</button>
                <span>Sida {nuSida + 1}/{sidor}</span>
                <button type="button" aria-label="Nästa sida med ordkort" disabled={nuSida >= sidor - 1} onClick={() => { ljud.klick(); setKortSida(nuSida + 1); }}>Fler ▶</button>
              </div>
            </div>
          ) : null}
          {svarsLage === "tangentbord" ? (
            <div className="tangenter" data-m2="uppdrag-tangentbord" ref={(el) => el?.setAttribute("data-testid", "tangentbord")}>
              {RADER.map((rad, i) => (
                <div key={i} className="tangent-rad">
                  {rad.map((b) => (
                    <button key={b} type="button" className="tangent" onClick={() => skrivTecken(b.toLowerCase())}>{b}</button>
                  ))}
                  {i === RADER.length - 1 ? (
                    <button type="button" className="tangent radera" onClick={sudda} aria-label="Sudda">⌫</button>
                  ) : null}
                </div>
              ))}
              <div className="tangent-rad">
                <button type="button" className="tangent mellanslag" onClick={() => skrivTecken(" ")}>Mellanslag</button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
      {lista.length === 0 && !(uppFlik === "pagar" && aktivtUpp) ? <p>{UPP.texter.inga}</p> : null}
      {lista.map((u) => (
        <p key={u.id} className="uppdrag-rad" data-testid={`uppdrag-${u.id}`} data-givare={u.givare ?? ""}>
          <span>{uppdragText(u, ang[0]?.kropp)}</span>
          <button type="button" className="lyssna-knapp" aria-label={`Lyssna på uppdraget: ${u.text}`} onClick={() => { ljud.klick(); hor(uppdragText(u, ang[0]?.kropp)); }}>🔊</button>
        </p>
      ))}
    </div>
  );
}
