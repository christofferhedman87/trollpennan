// Nya Skapa 6.2: Pennans bok som ett ark nedtill. Ängen syns ovanför, och ett tryck på ängen stänger arket.
// Arket öppnar med tangenterna (skriva själv är förstahandsvalet); Ordhjälpen är ett aktivt val.
import { useEffect, useMemo, useRef, useState } from "react";
import uiJson from "../../../../data/skapa-ui.json" with { type: "json" };
import * as rostKo from "../../rostKo.ts";
import { fyll } from "../../fyll.ts";
import { harBoksvar } from "../../skapa/svarsLage.ts";
import { ideForMal } from "../../skapa/bokMal.ts";
import { useBokMal } from "../../skapa/useBokMal.ts";
import { ikon } from "../../skapa/ikoner.ts";
import type { Fraga } from "../../skapa/lexikon.ts";
import { useSpel } from "../SpelKontext.ts";
import { Hjalprad } from "./Hjalprad.tsx";
import { Lapp } from "./Lapp.tsx";
import { Ordhjalp } from "./Ordhjalp.tsx";
import { Pennan } from "./Pennan.tsx";
import { Svarsrad } from "./Svarsrad.tsx";
import { Tangenter } from "./Tangenter.tsx";
import { Trollremsa } from "./Trollremsa.tsx";
import { flygGnistor, stjarnregn } from "./gnistor.ts";
import { useForhandArk } from "./useForhandArk.ts";
import { nyGata, type IdeLapp } from "./gataLapp.ts";
import { useArkLapp } from "../../skapa/arkLapp.ts";
import { platsLapp } from "../../skapa/platsLapp.ts";
import { kopplaTrollaKnapp } from "../../skapa/trollaKontroll.ts";
import { kanTrollas } from "../../skapa/kanTrollas.ts";
import { forhand } from "../../skapa/forhand.ts";
import { useMinne } from "../../minne.ts";
import "./skapa.css";

const UI = uiJson as unknown as { ark: Record<string, string>; rost: Record<string, string> };

export function SkapaArk() {
  const k = useSpel();
  const { stangBok } = k.o;
  const { textRef, gavaTill, onskan, text, varld, omrade } = k.t;
  const { remsa, vy, setVy, trolla, puff } = k.sk;
  const [flik, setFlik] = useState<Fraga>("vad");
  const [ide, setIde] = useState<IdeLapp | null>(null);
  const mal = useBokMal();
  useEffect(() => setIde(null), [mal.id]);
  const [penna, setPenna] = useState<{ lage: "vilar" | "puttar" | "blinka" | "trollar"; n: number }>({ lage: "vilar", n: 0 });
  const arkRef = useRef<HTMLElement>(null);
  const lagerRef = useRef<HTMLDivElement>(null);
  const trollar = useRef(false);
  const plats = useMinne((s) => s.plats);
  useForhandArk(arkRef, text, varld === "ang" && !omrade, plats);

  useEffect(() => {
    // Boken öppnar alltid i startläget (föräldrasidan: tangenterna först, eller Ordhjälpen först).
    setVy(useMinne.getState().startLage === "kort" ? "hjalp" : "skriv");
    // Öppnas boken tom och utan lapp frågar Pennan vad barnet vill trolla fram.
    if (!textRef.current.trim() && !gavaTill && !onskan && !useArkLapp.getState().lapp && !platsLapp(plats)) rostKo.lasUpp(UI.rost.oppna ?? "");
    const ned = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.metaKey && !e.ctrlKey && !e.altKey) stangBok();
    };
    window.addEventListener("keydown", ned);
    return () => {
      window.removeEventListener("keydown", ned);
      useArkLapp.getState().satt(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- en gång när arket öppnas
  }, []);
  useEffect(() => {
    if (penna.lage === "vilar") return;
    const id = window.setTimeout(() => setPenna({ lage: "vilar", n: penna.n }), penna.lage === "trollar" ? 900 : 700);
    return () => window.clearTimeout(id);
  }, [penna]);

  const tillDjur = k.t.onskaSkrivRef.current && onskan?.kalla === "djur" && onskan.typ === "ge" ? (k.vy.onskaDjur ?? null) : undefined;
  const redo = useMemo(() => (remsa.redo || kanTrollas(text, tillDjur, remsa.brickor.filter((b) => b.klass === "agg").map((b) => b.t)) || (!!gavaTill && !!(remsa.ord.length || remsa.skriv))) && !remsa.fraga,
    [text, tillDjur, gavaTill, remsa.redo, remsa.fraga, remsa.brickor, remsa.ord.length, remsa.skriv]);
  const tryckPenna = () => {
    if (trollar.current) return;
    if (!redo || !lagerRef.current) {
      const svar = trolla();
      if (svar === "tom") setPenna((p) => ({ lage: "puttar", n: p.n + 1 }));
      return;
    }
    // 6.11: Pennan trollar, meningen läses upp och orden flyger som gnistor in i ringen. Sedan blir skapelsen verklig.
    trollar.current = true;
    setPenna((p) => ({ lage: "trollar", n: p.n + 1 }));
    rostKo.lasUpp([remsa.ord.map((o) => o.t).join(" "), remsa.skriv].filter(Boolean).join(" "));
    const mal = forhand.lage().ringSkarm;
    const ms = flygGnistor(lagerRef.current, mal);
    window.setTimeout(() => {
      forhand.trolla();
      stjarnregn(mal);
      window.setTimeout(() => {
        trollar.current = false;
        const svar = trolla();
        if (svar === "tom") setPenna((p) => ({ lage: "puttar", n: p.n + 1 }));
      }, ms ? 450 : 0);
    }, ms);
  };
  const tryckPennaRef = useRef(tryckPenna);
  tryckPennaRef.current = tryckPenna;
  useEffect(() => kopplaTrollaKnapp(() => tryckPennaRef.current()), []);
  const skrivGuldForst = () => {
    if (!k.sk.spok) return false;
    k.sk.puffa(fyll(uiJson.hjalprad.tips_spok, { ord: k.sk.spok.ord }));
    return true;
  };
  const visaGata = () => {
    if (skrivGuldForst()) return;
    if (harBoksvar(k.sk, k.t)) { k.sk.puffa(uiJson.puffar.svara_forst); return; }
    const g = nyGata();
    if (g) setIde(g); else k.sk.puffa(uiJson.puffar.inga_gator);
  };
  const oppnaHjalp = (f?: Fraga) => {
    if (f) setFlik(f);
    setVy("hjalp");
    rostKo.lasUpp(UI.rost.ordhjalp ?? "");
  };

  return (
    <div className="sk-lager" data-testid="bok-skarm" ref={lagerRef}>
      <button type="button" className="sk-stang-yta" aria-label={UI.ark.stang_aria} tabIndex={-1} onClick={stangBok} />
      <section className="sk-ark" ref={arkRef} role="dialog" aria-label={UI.ark.aria} data-vy={vy}>
        <div className="sk-topp">
          <button type="button" className="sk-stang" data-testid="stang-bok" data-v3="bok-stang" aria-label={UI.ark.stang_aria} onClick={stangBok}>
            <img alt="" src={ikon("ui", "stang")} ref={(el) => el?.setAttribute("data-testid", "bok-stang")} />
          </button>
          <button type="button" className="sk-knapp sk-gata" onClick={visaGata}>{uiJson.gata_knapp}</button>
          <Pennan key={penna.n} redo={redo} lage={penna.lage === "vilar" ? (redo ? "redo" : "vilar") : penna.lage} onTryck={tryckPenna} />
        </div>
        {puff ? (
          <p key={puff.id} className="sk-puff" role="status">
            {puff.text}
          </p>
        ) : null}
        <div className="sk-boklayout">
          <Trollremsa />
          <div className="sk-innehall">
            <Lapp ide={ide} />
            <Svarsrad />
          </div>
          <div className="sk-inmatning">
        {vy === "skriv" ? (
          <>
            <Hjalprad gata={visaGata}
              oppnaHjalp={() => oppnaHjalp()}
              ide={() => {
                if (skrivGuldForst()) return;
                if (harBoksvar(k.sk, k.t)) { k.sk.puffa(uiJson.puffar.svara_forst); return; }
                const fras = ideForMal(mal, ide?.slag === "mal" ? ide.fras : null);
                if (fras) setIde({ slag: "mal", fras });
                else k.sk.puffa(uiJson.puffar.ide_lapp);
              }}
            />
            <Tangenter klar={tryckPenna} />
          </>
        ) : (
          <Ordhjalp flik={flik} setFlik={setFlik} />
        )}
          </div>
        </div>
        <input
          type="text"
          inputMode="none"
          tabIndex={-1}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="ord-input-ankare"
          aria-label={UI.ark.aria}
          value={textRef.current}
          onChange={(e) => k.sk.skrivText(e.target.value)}
          data-testid="ord-input"
        />
      </section>
    </div>
  );
}
