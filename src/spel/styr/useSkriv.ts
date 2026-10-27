import { useEffect, useRef, useState } from "react";
import type { ForslagKort, Ord } from "@/tolk/typer.ts";
import { ljud } from "../ljud.ts";
import { useMinne } from "../minne.ts";
import { valUrText } from "../useSkriv.ts";
import * as rostKo from "../rostKo.ts";
import { bokstav, bytOrd, meningAv, taBortOrd, utanSparratSuffix } from "../ui/hjalp.ts";
import type { Slot, Val } from "../ui/typer.ts";
import type { SpelKarna } from "./typer.ts";

const ANGRA_MAX = 24;

export function useSkriv(k: Pick<SpelKarna, "t" | "b" | "s">) {
  const { setText, lage, setLage, setVal, setFlik, setHand, forslag, setForslag, behover, setBehover, setVisKort, setOrdbok, setForalder, setAlbumOpp, setMossaOpp, bokOpp, setBokOpp, setByggPuff, setKop, onskaOpp, setKopia, gavaTill, setGavaTill, textRef, handRef, overlayRef, gavaRef } = k.t;
  const { visaBanner } = k.b;
  const { utfor, utforRef } = k.s;
  const angraStackRef = useRef<string[]>([]);
  const [kanAngra, setKanAngra] = useState(false);
  const foreLageRef = useRef(lage);

  useEffect(() => {
    const fore = foreLageRef.current;
    foreLageRef.current = lage;
    const byte = (fore === "skriv" && lage === "kort") || (fore === "kort" && lage === "skriv");
    if (!byte) return;
    // AC05 / UX-08: Stava själv <-> Ordkort får aldrig radera textRef.
    const bevarad = textRef.current;
    if (bevarad.trim()) setVal(valUrText(bevarad));
  }, [lage, setVal, textRef]);

  function sparaAngra(ny: string) {
    const fore = textRef.current;
    if (fore === ny) return;
    const s = angraStackRef.current;
    s.push(fore);
    if (s.length > ANGRA_MAX) s.shift();
    setKanAngra(true);
  }

  function tomAngra() {
    angraStackRef.current = [];
    setKanAngra(false);
  }

  function angraMening() {
    const s = angraStackRef.current;
    const foregaende = s.pop();
    if (foregaende == null) {
      setKanAngra(false);
      return;
    }
    textRef.current = foregaende;
    setText(foregaende);
    setVal(valUrText(foregaende));
    setKanAngra(s.length > 0);
  }

  function byggFras(fras: string) {
    ljud.lasOpp();
    ljud.pling();
    setByggPuff(null);
    tomAngra();
    textRef.current = fras;
    setText(fras);
    setHand(true);
    handRef.current = true;
    setForslag(null);
    setBehover(null);
    utfor(fras, { hand: true });
  }

  function vaknaNu() { tomAngra(); rostKo.handling(); utfor(textRef.current, { hand: handRef.current }); }

  function skrivTecken(bit: string) {
    setBokOpp(true);
    ljud.lasOpp();
    ljud.pling();
    let next = bokstav(textRef.current + bit);
    if (bit === " ") {
      const rens = utanSparratSuffix(next);
      if (rens.traff) {
        next = rens.text;
        sparaAngra(next);
        textRef.current = next;
        setLage("skriv");
        setHand(true);
        handRef.current = true;
        setForslag(null);
        setBehover(null);
        setText(next);
        visaBanner("Det ordet kan Trollpennan inte.", "sparr", "sparr");
        ljud.puff();
        return;
      }
    }
    sparaAngra(next);
    textRef.current = next;
    setLage("skriv");
    setHand(true);
    handRef.current = true;
    setForslag(null);
    setBehover(null);
    setText(next);
  }

  function sudda() {
    const next = textRef.current.slice(0, -1);
    sparaAngra(next);
    textRef.current = next;
    setHand(true);
    handRef.current = true;
    setLage("skriv");
    setForslag(null);
    setText(next);
  }

  function valjKort(ord: Ord) {
    if (gavaRef.current) {
      const fras = `${ord.genus} ${ord.visa}`;
      sparaAngra(fras);
      textRef.current = fras;
      setText(fras);
      setVal({ djur: ord });
      return;
    }
    ljud.lasOpp();
    ljud.pling();
    useMinne.getState().anvandKort(ord.id);
    setHand(false);
    setForslag(null);
    setBehover(null);
    setLage("kort");
    const slot = ord.klass as Slot;
    const nuText = textRef.current;
    const artikelMatch = nuText.trim().match(/^(en|ett)\s+/i);
    setVal((prev) => {
      const bas = Object.keys(prev).length > 0 ? prev : valUrText(nuText);
      const next: Val = { ...bas };
      const gammalt = next[slot];
      if (gammalt?.id === ord.id) delete next[slot];
      else next[slot] = ord;
      let mening: string | null = null;
      if (gammalt && gammalt.id !== ord.id) {
        for (const k of [gammalt.visa, gammalt.id, ...gammalt.former]) {
          const bytt = bytOrd(nuText, k, ord.visa);
          if (bytt !== nuText) {
            mening = bytt;
            break;
          }
        }
      }
      if (mening == null) {
        const grund = meningAv(next);
        mening = artikelMatch && grund && !/^(en|ett)\s+/i.test(grund)
          ? `${artikelMatch[1]!.toLocaleLowerCase("sv")} ${grund}`
          : grund;
      }
      const djurVisa = next.djur?.visa ?? bas.djur?.visa;
      if (djurVisa && mening && !mening.toLocaleLowerCase("sv").includes(djurVisa.toLocaleLowerCase("sv"))) {
        const grund = meningAv(next);
        mening = artikelMatch && grund && !/^(en|ett)\s+/i.test(grund)
          ? `${artikelMatch[1]!.toLocaleLowerCase("sv")} ${grund}`
          : grund;
      }
      sparaAngra(mening);
      textRef.current = mening;
      setText(mening);
      return next;
    });
  }

  function oppnaSkrivMig(ord: Ord) {
    setLage("skriv");
    setHand(true);
    const t = ord.visa.slice(0, 2);
    textRef.current = t;
    setText(t);
    setForslag(null);
  }

  function valjForslag(kortet: ForslagKort) {
    if (!forslag) return;
    rostKo.handling();
    const ny = bytOrd(textRef.current, forslag.token, kortet.visa);
    tomAngra();
    textRef.current = ny;
    setText(ny);
    setForslag(null);
    setHand(false);
    handRef.current = false;
    utfor(ny, { hand: false, inteGuld: [kortet.id] });
  }

  function nejForslag() {
    if (!forslag) return;
    const token = forslag.token;
    useMinne.getState().sparaOkanda([token]);
    const ny = taBortOrd(textRef.current, token);
    sparaAngra(ny);
    textRef.current = ny;
    setText(ny);
    setForslag(null);
    visaBanner("Det ordet kan Trollpennan inte än. Jag sparar det!", "okand", "okand_inget");
    ljud.puff();
  }

  function fyllExempel(ex: string) {
    ljud.lasOpp(); rostKo.handling();
    ljud.pling();
    sparaAngra(ex);
    textRef.current = ex;
    setText(ex);
    setHand(false);
    handRef.current = false;
    setForslag(null);
    setBehover(null);
    const nastaVal = valUrText(ex);
    setVal(nastaVal);
    if (/\bmed\s*…?\s*$/i.test(ex)) setFlik("tillbehor");
  }

  function vackIde(ex: string) {
    ljud.lasOpp();
    ljud.pling();
    tomAngra();
    textRef.current = ex;
    setText(ex);
    setHand(true);
    handRef.current = true;
    setForslag(null);
    setBehover(null);
    setVal({});
    utfor(ex, { hand: true });
  }

  useEffect(() => {
    if (forslag || behover || gavaTill || onskaOpp) setBokOpp(true);
  }, [forslag, behover, gavaTill, onskaOpp]);

  useEffect(() => { if (!bokOpp) { setGavaTill(null); gavaRef.current = null; } }, [bokOpp]); // R9H: gåvoläget är aldrig klistrigt

  useEffect(() => {
    const ned = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      // Låt Enter och mellanslag aktivera fokuserade kontroller, inte skapa djur.
      if (target?.closest('button, a, summary, input, textarea, select, [contenteditable="true"]')) {
        if (e.key === "Enter" || e.key === " " || target.closest('input, textarea, select, [contenteditable="true"]')) return;
      }
      if (overlayRef.current) {
        if (e.key === "Escape") {
          setOrdbok(false);
          setForalder(false);
          setVisKort(null);
          setKop(null);
          setKopia(null);
          setAlbumOpp(false);
          setMossaOpp(false);
        }
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        utforRef.current(textRef.current, { hand: handRef.current });
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        sudda();
        return;
      }
      if (e.key === " " || /^[a-zA-ZåäöÅÄÖ]$/.test(e.key)) {
        e.preventDefault();
        skrivTecken(e.key.toLocaleLowerCase("sv"));
      }
    };
    window.addEventListener("keydown", ned);
    return () => window.removeEventListener("keydown", ned);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- B6.1: tangentlyssnaren monteras en gång; skrivTecken/sudda når bara state via refs och set-funktioner
  }, []);
  return { byggFras, vaknaNu, skrivTecken, sudda, valjKort, oppnaSkrivMig, valjForslag, nejForslag, fyllExempel, vackIde, angraMening, kanAngra };
}

export type Skriv = ReturnType<typeof useSkriv>;
