// Nya Skapa 6.12 (fas E): Min bok. Sex stora rutor (Djuralbum, Ordjakten, Guldord, Mark, Stallet, Lådan) och under dem
// Se introt och Ljud: på/av. Inget i Min bok är mer än ett tryck bort. För vuxna finns bara bakom låset (håll inne).
import { useState } from "react";
import uiJson from "../../../data/skapa-ui.json" with { type: "json" };
import { ordLista } from "../../tolk/tolka.ts";
import { fyll } from "../fyll.ts";
import { ljud } from "../ljud.ts";
import { useMinne } from "../minne.ts";
import { ikon, kortBild } from "../skapa/ikoner.ts";
import { StallMeny } from "./Stall.tsx";
import "./skapa/skapa.css";

const UI = uiJson as unknown as { min_bok: Record<string, string>; ark: Record<string, string> };

type Props = {
  stang: () => void;
  oppnaAlbum: () => void;
  oppnaOrdbok: () => void;
  oppnaMark: () => void;
  oppnaLada: () => void;
  seIntro: () => void;
};

export function MinBok({ stang, oppnaAlbum, oppnaOrdbok, oppnaMark, oppnaLada, seIntro }: Props) {
  const funna = useMinne((s) => s.funna);
  const album = useMinne((s) => Object.keys(s.albumKropp).length);
  const stall = useMinne((s) => s.stall.length);
  const lada = useMinne((s) => s.lada.length);
  const ljudPa = useMinne((s) => s.ljudPa);
  const [visaStall, setVisaStall] = useState(false);
  const fritt = new Set(ordLista().filter((o) => o.niva === "fritt").map((o) => o.id));
  const skrivord = Object.keys(funna).filter((id) => fritt.has(id)).length;
  const guldord = Object.values(funna).filter((f) => f.guld).length;
  const rutor: { id: string; bild: string; namn: string; rakna: string; gor: () => void }[] = [
    { id: "album", bild: ikon("ui", "album"), namn: UI.min_bok.album ?? "", rakna: fyll(UI.min_bok.album_rakna ?? "", { n: album }), gor: oppnaAlbum },
    { id: "ordjakten", bild: ikon("ui", "ordbok"), namn: UI.min_bok.ordjakten ?? "", rakna: fyll(UI.min_bok.ordjakten_rakna ?? "", { n: skrivord }), gor: oppnaOrdbok },
    { id: "guldord", bild: ikon("ui", "guldord"), namn: UI.min_bok.guldord ?? "", rakna: fyll(UI.min_bok.guldord_rakna ?? "", { n: guldord }), gor: oppnaOrdbok },
    { id: "mark", bild: kortBild("hage"), namn: UI.min_bok.mark ?? "", rakna: UI.min_bok.mark_rakna ?? "", gor: oppnaMark },
    { id: "stall", bild: ikon("ui", "stall"), namn: UI.min_bok.stallet ?? "", rakna: fyll(UI.min_bok.stallet_rakna ?? "", { n: stall }), gor: () => setVisaStall((v) => !v) },
    { id: "lada", bild: ikon("ui", "lada"), namn: UI.min_bok.ladan ?? "", rakna: fyll(UI.min_bok.ladan_rakna ?? "", { n: lada }), gor: oppnaLada },
  ];
  return (
    <div className="sk-lager" data-testid="meny-panel">
      <button type="button" className="sk-stang-yta" aria-label={UI.ark.stang_aria} tabIndex={-1} onClick={stang} />
      <section className="sk-ark sk-meny" role="dialog" aria-label={UI.min_bok.rubrik}>
        <div className="sk-topp">
          <button type="button" className="sk-stang" aria-label={UI.ark.stang_aria} onClick={stang}>
            <img alt="" src={ikon("ui", "stang")} />
          </button>
        </div>
        <h2 className="sk-meny-rubrik">{UI.min_bok.rubrik}</h2>
        <div className="sk-bok-rutnat">
          {rutor.map((r) => (
            <button key={r.id} type="button" className="sk-bok-ruta" data-dal={`minbok-${r.id}`} aria-expanded={r.id === "stall" ? visaStall : undefined} onClick={r.gor}>
              <img alt="" src={r.bild} />
              <span>{r.namn}</span>
              <span className="rakna">{r.rakna}</span>
            </button>
          ))}
        </div>
        {visaStall ? (
          <div className="sk-stall">
            <StallMeny bara stang={stang} />
          </div>
        ) : null}
        <div className="sk-bok-smatt">
          <button type="button" data-testid="intro-meny" onClick={seIntro}>
            <img alt="" src={ikon("ui", "intro")} />
            {UI.min_bok.intro}
          </button>
          <button
            type="button"
            data-v2="meny-ljud"
            onClick={() => {
              const nasta = !ljudPa;
              useMinne.getState().sattLjud(nasta);
              ljud.satt(nasta);
            }}
          >
            <img alt="" src={ikon("ui", ljudPa ? "lyssna" : "ljud-av")} />
            {ljudPa ? UI.min_bok.ljud_pa : UI.min_bok.ljud_av}
          </button>
        </div>
      </section>
    </div>
  );
}
