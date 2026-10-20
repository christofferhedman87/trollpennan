import { useState } from "react";
import omradenJson from "../../data/omraden.json" with { type: "json" };
import foralderJson from "../../data/foralder-r6.json" with { type: "json" };
import vildaJson from "../../data/vilda-djur.json" with { type: "json" };
import { ordLista } from "@/tolk/tolka.ts";
import { fyll } from "./fyll.ts";
import { ALBUM, BYGG_ORD, KROPPAR, SKATTER, gavaOrd, taBortFoto } from "./liv.ts";
import { useMinne } from "./minne.ts";

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
        <h2>{ALBUM.texter.knapp}</h2>
        <p data-testid="album-framsteg">{fyll(ALBUM.texter.framsteg, tal)}</p>
        <div className="album-flikar">
          {sidor.map((s) => (
            <button key={s.id} type="button" className={s.id === vald.id ? "flik pa" : "flik"} data-testid={`album-${s.id}`} onClick={() => setFlik(s.id)}>
              {s.titel}
            </button>
          ))}
        </div>
        {vald.id === "kroppar" ? (
          <div className="album-rutnat">
            {KROPPAR.map((id) => {
              const m = kropp[id];
              return (
                <article key={id} className={m ? "album-ruta" : "album-ruta okand"} data-testid={`kropp-${id}`}>
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
                    <p className="silhuett">?</p>
                  )}
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
                  {kand ? <p>{v.namn}</p> : <p className="silhuett">?</p>}
                  {!kand ? <p>{borRad(plats)}</p> : null}
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
                  {kand ? (
                    <>
                      <p>{sk.namn}</p>
                      <p>{sk.text}</p>
                    </>
                  ) : (
                    <p className="silhuett">?</p>
                  )}
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
                  {kand ? <p>{ord}</p> : <p className="silhuett">?</p>}
                </article>
              );
            })}
          </div>
        ) : null}
        {vald.id === "foton" ? (
          <div className="album-rutnat" data-testid="foton">
            {foton.map((f) => (
              <article key={f.id} className="album-ruta" data-testid="foto-ruta">
                <p className="album-stj">{stjarnor(f.niva)}</p>
                <p>{f.formel}</p>
                <button type="button" className="nej" onClick={() => taBortFoto(f.id)}>
                  {ALBUM.texter.ta_bort}
                </button>
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
