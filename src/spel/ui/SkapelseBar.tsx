import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ordLista } from "../../tolk/tolka.ts";
import { TEXTER_AV } from "../aventyr.ts";
import type { Lage } from "../minne.ts";
import * as rostKo from "../rostKo.ts";
import { TEXTER } from "./spelData.ts";
import type { Slot, Varld } from "./typer.ts";

const SLOTAR: Slot[] = ["djur", "farg", "storlek", "monster", "formaga", "tillbehor"];

function slotForBricka(ord: string): Slot {
  const n = ord.toLocaleLowerCase("sv");
  if (n === "en" || n === "ett") return "djur";
  if (n === "med") return "tillbehor";
  if (n === "som") return "formaga";
  const hittat = ordLista().find((o) => {
    const lika = (s: string) => s.toLocaleLowerCase("sv") === n;
    return lika(o.id) || lika(o.visa) || o.former.some(lika);
  });
  if (hittat && SLOTAR.includes(hittat.klass as Slot)) return hittat.klass as Slot;
  return "djur";
}

function dataSlotFor(ord: string): Slot | "artikel" | "bindeord" {
  const n = ord.toLocaleLowerCase("sv");
  if (n === "en" || n === "ett") return "artikel";
  if (n === "med" || n === "som" || n === "och") return "bindeord";
  return slotForBricka(ord);
}

type SkapelseBarProps = {
  text: string;
  gavaTill: string | null;
  varld: Varld;
  omrade: string | null;
  vaknaText: string;
  visaTangenter: boolean;
  sudda: () => void;
  vaknaNu: () => void;
  kanAngra: boolean;
  angraMening: () => void;
  setFlik: Dispatch<SetStateAction<Slot>>;
  setLage: Dispatch<SetStateAction<Lage>>;
  setSkaparVy: Dispatch<SetStateAction<"skriv" | "gata" | "ideer">>;
  setSjalvSkriv: Dispatch<SetStateAction<boolean>>;
};

export function SkapelseBar({
  text, gavaTill, varld, omrade, vaknaText, visaTangenter, sudda, vaknaNu,
  kanAngra, angraMening, setFlik, setLage, setSkaparVy, setSjalvSkriv,
}: SkapelseBarProps) {
  const [casting, setCasting] = useState(false);
  const castingRef = useRef(false);
  const castingTimerRef = useRef<number | null>(null);
  useEffect(() => () => {
    if (castingTimerRef.current !== null) window.clearTimeout(castingTimerRef.current);
  }, []);
  const [aktivtOrdIdx, setAktivtOrdIdx] = useState<number | null>(null);
  const [expanderadMening, setExpanderadMening] = useState(false);
  const [magiskFas, setMagiskFas] = useState<"idle" | "word-selected" | "ready">("idle");
  const ordBit = text.trim() ? text.trim().split(/\s+/) : [];
  const antalOrd = ordBit.length;
  const visaBrickor = antalOrd < 7 || expanderadMening;
  const fas = casting ? "casting" : magiskFas;
  const statusText = casting
    ? "🪄 Trollpennan skapar…"
    : magiskFas === "word-selected"
      ? "✨ Ordet landade!"
      : text.trim()
        ? "✨ Redo att väcka liv!"
        : "✨ Skriv en mening…";
  const tomText = gavaTill
    ? TEXTER_AV.gavoruta.placeholder
    : varld === "gard" && !omrade
      ? TEXTER.penna_bygg.placeholder
      : "Välj ordkort eller skriv en mening…";

  useEffect(() => {
    if (antalOrd < 7) setExpanderadMening(false);
  }, [antalOrd]);

  useEffect(() => {
    if (casting) return;
    if (!text.trim()) {
      setMagiskFas("idle");
      return;
    }
    setMagiskFas("word-selected");
    const id = window.setTimeout(() => setMagiskFas("ready"), 250);
    return () => window.clearTimeout(id);
  }, [text, casting]);

  function onVakna() {
    if (castingRef.current || !text.trim()) return;
    castingRef.current = true;
    setCasting(true);
    try {
      vaknaNu();
    } finally {
      // Spärren släpps även om vaknaNu kastar, och en gammal timer städas innan en ny startas.
      if (castingTimerRef.current !== null) window.clearTimeout(castingTimerRef.current);
      castingTimerRef.current = window.setTimeout(() => {
        castingRef.current = false;
        setCasting(false);
        castingTimerRef.current = null;
      }, 450);
    }
  }

  function onOrdKlick(ord: string, slot: Slot | "artikel" | "bindeord", idx: number) {
    setAktivtOrdIdx(idx);
    setSkaparVy("skriv");
    setSjalvSkriv(false);
    setLage("kort");
    setFlik(slot === "artikel" || slot === "bindeord" ? slotForBricka(ord) : slot);
  }

  return (
    <div
      className={expanderadMening ? "skapelse-topp-remsa expanderad" : "skapelse-topp-remsa"}
      id="troll-ord"
      data-testid="remsa"
      data-m3="meningsruta"
      role="group"
      aria-label="Din mening och skrivverktyg"
      onClick={() => { setSkaparVy("skriv"); }}
    >
      <button type="button" className="remsa-lyssna" data-p4="lyssna-mening" aria-label="Läs upp meningen" disabled={!text.trim()} onClick={(e) => { e.stopPropagation(); if (text.trim()) rostKo.lasUpp(text); }}>🔊</button>
      <div className="meningsruta-innehall" data-m3="meningsruta-ord">
        {antalOrd === 0 ? (
          <span className="meningsruta-tom">{tomText}</span>
        ) : visaBrickor ? (
          ordBit.map((ord, idx) => {
            const slot = dataSlotFor(ord);
            return (
              <button
                key={`${ord}-${idx}`}
                type="button"
                className={aktivtOrdIdx === idx ? "meningsruta-bricka aktiv" : "meningsruta-bricka"}
                data-m3="ord-bricka"
                data-c1="ord-bricka"
                data-slot={slot}
                aria-label={`Ändra ${ord}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOrdKlick(ord, slot, idx);
                }}
              >
                {ord}
              </button>
            );
          })
        ) : (
          <span className="meningsruta-kortfattad" data-c1="mening-sammanfattning">{text.trim()}</span>
        )}
        {visaTangenter ? <i className="caret" /> : null}
      </div>
      {antalOrd >= 7 ? (
        <button
          type="button"
          className="meningsruta-expander"
          data-c1="mening-expander"
          onClick={(e) => {
            e.stopPropagation();
            setExpanderadMening((v) => !v);
          }}
        >
          {expanderadMening ? "🃏 Visa kort" : "✏️ Ändra orden"}
        </button>
      ) : null}
      <button type="button" className="meningsruta-angra" data-c1="mening-angra" aria-label="Ångra senaste ordval" disabled={!kanAngra} onClick={(e) => { e.stopPropagation(); angraMening(); }}>↶</button>
      {text ? <button type="button" className="meningsruta-sudda" data-m3="mening-sudda" aria-label="Sudda" onClick={(e) => { e.stopPropagation(); sudda(); }}>⌫</button> : null}
      <button type="button" className={text.trim() ? "vakna redo" : "vakna"} data-testid="vakna" data-m3="mening-vakna" disabled={casting || !text.trim()} aria-busy={casting} ref={(el) => el?.setAttribute("data-v3", "vack-knapp")} onClick={(e) => { e.stopPropagation(); onVakna(); }}>
        <span ref={(el) => el?.setAttribute("data-testid", "vack-knapp")}>✨ {vaknaText}</span>
      </button>
      <div className="magisk-status-rad" role="status" aria-live="polite" data-c1="magisk-status" data-fas={fas}>{statusText}</div>
    </div>
  );
}
