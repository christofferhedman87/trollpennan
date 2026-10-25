import { useEffect } from "react";
import type { ForslagKort, Ord } from "@/tolk/typer.ts";
import { ljud } from "../ljud.ts";
import { useMinne } from "../minne.ts";
import * as rostKo from "../rostKo.ts";
import { bokstav, bytOrd, meningAv, taBortOrd, utanSparratSuffix } from "../ui/hjalp.ts";
import type { Slot, Val } from "../ui/typer.ts";
import type { SpelKarna } from "./typer.ts";

export function useSkriv(k: Pick<SpelKarna, "t" | "b" | "s">) {
  const { setText, setLage, setVal, setHand, forslag, setForslag, behover, setBehover, setVisKort, setOrdbok, setForalder, setAlbumOpp, setMossaOpp, bokOpp, setBokOpp, setByggPuff, setKop, onskaOpp, setKopia, gavaTill, setGavaTill, textRef, handRef, overlayRef, gavaRef } = k.t;
  const { visaBanner } = k.b;
  const { utfor, utforRef } = k.s;

  function byggFras(fras: string) {
    ljud.lasOpp();
    ljud.pling();
    setByggPuff(null);
    textRef.current = fras;
    setText(fras);
    setHand(true);
    handRef.current = true;
    setForslag(null);
    setBehover(null);
    utfor(fras, { hand: true });
  }

  function vaknaNu() { rostKo.handling(); utfor(textRef.current, { hand: handRef.current }); }

  function skrivTecken(bit: string) {
    setBokOpp(true);
    ljud.lasOpp();
    ljud.pling();
    let next = bokstav(textRef.current + bit);
    if (bit === " ") {
      const rens = utanSparratSuffix(next);
      if (rens.traff) {
        next = rens.text;
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
    textRef.current = next;
    setHand(true);
    handRef.current = true;
    setLage("skriv");
    setForslag(null);
    setText(next);
  }

  function valjKort(ord: Ord) {
    ljud.lasOpp();
    ljud.pling();
    useMinne.getState().anvandKort(ord.id);
    setHand(false);
    setForslag(null);
    setBehover(null);
    setLage("kort");
    const slot = ord.klass as Slot;
    setVal((prev) => {
      const next: Val = { ...prev };
      if (next[slot]?.id === ord.id) delete next[slot];
      else next[slot] = ord;
      const mening = meningAv(next);
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
    textRef.current = ny;
    setText(ny);
    setForslag(null);
    visaBanner("Det ordet kan Trollpennan inte än. Jag sparar det!", "okand", "okand_inget");
    ljud.puff();
  }

  function fyllExempel(ex: string) {
    ljud.lasOpp(); rostKo.handling();
    ljud.pling();
    textRef.current = ex;
    setText(ex);
    setHand(false);
    handRef.current = false;
    setForslag(null);
    setBehover(null);
    setVal({});
  }

  function vackIde(ex: string) {
    ljud.lasOpp();
    ljud.pling();
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
  return { byggFras, vaknaNu, skrivTecken, sudda, valjKort, oppnaSkrivMig, valjForslag, nejForslag, fyllExempel, vackIde };
}

export type Skriv = ReturnType<typeof useSkriv>;
