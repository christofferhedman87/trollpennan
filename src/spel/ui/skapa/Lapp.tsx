// Nya Skapa 6.9: lappen överst i arket säger vad som är speciellt just nu: en önskan, en gåva, en idé från tärningen.
// Allt annat i boken är likadant. Lappen läses upp när den visas och med högtalaren.
import { useEffect, useState, type ReactNode } from "react";
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

const UI = uiJson as unknown as { lapp: Record<string, string>; ide: Record<string, string> };
const SNABB_NAMN = ["Skuttis", "Misse", "Blixten"] as const;

function LappRam({ bild, fran, text, las, children }: { bild: string | null; fran: string; text: string; las: string; children?: ReactNode }) {
  useEffect(() => {
    if (las) rostKo.lasUpp(las);
  }, [las]);
  return (
    <div className={bild ? "sk-lapp" : "sk-lapp utan-bild"} data-dal="lapp">
      {bild ? <span className="sk-lapp-bild"><img alt="" src={bild} /></span> : null}
      <p className="sk-lapp-text">
        <small>{fran}</small>
        {text}
      </p>
      <button type="button" className="sk-rund" aria-label={UI.lapp.lyssna_aria} data-p4="lyssna-onska" onClick={() => rostKo.lasUpp(las)}>
        <img alt="" src={ikon("ui", "lyssna")} />
      </button>
      {children ? <div className="sk-lapp-extra">{children}</div> : null}
    </div>
  );
}

export function Lapp({ ide }: { ide: string[] | null }) {
  const k = useSpel();
  const { gavaTill, onskan } = k.t;
  const { remsa } = k.sk;
  if (gavaTill) return <GavoLapp key={gavaTill} gavaTill={gavaTill} />;
  if (k.vy.visaOnskaHjalp && onskan) {
    const djur = k.vy.onskaDjur;
    const namn = djur ? bestamdAv(djur.kropp, true) : "";
    return (
      <div data-testid="onska-remsa" style={{ display: "contents" }}>
        <LappRam bild={djur ? kortBild(djur.kropp) : ikon("ui", "stjarna")} fran={fyll(UI.lapp.onskan_fran ?? "", { djur: namn || "Ett djur" })} text={onskan.text} las={onskan.text} />
      </div>
    );
  }
  if (ide) {
    const har = new Set(remsa.brickor.map((b) => b.id).filter(Boolean));
    const text = ideText(ide);
    return (
      <LappRam bild={null} fran={UI.ide.rubrik ?? ""} text={UI.ide.fraga ?? ""} las={text}>
        <div className="sk-ide-rad">
          {ideKort(ide).map((kort) => (
            <span key={kort.nyckel} className={har.has(kort.id) ? "sk-ide-bit klar" : "sk-ide-bit"}>
              <img alt="" src={kort.bild} />
            </span>
          ))}
        </div>
      </LappRam>
    );
  }
  return null;
}

/** Gåva till ett djur ("egen:<uid>" eller ett vilt djur). Döp-knappen och snabbnamnen från förra boken finns kvar. */
function GavoLapp({ gavaTill }: { gavaTill: string }) {
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
      <LappRam bild={kropp ? kortBild(kropp) : ikon("ui", "agg")} fran={fyll(UI.lapp.gava_fran ?? "", { djur: kropp ? bestamdAv(kropp, false) : "" })} text={text} las={text}>
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
