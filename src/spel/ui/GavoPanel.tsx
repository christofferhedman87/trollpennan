import { useState, type Dispatch, type SetStateAction } from "react";
import { djurMedUid } from "../liv.ts";
import { useMinne, type Lage } from "../minne.ts";
import type { Kalla } from "../rostKo.ts";
import { forsokDopaText, gavoNamn, gavoRuta } from "./gavoRuta.ts";
import { kortIkon } from "./hjalp.ts";
import { GavaStallKnapp } from "./Stall.tsx";
import type { Banner } from "./typer.ts";

const GAVOR = [
  { id: "morot", fras: "en morot", visa: "morot", ikon: "/ordkort/v08/illustrations/morot.webp" },
  { id: "äpple", fras: "ett äpple", visa: "äpple", ikon: "/ordkort/v08/illustrations/apple.webp" },
  { id: "mössa", fras: "en mössa", visa: "mössa", ikon: "/ordkort/v08/illustrations/mossa.webp" },
  { id: "halsduk", fras: "en halsduk", visa: "halsduk", ikon: "/kit/tillbehor/halsduk.png" },
] as const;

const SNABB_NAMN = ["Skuttis", "Misse", "Blixten"] as const;

type SkaparVy = "skriv" | "gata" | "ideer";

type GavoPanelProps = {
  gavaTill: string;
  text: string;
  fyllExempel: (ex: string) => void;
  visaBanner: (texten: string, slag: Banner["slag"], kalla: Kalla) => void;
  stangBok: () => void;
  setSkaparVy: Dispatch<SetStateAction<SkaparVy>>;
  setSjalvSkriv: Dispatch<SetStateAction<boolean>>;
  setLage: Dispatch<SetStateAction<Lage>>;
};

/** Gåvoläge låst till ett befintligt djur (`gavaTill` = "egen:<uid>" eller ett vilt id). */
export function GavoPanel({
  gavaTill, text, fyllExempel, visaBanner, stangBok, setSkaparVy, setSjalvSkriv, setLage,
}: GavoPanelProps) {
  const [namnForslag, setNamnForslag] = useState(false);
  const egen = gavaTill.startsWith("egen:");
  const uid = egen ? gavaTill.slice(5) : "";
  const djur = useMinne((s) => (uid ? djurMedUid(s, uid) : undefined));
  const kropp = djur?.kropp ?? "";
  const portratt = kortIkon(kropp, "djur") ?? "/ordkort/v08/illustrations/kanin.webp";
  const dopNamn = djur?.smeknamn?.trim() ?? "";

  function dopa() {
    if (!uid) return;
    const rå = text.trim();
    if (!rå) {
      setSkaparVy("skriv");
      setSjalvSkriv(true);
      setLage("skriv");
      fyllExempel("heter ");
      setNamnForslag(true);
      return;
    }
    const traff = forsokDopaText(rå, uid);
    const upp = traff?.djur ?? useMinne.getState().bytSmeknamn(uid, rå);
    const visat = traff?.namn ?? upp?.smeknamn;
    if (visat) visaBanner(`Nu heter djuret ${visat}!`, "ovr", "tapp");
    fyllExempel("");
    setNamnForslag(false);
  }

  function geNamn(namn: string) {
    if (!uid) return;
    useMinne.getState().bytSmeknamn(uid, namn);
    visaBanner("Nu heter djuret " + namn + "!", "ovr", "tapp");
    fyllExempel("");
    setNamnForslag(false);
  }

  return (
    <div className="onska-remsa gavo-panel" data-testid="gava-remsa">
      <div className="gava-mottagare" data-c3="mottagar-kort">
        <img className="gava-portratt" alt="" src={portratt} />
        <div>
          <p>{gavoRuta(gavaTill)}</p>
          <span className="gava-mottagare-info" data-c3="mottagar-namn">Din {kropp} på ängen ({gavoNamn(gavaTill)})</span>
        </div>
      </div>
      <div className="gavo-kort-grid" data-c3="gavo-kort-grid">
        {GAVOR.map((kort) => (
          <button
            key={kort.id}
            type="button"
            className={text.trim() === kort.fras ? "gavo-kort vald" : "gavo-kort"}
            data-c3="gavo-kort"
            onClick={() => fyllExempel(kort.fras)}
          >
            <img alt="" src={kort.ikon} />
            <span>{kort.visa}</span>
          </button>
        ))}
      </div>
      {egen ? (
        <div className="gava-knapprad">
          <button type="button" className="kort dop-knapp" data-d3="dop-knapp" ref={(el) => el?.setAttribute("data-testid", "dop-knapp")} onClick={dopa}>
            🏷️ {dopNamn ? "Byt namn" : "Döp"}
          </button>
          {namnForslag
            ? SNABB_NAMN.map((namn) => (
                <button key={namn} type="button" className="gavo-snabbnamn" data-c3="snabb-namn" onClick={() => geNamn(namn)}>
                  {namn}
                </button>
              ))
            : null}
          <GavaStallKnapp uid={uid} visaBanner={visaBanner} klar={stangBok} />
        </div>
      ) : null}
    </div>
  );
}
