// Nya Skapa 6.3: meningen som ordbrickor i barnets ordning. Färg och märke visar frågan ordet svarar på,
// guld visar ord som barnet skrev själv. Tryck på en bricka = läs upp och visa ×. Lyssna läser exakt det som står.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import uiJson from "../../../../data/skapa-ui.json" with { type: "json" };
import { fyll } from "../../fyll.ts";
import * as rostKo from "../../rostKo.ts";
import { ikon } from "../../skapa/ikoner.ts";
import type { Bricka } from "../../skapa/meningsbrickor.ts";
import { useSpel } from "../SpelKontext.ts";

const UI = uiJson as unknown as { ark: Record<string, string> };
const FARG: Record<string, string> = { vad: "var(--tp-vad)", hurdan: "var(--tp-hurdan)", har: "var(--tp-har)", gor: "var(--tp-gor)" };

export function Trollremsa() {
  const { sk } = useSpel();
  const { remsa, spok, kanAngra, angraMening, taBortBricka, rorelse, vy, setVy, puffa } = sk;
  const [vald, setVald] = useState<number | null>(null);
  const [anim, setAnim] = useState(rorelse);
  const skrivRef = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    if (!remsa.skriv && !spok?.ord) return;
    // Håll det barnet skriver synligt även när önskelappen behöver rulla undan i liggande läge.
    const visa = () => skrivRef.current?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    visa();
    window.addEventListener("resize", visa);
    return () => window.removeEventListener("resize", visa);
  }, [remsa.skriv, spok?.ord, spok?.buf]);
  useEffect(() => {
    setAnim(rorelse);
    const id = window.setTimeout(() => setAnim({ ny: null, bojda: [], id: 0 }), 760);
    return () => window.clearTimeout(id);
  }, [rorelse]);
  useEffect(() => setVald(null), [remsa.ord.length]);
  const b = remsa.brickor;
  // Tom plats: ett kort har lagt ett adjektiv men det finns inget Vad än.
  const sistaAdj = remsa.harVad ? -1 : b.reduce((m, x, i) => (x.klass === "hurdan" && x.kalla !== "skriv" ? i : m), -1);
  const lasText = [remsa.ord.map((o) => o.t).join(" "), spok ? spok.buf : remsa.skriv].filter(Boolean).join(" ");
  const tom = !b.length && !remsa.skriv && !spok;
  return (
    <div className="sk-remsa" data-testid="remsa" role="group" aria-label={UI.ark.aria} aria-live="polite" onClick={(e) => { if (e.target === e.currentTarget) setVy("skriv"); }}>
      {b.map((x, i) => (
        <span key={`${x.i}-${x.t}`} style={{ display: "contents" }}>
          <OrdBricka
            x={x}
            vald={vald === i}
            ny={anim.ny != null && x.i >= anim.ny && x.klass !== "smaord"}
            bojs={anim.bojda.includes(x.i)}
            onTryck={() => {
              rostKo.lasUpp(x.boj ? `${x.boj}?` : x.t);
              if (x.klass === "smaord" || x.klass === "fraga") return;
              setVald(vald === i ? null : i);
            }}
            onTaBort={() => {
              setVald(null);
              taBortBricka(i);
            }}
          />
          {i === sistaAdj ? (
            <button type="button" className="sk-ord tom" onClick={() => { setVy("skriv"); puffa(UI.ark.skriv_vad); }} style={{ "--k": "var(--tp-vad)" } as CSSProperties}>
              <img className="sk-markor" alt="" src={ikon("ordklass", "vad")} />
              {UI.ark.vad_lucka}
            </button>
          ) : null}
        </span>
      ))}
      <button type="button" onClick={() => setVy("skriv")} aria-label={UI.ark.skriv_aria} ref={skrivRef} key={spok?.fel ?? 0} className={`sk-skrivbricka${remsa.skriv || spok ? "" : " vilar"}${spok?.fel ? " skaka" : ""}`} data-dal="skrivbricka">
        {spok ? spok.buf : remsa.skriv}
        {vy === "skriv" ? <i className="sk-blink" aria-hidden="true" /> : null}
        {spok ? <span className="sk-spok">{spok.ord.slice(spok.buf.length)}</span> : null}
        {tom ? <span className="sk-uppmaning">{vy === "hjalp" ? UI.ark.tom_hjalp : UI.ark.tom}</span> : null}
      </button>
      <span className="sk-remsa-verktyg">
        <button type="button" className="sk-rund" aria-label={UI.ark.lyssna_aria} data-p4="lyssna-mening" disabled={!lasText} onClick={() => rostKo.lasUpp(lasText)}>
          <img alt="" src={ikon("ui", "lyssna")} />
        </button>
        <button type="button" className="sk-rund" aria-label={UI.ark.angra_aria} disabled={!kanAngra} onClick={angraMening}>
          <img alt="" src={ikon("ui", "angra")} />
        </button>
      </span>
    </div>
  );
}

function OrdBricka({ x, vald, ny, bojs, onTryck, onTaBort }: { x: Bricka; vald: boolean; ny: boolean; bojs: boolean; onTryck: () => void; onTaBort: () => void }) {
  const farg = FARG[x.klass];
  const kl = ["sk-ord", x.klass, x.guld ? "guld" : "", x.boj ? "boj" : "", vald ? "vald" : "", ny ? "ny" : "", bojs ? "bojs" : ""].filter(Boolean).join(" ");
  return (
    <span className={kl} style={farg ? ({ "--k": farg } as CSSProperties) : undefined} role="button" tabIndex={0} data-klass={x.klass} data-guld={x.guld ? "ja" : "nej"} data-boj={x.boj ?? undefined} onClick={onTryck} onKeyDown={(e) => { if (e.key === "Enter") onTryck(); }}>
      {farg ? <img className="sk-markor" alt="" src={ikon("ordklass", x.klass)} /> : null}
      {x.klass === "agg" ? <img alt="" src={ikon("ui", "agg")} /> : null}
      {x.t}
      {vald && x.klass !== "smaord" ? (
        <button type="button" className="sk-ta-bort" aria-label={fyll(UI.ark.ta_bort_aria ?? "", { ord: x.t })} onClick={(e) => { e.stopPropagation(); onTaBort(); }}>
          <img alt="" src={ikon("ui", "stang")} />
        </button>
      ) : null}
    </span>
  );
}
