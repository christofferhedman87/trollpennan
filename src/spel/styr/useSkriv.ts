// Nya Skapa: meningen i Pennans bok. Texten (textRef) är fortfarande sanningen, men varje färdigt ord har en källa
// (skriv/kort/auto, skapa/mening.ts) så att guldord, hjälpkort och böjning fungerar. Skriva själv är förstahandsvalet:
// mellanslag kollar ordet direkt (Menade du …? / ordägg), och hjälpkort sätts in där grammatiken säger (7.1).
import { useEffect, useMemo, useRef, useState } from "react";
import type { ForslagKort, Ord } from "@/tolk/typer.ts";
import uiJson from "../../../data/skapa-ui.json" with { type: "json" };
import { fyll } from "../fyll.ts";
import { ljud } from "../ljud.ts";
import { useMinne } from "../minne.ts";
import * as rostKo from "../rostKo.ts";
import { rattaBoj } from "../skapa/bojning.ts";
import { hylla, type HyllKort } from "../skapa/hjalpord.ts";
import { laggKort, taBort } from "../skapa/insattning.ts";
import { arFrasStart } from "../skapa/lexikon.ts";
import { delaText, justera, platta, tillText, type MOrd, type OrdKalla } from "../skapa/mening.ts";
import { harVad, meningsbrickor, oppenFraga } from "../skapa/meningsbrickor.ts";
import { arGuld, arSkrivord, meningensGenus } from "../skapa/hjalpord.ts";
import { kollaOrd, sammansatt } from "../skapa/ordKoll.ts";
import { sagBokstav } from "../skapa/installning.ts";
import { bokstav, utanSparratSuffix } from "../ui/hjalp.ts";
import type { SpelKarna } from "./typer.ts";
import { tackFor } from "../skapa/tack.ts";
import { tystaBannrar, useKvitto } from "../skapa/kvitto.ts";
import { useSkrivTangentbord } from "./useSkrivTangentbord.ts";
import { skrivGuldTecken, type Spok } from "../skapa/guldchans.ts";

const ANGRA_MAX = 24;
const UI = uiJson as unknown as { puffar: Record<string, string>; tider_ms: Record<string, number> };
export type SkrivVy = "skriv" | "hjalp";

export function useSkriv(k: Pick<SpelKarna, "t" | "s">) {
  const { text, setText, setVal, setHand, forslag, setForslag, behover, setBehover, bokOpp, setBokOpp, onskaOpp, gavaTill, setGavaTill, textRef, handRef, gavaRef, setByggPuff } = k.t;
  const { utfor } = k.s;
  const metaRef = useRef<MOrd[]>([]);
  const [ver, setVer] = useState(0);
  const behallRef = useRef<string[]>([]);
  const aterRef = useRef<MOrd | null>(null);
  const angraRef = useRef<{ text: string; meta: MOrd[] }[]>([]);
  const [kanAngra, setKanAngra] = useState(false);
  const [vy, setVy] = useState<SkrivVy>(() => (useMinne.getState().startLage === "kort" ? "hjalp" : "skriv"));
  const [puff, setPuff] = useState<{ id: number; text: string } | null>(null);
  const [spok, setSpok] = useState<Spok | null>(null);
  const [erbjud, setErbjud] = useState<HyllKort | null>(null);
  const [rorelse, setRorelse] = useState<{ ny: number | null; bojda: number[]; id: number }>({ ny: null, bojda: [], id: 0 });
  const [sistaTangent, setSistaTangent] = useState(0);
  const bokOppRef = useRef(bokOpp);
  bokOppRef.current = bokOpp;
  const spokRef = useRef(spok);
  spokRef.current = spok;
  const forslagRef = useRef(forslag);
  forslagRef.current = forslag;

  useEffect(() => {
    if (!text.trim()) {
      metaRef.current = [];
      aterRef.current = null;
    }
  }, [text]);

  const opts = useMemo(() => ({ fragaToken: forslag?.token ?? null, sammansatt }), [forslag]);
  function nu() {
    const d = delaText(textRef.current);
    return { ord: justera(d.ord, metaRef.current), skriv: d.skriv };
  }
  const remsa = useMemo(() => {
    void ver;
    const d = delaText(text);
    const ord = justera(d.ord, metaRef.current);
    const brickor = meningsbrickor(ord, opts);
    // Pennan vaknar redan när det påbörjade ordet är ett Vad ("en drake" utan mellanslag).
    const medSkriv = d.skriv ? harVad(meningsbrickor([...ord, { t: d.skriv, k: "skriv" }], opts)) : false;
    return { ord, skriv: d.skriv, brickor, harVad: harVad(brickor), redo: harVad(brickor) || medSkriv, fraga: oppenFraga(brickor) };
  }, [text, ver, opts]);

  function puffa(t: string, las = true) {
    setPuff({ id: Date.now(), text: t });
    if (las) rostKo.lasUpp(t);
  }
  useEffect(() => {
    if (!puff) return;
    const id = window.setTimeout(() => setPuff(null), UI.tider_ms.puff ?? 2600);
    return () => window.clearTimeout(id);
  }, [puff]);

  function sparaAngra() {
    const s = angraRef.current;
    s.push({ text: textRef.current, meta: [...metaRef.current] });
    if (s.length > ANGRA_MAX) s.shift();
    setKanAngra(true);
  }
  function tomAngra() {
    angraRef.current = [];
    setKanAngra(false);
  }

  /** Den enda vägen in i texten: ord + skrivbricka → text, källorna sparas, en fråga om ett ord som försvunnit stängs. */
  function satt(ord: MOrd[], skriv: string, angra = true) {
    const ny = tillText(ord, skriv);
    // Spökfrasens position gäller bara meningen där barnet började skriva den.
    if (spokRef.current && ny !== textRef.current) avbrytGuld();
    if (angra && ny !== textRef.current) sparaAngra();
    metaRef.current = platta(ord);
    textRef.current = ny;
    setText(ny);
    setVer((v) => v + 1);
    const f = forslagRef.current;
    if (f && !ord.some((o) => o.t.toLocaleLowerCase("sv") === f.token.toLocaleLowerCase("sv"))) setForslag(null);
  }

  function angraMening() {
    const s = angraRef.current;
    const fore = s.pop();
    if (!fore) return setKanAngra(false);
    avbrytGuld();
    metaRef.current = fore.meta;
    textRef.current = fore.text;
    setText(fore.text);
    setVer((v) => v + 1);
    setKanAngra(s.length > 0);
    setForslag(null);
  }

  /** Mellanslag eller Klar: ordet i skrivbrickan blir färdigt och kollas. */
  function avslutaOrd(): void {
    const { ord, skriv } = nu();
    const w = skriv.trim();
    if (!w) return;
    // Ett spärrat ord tas bort (samma regel som förut).
    const rens = utanSparratSuffix(`${tillText(ord, w)} `);
    if (rens.traff) {
      const d = delaText(rens.text);
      satt(justera(d.ord, metaRef.current), "");
      puffa(UI.puffar.sparr ?? "Det ordet kan Trollpennan inte.");
      ljud.puff();
      return;
    }
    if (arFrasStart(w)) {
      satt([...ord, { t: w, k: "skriv" }], "");
      return;
    }
    const ater = aterRef.current;
    const kalla: OrdKalla = ater && ater.t === w ? ater.k : "skriv";
    aterRef.current = null;
    // "springer" + "snabbt": fortsättningen på en fras tar källan från början av frasen.
    const nya = [...ord, { t: w, k: kalla }];
    satt(nya, "");
    if (kalla !== "skriv") return;
    const fore = tillText(nya).trim();
    const svar = kollaOrd(fore, w, behallRef.current);
    if (svar.typ === "forslag") {
      setForslag({ token: w, text: svar.text, forslag: svar.forslag });
      setBehover(null);
      rostKo.lasUpp(`${svar.text}`);
      return;
    }
    if (svar.typ === "okand") {
      puffa(fyll(UI.puffar.agg ?? "", { ord: w }));
      ljud.puff();
      return;
    }
    const b = meningsbrickor(platta(nya), { sammansatt }).at(-1);
    if (b && b.guld && b.id) {
      ljud.guld();
      const o = useMinne.getState().funna[b.id];
      const fritt = b.lex === "ord" && !o && arSkrivord(b.id);
      if (fritt) puffa(fyll(UI.puffar.skrivord ?? "", { ord: w }));
    }
  }

  function skrivTecken(bit: string) {
    setBokOpp(true);
    ljud.lasOpp();
    setSistaTangent(Date.now());
    const s = spokRef.current;
    if (s) {
      const steg = skrivGuldTecken(s, bit);
      if (steg.buf === s.buf) return void setSpok(steg);
      ljud.pling();
      if (bit !== " ") sagBokstav(bit);
      if (steg.buf !== s.ord) return void setSpok(steg);
      // Guldchansen klar: kortordet blir barnets eget guldord.
      const { ord, skriv } = nu();
      const ny = ord.map((o, i) => (i >= s.tokenI && i < s.tokenI + s.ord.split(" ").length ? { ...o, k: "skriv" as const } : o));
      satt(ny, skriv);
      setSpok(null);
      ljud.guld();
      puffa(fyll(UI.puffar.guldord ?? "", { ord: s.ord }));
      return;
    }
    if (bit === " ") {
      ljud.pling();
      avslutaOrd();
      return;
    }
    const b = bokstav(bit);
    if (!b) return;
    ljud.pling();
    sagBokstav(b);
    setVy("skriv");
    const { ord, skriv } = nu();
    satt(ord, `${skriv}${b}`.slice(0, 40));
  }

  function sudda() {
    setSistaTangent(Date.now());
    const s = spokRef.current;
    if (s) return void setSpok({ ...s, buf: s.buf.slice(0, -1) });
    const { ord, skriv } = nu();
    if (skriv) return satt(ord, skriv.slice(0, -1));
    const sista = ord.at(-1);
    if (!sista) return;
    // Är skrivbrickan tom flyttas sista ordet tillbaka in i den, så att barnet kan rätta det.
    aterRef.current = sista;
    satt(ord.slice(0, -1), sista.t);
  }

  /** Hjälpkort (Ordhjälpen): sätts in där grammatiken säger, eller ersätter det påbörjade ordet (prefixhjälpen). */
  function laggHjalpKort(kort: HyllKort) {
    ljud.lasOpp();
    ljud.pling();
    const { ord, skriv } = nu();
    useMinne.getState().anvandKort(kort.id);
    let res: { ord: MOrd[]; ny: number | null; bojda: number[]; bort: boolean };
    if (skriv.trim()) {
      const genus = meningensGenus(ord);
      const t = kort.slot === "vad" ? kort.visa : kort.bojning ? kort.bojning[genus] : kort.visa;
      res = { ord: [...ord, ...t.split(" ").map((x) => ({ t: x, k: "kort" as const }))], ny: ord.length, bojda: [], bort: false };
    } else res = laggKort(ord, kort, opts);
    satt(res.ord, "");
    setRorelse({ ny: res.ny, bojda: res.bojda, id: Date.now() });
    if (res.bort) return;
    const ny = res.ny != null ? res.ord.slice(res.ny).map((o) => o.t) : [];
    rostKo.lasUpp(kort.slot === "vad" && kort.genus ? `${kort.genus} ${kort.visa}` : ny.join(" ") || kort.visa);
    const gang = useMinne.getState().kortGang[kort.id] ?? 0;
    setErbjud(gang >= 3 && !arGuld(res.ord, kort) ? kort : null);
  }

  /** Bakåtkompatibelt: trollApi.kort(id) och äldre anrop väljer ett ord ur ord.json. */
  function valjKort(o: Ord) {
    const k = hylla("djur").concat(hylla("bygg")).flatMap((s) => s.kort).find((x) => x.id === o.id);
    if (k) laggHjalpKort(k);
  }

  function taBortBricka(b: number) {
    const { ord, skriv } = nu();
    satt(taBort(ord, b, opts), skriv);
  }

  function valjForslag(f: ForslagKort) {
    if (!forslag) return;
    rostKo.handling();
    const { ord, skriv } = nu();
    const ny = ord.map((o) => (o.t.toLocaleLowerCase("sv") === forslag.token.toLocaleLowerCase("sv") ? { t: f.visa, k: "kort" as const } : o));
    setForslag(null);
    satt(ny, skriv);
    rostKo.lasUpp(f.visa);
  }

  function nejForslag() {
    if (!forslag) return;
    const token = forslag.token;
    useMinne.getState().sparaOkanda([token]);
    behallRef.current = [...behallRef.current, token.toLocaleLowerCase("sv")];
    setForslag(null);
    setVer((v) => v + 1);
    puffa(fyll(UI.puffar.agg ?? "", { ord: token }));
    ljud.puff();
  }

  function rattaBojning(i: number, ratt: string) {
    const { ord, skriv } = nu();
    satt(rattaBoj(ord, i, ratt), skriv);
    setRorelse({ ny: null, bojda: [i], id: Date.now() });
    rostKo.lasUpp(ratt);
  }

  /** Guldchansen: skriv ordet själv med spökbokstäver, så blir kortet ett guldord. */
  function startaGuld(kort: HyllKort) {
    const { ord } = nu();
    const br = meningsbrickor(ord, opts);
    const b = br.find((x) => x.id === kort.id);
    if (!b) return;
    setErbjud(null);
    setVy("skriv");
    setSpok({ ord: b.t.toLocaleLowerCase("sv"), tokenI: b.i, buf: "", fel: 0 });
    setSistaTangent(Date.now());
    rostKo.lasUpp(fyll((uiJson as { rost: Record<string, string> }).rost.guldchans_start ?? "", { ord: b.t }));
  }
  function avbrytGuld() {
    spokRef.current = null;
    setSpok(null);
  }

  /** Trolla: meningen går till samma motor som förut (useSkapa.utfor). Guld bara för ord som barnet skrev. */
  function trolla(): "ok" | "fraga" | "tom" {
    if (spokRef.current) setSpok(null);
    if (nu().skriv.trim()) avslutaOrd();
    const { ord } = nu();
    const br = meningsbrickor(ord, { ...opts, fragaToken: forslagRef.current?.token ?? null });
    if (oppenFraga(br) || forslagRef.current) {
      puffa(UI.puffar.svara_forst ?? "");
      return "fraga";
    }
    const innehall = br.filter((b) => b.klass !== "smaord" && b.klass !== "vantar");
    if (!innehall.length) {
      puffa(UI.puffar.valj_forst ?? "");
      return "tom";
    }
    const hand = innehall.some((b) => b.kalla === "skriv");
    handRef.current = hand;
    setHand(hand);
    const inteGuld = innehall.filter((b) => !b.guld && b.id).map((b) => b.id!);
    tomAngra();
    setErbjud(null);
    rostKo.handling();
    const fore = useMinne.getState();
    const nycklar = new Set([...fore.ang.map((a) => a.uid), ...fore.garden.map((g) => g.uid)]);
    tystaBannrar(true);
    try {
      utfor(textRef.current, { hand, inteGuld, behall: behallRef.current });
    } finally {
      tystaBannrar(false);
    }
    const efter = useMinne.getState();
    const ny = [...efter.ang.map((a) => a.uid), ...efter.garden.map((g) => g.uid)].some((u) => !nycklar.has(u));
    const andrat = efter.ang.some((a) => fore.ang.find((x) => x.uid === a.uid)?.formel !== a.formel && nycklar.has(a.uid));
    if (ny || andrat) {
      const kv = innehall.length ? br.filter((b) => b.klass !== "vantar").map((b) => ({ t: b.t, guld: b.guld })) : [];
      useKvitto.getState().satt({ id: Date.now(), ord: kv, stj: Math.max(0, efter.stjarnor - fore.stjarnor), guld: innehall.filter((b) => b.guld).length, tack: tackFor(fore.onskan, efter.onskan) });
    }
    return "ok";
  }
  const vaknaNu = () => void trolla();

  function fyllExempel(ex: string) {
    ljud.lasOpp();
    rostKo.handling();
    ljud.pling();
    const d = delaText(ex.endsWith(" ") || !ex ? ex : `${ex} `);
    const ord = d.ord.map((t) => ({ t, k: "kort" as const }));
    satt(ord, d.skriv);
    setHand(false);
    handRef.current = false;
    setForslag(null);
    setBehover(null);
  }

  /** Hela texten på en gång som om barnet skrivit den (det dolda inmatningsfältet, prov). */
  function skrivText(t: string) {
    const d = delaText(bokstav(t));
    satt(d.ord.map((x) => ({ t: x, k: "skriv" as const })), d.skriv);
    setForslag(null);
    setBehover(null);
  }

  function byggFras(fras: string) {
    ljud.lasOpp();
    ljud.pling();
    setByggPuff(null);
    tomAngra();
    textRef.current = fras;
    setText(fras);
    setForslag(null);
    setBehover(null);
    utfor(fras, { hand: true });
  }

  function vackIde(ex: string) {
    ljud.lasOpp();
    ljud.pling();
    tomAngra();
    textRef.current = ex;
    setText(ex);
    setForslag(null);
    setBehover(null);
    setVal({});
    utfor(ex, { hand: true });
  }

  useEffect(() => {
    if (forslag || behover || gavaTill || onskaOpp) setBokOpp(true);
  }, [forslag, behover, gavaTill, onskaOpp, setBokOpp]);

  useEffect(() => { if (!bokOpp) { setGavaTill(null); gavaRef.current = null; setSpok(null); setErbjud(null); } }, [bokOpp, gavaRef, setGavaTill]); // R9H: gåvoläget är aldrig klistrigt

  useSkrivTangentbord(k.t, { nu: () => nu().skriv, avslutaOrd, trolla, sudda, skrivTecken, bokOppRef });


  // Bakåtkompatibla namn (trollApi, rundornas prov).
  const oppnaSkrivMig = (o: Ord) => {
    const k = hylla("djur").flatMap((s) => s.kort).find((x) => x.id === o.id);
    if (k) startaGuld(k);
  };

  return {
    byggFras, vaknaNu, trolla, skrivTecken, sudda, avslutaOrd, valjKort, laggHjalpKort, taBortBricka, oppnaSkrivMig,
    valjForslag, nejForslag, rattaBojning, fyllExempel, skrivText, vackIde, angraMening, kanAngra, startaGuld, avbrytGuld,
    remsa, vy, setVy, puff, puffa, spok, erbjud, setErbjud, rorelse, sistaTangent,
  };
}

export type Skriv = ReturnType<typeof useSkriv>;
