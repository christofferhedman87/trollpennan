// Nya Skapa 6.13: Uppdragsarket. Doktor Bengtssons aktiva uppdrag som en pappersgul ruta, en stor knapp
// "Svara med pennan" (öppnar Pennans bok med uppdragslappen) och övriga uppdrag. Svaret skrivs i samma bok som allt annat.
import uiJson from "../../../../data/skapa-ui.json" with { type: "json" };
import { ALLA_UPPDRAG, uppdragText } from "../../aventyr.ts";
import { aktivtUppdrag, BENGTSSON_BILD } from "../../skapa/uppdragLapp.ts";
import { fyll } from "../../fyll.ts";
import { useMinne } from "../../minne.ts";
import * as rostKo from "../../rostKo.ts";
import { useArkLapp } from "../../skapa/arkLapp.ts";
import { ikon } from "../../skapa/ikoner.ts";
import { useSpel } from "../SpelKontext.ts";
import "./skapa.css";

const UI = uiJson as unknown as { uppdrag_ark: Record<string, string>; ark: Record<string, string>; lapp: Record<string, string> };

export function UppdragArk() {
  const k = useSpel();
  const { stangBok } = k.o;
  const { setPanel, ang } = k.t;
  const spar = useMinne((s) => s.uppdrag);
  const aktiv = aktivtUppdrag(spar);
  const text = aktiv ? uppdragText(aktiv, ang[0]?.kropp) : "";
  const ovriga = ALLA_UPPDRAG.filter((u) => u.id !== aktiv?.id && spar[u.id]).slice(0, 6);
  const svara = () => {
    useArkLapp.getState().satt("uppdrag");
    setPanel("spel");
  };
  const belon = (n: number) => fyll(n === 1 ? (UI.uppdrag_ark.beloning_en ?? "") : (UI.uppdrag_ark.beloning_flera ?? ""), { n });
  return (
    <div className="sk-lager" data-testid="bok-skarm">
      <button type="button" className="sk-stang-yta" aria-label={UI.ark.stang_aria} tabIndex={-1} onClick={stangBok} />
      <section className="sk-ark sk-meny" role="dialog" aria-label={UI.uppdrag_ark.rubrik} data-testid="uppdragbok">
        <div className="sk-topp">
          <button type="button" className="sk-stang" data-testid="stang-bok" aria-label={UI.ark.stang_aria} onClick={stangBok}>
            <img alt="" src={ikon("ui", "stang")} />
          </button>
        </div>
        <h2 className="sk-meny-rubrik">{UI.uppdrag_ark.rubrik}</h2>
        {aktiv ? (
          <>
            <div className="sk-upp-kort" data-v2="aktivt-uppdrag-kort" data-uppdrag={aktiv.id}>
              <span className="sk-lapp-bild portratt"><img alt="" src={BENGTSSON_BILD} /></span>
              <p>
                <b>{UI.lapp.uppdrag_fran}</b>
                {text}
              </p>
              <button type="button" className="sk-rund" data-v2="lyssna-aktivt-uppdrag" aria-label={UI.lapp.lyssna_aria} onClick={() => rostKo.lasUpp(text)}>
                <img alt="" src={ikon("ui", "lyssna")} />
              </button>
            </div>
            <button type="button" className="sk-stor-knapp" data-testid="uppdrag-los-i-boken" onClick={svara}>
              <img alt="" src={ikon("grafik", "penna-redo")} />
              {UI.uppdrag_ark.svara}
            </button>
          </>
        ) : null}
        <div className="sk-upp-lista">
          {ovriga.map((u) => (
            <div key={u.id} className="sk-upp-rad" data-uppdrag={u.id}>
              <img alt="" src={ikon("ui", spar[u.id] === "klar" ? "bock" : "stjarna")} />
              <span>{uppdragText(u, ang[0]?.kropp)}</span>
              <span className={spar[u.id] === "klar" ? "klar" : ""}>{spar[u.id] === "klar" ? UI.uppdrag_ark.klart : belon(u.stjarnor)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
