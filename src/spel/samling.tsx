import { useState, type ReactNode } from "react";
import omradenJson from "../../data/omraden.json" with { type: "json" };
import foralderJson from "../../data/foralder-r6.json" with { type: "json" };
import vildaJson from "../../data/vilda-djur.json" with { type: "json" };
import { tolkaMedReserv } from "@/tolk/reserv.ts";
import { ordLista } from "@/tolk/tolka.ts";
import type { Sparad } from "./brygga.ts";
import { fyll } from "./fyll.ts";
import { ALBUM, BYGG_ORD, KROPPAR, SKATTER, gavaOrd, sparaFoto, taBortFoto } from "./liv.ts";
import { useMinne } from "./minne.ts";
import { albumBild, PLATS_ANG, PLATS_AVENTYR, PLATS_GARD, platsVild } from "./v9aHjalp.ts";

const OMR_NAMN = Object.fromEntries(
  (omradenJson as { omraden: { id: string; namn: string }[] }).omraden.map((o) => [o.id, o.namn]),
);
const VILDA = (vildaJson as { djur: { id: string; namn: string; omrade: string }[] }).djur;
const FOR = foralderJson;

function borRad(namn: string) {
  return `Bor i ${namn}`;
}

function stjarnor(id: string) {
  const n = ALBUM.sallsynthet.nivaer.find((x) => x.id === id);
  return "★".repeat(n?.stjarnor ?? 1);
}

function nivaNamn(id: string) {
  return ALBUM.sallsynthet.nivaer.find((x) => x.id === id)?.namn ?? id;
}

function reservKanin(): Sparad | null {
  const u = tolkaMedReserv("en röd kanin");
  if (u.typ !== "skapad") return null;
  return { ...u.varelse, uid: crypto.randomUUID(), skapad: Date.now() };
}

function taBildPaSkapelse(setFlik: (id: string) => void) {
  const s = useMinne.getState();
  const djur = s.ang.at(-1) ?? s.hemma.at(-1)?.spec ?? reservKanin();
  if (!djur) return;
  sparaFoto(djur);
  setFlik("foton");
}

function AlbumMark({ bild, plats, children }: { bild: string; plats: string; children: ReactNode }) {
  return (
    <>
      <span className="album-kort-bild" data-v9a="album-bild" aria-hidden="true">
        {bild}
      </span>
      {children}
      <span className="album-plats-tagg" data-v9a="album-plats">
        {plats}
      </span>
    </>
  );
}

export function AlbumVy({ stang }: { stang: () => void }) {
  const kropp = useMinne((s) => s.albumKropp);
  const van = useMinne((s) => s.van);
  const skatter = useMinne((s) => s.skatterHitta);
  const byggda = useMinne((s) => s.byggda);
  const foton = useMinne((s) => s.foton);
  const [flik, setFlik] = useState(ALBUM.sidor[0]!.id);
  const sidor = ALBUM.sidor;
  const vald = sidor.find((s) => s.id === flik) ?? sidor[0]!;
  const tal = framsteg(flik, kropp, van, skatter, byggda, foton);

  return (
    <div className="skarm" role="dialog" aria-label={ALBUM.texter.knapp} data-testid="album">
      <div className="ark sida album">
        <div className="v9a-huvud">
          <button type="button" className="stang-x stang" data-v9a="album-stang" data-f5="modal-stang" aria-label="Stäng" ref={(el) => el?.setAttribute("data-testid", "modal-stang")} onClick={stang}>
            ×
          </button>
        </div>
        <h2>{ALBUM.texter.knapp}</h2>
        <p data-testid="album-framsteg">{fyll(ALBUM.texter.framsteg, tal)}</p>
        <div className="album-flikar">
          {sidor.map((s) => (
            <button key={s.id} type="button" className={s.id === vald.id ? "flik pa" : "flik"} data-testid={`album-${s.id}`} onClick={() => setFlik(s.id)}>
              {s.titel}
            </button>
          ))}
        </div>
        {foton.length === 0 ? (
          <button type="button" className="kort album-ta-bild" data-v9a="album-ta-bild" onClick={() => taBildPaSkapelse(setFlik)}>
            📸 Ta bild på din skapelse
          </button>
        ) : null}
        {vald.id === "kroppar" ? (
          <div className="album-rutnat">
            {KROPPAR.map((id) => {
              const m = kropp[id];
              return (
                <article key={id} className={m ? "album-ruta" : "album-ruta okand"} data-testid={`kropp-${id}`}>
                  <AlbumMark bild={albumBild(id, "djur")} plats={PLATS_ANG}>
                    {m ? (
                      <>
                        <p className="album-stj" data-testid={`stjarnor-${id}`}>
                          {stjarnor(m.niva)}
                        </p>
                        <p>{m.formel}</p>
                        <p>
                          {nivaNamn(m.niva)} · {ALBUM.texter.hjartan} {"♥".repeat(m.hjartan)}
                        </p>
                        <p>{m.favorit ? fyll(ALBUM.texter.favorit, { gava: gavaOrd(m.favorit) }) : ALBUM.texter.okand_favorit}</p>
                      </>
                    ) : (
                      <p>{id}</p>
                    )}
                  </AlbumMark>
                </article>
              );
            })}
          </div>
        ) : null}
        {vald.id === "vilda" ? (
          <div className="album-rutnat">
            {VILDA.map((v) => {
              const kand = van.includes(v.id);
              const plats = OMR_NAMN[v.omrade] ?? v.omrade;
              return (
                <article key={v.id} className={kand ? "album-ruta" : "album-ruta okand"} data-testid={`vild-${v.id}`}>
                  <AlbumMark bild={albumBild(v.id, "djur")} plats={platsVild(v.omrade, plats)}>
                    {kand ? <p>{v.namn}</p> : <p>{v.namn}</p>}
                    {!kand ? <p>{borRad(plats)}</p> : null}
                  </AlbumMark>
                </article>
              );
            })}
          </div>
        ) : null}
        {vald.id === "skatter" ? (
          <div className="album-rutnat">
            {SKATTER.map((sk) => {
              const kand = skatter.includes(sk.id);
              return (
                <article key={sk.id} className={kand ? "album-ruta" : "album-ruta okand"} data-testid={`skatt-${sk.id}`}>
                  <AlbumMark bild={albumBild(sk.id, "skatt")} plats={PLATS_AVENTYR}>
                    {kand ? (
                      <>
                        <p>{sk.namn}</p>
                        <p>{sk.text}</p>
                      </>
                    ) : (
                      <p>{sk.namn}</p>
                    )}
                  </AlbumMark>
                </article>
              );
            })}
          </div>
        ) : null}
        {vald.id === "byggen" ? (
          <div className="album-rutnat">
            {BYGG_ORD.map((b) => {
              const kand = byggda.includes(b.id);
              const ord = (b as { former?: string[] }).former?.[0] ?? b.id;
              return (
                <article key={b.id} className={kand ? "album-ruta" : "album-ruta okand"} data-testid={`byggord-${b.id}`}>
                  <AlbumMark bild={albumBild(b.id, "bygg")} plats={PLATS_GARD}>
                    {kand ? <p>{ord}</p> : <p>{ord}</p>}
                  </AlbumMark>
                </article>
              );
            })}
          </div>
        ) : null}
        {vald.id === "foton" ? (
          <div className="album-rutnat" data-testid="foton">
            {foton.map((f) => (
              <article key={f.id} className="album-ruta" data-testid="foto-ruta">
                <AlbumMark bild={albumBild(f.kropp, "foto")} plats={PLATS_ANG}>
                  <p className="album-stj">{stjarnor(f.niva)}</p>
                  <p>{f.formel}</p>
                  <button type="button" className="nej" onClick={() => taBortFoto(f.id)}>
                    {ALBUM.texter.ta_bort}
                  </button>
                </AlbumMark>
              </article>
            ))}
          </div>
        ) : null}
        <button type="button" className="stang" onClick={stang}>
          Stäng
        </button>
      </div>
    </div>
  );
}

function framsteg(
  id: string,
  kropp: Record<string, unknown>,
  van: string[],
  skatter: string[],
  byggda: string[],
  foton: unknown[],
) {
  if (id === "kroppar") return { n: Object.keys(kropp).length, total: KROPPAR.length };
  if (id === "vilda") return { n: van.length, total: VILDA.length };
  if (id === "skatter") return { n: skatter.length, total: SKATTER.length };
  if (id === "byggen") return { n: byggda.length, total: BYGG_ORD.length };
  return { n: foton.length, total: 60 };
}

export function ForalderLiv() {
  const ordFrek = useMinne((s) => s.ordFrek);
  const funna = useMinne((s) => s.funna);
  const onskanAntal = useMinne((s) => s.onskanAntal);
  const garden = useMinne((s) => s.garden);
  const lada = useMinne((s) => s.lada);
  const van = useMinne((s) => s.van);
  const onskelista = useMinne((s) => s.onskelista);
  const hemliga = ordLista().filter((o) => o.niva === "fritt");
  const guld = Object.values(funna).filter((f) => f.guld).length;
  const hittadeHemliga = hemliga.filter((o) => funna[o.id]).length;
  const byggen = [...garden, ...lada].filter((b) => !b.bygg.startsWith("skatt:")).length;
  const varden = [
    Object.keys(ordFrek).length,
    guld,
    hittadeHemliga,
    onskanAntal,
    byggen,
    van.length,
    onskelista.length,
  ];
  const rader = FOR.sammanfattning.rader.map((rad, i) =>
    fyll(rad, { n: varden[i] ?? 0, total: i === 2 ? hemliga.length : 7 }),
  );
  return (
    <section data-testid="foralder-sammanfattning">
      <h3>{FOR.sammanfattning.rubrik}</h3>
      {rader.map((rad) => (
        <p key={rad} data-testid="foralder-rad">
          {rad}
        </p>
      ))}
      <p>{FOR.ordlista.hjalp}</p>
      <button type="button" className="kort" data-testid="ladda-ord" onClick={() => laddaOrd(ordFrek)}>
        {FOR.ordlista.knapp}
      </button>
    </section>
  );
}

function ordText(frek: Record<string, number>) {
  return Object.entries(frek)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "sv"))
    .map(([w]) => w)
    .join("\n");
}

function laddaOrd(frek: Record<string, number>) {
  const blob = new Blob([ordText(frek)], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = FOR.ordlista.filnamn;
  a.click();
  URL.revokeObjectURL(url);
}
