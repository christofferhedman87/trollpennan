// Nya Skapa 6.6: tangenterna (data/tangentbord.json). Vokalerna är rosa, skift gäller nästa bokstav,
// ⌫ suddar (och flyttar sista ordet tillbaka in i skrivbrickan). Under guldchansen lyser nästa tangent efter en stund.
import { useEffect, useState } from "react";
import uiJson from "../../../../data/skapa-ui.json" with { type: "json" };
import { ikon } from "../../skapa/ikoner.ts";
import { TANGENTBORD } from "../spelData.ts";
import { useSpel } from "../SpelKontext.ts";

const UI = uiJson as unknown as { tangentbord: Record<string, string>; tider_ms: Record<string, number> };
const VOKALER = new Set([...(UI.tangentbord.vokaler ?? "aeiouyåäö")]);

export function Tangenter({ klar }: { klar: () => void }) {
  const { sk } = useSpel();
  const { skrivTecken, sudda, spok, sistaTangent } = sk;
  const [versal, setVersal] = useState(false);
  const [tips, setTips] = useState<string | null>(null);
  const [fel, setFel] = useState<{ t: string; n: number } | null>(null);
  const nasta = spok ? spok.ord[spok.buf.length] ?? null : null;
  useEffect(() => {
    setTips(null);
    if (!nasta) return;
    const id = window.setTimeout(() => setTips(nasta), UI.tider_ms.spok_ledtrad ?? 3500);
    return () => window.clearTimeout(id);
  }, [nasta, sistaTangent]);
  const tryck = (t: string) => {
    if (spok && nasta && t !== nasta) setFel({ t, n: (fel?.n ?? 0) + 1 });
    skrivTecken(versal ? t.toLocaleUpperCase("sv") : t);
    if (versal) setVersal(false);
  };
  return (
    <div className="sk-tangenter" data-testid="tangentbord">
      {TANGENTBORD.rader.filter((rad) => rad.some((t) => t !== "{mellanslag}")).map((rad, r) => (
        <div className="sk-tangent-rad" key={rad.join("")}>
          {r === 2 ? (
            <button type="button" className={versal ? "sk-tangent bred skift-pa" : "sk-tangent bred"} aria-label={UI.tangentbord.skift_aria} aria-pressed={versal} data-v5="skift-knapp" onClick={() => setVersal((v) => !v)}>
              <img alt="" src={ikon("ui", "skift")} />
            </button>
          ) : null}
          {rad.map((t) =>
            t === "{radera}" ? (
              <button key={t} type="button" className="sk-tangent bred" data-testid="radera" aria-label={UI.tangentbord.sudda_aria} onClick={sudda}>
                <img alt="" src={ikon("ui", "radera")} />
              </button>
            ) : t === "{mellanslag}" ? null : (
              <button
                key={t + (fel?.t === t ? fel.n : "")}
                type="button"
                className={["sk-tangent", VOKALER.has(t) ? "vokal" : "", tips === t ? "tips" : "", fel?.t === t ? "fel" : ""].filter(Boolean).join(" ")}
                aria-label={versal ? t.toLocaleUpperCase("sv") : t}
                onClick={() => tryck(t)}
              >
                {versal ? t.toLocaleUpperCase("sv") : t}
              </button>
            ),
          )}
        </div>
      ))}
      <div className="sk-tangent-rad">
        <button type="button" className="sk-tangent mellan" data-testid="mellanslag" aria-label="Mellanslag" onClick={() => skrivTecken(" ")}>
          {UI.tangentbord.mellanslag}
        </button>
        <button type="button" className="sk-tangent klar" data-dal="klar" onClick={klar}>
          {UI.tangentbord.klar}
        </button>
      </div>
    </div>
  );
}
