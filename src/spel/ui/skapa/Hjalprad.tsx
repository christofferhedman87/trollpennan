// Nya Skapa 6.5: Idé · tips · Ordhjälp. Inga förslag visas av sig själva: står barnet still mitt i ett ord
// i 7 sekunder pulserar Ordhjälp och tipset ändras, men hjälpen öppnas först när barnet trycker.
import { useEffect, useState } from "react";
import uiJson from "../../../../data/skapa-ui.json" with { type: "json" };
import { fyll } from "../../fyll.ts";
import * as rostKo from "../../rostKo.ts";
import { ikon } from "../../skapa/ikoner.ts";
import { useSpel } from "../SpelKontext.ts";

const UI = uiJson as unknown as { hjalprad: Record<string, string>; tider_ms: Record<string, number> };

/** "<b>Mellanslag</b> när …" → fetstil i UI:t. Texterna kommer från skapa-ui.json, inte från barnet. */
export function Fet({ text }: { text: string }) {
  const delar = text.split(/(<b>.*?<\/b>)/g).filter(Boolean);
  return <>{delar.map((d, i) => (d.startsWith("<b>") ? <b key={i}>{d.slice(3, -4)}</b> : <span key={i}>{d}</span>))}</>;
}

export function Hjalprad({ oppnaHjalp, ide }: { oppnaHjalp: () => void; ide: () => void }) {
  const { sk } = useSpel();
  const { remsa, spok, sistaTangent } = sk;
  const [fast, setFast] = useState(false);
  const skriver = !!remsa.skriv.trim();
  useEffect(() => {
    setFast(false);
    if (!skriver || spok) return;
    const id = window.setTimeout(() => setFast(true), UI.tider_ms.fast_puls ?? 7000);
    return () => window.clearTimeout(id);
  }, [skriver, spok, sistaTangent]);
  const tips = spok
    ? fyll(UI.hjalprad.tips_spok ?? "", { ord: spok.ord })
    : fast
      ? UI.hjalprad.tips_fast
      : skriver
        ? UI.hjalprad.tips_skriver
        : remsa.harVad
          ? UI.hjalprad.tips_klar
          : UI.hjalprad.tips_tom;
  return (
    <div className="sk-hjalprad">
      <button type="button" className="sk-knapp guld" aria-label={UI.hjalprad.ide_aria} data-dal="ide" onClick={ide}>
        <img alt="" src={ikon("ui", "tarning")} />
        {UI.hjalprad.ide}
      </button>
      <p className="sk-tips">
        <Fet text={tips ?? ""} />
      </p>
      {spok ? (
        <button type="button" className="sk-knapp" onClick={() => rostKo.lasUpp(spok.ord)}>
          <img alt="" src={ikon("ui", "lyssna")} />
          {UI.hjalprad.hor}
        </button>
      ) : (
        <button type="button" className={fast ? "sk-knapp pulsa" : "sk-knapp"} data-dal="ordhjalp" onClick={oppnaHjalp}>
          <img alt="" src={ikon("ui", "ordhjalp")} />
          {UI.hjalprad.ordhjalp}
        </button>
      )}
    </div>
  );
}
