import type { Dispatch, SetStateAction } from "react"; import { Lock, Pencil } from "lucide-react";
import menyJson from "../../../data/meny.json" with { type: "json" }; import { fyll } from "../fyll.ts";
import { ljud } from "../ljud.ts"; import { useMinne } from "../minne.ts";
import { HoldOppnare } from "./HoldOppnare.tsx"; import { StallMeny } from "./Stall.tsx";
import { Coach } from "./Coach.tsx"; import { NpcIkon } from "./NpcFigur.tsx";
import { FORSTA } from "../forstaStunden.ts"; import "./hud-p2.css";
import { FIR, TEXTER } from "./spelData.ts"; import type { Varld } from "./typer.ts";

type HudProps = { haller: boolean;
  setHaller: Dispatch<SetStateAction<boolean>>; setForalder: Dispatch<SetStateAction<boolean>>;
  stjarnor: number; oppnaStjarnor: () => void;
  hittatAntal: number; totalOrd: number;
  menyOpp: boolean; setMenyOpp: Dispatch<SetStateAction<boolean>>;
  setMenySaker: Dispatch<SetStateAction<boolean>>; setSenare: Dispatch<SetStateAction<boolean>>;
  varld: Varld; hemTillAngen: () => void;
};

export function Hud({ oppnaStjarnor, haller, setHaller, setForalder, stjarnor, hittatAntal, totalOrd, menyOpp, setMenyOpp, setMenySaker, setSenare, varld, hemTillAngen }: HudProps) { return (
        <div className="hud" ref={(el) => el?.setAttribute("data-testid", "topp-hud")}> <button
            type="button" className={haller ? "foralder-knapp haller" : "foralder-knapp"}
            aria-label="För vuxna, håll inne" data-testid="foralder-hall"
            onClick={() => setForalder(true)} onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId);
              setHaller(true); }}
            onPointerUp={() => setHaller(false)} onPointerCancel={() => setHaller(false)}
          > <span className="ring" />
            <Lock className="prick-las" aria-hidden /> </button>
          <HoldOppnare haller={haller} oppna={() => setForalder(true)} /> {varld !== "ang" ? (
            <button type="button"
              className="hem-angen-knapp" data-f5="hem-angen" data-w3="vagvisare-knapp" data-plats="ang"
              aria-label="Till Ängen" ref={(el) => el?.setAttribute("data-testid", "hem-angen")}
              onClick={hemTillAngen}
            >
              🏡 Till Ängen
            </button> ) : null}
          <button type="button" className="stjarna-hud" data-testid="stjarnor" data-v9a="hud-stjarnor" aria-label={fyll(FIR.stjarnor.har, { n: stjarnor })} onClick={oppnaStjarnor}>
            ⭐ {stjarnor}
            <span className="stjarna-fraga" aria-hidden="true">?</span> </button>
          <span className="dold" data-testid="framsteg"> {fyll(FIR.framsteg.kort, { n: hittatAntal, total: totalOrd })}
          </span> <button
            type="button" className="meny-knapp"
            data-testid="meny" aria-expanded={menyOpp}
            aria-label="Meny" onClick={() => {
              setMenyOpp((v) => !v); setMenySaker(false);
              setSenare(false); }}
          > <span ref={(el) => el?.setAttribute("data-testid", "meny-knapp")} />
            <span /> <span />
          </button> </div>
  ); }

type MenyPanelProps = { menyOpp: boolean;
  setMenyOpp: Dispatch<SetStateAction<boolean>>; setMenySaker: Dispatch<SetStateAction<boolean>>;
  setSenare: Dispatch<SetStateAction<boolean>>; senare: boolean;
  panel: "spel" | "byggbok" | "uppdrag"; varld: Varld;
  valjVarld: (id: "ang" | "gard" | "byggbok") => void; lasMeny: () => void;
  oppnaUppdrag: () => void; setBokOpp: Dispatch<SetStateAction<boolean>>;
  oppnaKarta: () => void; setIntroNy: Dispatch<SetStateAction<number>>;
  setIntro: Dispatch<SetStateAction<boolean>>; menySaker: boolean;
  borjaOm: () => void; oppnaAlbum?: () => void;
  oppnaOrdbok?: () => void; setForalder: Dispatch<SetStateAction<boolean>>;
  stangModaler: () => void; };

function MenyIkon({ tecken }: { tecken: string }) { return (
    <span className="meny-ikon" data-v2="meny-ikon" aria-hidden="true"> {tecken}
    </span> );
}

export function MenyPanel({ menyOpp, setMenyOpp, setMenySaker, setSenare, senare, panel, varld, valjVarld, lasMeny, oppnaUppdrag, setBokOpp, oppnaKarta, setIntroNy, setIntro, menySaker, borjaOm, oppnaAlbum, oppnaOrdbok, setForalder, stangModaler }: MenyPanelProps) { const ljudPa = useMinne((s) => s.ljudPa);
  const v2 = menyJson.v2; const stangMeny = () => {
    setMenyOpp(false); setMenySaker(false);
    setSenare(false); };
  return ( <>
        {menyOpp ? ( <button type="button" className="meny-bak" aria-label="Stäng" onClick={stangMeny} />
        ) : null}
        {menyOpp ? ( <nav className="meny-panel" data-testid="meny-panel">
            {senare ? ( <p className="meny-fraga" data-testid="demo-senare" hidden>
                {TEXTER.demo.senare}
              </p> ) : null}
            <button type="button" data-testid="flik-ang" className={panel === "spel" && varld === "ang" ? "pa" : ""} onClick={() => { stangModaler(); valjVarld("ang"); }}> <MenyIkon tecken={v2.ang.ikon} />
              <span>{TEXTER.flikar.angen}</span> </button>
            <button type="button"
              data-testid="flik-gard" className={menyJson.oppen.gard ? (panel === "spel" && varld === "gard" ? "pa" : "") : "last"}
              {...(menyJson.oppen.gard ? {} : { "data-last": "ja" })} onClick={menyJson.oppen.gard ? () => { stangModaler(); valjVarld("gard"); } : lasMeny}
            > <MenyIkon tecken={v2.gard.ikon} />
              <span>{v2.gard.text}</span> {menyJson.oppen.gard ? null : <Lock aria-hidden />}
            </button> <button
              type="button" data-testid="flik-byggbok"
              hidden className={menyJson.oppen.byggbok ? (panel === "byggbok" ? "pa" : "") : "last"}
              {...(menyJson.oppen.byggbok ? {} : { "data-last": "ja" })} onClick={menyJson.oppen.byggbok ? () => { stangModaler(); valjVarld("byggbok"); } : lasMeny}
            > <MenyIkon tecken={v2.byggbok.ikon} />
              <span>{TEXTER.flikar.byggboken}</span> {menyJson.oppen.byggbok ? null : <Lock aria-hidden />}
            </button> <button type="button" data-testid="ut-pa-aventyr" onClick={() => { stangModaler(); setMenyOpp(false); setBokOpp(false); oppnaKarta(); }}>
              <MenyIkon tecken={v2.aventyr.ikon} /> <span>{v2.aventyr.text}</span>
            </button> <button type="button" data-testid="uppdrag-knapp" onClick={() => { stangModaler(); oppnaUppdrag(); }}>
              <MenyIkon tecken={v2.uppdrag.ikon} /> <span>{v2.uppdrag.text}</span>
            </button> <button
              type="button" data-testid="album-knapp"
              className={menyJson.oppen.album ? "" : "last"}
              {...(menyJson.oppen.album ? {} : { "data-last": "ja" })} onClick={
                menyJson.oppen.album ? () => {
                      stangMeny(); stangModaler();
                      setBokOpp(false); oppnaAlbum?.();
                    } : lasMeny
              }
            > <MenyIkon tecken={v2.album.ikon} />
              <span>{v2.album.text}</span> {menyJson.oppen.album ? null : <Lock aria-hidden />}
            </button> <button
              type="button" data-testid="ordbok"
              className={menyJson.oppen.ordbok ? "" : "last"}
              {...(menyJson.oppen.ordbok ? {} : { "data-last": "ja" })} onClick={
                menyJson.oppen.ordbok ? () => {
                      stangMeny(); stangModaler();
                      setBokOpp(false); oppnaOrdbok?.();
                    } : lasMeny
              }
            > <MenyIkon tecken={v2.ordbok.ikon} />
              <span>{v2.ordbok.text}</span> {menyJson.oppen.ordbok ? null : <Lock aria-hidden />}
            </button> <StallMeny stang={stangMeny} />
            <button type="button"
              data-testid="intro-meny" onClick={() => {
                stangModaler(); setMenyOpp(false);
                setIntroNy((n) => n + 1); setIntro(true);
              }}
            > <MenyIkon tecken={v2.intro.ikon} />
              <span>{v2.intro.text}</span> </button>
            <button type="button"
              data-v2="meny-ljud" onClick={() => {
                const nasta = !ljudPa; useMinne.getState().sattLjud(nasta);
                ljud.satt(nasta); }}
            > <MenyIkon tecken={ljudPa ? v2.ljud_pa.ikon : v2.ljud_av.ikon} />
              <span>{ljudPa ? v2.ljud_pa.text : v2.ljud_av.text}</span> </button>
            <button type="button"
              ref={(el) => el?.setAttribute("data-testid", "meny-foralder")} onClick={() => {
                stangModaler();
                setMenyOpp(false);
                setForalder(true);
              }}
            >
              <MenyIkon tecken={v2.foralder.ikon} />
              <span>{v2.foralder.text}</span>
            </button>
            <button
              type="button"
              className="farlig meny-borja"
              data-testid="meny-borja"
              hidden
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
              <div data-testid="meny-borja-fraga" hidden>
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
  npc?: { npcId: string; mine: string; nytt: boolean; ikonText: string; ikonAlt: string; klicka: () => void };
};

export function HudBot({ varld, omrade, kartaOpp, oppnaBygglage, setPanel, setBokOpp, npc }: HudBotProps) {
  const gard = varld === "gard" && !omrade;
  const pahemma = varld === "ang" && !omrade && !kartaOpp;
  return (
        <div className={pahemma && npc ? "hud-bot tva" : "hud-bot"}>
          {pahemma && npc ? <NpcIkon npc={npc.npcId} mine={npc.mine} nytt={npc.nytt} etikett="📋 Uppdrag" onClick={npc.klicka} /> : null}
          <button
            type="button"
            className={gard ? "bok-knapp bygg" : "bok-knapp"}
            data-testid={varld === "gard" && !omrade ? "bygg-nagot" : "pennans-bok"}
            data-v2="skriv-knapp"
            data-m1="hud-skapa"
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
            {pahemma ? (
              <>
                <span className="hud-kort-ikon" aria-hidden="true">🪄</span>
                <span className="hud-kort-text">
                  <span className="hud-kort-over">Pennans bok</span>
                  <span className="hud-kort-huvud">Trolla fram · Skriv</span>
                </span>
              </>
            ) : (
              <>
                {gard ? <Pencil aria-hidden /> : <span aria-hidden="true">✍️ </span>}
                <span ref={(el) => { if (el) { if (gard) el.setAttribute("data-testid", "hus-knapp"); else el.removeAttribute("data-testid"); } }}>{gard ? TEXTER.bygg_nagot : FORSTA.titel.skriv}</span>
                <span style={{ display: "inline-block", width: 2, height: 2 }} ref={(el) => { if (el) { if (gard) el.setAttribute("data-testid", "pennans-bok"); else el.removeAttribute("data-testid"); } }} onClick={(e) => { if (gard) { e.stopPropagation(); setPanel("byggbok"); setBokOpp(true); } }} />
              </>
            )}
          </button>
          <Coach aktiv={pahemma} />
        </div>
  );
}
