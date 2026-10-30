// R9G: stallet som lista i menyn + knappen "Till stallet" vid djuret man tryckt på. Läser minnet själv (useMinne),
// så Spel.tsx behöver inga nya props. Ingen 3D-byggnad.
import { useEffect, useState } from "react";
import menyJson from "../../../data/meny.json" with { type: "json" };
import { brygga } from "../brygga.ts";
import { useMinne } from "../minne.ts";
import { TEXTER } from "./spelData.ts";
import type { Kalla } from "../rostKo.ts";
import type { Banner } from "./typer.ts";

const CHIP_MS = 6000;

function finns(uid: string): boolean {
  const s = useMinne.getState();
  return s.ang.some((a) => a.uid === uid) || Object.values(s.platsSkapelser).some((l) => l.some((a) => a.uid === uid));
}

/** Efter tryck på ett djur (ängen eller annan plats): en knapp i ~6 s. B6.1: knappen ligger i UI-raden längst ner bredvid
 *  "Pennans bok", aldrig över djuret, så att ett nytt tryck på djuret aldrig ställer in det i stallet av misstag. */
export function StallChip({ visaBanner }: { visaBanner: (texten: string, slag: Banner["slag"], kalla: Kalla) => void }) {
  const [mal, setMal] = useState<{ uid: string } | null>(null);
  useEffect(() => {
    const sluta = brygga.lyssna((h) => {
      if (h.typ === "tryck" && finns(h.uid)) setMal({ uid: h.uid });
    });
    return () => {
      sluta();
    };
  }, []);
  // R9H: byter barnet plats försvinner knappen direkt (den hör till ett djur på den gamla platsen)
  useEffect(
    () =>
      useMinne.subscribe((s, f) => {
        // R9I: djuret har just flyttats till stallet (t.ex. med knappen i gåvorutan) → knappen här är inaktuell
        if (s.plats !== f.plats || s.stall.length > f.stall.length) setMal(null);
      }),
    [],
  );
  useEffect(() => {
    if (!mal) return;
    const t = window.setTimeout(() => setMal(null), CHIP_MS);
    return () => window.clearTimeout(t);
  }, [mal]);
  if (!mal) return null;
  return (
    <button
      type="button"
      className="stall-chip panel"
      data-testid="djur-till-stall"
      data-uid={mal.uid}
      onClick={() => {
        if (useMinne.getState().tillStall(mal.uid)) visaBanner(TEXTER.stall.flytta, "ovr", "tapp");
        setMal(null);
      }}
    >
      {TEXTER.stall.chip}
    </button>
  );
}

/** R9I: "Till stallet" inne i gåvorutan, så att knappen aldrig döljs när ett sugen djur öppnar boken. */
export function GavaStallKnapp({ uid, visaBanner, klar }: { uid: string; visaBanner: (texten: string, slag: Banner["slag"], kalla: Kalla) => void; klar: () => void }) {
  return (
    <button
      type="button"
      className="stall-chip i-bok"
      data-testid="gava-till-stall"
      onClick={() => {
        if (useMinne.getState().tillStall(uid)) visaBanner(TEXTER.stall.flytta, "ovr", "tapp");
        klar();
      }}
    >
      {TEXTER.stall.chip}
    </button>
  );
}

/** Menyknappen "Stallet" och listan; "Hämta ut" lägger djuret på platsen barnet är på. */
export function StallMeny({ stang, bara = false }: { stang: () => void; bara?: boolean }) {
  const stall = useMinne((s) => s.stall);
  const [oppen, setOppen] = useState(bara);
  const [full, setFull] = useState(false);
  return (
    <>
      <button type="button" data-testid="meny-stall" aria-expanded={oppen} hidden={bara} onClick={() => { setOppen((v) => !v); setFull(false); }}>
        <span className="meny-ikon" data-v2="meny-ikon" aria-hidden="true">{menyJson.v2.stall.ikon}</span>
        <span>
          {TEXTER.stall.meny} {stall.length ? `(${stall.length})` : ""}
        </span>
      </button>
      {oppen ? (
        <div className="stall-lista" data-testid="stall-lista">
          <p className="meny-fraga">{stall.length ? TEXTER.stall.forklaring : TEXTER.stall.tom}</p>
          {full ? <p className="meny-fraga" data-testid="stall-full">{TEXTER.stall.full}</p> : null}
          {stall.map((d) => (
            <div className="stall-rad" key={d.uid}>
              <span className="stall-namn" data-testid={`stall-namn-${d.uid}`}>{d.formel}</span>
              <button
                type="button"
                data-testid={`stall-hamta-${d.uid}`}
                onClick={() => {
                  const r = useMinne.getState().franStall(d.uid);
                  if (r === "full") return setFull(true);
                  if (r === "ok") stang();
                }}
              >
                {TEXTER.stall.hamta}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
