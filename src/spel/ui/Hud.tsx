import type { Dispatch, SetStateAction } from "react";
import { Lock, Pencil } from "lucide-react";
import introJson from "../../../data/intro.json" with { type: "json" };
import { OMR, UPP } from "../aventyr.ts";
import { fyll } from "../fyll.ts";
import { ALBUM } from "../liv.ts";
import { HoldOppnare } from "./HoldOppnare.tsx";
import { FIR, TEXTER } from "./spelData.ts";
import type { Varld } from "./typer.ts";

type HudProps = {
  haller: boolean;
  setHaller: Dispatch<SetStateAction<boolean>>;
  setForalder: Dispatch<SetStateAction<boolean>>;
  stjarnor: number;
  hittatAntal: number;
  totalOrd: number;
  menyOpp: boolean;
  setMenyOpp: Dispatch<SetStateAction<boolean>>;
  setMenySaker: Dispatch<SetStateAction<boolean>>;
  setSenare: Dispatch<SetStateAction<boolean>>;
};

export function Hud({ haller, setHaller, setForalder, stjarnor, hittatAntal, totalOrd, menyOpp, setMenyOpp, setMenySaker, setSenare }: HudProps) {
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
            <span className="prick" />
          </button>
          <HoldOppnare haller={haller} oppna={() => setForalder(true)} />
          <span className="stjarna-hud" data-testid="stjarnor" aria-label={fyll(FIR.stjarnor.har, { n: stjarnor })}>
            ★ {stjarnor}
          </span>
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
  setBokOpp: Dispatch<SetStateAction<boolean>>;
  oppnaKarta: () => void;
  setIntroNy: Dispatch<SetStateAction<number>>;
  setIntro: Dispatch<SetStateAction<boolean>>;
  menySaker: boolean;
  borjaOm: () => void;
};

export function MenyPanel({ menyOpp, setMenyOpp, setMenySaker, setSenare, senare, panel, varld, valjVarld, lasMeny, setBokOpp, oppnaKarta, setIntroNy, setIntro, menySaker, borjaOm }: MenyPanelProps) {
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
            <button type="button" className="last" data-testid="flik-gard" data-last="ja" onClick={lasMeny}>
              <span>{TEXTER.flikar.garden}</span>
              <Lock aria-hidden />
            </button>
            <button type="button" className="last" data-testid="flik-byggbok" data-last="ja" onClick={lasMeny}>
              <span>{TEXTER.flikar.byggboken}</span>
              <Lock aria-hidden />
            </button>
            <button type="button" className="last" data-testid="album-knapp" data-last="ja" onClick={lasMeny}>
              <span>{ALBUM.texter.knapp}</span>
              <Lock aria-hidden />
            </button>
            <button type="button" data-testid="ut-pa-aventyr" onClick={() => { setMenyOpp(false); setBokOpp(false); oppnaKarta(); }}>
              <span>{OMR.karta.knapp}</span>
            </button>
            <button type="button" className="last" data-testid="uppdrag-knapp" data-last="ja" onClick={lasMeny}>
              <span>{UPP.texter.rubrik}</span>
              <Lock aria-hidden />
            </button>
            <button type="button" className="last" data-testid="ordbok" data-last="ja" onClick={lasMeny}>
              <span>Bok</span>
              <Lock aria-hidden />
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
};

export function HudBot({ varld, omrade, kartaOpp, oppnaBygglage, setPanel, setBokOpp }: HudBotProps) {
  return (
        <div className="hud-bot">
          <button
            type="button"
            className={varld === "gard" && !omrade ? "bok-knapp bygg" : "bok-knapp"}
            data-testid={varld === "gard" && !omrade ? "bygg-nagot" : "pennans-bok"}
            onClick={() => {
              if (varld === "gard" && !omrade && !kartaOpp) {
                oppnaBygglage();
                return;
              }
              setPanel("spel");
              setBokOpp(true);
            }}
          >
            {varld === "gard" && !omrade ? (
              <>
                <Pencil aria-hidden />
                {TEXTER.bygg_nagot}
              </>
            ) : (
              "Pennans bok"
            )}
          </button>
        </div>
  );
}
