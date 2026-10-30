// Nya Skapa: det fysiska tangentbordet (dator) skriver i Pennans bok precis som skärmtangenterna.
// Enter = klar (eller Trolla när skrivbrickan är tom), Backspace = sudda, Escape stänger boken utan att sudda.
import { useEffect, useRef, type RefObject } from "react";
import type { SpelTillstand } from "./useSpelTillstand.ts";

type Op = {
  nu: () => string;
  avslutaOrd: () => void;
  trolla: () => unknown;
  sudda: () => void;
  skrivTecken: (bit: string) => void;
  bokOppRef: RefObject<boolean>;
};

export function useSkrivTangentbord(t: SpelTillstand, op: Op) {
  const { setOrdbok, setForalder, setVisKort, setKop, setKopia, setAlbumOpp, setMossaOpp, setBokOpp, overlayRef, gavaRef } = t;
  const opRef = useRef(op);
  opRef.current = op;
  useEffect(() => {
    const ned = (e: KeyboardEvent) => {
      const o = opRef.current;
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") {
        if (overlayRef.current) {
          setOrdbok(false);
          setForalder(false);
          setVisKort(null);
          setKop(null);
          setKopia(null);
          setAlbumOpp(false);
          setMossaOpp(false);
        }
        // Stäng boken utan att röra textRef — barnets mening ska finnas kvar.
        if ((!overlayRef.current || gavaRef.current) && o.bokOppRef.current) setBokOpp(false);
        return;
      }
      const target = e.target instanceof HTMLElement ? e.target : null;
      // I Pennans bok är mellanslag alltid ett mellanslag (fokus står ofta på stängknappen), Enter trycker på knappen.
      const iArket = !!target?.closest(".sk-lager") && !target.closest("input, textarea, select");
      if (!iArket && target?.closest('button, a, summary, input, textarea, select, [contenteditable="true"]')) {
        if (e.key === "Enter" || e.key === " " || target.closest('input, textarea, select, [contenteditable="true"]')) return;
      }
      if (iArket && e.key === "Enter" && target?.closest("button")) return;
      // Gåvan skrivs i Pennans bok, så den räknas inte som en dialog här.
      if (overlayRef.current && !(gavaRef.current && o.bokOppRef.current)) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (o.nu().trim()) o.avslutaOrd();
        else if (o.bokOppRef.current) o.trolla();
        else setBokOpp(true);
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        o.sudda();
        return;
      }
      if (e.key === " " || /^[a-zA-ZåäöÅÄÖ]$/.test(e.key)) {
        e.preventDefault();
        o.skrivTecken(e.key === " " ? " " : e.key.toLocaleLowerCase("sv"));
      }
    };
    window.addEventListener("keydown", ned);
    return () => window.removeEventListener("keydown", ned);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lyssnaren monteras en gång; funktionerna nås via opRef
  }, []);
}
