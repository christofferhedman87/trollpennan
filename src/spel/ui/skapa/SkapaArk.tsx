// Nya Skapa 6.2: Pennans bok som ett ark nedtill. Ängen syns ovanför, och ett tryck på ängen stänger arket.
// Arket öppnar med tangenterna (skriva själv är förstahandsvalet); Ordhjälpen är ett aktivt val.
import { useEffect, useRef, useState } from "react";
import uiJson from "../../../../data/skapa-ui.json" with { type: "json" };
import * as rostKo from "../../rostKo.ts";
import { nyIde } from "../../skapa/idetarning.ts";
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
import { forhand } from "../../skapa/forhand.ts";
import { useMinne } from "../../minne.ts";
import { START_PLATS } from "../../platser.ts";
import "./skapa.css";

const UI = uiJson as unknown as { ark: Record<string, string>; rost: Record<string, string> };

export function SkapaArk() {
  const k = useSpel();
  const { stangBok } = k.o;
  const { textRef, gavaTill, onskan, text, varld, omrade } = k.t;
  const { remsa, vy, setVy, trolla, avslutaOrd, puff } = k.sk;
  const [flik, setFlik] = useState<Fraga>("vad");
  const [ide, setIde] = useState<IdeLapp | null>(null);
  const ideNr = useRef(0);
  const [penna, setPenna] = useState<{ lage: "vilar" | "puttar" | "blinka" | "trollar"; n: number }>({ lage: "vilar", n: 0 });
  const arkRef = useRef<HTMLElement>(null);
  const lagerRef = useRef<HTMLDivElement>(null);
  const trollar = useRef(false);
  const plats = useMinne((s) => s.plats);
  useForhandArk(arkRef, text, varld === "ang" && !omrade && plats === START_PLATS);

  useEffect(() => {
    // Boken öppnar alltid i startläget (föräldrasidan: tangenterna först, eller Ordhjälpen först).
    setVy(useMinne.getState().startLage === "kort" ? "hjalp" : "skriv");
    // Öppnas boken tom och utan lapp frågar Pennan vad barnet vill trolla fram.
    if (!textRef.current.trim() && !gavaTill && !onskan && !useArkLapp.getState().lapp) rostKo.lasUpp(UI.rost.oppna ?? "");
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

  const redo = (remsa.redo || (!!gavaTill && !!(remsa.ord.length || remsa.skriv))) && !remsa.fraga;
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
  const klar = () => {
    if (remsa.skriv.trim()) avslutaOrd();
    else if (remsa.harVad) setPenna((p) => ({ lage: "blinka", n: p.n + 1 }));
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
          <Pennan key={penna.n} redo={redo} lage={penna.lage === "vilar" ? (redo ? "redo" : "vilar") : penna.lage} onTryck={tryckPenna} />
        </div>
        {puff ? (
          <p key={puff.id} className="sk-puff" role="status">
            {puff.text}
          </p>
        ) : null}
        <Lapp ide={ide} />
        <Trollremsa oppnaVad={() => oppnaHjalp("vad")} />
        <Svarsrad />
        {vy === "skriv" ? (
          <>
            <Hjalprad
              oppnaHjalp={() => oppnaHjalp()}
              ide={() => {
                // Varannan gång en bildgåta, varannan en gåta om ett hemligt ord. Tärningen skriver aldrig åt barnet.
                ideNr.current += 1;
                const gata = ideNr.current % 2 === 0 ? nyGata() : null;
                setIde(gata ?? { slag: "bild", ide: nyIde(ide?.slag === "bild" ? ide.ide : null) });
              }}
            />
            <Tangenter klar={klar} />
          </>
        ) : (
          <Ordhjalp flik={flik} setFlik={setFlik} />
        )}
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
