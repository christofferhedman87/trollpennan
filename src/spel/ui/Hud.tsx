import type { Dispatch, SetStateAction } from "react";
import { Lock, Pencil } from "lucide-react";
import introJson from "../../../data/intro.json" with { type: "json" };
import menyJson from "../../../data/meny.json" with { type: "json" };
import { OMR, UPP } from "../aventyr.ts";
import { fyll } from "../fyll.ts";
import { ALBUM } from "../liv.ts";
import { HoldOppnare } from "./HoldOppnare.tsx";
import { StallMeny } from "./Stall.tsx";
import { Coach } from "./Coach.tsx";
import { NpcIkon } from "./NpcFigur.tsx";
import { FORSTA } from "../forstaStunden.ts";
import "./hud-p2.css";
import { FIR, TEXTER } from "./spelData.ts";
import type { Varld } from "./typer.ts";

type HudProps = {
  haller: boolean;
  setHaller: Dispatch<SetStateAction<boolean>>;
  setForalder: Dispatch<SetStateAction<boolean>>;
  stjarnor: number;
  oppnaStjarnor: () => void;
  hittatAntal: number;
  totalOrd: number;
  menyOpp: boolean;
  setMenyOpp: Dispatch<SetStateAction<boolean>>;
  setMenySaker: Dispatch<SetStateAction<boolean>>;
  setSenare: Dispatch<SetStateAction<boolean>>;
};

export function Hud({ oppnaStjarnor, haller, setHaller, setForalder, stjarnor, hittatAntal, totalOrd, menyOpp, setMenyOpp, setMenySaker, setSenare }: HudProps) {
  return (
        <div className="hud">
          <button
            type="button"
            className={haller ? "foralder-knapp haller" : "foralder-knapp"}
            aria-label="För vuxna, håll inne"
            data-testid="foralder-hall"
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setHaller(true);
            }}
            onPointerUp={() => setHaller(false)}
            onPointerCancel={() => setHaller(false)}
          >
            <span className="ring" />
            <Lock className="prick-las" aria-hidden />
          </button>
          <HoldOppnare haller={haller} oppna={() => setForalder(true)} />
          <button type="button" className="stjarna-hud" data-testid="stjarnor" aria-label={fyll(FIR.stjarnor.har, { n: stjarnor })} onClick={oppnaStjarnor}>
            ★ {stjarnor}
            <span className="stjarna-fraga" aria-hidden="true">?</span>
          </button>
          <span className="dold" data-testid="framsteg">
            {fyll(FIR.framsteg.kort, { n: hittatAntal, total: totalOrd })}
          </span>
          <button
            type="button"
            className="meny-knapp"
            data-testid="meny"
            aria-expanded={menyOpp}
            aria-label="Meny"
            onClick={() => {
              setMenyOpp((v) => !v);
              setMenySaker(false);
              setSenare(false);
            }}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
  );
}

type MenyPanelProps = {
  menyOpp: boolean;
  setMenyOpp: Dispatch<SetStateAction<boolean>>;
  setMenySaker: Dispatch<SetStateAction<boolean>>;
  setSenare: Dispatch<SetStateAction<boolean>>;
  senare: boolean;
  panel: "spel" | "byggbok" | "uppdrag";
  varld: Varld;
  valjVarld: (id: "ang" | "gard" | "byggbok") => void;
  lasMeny: () => void;
  oppnaUppdrag: () => void;
  setBokOpp: Dispatch<SetStateAction<boolean>>;
  oppnaKarta: () => void;
  setIntroNy: Dispatch<SetStateAction<number>>;
  setIntro: Dispatch<SetStateAction<boolean>>;
  menySaker: boolean;
  borjaOm: () => void;
  oppnaAlbum?: () => void;
  oppnaOrdbok?: () => void;
};

export function MenyPanel({ menyOpp, setMenyOpp, setMenySaker, setSenare, senare, panel, varld, valjVarld, lasMeny, oppnaUppdrag, setBokOpp, oppnaKarta, setIntroNy, setIntro, menySaker, borjaOm, oppnaAlbum, oppnaOrdbok }: MenyPanelProps) {
  return (
<>
        {menyOpp ? (
          <button type="button" className="meny-bak" aria-label="Stäng" onClick={() => { setMenyOpp(false); setMenySaker(false); setSenare(false); }} />
        ) : null}
        {menyOpp ? (
          <nav className="meny-panel" data-testid="meny-panel">
            {senare ? (
              <p className="meny-fraga" data-testid="demo-senare">
                {TEXTER.demo.senare}
              </p>
            ) : null}
            <button
              type="button"
              data-testid="flik-ang"
              className={panel === "spel" && varld === "ang" ? "pa" : ""}
              onClick={() => valjVarld("ang")}
            >
              {TEXTER.flikar.angen}
            </button>
            <button
              type="button"
              data-testid="flik-gard"
              className={menyJson.oppen.gard ? (panel === "spel" && varld === "gard" ? "pa" : "") : "last"}
              {...(menyJson.oppen.gard ? {} : { "data-last": "ja" })}
              onClick={menyJson.oppen.gard ? () => valjVarld("gard") : lasMeny}
            >
              <span>{TEXTER.flikar.garden}</span>
              {menyJson.oppen.gard ? null : <Lock aria-hidden />}
            </button>
            <button
              type="button"
              data-testid="flik-byggbok"
              className={menyJson.oppen.byggbok ? (panel === "byggbok" ? "pa" : "") : "last"}
              {...(menyJson.oppen.byggbok ? {} : { "data-last": "ja" })}
              onClick={menyJson.oppen.byggbok ? () => valjVarld("byggbok") : lasMeny}
            >
              <span>{TEXTER.flikar.byggboken}</span>
              {menyJson.oppen.byggbok ? null : <Lock aria-hidden />}
            </button>
            <button
              type="button"
              data-testid="album-knapp"
              className={menyJson.oppen.album ? "" : "last"}
              {...(menyJson.oppen.album ? {} : { "data-last": "ja" })}
              onClick={
                menyJson.oppen.album
                  ? () => {
                      setMenyOpp(false);
                      setMenySaker(false);
                      setSenare(false);
                      setBokOpp(false);
                      oppnaAlbum?.();
                    }
                  : lasMeny
              }
            >
              <span>{ALBUM.texter.knapp}</span>
              {menyJson.oppen.album ? null : <Lock aria-hidden />}
            </button>
            <button type="button" data-testid="ut-pa-aventyr" onClick={() => { setMenyOpp(false); setBokOpp(false); oppnaKarta(); }}>
              <span>{OMR.karta.knapp}</span>
            </button>
            <button type="button" data-testid="uppdrag-knapp" onClick={oppnaUppdrag}>
              <span>{UPP.texter.rubrik}</span>
            </button>
            <StallMeny stang={() => { setMenyOpp(false); setMenySaker(false); setSenare(false); }} />
            <button
              type="button"
              data-testid="ordbok"
              className={menyJson.oppen.ordbok ? "" : "last"}
              {...(menyJson.oppen.ordbok ? {} : { "data-last": "ja" })}
              onClick={
                menyJson.oppen.ordbok
                  ? () => {
                      setMenyOpp(false);
                      setMenySaker(false);
                      setSenare(false);
                      setBokOpp(false);
                      oppnaOrdbok?.();
                    }
                  : lasMeny
              }
            >
              <span>Bok</span>
              {menyJson.oppen.ordbok ? null : <Lock aria-hidden />}
            </button>
            <button
              type="button"
              data-testid="intro-meny"
              onClick={() => {
                setMenyOpp(false);
                setIntroNy((n) => n + 1);
                setIntro(true);
              }}
            >
              {(introJson as { meny: string }).meny}
            </button>
            <button
              type="button"
              className="farlig"
              data-testid="meny-borja"
              onClick={() => {
                setMenySaker(true);
                requestAnimationFrame(() => {
                  document.querySelector("[data-testid=meny-borja-fraga]")?.scrollIntoView({ block: "end" });
                });
              }}
            >
              {TEXTER.borja_om.knapp}
            </button>
            {menySaker ? (
              <div data-testid="meny-borja-fraga">
                <p className="meny-fraga">{TEXTER.borja_om.fraga}</p>
                <button type="button" data-testid="meny-borja-ja" onClick={borjaOm}>
                  {TEXTER.borja_om.ja}
                </button>
                <button type="button" data-testid="meny-borja-nej" onClick={() => setMenySaker(false)}>
                  {TEXTER.backup.las_in_nej}
                </button>
              </div>
            ) : null}
          </nav>
        ) : null}
</>
  );
}

type HudBotProps = {
  varld: Varld;
  omrade: string | null;
  kartaOpp: boolean;
  oppnaBygglage: () => void;
  setPanel: Dispatch<SetStateAction<"spel" | "byggbok" | "uppdrag">>;
  setBokOpp: Dispatch<SetStateAction<boolean>>;
  /** P2-2: Bengtsson som primär knapp bredvid Skriv (förslag A). */
  npc?: { npcId: string; ikonText: string; ikonAlt: string; klicka: () => void };
};

export function HudBot({ varld, omrade, kartaOpp, oppnaBygglage, setPanel, setBokOpp, npc }: HudBotProps) {
  const gard = varld === "gard" && !omrade;
  const pahemma = varld === "ang" && !omrade && !kartaOpp;
  return (
        <div className={pahemma && npc ? "hud-bot tva" : "hud-bot"}>
          {pahemma && npc ? <NpcIkon npc={npc.npcId} nytt={false} text={npc.ikonText} alt={npc.ikonAlt} onClick={npc.klicka} /> : null}
          <button
            type="button"
            className={gard ? "bok-knapp bygg" : "bok-knapp"}
            data-testid={varld === "gard" && !omrade ? "bygg-nagot" : "pennans-bok"}
            aria-label={gard ? undefined : "Skriv i Pennans bok"}
            onClick={() => {
              if (gard && !kartaOpp) {
                oppnaBygglage();
                return;
              }
              setPanel("spel");
              setBokOpp(true);
            }}
          >
            <Pencil aria-hidden />
            {gard ? TEXTER.bygg_nagot : FORSTA.titel.skriv}
          </button>
          <Coach aktiv={pahemma} />
        </div>
  );
}
