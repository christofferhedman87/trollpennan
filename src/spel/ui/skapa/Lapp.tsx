// Nya Skapa 6.9: lappen överst i arket säger vad som är speciellt just nu: en önskan, en gåva, en idé från tärningen.
// Allt annat i boken är likadant. Lappen läses upp när den visas och med högtalaren.
import { useState, type ReactNode } from "react";
import uiJson from "../../../../data/skapa-ui.json" with { type: "json" };
import { fyll } from "../../fyll.ts";
import { djurMedUid } from "../../liv.ts";
import { useMinne } from "../../minne.ts";
import * as rostKo from "../../rostKo.ts";
import { ideKort, ideText } from "../../skapa/idetarning.ts";
import { ikon, kortBild } from "../../skapa/ikoner.ts";
import { forsokDopaText, gavoRuta } from "../gavoRuta.ts";
import { bestamdAv } from "../hjalp.ts";
import { useSpel } from "../SpelKontext.ts";
import { GavaStallKnapp } from "../Stall.tsx";
import { useBokMal } from "../../skapa/useBokMal.ts";
import { onskeKort } from "../../skapa/hjalpord.ts";
import { LappRam, useLagBok } from "./LappRam.tsx";
import { harBoksvar } from "../../skapa/svarsLage.ts";
import type { IdeLapp } from "./gataLapp.ts";

const UI = uiJson as unknown as { lapp: Record<string, string>; ide: Record<string, string>; gata_knapp: string };
const SNABB_NAMN = ["Skuttis", "Misse", "Blixten"] as const;

export function Lapp({ ide }: { ide: IdeLapp | null }) {
  const k = useSpel();
  const mal = useBokMal();
  const lag = useLagBok();
  const svar = harBoksvar(k.sk, k.t);
  const kompakt = lag || !!ide || svar;
  const l = mal.lapp;
  let lapp: ReactNode = l ? <LappRam {...l} las={l.text} kompakt={kompakt} /> : null;
  if (mal.slag === "gava" && k.t.gavaTill) lapp = <GavoLapp key={k.t.gavaTill} gavaTill={k.t.gavaTill} kompakt={kompakt} />;
  else if (mal.slag === "onskan") lapp = <div data-testid="onska-remsa" style={{ display: "contents" }}>{lapp}</div>;
  return <>{lapp}{ide && !svar ? <IdeRam ide={ide} kompakt={lag} /> : null}</>;
}

function IdeRam({ ide, kompakt }: { ide: IdeLapp; kompakt: boolean }) {
  const { sk } = useSpel();
  const har = new Set(sk.remsa.brickor.map((b) => b.id).filter(Boolean));
  if (ide.slag === "gata") return <LappRam kompakt={kompakt} bild={ikon("ui", "agg")} fran={UI.lapp.gata_fran ?? ""} text={`${ide.gata} ${ide.streck}`} las={ide.gata} />;
  const kort = (ide.slag === "mal" ? onskeKort([ide.fras]) : ideKort(ide.ide)).filter((k) => k.bild !== ikon("ui", "agg"));
  const text = ide.slag === "mal" ? ide.fras : ideText(ide.ide);
  return <LappRam kompakt={kompakt} bild={null} fran={UI.ide.rubrik ?? ""} text={text} las={text}>
    <div className="sk-ide-rad">
      {kort.map((k) => <span key={k.nyckel} className={har.has(k.id) ? "sk-ide-bit klar" : "sk-ide-bit"}>
        <img alt={k.visa} src={k.bild} />
      </span>)}
    </div>
  </LappRam>;
}

/** Gåva till ett djur ("egen:<uid>" eller ett vilt djur). Döp-knappen och snabbnamnen från förra boken finns kvar. */
function GavoLapp({ gavaTill, kompakt }: { gavaTill: string; kompakt: boolean }) {
  const k = useSpel();
  const { visaBanner } = k.b;
  const { stangBok } = k.o;
  const { fyllExempel } = k.sk;
  const [namnForslag, setNamnForslag] = useState(false);
  const egen = gavaTill.startsWith("egen:");
  const uid = egen ? gavaTill.slice(5) : "";
  const djur = useMinne((s) => (uid ? djurMedUid(s, uid) : undefined));
  const kropp = djur?.kropp ?? "";
  const text = gavoRuta(gavaTill);
  function dopa() {
    if (!uid) return;
    const ra = k.t.textRef.current.trim();
    if (!ra) {
      fyllExempel("heter ");
      setNamnForslag(true);
      return;
    }
    const traff = forsokDopaText(ra, uid);
    const upp = traff?.djur ?? useMinne.getState().bytSmeknamn(uid, ra);
    const visat = traff?.namn ?? upp?.smeknamn;
    if (visat) visaBanner(`Nu heter djuret ${visat}!`, "ovr", "tapp");
    fyllExempel("");
    setNamnForslag(false);
  }
  function geNamn(namn: string) {
    if (!uid) return;
    useMinne.getState().bytSmeknamn(uid, namn);
    visaBanner(`Nu heter djuret ${namn}!`, "ovr", "tapp");
    fyllExempel("");
    setNamnForslag(false);
  }
  return (
    <div data-testid="gava-remsa" style={{ display: "contents" }}>
      <LappRam kompakt={kompakt} bild={kropp ? kortBild(kropp) : ikon("ui", "agg")} fran={fyll(UI.lapp.gava_fran ?? "", { djur: kropp ? bestamdAv(kropp, false) : "" })} text={text} las={text}>
        {egen ? (
          <>
            <button type="button" className="sk-knapp" data-d3="dop-knapp" ref={(el) => el?.setAttribute("data-testid", "dop-knapp")} onClick={dopa}>
              {djur?.smeknamn?.trim() ? UI.lapp.byt_namn : UI.lapp.dop}
            </button>
            {namnForslag
              ? SNABB_NAMN.map((n) => (
                  <button key={n} type="button" className="sk-knapp dov" data-c3="snabb-namn" onClick={() => geNamn(n)}>
                    {n}
                  </button>
                ))
              : null}
            <GavaStallKnapp uid={uid} visaBanner={visaBanner} klar={stangBok} />
          </>
        ) : null}
      </LappRam>
    </div>
  );
}
