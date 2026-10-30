// Nya Skapa 6.1 (fas E): HUD:en. Uppe: lås (håll inne), stjärnor … Se hela dalen och Karta som runda klistermärken.
// Nere (bara på ängen, döljs när ett ark är öppet): Uppdrag, Skriv (stor, i mitten) och Min bok.
// Hamburgermenyn är borta: allt den hade finns i Min bok, Karta eller hos låset (För vuxna).
import type { Dispatch, SetStateAction } from "react";
import uiJson from "../../../data/skapa-ui.json" with { type: "json" };
import { fyll } from "../fyll.ts";
import { ikon } from "../skapa/ikoner.ts";
import { HoldOppnare } from "./HoldOppnare.tsx";
import { Coach } from "./Coach.tsx";
import { mineUrl } from "../npc.ts";
import { FIR } from "./spelData.ts";
import type { Varld } from "./typer.ts";
import "./hud-p2.css";
import "./skapa/skapa.css";

const UI = uiJson as unknown as { hud: Record<string, string> };

type HudProps = {
  haller: boolean;
  setHaller: Dispatch<SetStateAction<boolean>>;
  setForalder: Dispatch<SetStateAction<boolean>>;
  stjarnor: number;
  oppnaStjarnor: () => void;
  hittatAntal: number;
  totalOrd: number;
  varld: Varld;
  hemTillAngen: () => void;
  oppnaKarta: () => void;
  /** Se hela dalen (flygturen). Saknas när den inte går att starta just nu. */
  seDalen?: () => void;
};

export function Hud({ oppnaStjarnor, haller, setHaller, setForalder, stjarnor, hittatAntal, totalOrd, varld, hemTillAngen, oppnaKarta, seDalen }: HudProps) {
  return (
    <div className="hud sk-hud-topp" ref={(el) => el?.setAttribute("data-testid", "topp-hud")}>
      <button
        type="button"
        className={haller ? "sk-hud-rund foralder-knapp haller" : "sk-hud-rund foralder-knapp"}
        aria-label={UI.hud.vuxna_aria}
        data-testid="foralder-hall"
        onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setHaller(true); } }}
        onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") setHaller(false); }}
        onBlur={() => setHaller(false)}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          if (!e.isPrimary || e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          setHaller(true);
        }}
        onPointerUp={() => setHaller(false)}
        onPointerCancel={() => setHaller(false)}
        onLostPointerCapture={() => setHaller(false)}
        onPointerLeave={() => setHaller(false)}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) setHaller(false);
        }}
      >
        <span className="ring" />
        <img alt="" src={ikon("ui", "las")} />
      </button>
      <HoldOppnare haller={haller} oppna={() => { setHaller(false); setForalder(true); }} />
      {varld !== "ang" ? (
        <button type="button" className="hem-angen-knapp" data-f5="hem-angen" data-w3="vagvisare-knapp" data-plats="ang" aria-label="Till Ängen" ref={(el) => el?.setAttribute("data-testid", "hem-angen")} onClick={hemTillAngen}>
          <img alt="" src={ikon("ui", "hem")} />
          Till Ängen
        </button>
      ) : null}
      <button type="button" className="sk-hud-stjarnor" data-testid="stjarnor" data-v9a="hud-stjarnor" aria-label={fyll(UI.hud.stjarnor_aria ?? FIR.stjarnor.har, { n: stjarnor })} onClick={oppnaStjarnor}>
        <img alt="" src={ikon("ui", "stjarna")} />
        {stjarnor}
      </button>
      <span className="dold" data-testid="framsteg">
        {fyll(FIR.framsteg.kort, { n: hittatAntal, total: totalOrd })}
      </span>
      <span className="sk-hud-luft" />
      {seDalen ? (
        <button type="button" className="sk-hud-rund" aria-label={UI.hud.dalen_aria} data-dal="se-dalen" onClick={seDalen}>
          <img alt="" src={ikon("ui", "dalen")} />
        </button>
      ) : null}
      <button type="button" className="sk-hud-rund" aria-label={UI.hud.karta_aria} data-testid="ut-pa-aventyr" onClick={oppnaKarta}>
        <img alt="" src={ikon("ui", "karta")} />
      </button>
    </div>
  );
}

type HudBottenProps = {
  pahemma: boolean;
  oppnaSkriv: () => void;
  oppnaMinBok: () => void;
  minBokOpp: boolean;
  /** Doktor Bengtsson: porträttet och en bricka när något nytt finns. */
  npc?: { npcId: string; mine: string; nytt: boolean; klicka: () => void };
};

export function HudBotten({ pahemma, oppnaSkriv, oppnaMinBok, minBokOpp, npc }: HudBottenProps) {
  if (!pahemma) return null;
  return (
    <nav className="sk-hud-botten" aria-label="Huvudmeny">
      {npc ? (
        <button type="button" className="sk-hud-sida forst" data-testid="bengtsson-ikon" data-m1="hud-uppdrag" data-mine={npc.mine} onClick={npc.klicka}>
          <span className="sk-hud-sida-bild portratt">
            <span className="sk-portratt-ram"><img alt="" src={mineUrl(npc.npcId, npc.mine === "automat" ? "tankande" : npc.mine)} draggable={false} /></span>
            {npc.nytt ? <b className="sk-bricka" data-m1="uppdrag-badge" aria-hidden="true">!</b> : null}
          </span>
          <span className="sk-hud-etikett">{UI.hud.uppdrag}</span>
        </button>
      ) : (
        <span />
      )}
      <button type="button" className="sk-hud-skapa" data-testid="pennans-bok" data-v2="skriv-knapp" data-m1="hud-skapa" aria-label={UI.hud.skriv_aria} onClick={oppnaSkriv}>
        <span className="sk-hud-skapa-cirkel"><img alt="" src={ikon("grafik", "penna-redo")} /></span>
        <span className="sk-hud-etikett stor">{UI.hud.skriv}</span>
      </button>
      <button type="button" className="sk-hud-sida sist" data-testid="meny" aria-expanded={minBokOpp} onClick={oppnaMinBok}>
        <span className="sk-hud-sida-bild"><img alt="" src={ikon("ui", "boken")} /></span>
        <span className="sk-hud-etikett">{UI.hud.min_bok}</span>
      </button>
      <Coach aktiv={pahemma} />
    </nav>
  );
}
