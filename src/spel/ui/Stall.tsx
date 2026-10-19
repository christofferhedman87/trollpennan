// R9G: stallet som lista i menyn + knappen "Till stallet" vid djuret man tryckt på. Läser minnet själv (useMinne),
// så Spel.tsx behöver inga nya props. Ingen 3D-byggnad.
import { useEffect, useState } from "react";
import { brygga } from "../brygga.ts";
import { useMinne } from "../minne.ts";
import { dukStil } from "./hjalp.ts";
import { TEXTER } from "./spelData.ts";
import type { Banner } from "./typer.ts";

const CHIP_MS = 6000;

function finns(uid: string): boolean {
  const s = useMinne.getState();
  return s.ang.some((a) => a.uid === uid) || Object.values(s.platsSkapelser).some((l) => l.some((a) => a.uid === uid));
}

/** Efter tryck på ett djur (ängen eller annan plats): en knapp under djuret i ~6 s. */
export function StallChip({ visaBanner }: { visaBanner: (texten: string, slag: Banner["slag"]) => void }) {
  const [mal, setMal] = useState<{ uid: string; x: number; y: number } | null>(null);
  useEffect(() => {
    const sluta = brygga.lyssna((h) => {
      if (h.typ === "tryck" && finns(h.uid)) setMal({ uid: h.uid, x: h.x, y: h.y });
    });
    return () => {
      sluta();
    };
  }, []);
  // R9H: byter barnet plats försvinner knappen direkt (den hör till ett djur på den gamla platsen)
  useEffect(
    () =>
      useMinne.subscribe((s, f) => {
        if (s.plats !== f.plats) setMal(null);
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
      className="stall-chip"
      data-testid="djur-till-stall"
      data-uid={mal.uid}
      style={dukStil(mal.x, Math.min(0.86, mal.y + 0.24))}
      onClick={() => {
        if (useMinne.getState().tillStall(mal.uid)) visaBanner(TEXTER.stall.flytta, "ovr");
        setMal(null);
      }}
    >
      {TEXTER.stall.chip}
    </button>
  );
}

/** Menyknappen "Stallet" och listan; "Hämta ut" lägger djuret på platsen barnet är på. */
export function StallMeny({ stang }: { stang: () => void }) {
  const stall = useMinne((s) => s.stall);
  const [oppen, setOppen] = useState(false);
  const [full, setFull] = useState(false);
  return (
    <>
      <button type="button" data-testid="meny-stall" aria-expanded={oppen} onClick={() => { setOppen((v) => !v); setFull(false); }}>
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
