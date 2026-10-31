// Nya Skapa 6.7: Ordhjälpen. Frågeflikarna (Skriv · Vad? · Hurdan? · Har · Gör) över en lång hylla som rullar i
// sidled. Flikarna hoppar till rätt del och följer med när barnet rullar. Varje del slutar med "Skriv fler!".
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import uiJson from "../../../../data/skapa-ui.json" with { type: "json" };
import { fyll } from "../../fyll.ts";
import { useMinne } from "../../minne.ts";
import * as rostKo from "../../rostKo.ts";
import { hyllaMedOnskan, kortVisa, onskeKort, prefixKort, type HyllKort } from "../../skapa/hjalpord.ts";
import { harKortBild, ikon, kortBild } from "../../skapa/ikoner.ts";
import { kortIkon } from "../hjalp.ts";
import type { Fraga } from "../../skapa/lexikon.ts";
import { meningGenus, meningTyp } from "../../skapa/meningsbrickor.ts";
import { useSpel } from "../SpelKontext.ts";
import { useArkLapp } from "../../skapa/arkLapp.ts";
import { useBokMal } from "../../skapa/useBokMal.ts";
import { Fet } from "./Hjalprad.tsx";
import { Ordkort } from "./Ordkort.tsx";

const UI = uiJson as unknown as { fragor: Record<string, string>; hylla: Record<string, string>; rost: Record<string, string>; sektioner: Record<string, string>; bokmal: { rubriker: Record<string, string>; byt_rubrik: string; byt_text: string; byt_ja: string; byt_nej: string } };
const FRAGOR: { id: Fraga; farg: string }[] = [
  { id: "vad", farg: "var(--tp-vad)" },
  { id: "hurdan", farg: "var(--tp-hurdan)" },
  { id: "har", farg: "var(--tp-har)" },
  { id: "gor", farg: "var(--tp-gor)" },
];

export function Ordhjalp({ flik, setFlik }: { flik: Fraga; setFlik: (f: Fraga) => void }) {
  const k = useSpel();
  const { remsa, laggHjalpKort, setVy, startaGuld, fyllExempel } = k.sk;
  const { gavaTill } = k.t;
  const kortGang = useMinne((s) => s.kortGang);
  const hyllRef = useRef<HTMLDivElement>(null);
  const hoppar = useRef(false);
  const typ = meningTyp(remsa.brickor);
  const genus = meningGenus(remsa.brickor);
  const arkLapp = useArkLapp((s) => s.lapp);
  const mal = useBokMal();
  const [byta, setByta] = useState<string | null>(null);
  useEffect(() => setByta(null), [k.t.text, mal.id]);
  const prova = (fras: string) => {
    if (remsa.skriv.trim() || remsa.brickor.some((b) => b.kalla === "skriv")) setByta(fras);
    else fyllExempel(fras);
  };
  // 7.6: korten som löser önskan eller uppdraget glöder (och läggs till om de inte är hjälpord).
  const onskade = useMemo(() => onskeKort(mal.slag === "fri" ? [] : mal.losningar), [mal.slag, mal.losningar]);
  const onskadeNycklar = useMemo(() => new Set(onskade.map((x) => x.nyckel)), [onskade]);
  const del = useMemo(() => hyllaMedOnskan(typ, onskade), [typ, onskade]);
  const prefix = remsa.skriv.trim().toLocaleLowerCase("sv");
  const prefixLista = prefix ? prefixKort(del, prefix) : [];
  const valda = new Set(remsa.brickor.filter((b) => b.id && b.slot).map((b) => `${b.slot}:${b.id}`));
  const fylld = (f: Fraga) => remsa.brickor.some((b) => b.klass === f && b.kalla !== "auto");
  const [, rita] = useState(0);

  const hoppaTill = (f: Fraga, mjukt = true, sektion?: string) => {
    const h = hyllRef.current;
    const el = h?.querySelector<HTMLElement>(sektion ? `[data-sektion="${sektion}"]` : `[data-start="${f}"]`);
    if (!h || !el) return;
    hoppar.current = true;
    h.scrollTo({ left: el.offsetLeft - 14, behavior: mjukt ? "smooth" : "auto" });
    window.setTimeout(() => (hoppar.current = false), 600);
  };
  useEffect(() => {
    if (prefix) hyllRef.current?.scrollTo({ left: 0 });
    else if (mal.slag !== "fri" && mal.losningar.length) { hyllRef.current?.scrollTo({ left: 0 }); setFlik("vad"); }
    else if (arkLapp === "tomt" && flik === "vad") hoppaTill("vad", false, "hus");
    else hoppaTill(flik, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bara när hyllan visas eller typen byts
  }, [typ, prefix === "", mal.id]);

  const valj = (kort: HyllKort) => {
    laggHjalpKort(kort);
    if (kort.fraga === "vad") {
      setFlik("hurdan");
      window.setTimeout(() => hoppaTill("hurdan"), 350);
    }
    rita((n) => n + 1);
  };
  const kortEl = (kort: HyllKort, i: number) => (
    <Ordkort
      key={`${kort.nyckel}-${i}`}
      kort={kort}
      visa={kortVisa(kort, genus)}
      vald={valda.has(kort.nyckel)}
      onskad={onskadeNycklar.has(kort.nyckel)}
      skrivMig={(kortGang[kort.id] ?? 0) >= 3 && valda.has(kort.nyckel)}
      onValj={() => valj(kort)}
      onSkrivMig={() => startaGuld(kort)}
    />
  );

  // Gåva till ett djur: hyllan visar gåvorna (presenter, mat, saker) i stället för frågorna.
  if (gavaTill) {
    return (
      <div className="sk-hylla-ram">
        <div className="sk-hylla" ref={hyllRef}>
          {k.vy.kort.slice(0, 24).map((o) => (
            <button key={o.id} type="button" className="sk-kort" data-testid={`kort-${o.id}`} onClick={() => fyllExempel(`${(o as { genus?: string }).genus ?? "en"} ${o.visa}`)}>
              {harKortBild(o.id) || kortIkon(o.id) ? <img className="sk-kort-bild" alt="" src={kortBild(o.id)} /> : <span aria-hidden="true" />}
              <span className={o.visa.length > 7 ? "sk-kort-ord lang" : "sk-kort-ord"}>{o.visa}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {byta ? <div className="sk-mal-fraga" role="dialog" aria-modal="true" aria-label={UI.bokmal.byt_rubrik} onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Escape") { e.preventDefault(); setByta(null); } }}>
        <p>{UI.bokmal.byt_text}</p><p><b>{byta}</b></p>
        <button type="button" className="sk-knapp" onClick={() => { fyllExempel(byta); setByta(null); }}>{UI.bokmal.byt_ja}</button>
        <button type="button" className="sk-knapp" autoFocus data-dialog-close onClick={() => setByta(null)}>{UI.bokmal.byt_nej}</button>
      </div> : null}
      <div className="sk-flikar" role="tablist" aria-label={UI.hylla.lyssna_hall}>
        <button type="button" role="tab" aria-selected={false} className="sk-flik skriv-flik" data-testid="pennan" onClick={() => { setVy("skriv"); rostKo.lasUpp(UI.fragor.skriv ?? ""); }}>
          <img alt="" src={ikon("ui", "tangentbord")} />
          {UI.fragor.skriv}
        </button>
        {FRAGOR.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={flik === f.id && !prefixLista.length}
            className="sk-flik"
            style={{ "--k": f.farg } as CSSProperties}
            data-flik={f.id}
            onClick={() => { setFlik(f.id); hoppaTill(f.id); rostKo.lasUpp(UI.fragor[f.id] ?? ""); }}
          >
            <img alt="" src={ikon("ordklass", f.id)} />
            {UI.fragor[f.id]}
            {fylld(f.id) ? <i className="fylld" aria-hidden="true" /> : null}
          </button>
        ))}
      </div>
      <div className="sk-hylla-ram">
        <div
          className="sk-hylla"
          ref={hyllRef}
          onScroll={() => {
            const h = hyllRef.current;
            if (!h || hoppar.current) return;
            let aktiv = flik;
            for (const s of h.querySelectorAll<HTMLElement>("[data-start]")) if (s.offsetLeft - 60 <= h.scrollLeft) aktiv = s.dataset.start as Fraga;
            if (aktiv !== flik) setFlik(aktiv);
          }}
        >
          {mal.slag !== "fri" && mal.losningar.length ? <>
            <div className="sk-sektion sk-mal-rubrik" data-start="vad" data-sektion="mal">
              <h3>{UI.bokmal.rubriker[mal.slag]}</h3>
            </div>
            {mal.losningar.slice(0, 4).map((fras) => {
              const kort = onskeKort([fras]);
              const bild = kort.find((x) => x.fraga === "vad") ?? kort.find((x) => x.fraga === "har") ?? kort[0];
              return <button key={fras} type="button" className="sk-kort sk-mal-losning" data-mal="losning" onClick={() => prova(fras)}>
                <img className="sk-kort-bild" alt="" src={bild?.bild ?? ikon("ui", "ordhjalp")} />
                <span>{fras}</span>
              </button>;
            })}
          </> : null}
          {prefix ? (
            prefixLista.length ? (
              <>
                <div className="sk-prefix"><span>{UI.hylla.prefix}<b>{prefix}</b></span></div>
                {prefixLista.map(kortEl)}
              </>
            ) : (
              <div className="sk-prefix bred"><span><Fet text={fyll(UI.hylla.prefix_tomt ?? "", { p: prefix })} /></span></div>
            )
          ) : null}
          {del.map((s, si) => {
            const forst = del.findIndex((x) => x.fraga === s.fraga) === si;
            return (
              <span key={s.id} style={{ display: "contents" }}>
                <div className="sk-sektion" data-start={forst ? s.fraga : undefined} data-sektion={s.id}>
                  <img alt="" src={ikon("sektion", s.ikon)} />
                  <span>{s.namn}</span>
                  <img className="liten" alt="" src={ikon("ordklass", s.fraga)} />
                </div>
                {s.kort.map(kortEl)}
                <button type="button" className="sk-kort skriv-fler" data-dal="skriv-fler" onClick={() => { setVy("skriv"); rostKo.lasUpp(UI.rost.skriv_fler ?? ""); }}>
                  <img className="sk-kort-bild" alt="" src={ikon("ui", "penna")} />
                  <span className="sk-kort-ord">
                    {UI.hylla.skriv_fler}
                    <small>{s.fler === "alla" ? UI.hylla.fler_alla : fyll(UI.hylla.fler_antal ?? "", { n: s.fler })}</small>
                  </span>
                </button>
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
}
