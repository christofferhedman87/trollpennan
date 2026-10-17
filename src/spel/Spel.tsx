import { useDialogFokus } from "./dialogFokus";
import upplevelse from "../../data/upplevelse.json";
import { LagringsInfo } from "./LagringsInfo";
import { Heart, Lock, Pencil } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import byggSidorJson from "../../data/byggsidor.json" with { type: "json" };
import firandeJson from "../../data/firande.json" with { type: "json" };
import ledJson from "../../data/ledtradar.json" with { type: "json" };
import ljudJson from "../../data/ljud.json" with { type: "json" };
import sidorJson from "../../data/sidor.json" with { type: "json" };
import texterJson from "../../data/texter-gard.json" with { type: "json" };
import introJson from "../../data/intro.json" with { type: "json" };
import { arSparrat } from "@/tolk/sparr.ts";
import { hemligaKvar, ordLista, tolka } from "@/tolk/tolka.ts";
import type { ForslagKort, Ord, Utfall } from "@/tolk/typer.ts";
import { BYGG, byggMedId, formelBygg, materialMed, tolkaBygg, type ByggeTolk } from "@/tolk/byggtolk.ts";
import { bestamdHem, franTolk, ledigPlats } from "./bygge.ts";
import { brygga, type Handelse, type Sparad } from "./brygga.ts";
import { fyll } from "./fyll.ts";
import { FormelBild } from "./formel.tsx";
import { Angen3D } from "./angen3d.tsx";
import { ritaDjur } from "./billboard.ts";
import { Intro } from "./intro.tsx";
import { sagaNu } from "./saga.ts";
import { ljud } from "./ljud.ts";
import { useMinne, type Lage, type OnskaSpar } from "./minne.ts";
import { byggTraff, geTraff, kompisTraff, nastanRad, ONSK, ONSK_BYGG, tillaggFras, valjDjurOnska } from "./onska.ts";
import { replik } from "./replik.ts";
import { avBro, type AvHandelse } from "./avbro.ts";
import { AlbumVy, ForalderLiv } from "./samling.tsx";
import {
  ALBUM,
  BYGG_ORD,
  DYGN,
  HUMOR,
  HUMOR_IKON,
  MOSSA,
  arSammansatt,
  framDygn,
  geEgenGava,
  geHjarta,
  hoppaDag,
  hoppaKvall,
  inbjudanAv,
  komIhagDjur,
  kvallStyrka,
  mossaHand,
  noteraSkriv,
  nyttLiv,
  oppnaMossaLista,
  poangAv,
  replikHumor,
  sparaFoto,
  sovText,
  synkaVisning,
  taggarFor,
  tickLiv,
  ugglaRad,
  vackRad,
  visningsTid,
  fasAv,
} from "./liv.ts";
import { tolkaGava } from "@/tolk/gavotolk.ts";
import { harTagg, omradeMed, OMR, TEXTER_AV, UPP, VILDA, passarDjur } from "./aventyr.ts";
import {
  allaMina,
  djurSomKan,
  forsokOn,
  forsokPlats,
  foljeNu,
  geGavor,
  lasSkylt,
  oppnaBro,
  oppnaMed,
  oppnaOn,
  plockaSkatt,
  skickaDjur,
  startaForPlats,
  type FlodeSvar,
  type Vantar,
} from "./avflode.ts";

type Slot = "djur" | "farg" | "storlek" | "monster" | "formaga" | "tillbehor";
type Val = Partial<Record<Slot, Ord>>;
type Banner = { id: number; text: string; slag: "okand" | "sparr" | "ovr" | "sov" };
type Bubbla = { id: number; text: string; x: number; y: number; hjarta: boolean; ovan?: boolean };
type Forslag = { token: string; text: string; forslag: ForslagKort[] };
type VisKort = { slag: "djur"; spec: Sparad } | { slag: "bygg"; formel: string } | null;
type Varld = "ang" | "gard";
type KopFraga = { slag: "djur" | "bygg"; id: string; titel: string; pris: number };

type SidaDjur = { id: string; titel: string; ord: string[]; prova: string[]; oppnas: string };
type SidaBygg = {
  id: string;
  titel: string;
  kostnad: number;
  beskrivning: string;
  exempel: string;
  ord: string[];
  material: string[];
};
type Led = { gata: string; forsta: string; langd: number };

const SIDOR = sidorJson as {
  ekonomi: { kostnad_i_kopordning: number[] };
  sidor: SidaDjur[];
};
const BYGGSIDOR = byggSidorJson as {
  sidor: SidaBygg[];
  last_ord: { text: string[] };
};
const TEXTER = texterJson as {
  flikar: { angen: string; garden: string; byggboken: string };
  forsta_besok: string[];
  penna_bygg: { placeholder: string; knapp: string };
  bygg_nagot: string;
  byggt: string[];
  meny: { flytta: string; bygg_om: string; lada: string; bo: string };
  flytta_hjalp: string;
  bygg_om_hjalp: string;
  lada: { rubrik: string; tom: string; ta_fram: string; full: string };
  bo: { valj: string; flyttar_in: string[]; full: string; passar_inte: string; ingen: string };
  backup: {
    rubrik: string;
    spara: string;
    spara_hjalp: string;
    las_in: string;
    las_in_fraga: string;
    las_in_ja: string;
    las_in_nej: string;
    klart: string;
    fel: string;
  };
  borja_om: { knapp: string; fraga: string; ja: string };
  klapp: { en: string[]; mer: string[] };
  demo: { senare: string };
};
const FIR = firandeJson as {
  guldord: { text: string[]; stjarnor: number };
  hemligt_ord: { text: string[]; stjarnor: number };
  framsteg: { text: string; kort: string };
  stjarnor: { fa: string; fa_en: string; har: string; kop: string; kop_ja: string; kop_nej: string; for_fa: string };
  ny_sida: { text: string };
  sida_klar: { text: string; stjarnor: number };
  bok_klar: { text: string };
  onskan: { knapp: string; inte_nu: string; rubrik: string; led: string; onskar: string; andra: string; kompis: string };
};
const LED = (ledJson as { ledtradar: Record<string, Led> }).ledtradar;
const LJUD_KNAPP = (ljudJson as { foralder: { knapp: string } }).foralder.knapp;
const [LJUD_PA, LJUD_AV_ORD] = LJUD_KNAPP.split(" / ");
const LJUD_AV = `${LJUD_PA?.split(":")[0] ?? "Ljud"}: ${LJUD_AV_ORD ?? "av"}`;

const FLIKAR: { id: Slot; namn: string }[] = [
  { id: "djur", namn: "Djur" },
  { id: "farg", namn: "Färg" },
  { id: "storlek", namn: "Storlek" },
  { id: "monster", namn: "Mönster" },
  { id: "formaga", namn: "Kan" },
  { id: "tillbehor", namn: "Har" },
];

const RADER = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "å"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ö", "ä"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

function dukStil(x: number, y: number): { left: string; top: string } {
  const nx = Number.isFinite(x) ? x : 0.5;
  const ny = Number.isFinite(y) ? y : 0.4;
  return {
    left: `calc((var(--duk-x) + ${nx} * var(--duk-w)) * 100%)`,
    top: `calc((var(--duk-y) + ${ny} * var(--duk-h)) * 100%)`,
  };
}

/** Skärmpunkt från 3D-djuret, i samma 0–1 som dukStil. */
function malTillDuk(uid: string): { x: number; y: number } | null {
  const mal = window.__tredMal?.[uid];
  const ang = document.querySelector(".ang");
  if (!mal || !(ang instanceof HTMLElement)) return null;
  const arect = ang.getBoundingClientRect();
  const nx = (mal.x - arect.left) / Math.max(1, arect.width);
  const ny = (mal.y - arect.top) / Math.max(1, arect.height);
  const stil = getComputedStyle(ang);
  const dukX = Number.parseFloat(stil.getPropertyValue("--duk-x")) || 0;
  const dukY = Number.parseFloat(stil.getPropertyValue("--duk-y")) || 0;
  const dukW = Number.parseFloat(stil.getPropertyValue("--duk-w")) || 1;
  const dukH = Number.parseFloat(stil.getPropertyValue("--duk-h")) || 1;
  return { x: (nx - dukX) / dukW, y: (ny - dukY) / dukH };
}

let idNr = 1;
function nyId() {
  idNr += 1;
  return idNr;
}

function bestamdAv(kropp: string, stor: boolean): string {
  const ord = ordLista().find((o) => o.id === kropp);
  const form = ord?.former?.[1] ?? kropp;
  if (!stor) return form;
  return form.charAt(0).toLocaleUpperCase("sv") + form.slice(1);
}

function OnskaAnsikte({ djur }: { djur: Sparad }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let stopp = false;
    ritaDjur(djur).then((bild) => {
      const duk = ref.current;
      if (stopp || !bild || !duk) return;
      const ctx = duk.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, duk.width, duk.height);
      const s = Math.min(duk.width / bild.width, duk.height / bild.height);
      const w = bild.width * s;
      const h = bild.height * s;
      ctx.drawImage(bild, (duk.width - w) / 2, (duk.height - h) / 2, w, h);
    });
    return () => {
      stopp = true;
    };
  }, [djur.uid, djur.formel]);
  return <canvas ref={ref} className="onska-ansikte" width={144} height={144} data-testid="onska-ansikte" aria-hidden />;
}

function kanEtikett(o: Ord): string {
  if (o.klass !== "formaga" || o.ordklass === "adjektiv" || o.efter === "med") return o.visa;
  const led = o.fras?.[0] ?? o.former;
  const inf = led.find((f) => f.length > 2 && f.endsWith("a") && !f.endsWith("ande"));
  const huvud = o.visa.split(" ")[0] ?? "";
  if (!inf || !huvud.endsWith("r")) return o.visa;
  const rest = o.visa.slice(huvud.length).trim();
  return rest ? `${inf} ${rest}` : inf;
}

const KORT_IKON: Record<string, string> = {
  kanin: "kanin",
  katt: "katt",
  kattunge: "katt",
  kisse: "katt",
  hund: "hund",
  valp: "hund",
  vovve: "hund",
  drake: "drake",
  häst: "hast",
  ponny: "hast",
  föl: "hast",
  fågel: "fagel",
  fisk: "fisk",
  groda: "groda",
  padda: "groda",
  gris: "gris",
  nöff: "gris",
  nasse: "gris",
  kulting: "gris",
  dinosaurie: "dinosaurie",
  dino: "dinosaurie",
  uggla: "uggla",
  ekorre: "ekorre",
  bäver: "baver",
  haj: "haj",
  enhörning: "hast",
};

function kortIkon(id: string) {
  const mapp = KORT_IKON[id];
  return mapp ? `/kit/kroppar/${mapp}/bas.png` : null;
}

function meningAv(val: Val): string {
  const delar: string[] = [];
  if (val.storlek) delar.push(val.storlek.visa);
  if (val.farg) delar.push(val.farg.visa);
  if (val.monster && val.monster.efter !== "med") delar.push(val.monster.visa);
  if (val.djur) delar.push(val.djur.visa);
  const med: string[] = [];
  if (val.monster?.efter === "med") med.push(val.monster.visa);
  if (val.tillbehor) med.push(val.tillbehor.visa);
  if (med.length) delar.push("med", med.join(" och "));
  if (val.formaga) delar.push("som", val.formaga.visa);
  return delar.join(" ");
}

function normFras(s: string) {
  return ` ${s.toLocaleLowerCase("sv").replace(/[^a-zåäö0-9 ]+/gi, " ").replace(/\s+/g, " ").trim()} `;
}

function exempelFor(o: OnskaSpar): string[] {
  if (o.kalla === "bygg") return ONSK_BYGG.onskningar.find((x) => x.id === o.id)?.exempel ?? [];
  return ONSK.onskningar.find((x) => x.id === o.id)?.exempel ?? [];
}

function kortForExempel(exempel: string[], ord: Ord[]): Ord[] {
  const hay = exempel.map(normFras);
  return ord.filter((o) => {
    if (o.niva !== "kort" || !FLIKAR.some((f) => f.id === o.klass)) return false;
    const vis = normFras(o.visa).trim();
    if (vis.length < 2) return false;
    return hay.some((h) => h.includes(` ${vis} `));
  });
}

function bastaFlik(traff: Ord[]): Slot {
  const rakna = new Map<Slot, number>();
  for (const o of traff) {
    const k = o.klass as Slot;
    rakna.set(k, (rakna.get(k) ?? 0) + 1);
  }
  let bast: Slot = "djur";
  let n = 0;
  for (const [k, v] of rakna) {
    if (v > n) {
      bast = k;
      n = v;
    }
  }
  return bast;
}

/** Liten bubbla bredvid huvudet, inte på kroppen. */
function onskaAnkare(x: number, topp: number): { x: number; y: number; vanster: boolean } {
  const vanster = x >= 0.42;
  const ax = vanster ? Math.max(0.22, Math.min(0.78, x - 0.02)) : Math.min(0.78, Math.max(0.22, x + 0.02));
  const ay = Math.max(0.38, Math.min(0.62, topp + 0.06));
  return { x: ax, y: ay, vanster };
}

function bokstav(s: string) {
  return s.replace(/[^a-zA-ZåäöÅÄÖ ]/g, "").slice(0, 80);
}

function bytOrd(text: string, fran: string, till: string) {
  const delar = text.split(" ");
  const i = delar.findIndex((d) => d.toLocaleLowerCase("sv") === fran.toLocaleLowerCase("sv"));
  if (i < 0) return text;
  delar[i] = till;
  return delar.join(" ");
}

function taBortOrd(text: string, fran: string) {
  const delar = text.split(" ");
  const i = delar.findIndex((d) => d.toLocaleLowerCase("sv") === fran.toLocaleLowerCase("sv"));
  if (i < 0) return text.trim();
  delar.splice(i, 1);
  return delar.join(" ").replace(/\s+/g, " ").trim();
}

function utanSparratSuffix(text: string): { text: string; traff: boolean } {
  if (!/\s$/.test(text)) return { text, traff: false };
  const ord = text.trim().split(/\s+/).filter(Boolean);
  const max = Math.min(4, ord.length);
  for (let n = 1; n <= max; n++) {
    const suffix = ord.slice(ord.length - n).join(" ");
    if (arSparrat(suffix)) {
      const kvar = ord.slice(0, -n).join(" ");
      return { text: kvar ? `${kvar} ` : "", traff: true };
    }
  }
  return { text, traff: false };
}

function djurPris(antal: number) {
  const lista = SIDOR.ekonomi.kostnad_i_kopordning;
  return lista[Math.min(antal, lista.length - 1)] ?? 15;
}

function ordVis(id: string) {
  return ordLista().find((o) => o.id === id)?.visa ?? id;
}

function streck(id: string, funnen: boolean) {
  const visa = ordVis(id);
  const led = LED[id];
  if (funnen) return { ord: visa, gata: led?.gata ?? "" };
  if (!led) {
    const rest = Math.max(0, [...visa].length - 1);
    return {
      ord: `${visa.slice(0, 1).toLocaleUpperCase("sv")} ${Array.from({ length: rest }, () => "_").join(" ")}`.trim(),
      gata: "",
    };
  }
  const rest = Math.max(0, led.langd - 1);
  return { ord: `${led.forsta} ${Array.from({ length: rest }, () => "_").join(" ")}`.trim(), gata: led.gata };
}

function lastBygge(b: ByggeTolk, agda: string[]): { ord: string; sidaId: string; titel: string; pris: number } | null {
  const sidaAv = (id: string) => BYGGSIDOR.sidor.find((s) => s.id === id);
  if (!agda.includes(b.sida)) {
    const sida = sidaAv(b.sida);
    return { ord: b.ord, sidaId: b.sida, titel: sida?.titel ?? b.sida, pris: sida?.kostnad ?? 0 };
  }
  if (b.material) {
    const m = materialMed(b.material);
    if (m && !agda.includes(m.sida)) {
      const sida = sidaAv(m.sida);
      return { ord: b.ord, sidaId: m.sida, titel: sida?.titel ?? m.sida, pris: sida?.kostnad ?? 0 };
    }
  }
  return null;
}

function frasForByggOrd(id: string): string {
  const bo = BYGG.bygg_ord.find((b) => b.id === id);
  if (!bo) return id;
  return `${bo.genus} ${bo.former[0]}`;
}

function arKopia(v: unknown): v is Record<string, unknown> {
  if (!v || typeof v !== "object") return false;
  const o = v as { version?: unknown; ang?: unknown; garden?: unknown; stjarnor?: unknown };
  return o.version === 2 && Array.isArray(o.ang) && Array.isArray(o.garden) && typeof o.stjarnor === "number";
}

function exportera() {
  const s = useMinne.getState();
  return {
    version: 2 as const,
    startLage: s.startLage,
    funna: s.funna,
    kortGang: s.kortGang,
    onskelista: s.onskelista,
    sovande: s.sovande,
    formler: s.formler,
    ang: s.ang,
    stjarnor: s.stjarnor,
    ljudPa: s.ljudPa,
    koptaSidor: s.koptaSidor,
    byggSidor: s.byggSidor,
    snart: s.snart,
    garden: s.garden,
    lada: s.lada,
    hemma: s.hemma,
    onskan: s.onskan,
    seddOnska: s.seddOnska,
    sidaKlar: s.sidaKlar,
    forstaGard: s.forstaGard,
    onskaVid: s.onskaVid,
    oppna: s.oppna,
    foljeUid: s.foljeUid,
    hjartan: s.hjartan,
    van: s.van,
    uppdrag: s.uppdrag,
    fyr: s.fyr,
    forstaKarta: s.forstaKarta,
    klarOmraden: s.klarOmraden,
    dygnMs: s.dygnMs,
    liv: s.liv,
    albumKropp: s.albumKropp,
    foton: s.foton,
    seddaNiva: s.seddaNiva,
    mossaLista: s.mossaLista,
    mossaDag: s.mossaDag,
    mossaExtra: s.mossaExtra,
    mossaRakn: s.mossaRakn,
    ordFrek: s.ordFrek,
    onskanAntal: s.onskanAntal,
    skatterHitta: s.skatterHitta,
    byggda: s.byggda,
    introSedd: s.introSedd,
    dragit: s.dragit,
  };
}

export function Spel() {
  useDialogFokus();
  const [text, setText] = useState("");
  const [lage, setLage] = useState<Lage>(() => useMinne.getState().startLage);
  const [flik, setFlik] = useState<Slot>("djur");
  const [val, setVal] = useState<Val>({});
  const [hand, setHand] = useState(false);
  const [forslag, setForslag] = useState<Forslag | null>(null);
  const [behover, setBehover] = useState<{ text: string; djur: { id: string; visa: string }[] } | null>(null);
  const [bubblor, setBubblor] = useState<Bubbla[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [visKort, setVisKort] = useState<VisKort>(null);
  const [ordbok, setOrdbok] = useState(false);
  const [foralder, setForalder] = useState(false);
  const [natt, setNatt] = useState(0);
  const [albumOpp, setAlbumOpp] = useState(false);
  const [mossaOpp, setMossaOpp] = useState(false);
  const [halsning, setHalsning] = useState("");
  const [fotoMal, setFotoMal] = useState<{ uid: string; x: number; y: number } | null>(null);
  const [haller, setHaller] = useState(false);
  const [bokOpp, setBokOpp] = useState(false);
  const [menyOpp, setMenyOpp] = useState(false);
  const [intro, setIntro] = useState(true);
  const [introNy, setIntroNy] = useState(0);
  const [saker, setSaker] = useState(false);
  const [menySaker, setMenySaker] = useState(false);
  const [senare, setSenare] = useState(false);
  const [varld, setVarld] = useState<Varld>("ang");
  const [panel, setPanel] = useState<"spel" | "byggbok" | "uppdrag">("spel");
  const [meny, setMeny] = useState<{ uid: string; x: number; y: number } | null>(null);
  const [boUid, setBoUid] = useState<string | null>(null);
  const [ladaOpp, setLadaOpp] = useState(false);
  const [byggSidaId, setByggSidaId] = useState("start");
  const [byggPuff, setByggPuff] = useState<string | null>(null);
  const [sidOpp, setSidOpp] = useState<string | null>(null);
  const [kop, setKop] = useState<KopFraga | null>(null);
  const [kopRad, setKopRad] = useState<string | null>(null);
  const [onskaOpp, setOnskaOpp] = useState(false);
  const [onskaPos, setOnskaPos] = useState({ x: 0.5, y: 0.16 });
  const [onskaSyns, setOnskaSyns] = useState(false);
  const [foralderRad, setForalderRad] = useState<string | null>(null);
  const [kopia, setKopia] = useState<unknown>(null);
  const [kartaOpp, setKartaOpp] = useState(false);
  const [forstaRad, setForstaRad] = useState<string[] | null>(null);
  const [kartaText, setKartaText] = useState<string | null>(null);
  const [omrade, setOmrade] = useState<string | null>(null);
  const [gavaTill, setGavaTill] = useState<string | null>(null);
  const [skylt, setSkylt] = useState<{ text: string; nytt: string | null } | null>(null);
  const [valj, setValj] = useState<{ rubrik: string; eller?: string; djur: Sparad[]; nyckel: string } | null>(null);
  const [uppFlik, setUppFlik] = useState<"pagar" | "klar">("pagar");
  const [skriverAv, setSkriverAv] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const angRef = useRef<HTMLElement>(null);
  const filRef = useRef<HTMLInputElement>(null);
  const textRef = useRef(text);
  const handRef = useRef(hand);
  const overlayRef = useRef(false);
  const varldRef = useRef<Varld>("ang");
  const onskaSkrivRef = useRef(false);
  const omUidRef = useRef<string | null>(null);
  const omradeRef = useRef<string | null>(null);
  const gavaRef = useRef<string | null>(null);
  const vantarRef = useRef<Vantar | null>(null);
  const valjKor = useRef<(d: Sparad) => void>(() => undefined);
  const avHand = useRef<(h: AvHandelse) => void>(() => undefined);
  const nastanRef = useRef(0);
  const paHandelse = useRef<(h: Handelse) => void>(() => undefined);
  const visaOnskaRef = useRef<() => void>(() => undefined);
  const bannerKo = useRef<Banner[]>([]);
  const bannerSyns = useRef(false);
  const bannerTimer = useRef<number | null>(null);
  textRef.current = text;
  handRef.current = hand;
  useLayoutEffect(() => {
    if (useMinne.getState().introSedd) setIntro(false);
  }, []);
  useEffect(() => {
    return () => {
      if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    };
  }, []);
  gavaRef.current = gavaTill;
  overlayRef.current = ordbok || foralder || !!visKort || !!kop || kopia != null || kartaOpp || !!omrade || !!valj || !!skylt || !!gavaTill || panel === "uppdrag" || albumOpp || mossaOpp;

  const funna = useMinne((s) => s.funna);
  const kortGang = useMinne((s) => s.kortGang);
  const startLage = useMinne((s) => s.startLage);
  const onskelista = useMinne((s) => s.onskelista);
  const sovande = useMinne((s) => s.sovande);
  const formler = useMinne((s) => s.formler);
  const stjarnor = useMinne((s) => s.stjarnor);
  const onskan = useMinne((s) => s.onskan);
  const koptaSidor = useMinne((s) => s.koptaSidor);
  const byggSidor = useMinne((s) => s.byggSidor);
  const garden = useMinne((s) => s.garden);
  const lada = useMinne((s) => s.lada);
  const ang = useMinne((s) => s.ang);
  const hemma = useMinne((s) => s.hemma);
  const ljudPa = useMinne((s) => s.ljudPa);
  const uppdragSpar = useMinne((s) => s.uppdrag);
  const oppna = useMinne((s) => s.oppna);
  const mossaLista = useMinne((s) => s.mossaLista);
  const mossaExtra = useMinne((s) => s.mossaExtra);
  const liv = useMinne((s) => s.liv);

  const allaOrd = ordLista();
  const totalOrd = allaOrd.filter((o) => o.niva === "fritt" || o.niva === "kort").length;
  const hittatAntal = allaOrd.filter((o) => funna[o.id] && (o.niva === "fritt" || o.niva === "kort")).length;

  function visaNastaBanner() {
    const next = bannerKo.current.shift();
    if (!next) {
      bannerSyns.current = false;
      setBanners([]);
      return;
    }
    bannerSyns.current = true;
    setBanners([next]);
    bannerTimer.current = window.setTimeout(() => {
      setBanners([]);
      bannerTimer.current = window.setTimeout(() => {
        bannerTimer.current = null;
        visaNastaBanner();
      }, 200);
    }, 2400);
  }

  function visaBanner(texten: string, slag: Banner["slag"]) {
    bannerKo.current.push({ id: nyId(), text: texten, slag });
    if (bannerSyns.current) return;
    visaNastaBanner();
  }

  function lasMeny() {
    setSenare(true);
    setMenySaker(false);
    requestAnimationFrame(() => {
      document.querySelector("[data-testid=demo-senare]")?.scrollIntoView({ block: "nearest" });
    });
  }

  function visaBubbla(texten: string, x: number, y: number, hjarta: boolean, ovan = false, ensam = false) {
    const id = nyId();
    setBubblor((prev) => {
      const start = ensam ? [] : prev;
      if (ovan) {
        const i3d = typeof document !== "undefined" && !!document.querySelector("[data-testid='angen-3d']");
        const xx = i3d ? Math.min(0.82, Math.max(0.18, x)) : Math.min(0.64, Math.max(0.36, x));
        const yy = i3d ? Math.min(0.78, Math.max(0.58, y)) : Math.max(0.48, Math.min(0.72, y));
        return [...start, { id, text: texten, x: xx, y: yy, hjarta, ovan: true }].slice(-2);
      }
      const hoger = start.some((a) => a.x > 0.5);
      const vanster = start.some((a) => a.x <= 0.5);
      let sida = x < 0.5 ? "h" : "v";
      if (sida === "h" && hoger && !vanster) sida = "v";
      if (sida === "v" && vanster && !hoger) sida = "h";
      const xx = sida === "h" ? 0.74 : 0.26;
      const yy = hoger && vanster ? 0.3 : 0.03;
      return [...start, { id, text: texten, x: xx, y: yy, hjarta, ovan: false }].slice(-2);
    });
    window.setTimeout(() => setBubblor((b) => b.filter((x) => x.id !== id)), 4200);
  }

  function visaVarld(p: Varld) {
    varldRef.current = p;
    setVarld(p);
    setPanel("spel");
    setMeny(null);
    if (!omradeRef.current) brygga.visa(p);
  }

  function lamnaAv() {
    omradeRef.current = null;
    setOmrade(null);
    synkaAv(null);
  }

  function synkaAv(plats: string | null) {
    const s = useMinne.getState();
    const folje = allaMina().find((d) => d.uid === s.foljeUid) ?? null;
    avBro.satt({
      plats,
      folje,
      van: s.van,
      uppdrag: s.uppdrag,
      fyr: s.fyr,
      on: plats === "on",
    });
    const game = (window as unknown as {
      __spel?: {
        scene: {
          sleep: (k: string) => void;
          wake: (k: string) => void;
          isSleeping: (k: string) => boolean;
          isActive: (k: string) => boolean;
          start: (k: string) => void;
        };
      };
    }).__spel;
    if (!game) return;
    if (plats) {
      game.scene.sleep("ang");
      game.scene.sleep("gard");
      if (game.scene.isSleeping("av")) game.scene.wake("av");
      else if (!game.scene.isActive("av")) game.scene.start("av");
    } else if (game.scene.isActive("av") || game.scene.isSleeping("av")) {
      game.scene.sleep("av");
      brygga.visa(varldRef.current);
    }
  }

  function belonaFlode(r: FlodeSvar) {
    for (const t of r.texter) if (t) visaBanner(t, "ovr");
    if (r.stj > 0) {
      useMinne.getState().geStjarnor(r.stj);
      ljud.stjarna();
      visaBanner(r.stj === 1 ? FIR.stjarnor.fa_en : fyll(FIR.stjarnor.fa, { n: r.stj }), "ovr");
    }
    if (r.hem && r.sparad) {
      setGavaTill(null);
      gavaRef.current = null;
      lamnaAv();
      visaVarld("ang");
      brygga.skapa(r.sparad, true);
      return;
    }
    if (omradeRef.current) synkaAv(omradeRef.current);
  }

  function visaMossa(h: Parameters<typeof mossaHand>[0]) {
    const r = mossaHand(h);
    for (const t of r.texter) if (t) visaBanner(t, "ovr");
    if (r.stj > 0) {
      useMinne.getState().geStjarnor(r.stj);
      ljud.stjarna();
      visaBanner(fyll(MOSSA.beloning.text, { n: r.stj }), "ovr");
    }
  }

  function bjud(slag: string, uid?: string) {
    const s = useMinne.getState();
    const djur = [...s.ang, ...s.hemma.map((x) => x.spec)];
    for (const d of djur) {
      if (uid && d.uid !== uid) continue;
      if (inbjudanAv(d.uid) !== slag) continue;
      geHjarta(d.uid);
      const tack = HUMOR.tack_text[Math.floor(Math.random() * HUMOR.tack_text.length)] ?? HUMOR.tack_text[0]!;
      const p = brygga.platser().find((x) => x.uid === d.uid);
      visaBubbla(tack, p?.x ?? 0.5, p?.topp ?? p?.y ?? 0.3, true, true);
    }
  }

  function gaIn(id: string) {
    setKartaOpp(false);
    setPanel("spel");
    setGavaTill(null);
    gavaRef.current = null;
    setSkriverAv(false);
    vantarRef.current = null;
    omradeRef.current = id;
    setOmrade(id);
    for (const t of startaForPlats(id)) visaBanner(t, "ovr");
    if (id === "grottan") {
      const inne = omradeMed("grottan")?.inne;
      const f = foljeNu();
      if (inne && f && harTagg(f, "lysa")) visaBanner(fyll(inne.klart, { djur: f.formel }), "ovr");
      else if (inne) visaBanner(inne.text, "ovr");
    }
    synkaAv(id);
    const folje = foljeNu();
    if (folje) {
      bjud("aventyr", folje.uid);
      visaMossa({ aventyr: true });
    }
  }

  function oppnaKarta() {
    setPanel("spel");
    setMeny(null);
    setKartaOpp(true);
    if (useMinne.getState().forstaKarta) {
      useMinne.getState().settKarta();
      setForstaRad([...TEXTER_AV.forsta_gangen]);
      for (const rad of TEXTER_AV.forsta_gangen) visaBanner(rad, "ovr");
    }
  }

  function tryckPlats(id: string) {
    if (id === "garden") {
      setKartaOpp(false);
      setKartaText(null);
      lamnaAv();
      valjVarld("gard");
      return;
    }
    const s = forsokPlats(id);
    if (s.typ === "nas") return;
    if (s.typ === "in") {
      gaIn(s.id);
      return;
    }
    if (s.typ === "bro") {
      oppnaBro(id);
      visaBanner(s.text, "ovr");
      gaIn(id);
      return;
    }
    if (s.typ === "inga") {
      visaBanner(s.text, "ovr");
      setKartaText(s.text);
      vantarRef.current = { slag: "oppna", omrade: id, taggar: s.taggar };
      setSkriverAv(true);
      setLage("skriv");
      setHand(true);
      setKartaOpp(false);
      setBokOpp(true);
      return;
    }
    const kan = s.taggar.map((t) => OMR.karta.kan_text[t] ?? t).join(" ");
    setKartaText(s.text);
    vantarRef.current = { slag: "oppna", omrade: id, taggar: s.taggar };
    valjKor.current = (d) => {
      setValj(null);
      vantarRef.current = null;
      setSkriverAv(false);
      visaBanner(oppnaMed(id, d), "ovr");
      gaIn(id);
    };
    setValj({ rubrik: fyll(OMR.karta.valj_djur, { kan }), eller: s.eller, djur: s.djur, nyckel: id });
  }

  function tryckOn() {
    const s = forsokOn();
    if (s.typ === "in") {
      gaIn("on");
      return;
    }
    if (s.typ === "inga") {
      visaBanner(s.text, "ovr");
      vantarRef.current = { slag: "del", taggar: s.taggar };
      setSkriverAv(true);
      setLage("skriv");
      setHand(true);
      setKartaOpp(false);
      setBokOpp(true);
      return;
    }
    if (s.typ !== "valj") return;
    const kan = s.taggar.map((t) => OMR.karta.kan_text[t] ?? t).join(" ");
    vantarRef.current = { slag: "del", taggar: s.taggar };
    valjKor.current = (d) => {
      setValj(null);
      vantarRef.current = null;
      setSkriverAv(false);
      visaBanner(oppnaOn(d), "ovr");
      gaIn("on");
    };
    setValj({ rubrik: fyll(OMR.karta.valj_djur, { kan }), eller: s.eller, djur: s.djur, nyckel: "on" });
  }

  function oppnaSkicka(uppId: string) {
    const tagg = UPP.uppdrag.find((u) => u.id === uppId)?.mal.skicka_tagg;
    if (!tagg || useMinne.getState().uppdrag[uppId] === "klar") return;
    if (!useMinne.getState().uppdrag[uppId]) useMinne.getState().sattUppdrag(uppId, "pagar");
    const lista = djurSomKan([tagg]);
    const kan = OMR.karta.kan_text[tagg] ?? tagg;
    if (!lista.length) {
      const text = fyll(OMR.karta.inget_djur, { kan });
      visaBanner(text, "ovr");
      vantarRef.current = { slag: "skicka", uppdrag: uppId, taggar: [tagg] };
      setSkriverAv(true);
      setLage("skriv");
      setHand(true);
      setKartaOpp(false);
      setBokOpp(true);
      return;
    }
    valjKor.current = (d) => {
      setValj(null);
      const r = skickaDjur(uppId, d);
      if (r) belonaFlode(r);
    };
    setValj({ rubrik: fyll(OMR.karta.valj_djur, { kan }), djur: lista, nyckel: uppId });
  }

  function bytFolje() {
    const djur = allaMina();
    valjKor.current = (d) => {
      setValj(null);
      useMinne.getState().sattFolje(d.uid);
      const o = omradeRef.current;
      if (o === "grottan") {
        const inne = omradeMed("grottan")?.inne;
        if (inne && harTagg(d, "lysa")) visaBanner(fyll(inne.klart, { djur: d.formel }), "ovr");
      }
      if (o) synkaAv(o);
      visaBanner(fyll(TEXTER_AV.foljeslagare.foljer, { djur: d.formel }), "ovr");
    };
    setValj({ rubrik: TEXTER_AV.foljeslagare.byt, djur, nyckel: "byt" });
  }

  function kanskeForstaGard() {
    if (!useMinne.getState().forstaGard) return;
    useMinne.getState().sattForsta();
    for (const rad of TEXTER.forsta_besok) visaBanner(rad, "ovr");
  }

  function oppnaBygglage() {
    setKartaOpp(false);
    setMenyOpp(false);
    setMeny(null);
    varldRef.current = "gard";
    setVarld("gard");
    if (omradeRef.current) lamnaAv();
    else brygga.visa("gard");
    setPanel("byggbok");
    setLage("kort");
    setForslag(null);
    setBehover(null);
    setBokOpp(true);
  }

  function stangBok() {
    const paGard = varldRef.current === "gard";
    setBokOpp(false);
    setPanel("spel");
    setByggPuff(null);
    stangOnska();
    if (paGard) kanskeForstaGard();
  }

  function visaPlatsRen(id: "ang" | "gard") {
    setKartaOpp(false);
    setMenyOpp(false);
    if (omradeRef.current) lamnaAv();
    setPanel("spel");
    visaVarld(id);
    setBokOpp(false);
    if (id === "gard") kanskeForstaGard();
  }

  function valjVarld(id: "ang" | "gard" | "byggbok") {
    setKartaOpp(false);
    setMenyOpp(false);
    if (id === "byggbok") {
      oppnaBygglage();
      return;
    }
    if (omradeRef.current) lamnaAv();
    if (id === "gard") {
      visaVarld("gard");
      setBokOpp(false);
      kanskeForstaGard();
      return;
    }
    visaVarld("ang");
    setBokOpp(false);
  }

  function kollaSidor() {
    const s = useMinne.getState();
    for (const sida of SIDOR.sidor) {
      if (!s.koptaSidor.includes(sida.id) || s.sidaKlar.includes(sida.id)) continue;
      if (!sida.ord.every((id) => s.funna[id])) continue;
      s.markeraSida(sida.id);
      s.geStjarnor(FIR.sida_klar.stjarnor);
      ljud.stjarna();
      visaBanner(fyll(FIR.sida_klar.text, { sida: sida.titel }), "ovr");
    }
    const fritt = ordLista().filter((o) => o.niva === "fritt");
    if (fritt.length && fritt.every((o) => useMinne.getState().funna[o.id]) && !useMinne.getState().sidaKlar.includes("bok")) {
      useMinne.getState().markeraSida("bok");
      visaBanner(FIR.bok_klar.text, "ovr");
    }
  }

  function belona(u: { funna: string[]; guld: string[] }, glitterUid?: string, firaguld = true) {
    const guldLista = firaguld ? u.guld : [];
    const innan = useMinne.getState().funna;
    const nyaGuld = guldLista.filter((id) => !innan[id]?.guld);
    const nyaHemliga = u.funna.filter((id) => !innan[id] && ordLista().find((o) => o.id === id)?.niva === "fritt");
    useMinne.getState().registrera(u.funna, guldLista);
    let stj = 0;
    if (nyaGuld.length) {
      stj += nyaGuld.length * FIR.guldord.stjarnor;
      visaBanner(fyll(FIR.guldord.text[0]!, { ord: ordVis(nyaGuld[0]!) }), "ovr");
      ljud.guld();
      if (glitterUid) brygga.glitter(glitterUid);
      visaMossa({ guld: nyaGuld.length });
    }
    if (nyaHemliga.length) {
      stj += nyaHemliga.length * FIR.hemligt_ord.stjarnor;
      visaBanner(fyll(FIR.hemligt_ord.text[0]!, { ord: ordVis(nyaHemliga[0]!) }), "ovr");
      visaMossa({ hemligt: nyaHemliga.length });
    }
    if (stj > 0) {
      useMinne.getState().geStjarnor(stj);
      ljud.stjarna();
      visaBanner(stj === 1 ? FIR.stjarnor.fa_en : fyll(FIR.stjarnor.fa, { n: stj }), "ovr");
    }
    kollaSidor();
  }

  function uppfyll(o: OnskaSpar, tack: string, stj: number, uid: string, x = 0.5, y = 0.35) {
    useMinne.getState().geStjarnor(stj);
    useMinne.getState().sattOnska(null);
    useMinne.setState({ onskanAntal: useMinne.getState().onskanAntal + 1 });
    useMinne.getState().noteraOnska();
    onskaSkrivRef.current = false;
    setOnskaOpp(false);
    setOnskaSyns(false);
    setBokOpp(false);
    ljud.uppfylld();
    ljud.stjarna();
    brygga.glad(uid);
    const p = brygga.platser().find((q) => q.uid === uid);
    visaBubbla(tack, p?.x ?? x, p?.topp ?? p?.y ?? y, false, true);
    visaBanner(stj === 1 ? FIR.stjarnor.fa_en : fyll(FIR.stjarnor.fa, { n: stj }), "ovr");
    visaMossa({ onskan: 1 });
  }

  function rensaSkriv() {
    setText("");
    textRef.current = "";
    setVal({});
    setHand(false);
    setForslag(null);
    setBehover(null);
  }

  function hanteraBygg(utfall: Extract<ReturnType<typeof tolkaBygg>, { typ: "bygge" }>) {
    useMinne.getState().sparaOkanda(utfall.okanda);
    const agda = useMinne.getState().byggSidor;
    const las = utfall.byggen.map((b) => lastBygge(b, agda)).filter((x) => x != null);
    if (las.length) {
      const x = las[0]!;
      const mall = BYGGSIDOR.last_ord.text[0] ?? "";
      const texten = fyll(mall, { ord: x.ord, sida: x.titel, n: x.pris });
      setByggPuff(texten);
      visaBubbla(texten, 0.5, 0.55, false, true, true);
      visaBanner(texten, "ovr");
      useMinne.getState().sparaSnart(x.sidaId, x.ord);
      setBokOpp(true);
      return;
    }
    const om = omUidRef.current;
    const behov = om ? Math.max(0, utfall.byggen.length - 1) : utfall.byggen.length;
    const lediga = BYGG.max_pa_garden - useMinne.getState().garden.length;
    if (behov > lediga) {
      visaBanner(TEXTER.lada.full, "ovr");
      return;
    }
    visaPlatsRen("gard");
    const redan = useMinne.getState().garden.map((p) => ({ x: p.x, y: p.y }));
    const gjorda = utfall.byggen.map((b) => {
      const pos = ledigPlats([...redan]);
      redan.push(pos);
      return franTolk(b, formelBygg(b), pos.x, pos.y);
    });
    if (om && gjorda[0]) {
      useMinne.getState().bytBygge(om, gjorda[0]);
      if (gjorda.length > 1) useMinne.getState().laggByggen(gjorda.slice(1));
      omUidRef.current = null;
    } else {
      useMinne.getState().laggByggen(gjorda);
    }
    const forsta = useMinne.getState().garden.find((g) => g.uid === gjorda[0]?.uid) ?? gjorda[0];
    if (forsta) {
      const rad = TEXTER.byggt[Math.floor(Math.random() * TEXTER.byggt.length)] ?? TEXTER.byggt[0]!;
      visaBubbla(fyll(rad, { formel: utfall.formel }), forsta.x, Math.max(0.12, forsta.y - 0.16), false, true, true);
      ljud.uppfylld();
    }
    setByggPuff(null);
    const aktiv = useMinne.getState().onskan;
    if (aktiv?.kalla === "bygg") {
      const ons = ONSK_BYGG.onskningar.find((o) => o.id === aktiv.id);
      const djur =
        useMinne.getState().ang.find((a) => a.uid === aktiv.uid) ??
        useMinne.getState().hemma.find((h) => h.spec.uid === aktiv.uid)?.spec;
      const traff = ons ? byggTraff(utfall.byggen, ons, djur?.kropp) : null;
      if (ons && traff) {
        const hem = useMinne.getState().garden.find((g) => gjorda.some((x) => x.uid === g.uid) && g.bygg === traff.bygg);
        let ok = true;
        if (ons.krav.hem_for_djuret && djur && hem) {
          const res = useMinne.getState().flyttaIn(djur.uid, hem.uid);
          ok = res === "ok";
          if (res === "ok") visaBanner(fyll(TEXTER.bo.flyttar_in[0]!, { djur: djur.formel, hem: bestamdHem(hem) }), "ovr");
          else if (res === "full") visaBanner(TEXTER.bo.full, "ovr");
          else visaBanner(fyll(TEXTER.bo.passar_inte, { djur: djur.formel }), "ovr");
        }
        if (ok && djur) uppfyll(aktiv, ons.tack, ons.stjarnor, djur.uid, hem?.x ?? 0.5, hem?.y ?? 0.4);
      }
    }
    if (utfall.byggen.some((b) => BYGG_ORD.find((o) => o.id === b.bygg)?.typ === "lek")) bjud("lek");
    visaMossa({ byggen: utfall.byggen });
    rensaSkriv();
    setBokOpp(false);
  }

  function hanteraDjur(raw: string, opt: { hand: boolean; inteGuld?: string[] }) {
    const aktiv = useMinne.getState().onskan;
    const ge = onskaSkrivRef.current && aktiv?.kalla === "djur" && aktiv.typ === "ge";
    if (ge && aktiv) {
      const bas =
        useMinne.getState().ang.find((a) => a.uid === aktiv.uid) ??
        useMinne.getState().hemma.find((h) => h.spec.uid === aktiv.uid)?.spec;
      const ons = ONSK.onskningar.find((o) => o.id === aktiv.id);
      const fras = bas ? tillaggFras(bas, raw) : null;
      if (!bas || !fras || !ons) {
        rensaSkriv();
        return;
      }
      const u = tolka(fras, { kalla: opt.hand ? "skriv" : "kort", inteGuld: opt.inteGuld });
      if (u.typ === "sparr") {
        rensaSkriv();
        visaBanner(u.text, "sparr");
        ljud.puff();
        return;
      }
      if (u.typ === "forslag") {
        setForslag({ token: u.token, text: u.text, forslag: u.forslag });
        setBehover(null);
        return;
      }
      if (u.typ !== "skapad") {
        if (u.typ === "behover_djur") {
          useMinne.getState().sparaOkanda(u.okanda);
          for (const m of u.meddelanden) visaBanner(m, "okand");
        }
        return;
      }
      useMinne.getState().uppdateraDjur(aktiv.uid, u.varelse);
      belona(u, aktiv.uid, opt.hand);
      if (geTraff(bas, u.varelse, ons)) uppfyll(aktiv, ons.tack, ons.stjarnor, aktiv.uid);
      else {
        ljud.nastan();
        const p = brygga.platser().find((x) => x.uid === aktiv.uid);
        visaBubbla(nastanRad(nastanRef.current), p?.x ?? 0.5, p?.topp ?? 0.3, false, true);
        nastanRef.current += 1;
      }
      rensaSkriv();
      return;
    }

    const utfall: Utfall = tolka(raw, { kalla: opt.hand ? "skriv" : "kort", inteGuld: opt.inteGuld });
    if (utfall.typ === "sparr") {
      rensaSkriv();
      visaBanner(utfall.text, "sparr");
      ljud.puff();
      return;
    }
    if (utfall.typ === "forslag") {
      setForslag({ token: utfall.token, text: utfall.text, forslag: utfall.forslag });
      setBehover(null);
      return;
    }
    if (utfall.typ === "behover_djur") {
      useMinne.getState().sparaOkanda(utfall.okanda);
      for (const m of utfall.meddelanden) visaBanner(m, "okand");
      if (utfall.meddelanden.length) ljud.puff();
      setBehover({ text: utfall.text, djur: utfall.djur });
      setForslag(null);
      return;
    }
    if (utfall.guld.length) utfall.varelse.glans = true;
    const { nya, somnade } = useMinne.getState().laggPaAng(utfall.varelse, utfall.antal);
    for (const s of somnade) brygga.taBort(s.uid);
    if (somnade[0]) visaBanner(replik(somnade[0], "sover"), "sov");
    for (const n of nya) {
      brygga.skapa(n, n === nya[nya.length - 1]);
      const ny = komIhagDjur(n);
      if (ny) {
        const mall = ALBUM.sallsynthet.ny_niva_text[Math.floor(Math.random() * ALBUM.sallsynthet.ny_niva_text.length)] ?? ALBUM.sallsynthet.ny_niva_text[0]!;
        visaBanner(fyll(mall, { niva: ny }), "ovr");
      }
    }
    const sista = nya[nya.length - 1];
    if (sista) {
      visaMossa({
        taggar: taggarFor(utfall.varelse),
        antal: utfall.antal,
        sammansatt: arSammansatt(raw) || arSammansatt(utfall.varelse.formel),
        poang: poangAv(utfall.varelse),
      });
    }
    belona(utfall, utfall.guld.length && opt.hand ? sista?.uid : undefined, opt.hand);
    for (const m of utfall.meddelanden) visaBanner(m, "okand");
    for (const o of utfall.varelse.overraskningar) visaBanner(o.text, "ovr");
    ljud.puff();
    if (sista) {
      const visa = (kvar: number) => {
        const p = brygga.platser().find((x) => x.uid === sista.uid);
        if (!p && kvar > 0) {
          window.setTimeout(() => visa(kvar - 1), 160);
          return;
        }
        const sida = (p?.x ?? 0.5) < 0.5 ? 0.62 : 0.38;
        const yy = Math.max(0.5, Math.min(0.62, p?.topp ?? 0.5));
        visaBubbla(replik(utfall.varelse, "hej"), sida, yy, false, true, true);
        brygga.glad(sista.uid);
        brygga.glitter(sista.uid);
        if (utfall.varelse.formagor.length) {
          const uid = sista.uid;
          window.setTimeout(() => {
            if (!useMinne.getState().ang.some((a) => a.uid === uid) && !useMinne.getState().hemma.some((h) => h.spec.uid === uid)) return;
            visaBubbla(replik(utfall.varelse, "tryck"), sida, yy, false, true, true);
          }, 900);
        }
      };
      window.setTimeout(() => visa(8), 280);
      setFotoMal(null);
      setBokOpp(false);
    }
    if (varldRef.current === "gard") visaVarld("ang");
    if (aktiv?.kalla === "djur" && aktiv.typ === "kompis" && sista) {
      const ons = ONSK.onskningar.find((o) => o.id === aktiv.id);
      if (ons && kompisTraff(sista, ons)) uppfyll(aktiv, ons.tack, ons.stjarnor, sista.uid);
    }
    const vant = vantarRef.current;
    if (vant && sista && passarDjur(sista, vant.taggar)) {
      vantarRef.current = null;
      setSkriverAv(false);
      if (vant.slag === "oppna") {
        visaBanner(oppnaMed(vant.omrade, sista), "ovr");
        gaIn(vant.omrade);
      } else if (vant.slag === "del") {
        visaBanner(oppnaOn(sista), "ovr");
        gaIn("on");
      } else {
        const r = skickaDjur(vant.uppdrag, sista);
        if (r) belonaFlode(r);
      }
    }
    rensaSkriv();
  }

  function utfor(raw: string, opt: { hand: boolean; inteGuld?: string[] }) {
    ljud.lasOpp();
    const trim = raw.trim();
    if (!trim) return;
    noteraSkriv(trim);
    if (gavaRef.current?.startsWith("egen:")) {
      const uid = gavaRef.current.slice(5);
      const u = tolkaGava(trim);
      if (u.typ === "tom") return;
      if (u.typ === "djur") {
        visaBanner(TEXTER_AV.gavoruta.djur_i_rutan, "ovr");
        rensaSkriv();
        return;
      }
      if (u.typ === "forslag") {
        setForslag({ token: u.token, text: u.text, forslag: [{ id: u.forslag, visa: u.forslag }] });
        setBehover(null);
        return;
      }
      if (u.typ === "okant") {
        useMinne.getState().sparaOkanda(u.okanda);
        visaBanner(TEXTER_AV.gavoruta.okant, "okand");
        rensaSkriv();
        return;
      }
      if (u.okanda.length) useMinne.getState().sparaOkanda(u.okanda);
      const taggar = [...new Set(u.gavor.flatMap((g) => g.taggar))];
      const favorit = taggar.includes(useMinne.getState().liv[uid]?.favorit ?? "");
      const svar = geEgenGava(uid, taggar);
      const p = brygga.platser().find((x) => x.uid === uid);
      visaBubbla(svar.text, p?.x ?? 0.5, p?.topp ?? 0.3, true, true);
      visaMossa({ gavaTaggar: taggar, favorit });
      setGavaTill(null);
      gavaRef.current = null;
      rensaSkriv();
      return;
    }
    if (gavaRef.current) {
      const svar = geGavor(gavaRef.current, trim);
      if (svar.forslag) {
        setForslag({ token: svar.forslag.token, text: svar.forslag.text, forslag: [{ id: svar.forslag.ord, visa: svar.forslag.ord }] });
        setBehover(null);
        return;
      }
      belonaFlode(svar);
      rensaSkriv();
      return;
    }
    if (varldRef.current === "gard" && !vantarRef.current && !omradeRef.current) {
      const bygg = tolkaBygg(trim);
      if (bygg.typ === "forslag") {
        setForslag({ token: bygg.token, text: bygg.text, forslag: bygg.forslag });
        setBehover(null);
        return;
      }
      if (bygg.typ === "bygge") {
        hanteraBygg(bygg);
        return;
      }
    }
    hanteraDjur(trim, opt);
  }

  const utforRef = useRef(utfor);
  utforRef.current = utfor;

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

  function vaknaNu() {
    utfor(textRef.current, { hand: handRef.current });
  }

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
        visaBanner("Det ordet kan Trollpennan inte.", "sparr");
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
    visaBanner("Det ordet kan Trollpennan inte än. Jag sparar det!", "okand");
    ljud.puff();
  }

  function oppnaOnska() {
    const o = useMinne.getState().onskan;
    if (!o) return;
    setOnskaOpp(true);
    setBokOpp(true);
    setMenyOpp(false);
    const ex = exempelFor(o);
    const traff = kortForExempel(ex, ordLista());
    if (o.kalla === "bygg") {
      onskaSkrivRef.current = false;
      oppnaBygglage();
      setOnskaOpp(true);
      return;
    }
    setPanel("spel");
    onskaSkrivRef.current = o.typ === "ge";
    if (traff.length) {
      setLage("kort");
      setFlik(bastaFlik(traff));
    } else setLage("skriv");
  }

  function fyllExempel(ex: string) {
    ljud.lasOpp();
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

  function stangOnska() {
    onskaSkrivRef.current = false;
    setOnskaOpp(false);
  }

  function forsokKop(slag: "djur" | "bygg", id: string, titel: string, pris: number) {
    setKopRad(null);
    if (useMinne.getState().stjarnor < pris) {
      setKopRad(fyll(FIR.stjarnor.for_fa, { n: pris - useMinne.getState().stjarnor }));
      setKop(null);
      return;
    }
    setKop({ slag, id, titel, pris });
  }

  function bekraftaKop() {
    if (!kop) return;
    const ok = kop.slag === "djur" ? useMinne.getState().kopSida(kop.id, kop.pris) : useMinne.getState().kopBygg(kop.id, kop.pris);
    if (ok) {
      ljud.sida();
      visaBanner(fyll(FIR.ny_sida.text, { sida: kop.titel }), "ovr");
      if (kop.slag === "bygg") setByggSidaId(kop.id);
      if (kop.slag === "djur") {
        const sida = SIDOR.sidor.find((s) => s.id === kop.id);
        if (sida) visaBanner(sida.oppnas, "ovr");
      }
    }
    setKop(null);
  }

  function flyttaInDjur(djurUid: string) {
    if (!boUid) return;
    const djur = useMinne.getState().ang.find((a) => a.uid === djurUid);
    const hem = useMinne.getState().garden.find((b) => b.uid === boUid);
    if (!djur || !hem) return;
    const res = useMinne.getState().flyttaIn(djurUid, boUid);
    if (res === "ok") {
      const rad = TEXTER.bo.flyttar_in[Math.floor(Math.random() * TEXTER.bo.flyttar_in.length)] ?? TEXTER.bo.flyttar_in[0]!;
      visaBubbla(fyll(rad, { djur: djur.formel, hem: bestamdHem(hem) }), hem.x, Math.max(0.1, hem.y - 0.14), false, true);
      bjud("hem", djurUid);
      setBoUid(null);
      setMeny(null);
      return;
    }
    if (res === "full") visaBanner(TEXTER.bo.full, "ovr");
    else if (res === "passar") visaBanner(fyll(TEXTER.bo.passar_inte, { djur: djur.formel }), "ovr");
    else visaBanner(TEXTER.bo.ingen, "ovr");
  }

  function borjaOm() {
    const rensa = () => {
      const bort: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith("trollpennan")) bort.push(k);
      }
      for (const k of bort) localStorage.removeItem(k);
    };
    rensa();
    window.addEventListener("pagehide", rensa);
    window.location.reload();
  }

  function sparaKopia() {
    const blob = new Blob([JSON.stringify(exportera(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trollpennan-kopia.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function lasFil(fil: File) {
    try {
      const json: unknown = JSON.parse(await fil.text());
      if (!arKopia(json)) {
        setForalderRad(TEXTER.backup.fel);
        setKopia(null);
        return;
      }
      setKopia(json);
      setForalderRad(null);
    } catch {
      setForalderRad(TEXTER.backup.fel);
      setKopia(null);
    }
  }

  function lasInKopia() {
    if (!arKopia(kopia) || !useMinne.getState().importera(kopia)) {
      setForalderRad(TEXTER.backup.fel);
      setKopia(null);
      return;
    }
    ljud.satt(useMinne.getState().ljudPa);
    setLage(useMinne.getState().startLage);
    rensaSkriv();
    setVisKort(null);
    setOnskaOpp(false);
    onskaSkrivRef.current = false;
    visaVarld("ang");
    setKopia(null);
    setForalderRad(TEXTER.backup.klart);
  }

  paHandelse.current = (h) => {
    if (h.typ === "redo") {
      for (const [i, a] of useMinne.getState().ang.entries()) brygga.skapa(a, i === useMinne.getState().ang.length - 1);
      brygga.synkaGard();
      return;
    }
    if (h.typ === "tryck" || h.typ === "hemTryck") {
      ljud.boing();
      const djur =
        useMinne.getState().ang.find((a) => a.uid === h.uid) ?? useMinne.getState().hemma.find((x) => x.spec.uid === h.uid)?.spec;
      const kvall = kvallStyrka(visningsTid()) > 0.7;
      const sov = kvall && djur && djur.kropp !== "uggla";
      const ons = useMinne.getState().onskan;
      const harOnska = !!(ons && djur && ons.uid === djur.uid && !sov);
      if (harOnska && ons) {
        const i3d = document.querySelector("[data-testid='angen-3d']");
        const p = i3d ? null : brygga.platser().find((x) => x.uid === h.uid);
        setOnskaSyns(true);
        setOnskaPos({ x: p?.x ?? h.x, y: p?.topp ?? h.y });
        setFotoMal(null);
        return;
      }
      let text = h.text;
      if (sov) text = vackRad();
      else if (kvall && djur?.kropp === "uggla") text = ugglaRad();
      else if (djur && h.typ === "tryck" && h.klapp) {
        const rader = h.klapp >= 2 ? TEXTER.klapp.mer : TEXTER.klapp.en;
        text = rader[Math.floor(Math.random() * rader.length)] ?? text;
      } else if (djur) text = replikHumor(useMinne.getState().liv[djur.uid]?.humor ?? "glad");
      visaBubbla(text, h.x, h.y, true, true, true);
      if (djur && inbjudanAv(djur.uid) === "gava") {
        setGavaTill(`egen:${djur.uid}`);
        gavaRef.current = `egen:${djur.uid}`;
        setLage("skriv");
        setHand(true);
        handRef.current = true;
      }
      return;
    }
    if (h.typ === "mossa") {
      ljud.boing();
      if (!useMinne.getState().mossaLista.length) oppnaMossaLista();
      const hals = MOSSA.halsningar[Math.floor(Math.random() * MOSSA.halsningar.length)] ?? MOSSA.halsningar[0]!;
      setHalsning(hals);
      setMossaOpp(true);
      return;
    }
    if (h.typ === "lang") {
      const djur =
        useMinne.getState().ang.find((a) => a.uid === h.uid) ?? useMinne.getState().hemma.find((x) => x.spec.uid === h.uid)?.spec;
      if (!djur) return;
      useMinne.getState().sparaFormel(djur);
      setVisKort({ slag: "djur", spec: djur });
      return;
    }
    if (h.typ === "bygg") {
      ljud.boing();
      const b = useMinne.getState().garden.find((g) => g.uid === h.uid);
      if (b) visaBubbla(b.formel, h.x, Math.max(0.12, h.y - 0.08), false, true, true);
      setMeny(null);
      return;
    }
    if (h.typ === "byggLang") {
      ljud.boing();
      setMeny({ uid: h.uid, x: h.x, y: h.y });
      setBoUid(null);
      return;
    }
    if (h.typ === "byggd") {
      useMinne.getState().flyttaBygge(h.uid, h.x, h.y);
      setMeny(null);
    }
  };

  visaOnskaRef.current = () => {
    const s = useMinne.getState();
    if (s.onskan) {
      if (typeof document !== "undefined" && document.querySelector("[data-testid='angen-3d']")) {
        const mal = malTillDuk(s.onskan.uid);
        setOnskaSyns(true);
        if (mal) {
          setOnskaPos((prev) =>
            Math.abs(prev.x - mal.x) < 0.03 && Math.abs(prev.y - mal.y) < 0.03 ? prev : mal,
          );
        }
        return;
      }
      const p = brygga.platser().find((x) => x.uid === s.onskan?.uid);
      setOnskaSyns(!!p);
      if (p) setOnskaPos({ x: p.x, y: p.topp ?? p.y });
      return;
    }
    if (s.onskaVid && Date.now() - s.onskaVid < 20000) return;
    if (textRef.current.trim() || onskaSkrivRef.current || overlayRef.current) return;
    let forsta = s.ang[0];
    for (const a of s.ang) {
      if (forsta && a.skapad < forsta.skapad) forsta = a;
    }
    if (!forsta || Date.now() - forsta.skapad < 30000) return;
    const undvik = new Set(s.seddOnska);
    const djurO = valjDjurOnska(forsta, undvik);
    if (!djurO) return;
    const spar: OnskaSpar = { id: djurO.id, kalla: "djur", uid: forsta.uid, text: djurO.text, typ: djurO.typ };
    s.sattOnska(spar);
    s.settOnska(spar.id);
    s.noteraOnska();
    ljud.onskan();
    const mal = malTillDuk(forsta.uid);
    setOnskaSyns(true);
    if (mal) setOnskaPos(mal);
    else {
      const p = brygga.platser().find((x) => x.uid === forsta.uid);
      setOnskaPos({ x: p?.x ?? 0.5, y: p?.topp ?? p?.y ?? 0.45 });
    }
  };

  useEffect(() => {
    ljud.satt(useMinne.getState().ljudPa);
    const el = host.current;
    if (!el) return;
    let dead = false;
    let game: { destroy: (removeCanvas: boolean) => void } | null = null;
    const stopp = brygga.lyssna((h) => paHandelse.current(h));
    const tick = window.setInterval(() => visaOnskaRef.current(), 1000);
    void import("./starta.ts").then(async (m) => {
      if (dead || !host.current) return;
      try {
        const g = await m.starta(host.current);
        if (dead) {
          g.destroy(true);
          return;
        }
        game = g;
      } catch {
        /* ängen får vila om kitet saknas */
      }
    });
    return () => {
      dead = true;
      stopp();
      window.clearInterval(tick);
      game?.destroy(true);
    };
  }, []);

  useEffect(() => {
    let sen = performance.now();
    let senFas = fasAv(visningsTid());
    const id = window.setInterval(() => {
      const nu = performance.now();
      const dt = document.hidden ? 0 : Math.min(1500, nu - sen);
      sen = nu;
      if (dt > 0) framDygn(dt);
      const sparad = useMinne.getState().dygnMs;
      const vis = visningsTid();
      if (vis - sparad >= 3000) {
        const del = tickLiv(useMinne.getState(), vis - sparad);
        useMinne.setState(del);
        if (typeof del.dygnMs === "number") synkaVisning(del.dygnMs);
      }
      setNatt(kvallStyrka(visningsTid()));
      const fas = fasAv(visningsTid());
      if (dt > 0 && fas !== senFas) {
        senFas = fas;
        const rader = fas === "kvall" ? DYGN.texter.kvall_borjar : DYGN.texter.morgon;
        for (const rad of rader) visaBanner(rad, "ovr");
      }
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (forslag || behover || gavaTill || onskaOpp) setBokOpp(true);
  }, [forslag, behover, gavaTill, onskaOpp]);

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
  }, []);

  useEffect(() => {
    const api = {
      vakna: (mening?: string) => {
        const raw = mening ?? textRef.current;
        if (mening != null) {
          textRef.current = mening;
          setText(mening);
          setHand(true);
          setLage("skriv");
        }
        utforRef.current(raw, { hand: mening != null ? true : handRef.current });
      },
      skriv: (mening: string) => {
        setLage("skriv");
        setHand(true);
        setBokOpp(true);
        const t = bokstav(mening);
        textRef.current = t;
        setText(t);
        setForslag(null);
      },
      lage: (l: Lage) => setLage(l),
      kort: (id: string) => {
        const ord = ordLista().find((o) => o.id === id);
        if (ord) valjKort(ord);
      },
      platser: () => brygga.platser(),
      state: () => {
        const s = useMinne.getState();
        return {
          ang: s.ang.map((a) => ({
            uid: a.uid,
            formel: a.formel,
            kropp: a.kropp,
            formagor: a.formagor,
            tillbehor: a.tillbehor,
            glans: a.glans,
          })),
          funna: s.funna,
          onskelista: s.onskelista,
          formler: s.formler.map((f) => f.text),
          sovande: s.sovande.map((a) => a.formel),
          text: textRef.current,
          stjarnor: s.stjarnor,
          onskan: s.onskan,
          garden: s.garden.map((g) => ({ uid: g.uid, formel: g.formel, bygg: g.bygg, x: g.x, y: g.y, boende: g.boende, delar: g.delar })),
          lada: s.lada.map((g) => g.formel),
          hemma: s.hemma.map((h) => ({ formel: h.spec.formel, hem: h.hem })),
          koptaSidor: s.koptaSidor,
          byggSidor: s.byggSidor,
          ljudPa: s.ljudPa,
          ljudlogg: [...ljud.logg],
          fas: fasAv(visningsTid()),
          natt: kvallStyrka(visningsTid()),
          dygnMs: visningsTid(),
          mossa: s.mossaLista,
          mossaExtra: s.mossaExtra,
          album: s.albumKropp,
          foton: s.foton,
          liv: s.liv,
          hjartanLiv: Object.fromEntries(Object.entries(s.liv).map(([id, v]) => [id, v.hjartan])),
          ordFrek: s.ordFrek,
          onskanAntal: s.onskanAntal,
          van: s.van,
          byggda: s.byggda,
        };
      },
      aterstall: () => {
        useMinne.getState().aterstall();
        synkaVisning(0);
        setNatt(0);
        rensaSkriv();
        setLage(useMinne.getState().startLage);
        setVisKort(null);
        setOrdbok(false);
        setForalder(false);
        setBubblor([]);
        setBanners([]);
        bannerKo.current = [];
        bannerSyns.current = false;
        setMeny(null);
        setBoUid(null);
        setOnskaOpp(false);
        onskaSkrivRef.current = false;
        omUidRef.current = null;
        omradeRef.current = null;
        gavaRef.current = null;
        vantarRef.current = null;
        setOmrade(null);
        setKartaOpp(false);
        setGavaTill(null);
        setSkylt(null);
        setValj(null);
        setSkriverAv(false);
        setKartaText(null);
        setPanel("spel");
        synkaAv(null);
        visaVarld("ang");
      },
      formel: () => {
        const d = useMinne.getState().ang.at(-1);
        if (!d) return;
        useMinne.getState().sparaFormel(d);
        setVisKort({ slag: "djur", spec: d });
      },
      ordbok: (oppna: boolean) => setOrdbok(oppna),
      foralder: (oppna: boolean) => setForalder(oppna),
      plats: (p: Varld) => visaVarld(p),
      onska: (id: string, oppna?: boolean) => {
        const djur = useMinne.getState().ang[0];
        if (!djur) return;
        const bygg = ONSK_BYGG.onskningar.find((o) => o.id === id);
        const djurO = ONSK.onskningar.find((o) => o.id === id);
        if (!bygg && !djurO) return;
        const spar: OnskaSpar = bygg
          ? { id: bygg.id, kalla: "bygg", uid: djur.uid, text: bygg.text }
          : { id: djurO!.id, kalla: "djur", uid: djur.uid, text: djurO!.text, typ: djurO!.typ };
        useMinne.getState().sattOnska(spar);
        useMinne.getState().settOnska(spar.id);
        useMinne.getState().noteraOnska();
        ljud.onskan();
        const p = brygga.platser().find((x) => x.uid === djur.uid);
        setOnskaSyns(true);
        setOnskaPos({ x: p?.x ?? 0.5, y: p?.topp ?? p?.y ?? 0.45 });
        if (oppna) oppnaOnska();
      },
      stjarnor: (n: number) => useMinne.setState({ stjarnor: n }),
      kop: (id: string) => {
        if (SIDOR.sidor.some((s) => s.id === id) && !useMinne.getState().koptaSidor.includes(id)) {
          useMinne.setState({ koptaSidor: [...useMinne.getState().koptaSidor, id] });
        }
        if (BYGGSIDOR.sidor.some((s) => s.id === id) && !useMinne.getState().byggSidor.includes(id)) {
          useMinne.setState({ byggSidor: [...useMinne.getState().byggSidor, id] });
        }
      },
      aldras: () => {
        useMinne.setState({
          ang: useMinne.getState().ang.map((a) => ({ ...a, skapad: Date.now() - 40000 })),
          onskaVid: 0,
        });
      },
      ljudlogg: () => [...ljud.logg],
      kvall: () => {
        hoppaKvall();
        setNatt(kvallStyrka(visningsTid()));
      },
      dag: () => {
        hoppaDag();
        setNatt(kvallStyrka(visningsTid()));
      },
      humor: (uid: string, id: string) => {
        const s = useMinne.getState();
        const har = s.liv[uid] ?? nyttLiv(visningsTid());
        useMinne.setState({ liv: { ...s.liv, [uid]: { ...har, humor: id, humorMs: visningsTid(), humorLangd: 180_000 } } });
      },
      favorit: (uid: string, tagg: string) => {
        const s = useMinne.getState();
        const har = s.liv[uid] ?? nyttLiv(visningsTid());
        useMinne.setState({ liv: { ...s.liv, [uid]: { ...har, favorit: tagg, favoritHittad: false } } });
      },
      vila: (ms: number) => {
        const fore = useMinne.getState();
        const del = tickLiv({ ...fore, dygnMs: visningsTid() }, ms);
        useMinne.setState(del);
        if (typeof del.dygnMs === "number") synkaVisning(del.dygnMs);
        setNatt(kvallStyrka(visningsTid()));
      },
      geGava: (uid: string) => {
        setGavaTill(`egen:${uid}`);
        gavaRef.current = `egen:${uid}`;
        setLage("skriv");
        setHand(true);
      },
      album: (oppna: boolean) => setAlbumOpp(oppna),
      fotoNu: () => {
        const d = useMinne.getState().ang.at(-1) ?? useMinne.getState().hemma.at(-1)?.spec;
        if (!d) return "";
        const text = sparaFoto(d);
        if (text === ALBUM.texter.foto_klart) visaMossa({ foto: true, poang: poangAv(d) });
        return text;
      },
      inHem: () => {
        const s = useMinne.getState();
        const djur = s.ang[0];
        if (!djur) return false;
        const hem = s.garden.find((g) => {
          const b = byggMedId(g.bygg);
          return !!b?.hem && b.hem.kroppar.includes(djur.kropp) && g.boende.length < (b.hem?.platser ?? 0);
        });
        if (!hem) return false;
        return useMinne.getState().flyttaIn(djur.uid, hem.uid) === "ok";
      },
    };
    window.__troll = api;
    return () => {
      delete window.__troll;
    };
  });

  avHand.current = (h) => {
    if (h.typ === "skylt") {
      const r = lasSkylt(h.id);
      setSkylt(r);
      if (r.nytt) visaBanner(r.nytt, "ovr");
      if (omradeRef.current) synkaAv(omradeRef.current);
      return;
    }
    if (h.typ === "vild") {
      setGavaTill(h.id);
      gavaRef.current = h.id;
      setLage("skriv");
      setHand(true);
      handRef.current = true;
      setForslag(null);
      return;
    }
    if (h.typ === "skatt") {
      belonaFlode(plockaSkatt(h.id));
      return;
    }
    if (h.typ === "plats" && h.id === "on" && omradeRef.current === "on") {
      oppnaSkicka("fyren");
      return;
    }
    if (h.typ === "plats" && h.id === "on") {
      tryckOn();
      return;
    }
    if (h.typ === "plats" && h.id === "svampringen") oppnaSkicka("svampring");
  };

  useEffect(() => {
    const stop = avBro.lyssna((h) => avHand.current(h));
    return () => {
      stop();
    };
  }, []);

  useEffect(() => {
    const rot = angRef.current;
    if (!rot) return;
    const synka = () => {
      const canvas = rot.querySelector("canvas");
      if (!canvas) return;
      const a = rot.getBoundingClientRect();
      const c = canvas.getBoundingClientRect();
      if (a.width < 2 || a.height < 2 || c.width < 2) return;
      rot.style.setProperty("--duk-x", String((c.left - a.left) / a.width));
      rot.style.setProperty("--duk-y", String((c.top - a.top) / a.height));
      rot.style.setProperty("--duk-w", String(c.width / a.width));
      rot.style.setProperty("--duk-h", String(c.height / a.height));
    };
    synka();
    const ro = new ResizeObserver(synka);
    ro.observe(rot);
    const id = window.setInterval(synka, 500);
    return () => {
      ro.disconnect();
      window.clearInterval(id);
    };
  }, []);

  const visaOnskaHjalp = Boolean(onskan && (onskaOpp || !onskaSyns));
  const onskaDjur =
    visaOnskaHjalp && onskan
      ? (ang.find((a) => a.uid === onskan.uid) ?? hemma.find((h) => h.spec.uid === onskan.uid)?.spec)
      : undefined;
  const andrar = Boolean(visaOnskaHjalp && onskan?.kalla === "djur" && onskaDjur);
  const vaknaText = gavaTill
    ? TEXTER_AV.gavoruta.knapp
    : varld === "gard" && !omrade
      ? TEXTER.penna_bygg.knapp
      : andrar && onskaDjur
        ? onskan?.typ === "kompis"
          ? FIR.onskan.kompis
          : fyll(FIR.onskan.andra, { djur: bestamdAv(onskaDjur.kropp, false) })
        : "Vakna!";
  const onskaEx = onskan ? exempelFor(onskan) : [];
  const onskaKort = visaOnskaHjalp ? kortForExempel(onskaEx, allaOrd) : [];
  const onskaIds = new Set(onskaKort.map((o) => o.id));
  const i3d = typeof document !== "undefined" && !!document.querySelector("[data-testid='angen-3d']");
  const ank = i3d
    ? {
        x: 0.7,
        y: 0.3,
        vanster: true,
      }
    : onskaAnkare(onskaPos.x, onskaPos.y);
  const kort = allaOrd
    .filter((o) => o.niva === "kort" && o.klass === flik)
    .slice()
    .sort((a, b) => Number(onskaIds.has(b.id)) - Number(onskaIds.has(a.id)));
  const hemliga = allaOrd.filter((o) => o.niva === "fritt");
  const kvar = hemligaKvar(funna);
  const hittade = allaOrd.filter((o) => funna[o.id]);
  const boBygge = garden.find((b) => b.uid === boUid);
  const boHem = boBygge ? byggMedId(boBygge.bygg) : undefined;
  const boDjur = boHem?.hem ? ang.filter((a) => boHem.hem!.kroppar.includes(a.kropp)) : [];
  const menyBygge = garden.find((b) => b.uid === meny?.uid);
  const menyHem = menyBygge ? byggMedId(menyBygge.bygg)?.hem : null;
  const visa3d = varld === "ang" && !omrade && !kartaOpp;
  const agdaSidor = BYGGSIDOR.sidor.filter((s) => byggSidor.includes(s.id));
  const lastaSidor = BYGGSIDOR.sidor.filter((s) => s.kostnad > 0 && !byggSidor.includes(s.id));
  const byggSida = agdaSidor.find((s) => s.id === byggSidaId) ?? agdaSidor[0] ?? BYGGSIDOR.sidor[0]!;

  function stallKanin() {
    const s = useMinne.getState();
    if (s.ang.length || s.hemma.length) return;
    const u = tolka("en rosa kanin", { kalla: "kort" });
    if (u.typ !== "skapad") return;
    const { nya } = useMinne.getState().laggPaAng(u.varelse, 1);
    const n = nya[0];
    if (n) komIhagDjur(n);
  }

  return (
    <main className="spel" onPointerDown={() => ljud.lasOpp()}>
      <LagringsInfo />
      <section className="sr-only" aria-label={upplevelse.sceneTitle} aria-live="polite" aria-atomic="true">
        <h2>{upplevelse.sceneTitle}</h2>
        {ang.length ? <ul>{ang.map(a => <li key={a.uid}>{a.formel}</li>)}</ul> : <p>{upplevelse.sceneEmpty}</p>}
      </section>
      {intro ? (
        <Intro
          key={introNy}
          ljudPa={ljudPa}
          onSteg={(fas) => {
            if (fas >= 5) stallKanin();
          }}
          onKlar={() => {
            sagaNu.aktiv = false;
            stallKanin();
            useMinne.getState().sattIntro();
            setIntro(false);
          }}
          onIde={(ex) => {
            vackIde(ex);
            sagaNu.aktiv = false;
            useMinne.getState().sattIntro();
            setIntro(false);
          }}
        />
      ) : null}
      <section className={visa3d ? "ang tred" : "ang"} ref={angRef} aria-label={varld === "gard" ? TEXTER.flikar.garden : TEXTER.flikar.angen} inert={intro}>
        <div className="natt-bak" style={{ opacity: natt }} />
        <div className="duk" ref={host} />
        {visa3d ? <Angen3D natt={natt} saga={intro} /> : null}
        <div className="ang-lager">
          <div className="natt" data-testid="natt" data-styrka={natt.toFixed(2)} />
          {varld === "gard" && !omrade ? (
            <div className="lykta" data-testid="lykta" aria-hidden>
              <span className="lykta-stolpe" />
              <span className="lykta-hus" />
              <span className="lykta-ljus" style={{ opacity: natt }} />
            </div>
          ) : null}
          {omrade === "on" ? <span className="fyr-ljus" data-testid="fyr-ljus" style={{ opacity: natt }} /> : null}
          {panel === "spel" && !omrade
            ? brygga.platser().map((p) => {
                const djur = ang.find((a) => a.uid === p.uid) ?? hemma.find((h) => h.spec.uid === p.uid)?.spec;
                if (!djur) return null;
                const sov = natt > 0.7 && djur.kropp !== "uggla";
                const ikon = HUMOR_IKON[liv[djur.uid]?.humor ?? "glad"] ?? "♥";
                return (
                  <span
                    key={p.uid}
                    className="humor-ikon"
                    data-testid={sov ? "zzz" : `humor-${liv[djur.uid]?.humor ?? "glad"}`}
                    style={{ ...dukStil(p.x, p.topp ?? p.y) }}
                  >
                    {sov ? sovText() : ikon}
                  </span>
                );
              })
            : null}
          {fotoMal && panel === "spel" ? (
            <button
              type="button"
              className="foto-knapp"
              data-testid="ta-foto-scen"
              style={{ ...dukStil(fotoMal.x, Math.max(0.08, fotoMal.y - 0.08)) }}
              onClick={() => {
                const djur =
                  useMinne.getState().ang.find((a) => a.uid === fotoMal.uid) ??
                  useMinne.getState().hemma.find((h) => h.spec.uid === fotoMal.uid)?.spec;
                if (!djur) return;
                const text = sparaFoto(djur);
                visaBanner(text, "ovr");
                if (text === ALBUM.texter.foto_klart) visaMossa({ foto: true, poang: poangAv(djur) });
                setFotoMal(null);
              }}
            >
              {ALBUM.texter.ta_foto}
            </button>
          ) : null}
          <div className="banderoller" role="status" aria-live="polite" aria-atomic="true">
            {banners.map((b) => (
              <p key={b.id} className={`banner ${b.slag}`} data-testid="puff">
                {b.text}
              </p>
            ))}
          </div>
          {bubblor.map((b) => (
            <div key={b.id} className={b.ovan ? "bubbla ovan" : "bubbla"} style={dukStil(b.x, b.y)} data-testid="bubbla">
              {b.hjarta ? <Heart className="hjarta" aria-hidden /> : null}
              <p>{b.text}</p>
            </div>
          ))}
          {onskan && !onskaOpp && onskaSyns ? (
            <button
              type="button"
              className={ank.vanster ? "bubbla onska vanster" : "bubbla onska hoger"}
              style={dukStil(ank.x, ank.y)}
              data-testid="onska-bubbla"
              onClick={oppnaOnska}
            >
              <p>★ {onskan.text}</p>
              <p className="gor">{FIR.onskan.knapp}</p>
            </button>
          ) : null}
          {meny ? (
            <div className="bygg-meny" style={dukStil(meny.x, Math.min(meny.y, 0.62))} data-testid="bygg-meny">
              <button
                type="button"
                onClick={() => {
                  brygga.flyttaBygg(meny.uid);
                  setMeny(null);
                  visaBanner(TEXTER.flytta_hjalp, "ovr");
                }}
              >
                {TEXTER.meny.flytta}
              </button>
              <button
                type="button"
                onClick={() => {
                  omUidRef.current = meny.uid;
                  setMeny(null);
                  setLage("skriv");
                  setBokOpp(true);
                  visaBanner(TEXTER.bygg_om_hjalp, "ovr");
                }}
              >
                {TEXTER.meny.bygg_om}
              </button>
              <button
                type="button"
                onClick={() => {
                  useMinne.getState().tillLada(meny.uid);
                  setMeny(null);
                  setLadaOpp(true);
                }}
              >
                {TEXTER.meny.lada}
              </button>
              {menyHem ? (
                <button
                  type="button"
                  onClick={() => {
                    setBoUid(meny.uid);
                    setMeny(null);
                  }}
                >
                  {TEXTER.meny.bo}
                </button>
              ) : null}
            </div>
          ) : null}
          {varld === "gard" && !omrade && lada.length > 0 ? (
            <button type="button" className="lada-knapp" data-testid="lada" onClick={() => setLadaOpp((v) => !v)}>
              {TEXTER.lada.rubrik}
            </button>
          ) : null}
          {ladaOpp && lada.length > 0 ? (
            <div className="lada-panel" data-testid="lada-panel">
              <p>{TEXTER.lada.rubrik}</p>
              {lada.length === 0 ? <p>{TEXTER.lada.tom}</p> : null}
              {lada.map((b) => (
                <button
                  key={b.uid}
                  type="button"
                  onClick={() => {
                    if (!useMinne.getState().franLada(b.uid)) visaBanner(TEXTER.lada.full, "ovr");
                  }}
                >
                  {TEXTER.lada.ta_fram}: {b.formel}
                </button>
              ))}
            </div>
          ) : null}
          {boUid ? (
            <div className="lada-panel bo-panel" data-testid="bo-panel">
              <p>{TEXTER.bo.valj}</p>
              {boDjur.length === 0 ? <p>{TEXTER.bo.ingen}</p> : null}
              {boDjur.map((d) => (
                <button key={d.uid} type="button" onClick={() => flyttaInDjur(d.uid)}>
                  {d.formel}
                </button>
              ))}
              <button type="button" onClick={() => setBoUid(null)}>
                {FIR.onskan.inte_nu}
              </button>
            </div>
          ) : null}
        </div>
        {kartaOpp ? (
          <div className="karta-lager" data-testid="karta">
            <h2>{OMR.karta.rubrik}</h2>
            <p>{OMR.karta.hjalp}</p>
            {forstaRad?.map((r) => (
              <p key={r}>{r}</p>
            ))}
            {kartaText ? <p data-testid="karta-text">{kartaText}</p> : null}
            <button type="button" className="plats-knapp hem" data-testid="plats-garden" onClick={() => tryckPlats("garden")}>
              {TEXTER.flikar.garden}
            </button>
            {OMR.omraden.map((o) => {
              const last = o.nas_fran !== "garden" && !oppna.includes(o.nas_fran);
              const oppen = !o.hinder || oppna.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  className={`plats-knapp ${o.id}${oppen ? " oppen" : ""}`}
                  data-testid={`plats-${o.id}`}
                  disabled={last}
                  onClick={() => tryckPlats(o.id)}
                >
                  {o.namn}
                </button>
              );
            })}
          </div>
        ) : null}
        {omrade && !kartaOpp ? (
          <div className="omrade-hud">
            <button type="button" data-testid="hem-knapp" onClick={() => tryckPlats("garden")}>
              {OMR.karta.hem}
            </button>
            <button type="button" data-testid="byt-folje" onClick={bytFolje}>
              {TEXTER_AV.foljeslagare.byt}
            </button>
          </div>
        ) : null}
        <div className="hud">
          <button
            type="button"
            className={haller ? "foralder-knapp haller" : "foralder-knapp"}
            aria-label="För vuxna, håll inne"
            data-testid="foralder-hall"
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setHaller(true);
            }}
            onPointerUp={() => setHaller(false)}
            onPointerCancel={() => setHaller(false)}
          >
            <span className="ring" />
            <span className="prick" />
          </button>
          <HoldOppnare haller={haller} oppna={() => setForalder(true)} />
          <span className="stjarna-hud" data-testid="stjarnor" aria-label={fyll(FIR.stjarnor.har, { n: stjarnor })}>
            ★ {stjarnor}
          </span>
          <span className="dold" data-testid="framsteg">
            {fyll(FIR.framsteg.kort, { n: hittatAntal, total: totalOrd })}
          </span>
          <button
            type="button"
            className="meny-knapp"
            data-testid="meny"
            aria-expanded={menyOpp}
            aria-label="Meny"
            onClick={() => {
              setMenyOpp((v) => !v);
              setMenySaker(false);
              setSenare(false);
            }}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        {menyOpp ? (
          <button type="button" className="meny-bak" aria-label="Stäng" onClick={() => { setMenyOpp(false); setMenySaker(false); setSenare(false); }} />
        ) : null}
        {menyOpp ? (
          <nav className="meny-panel" data-testid="meny-panel">
            {senare ? (
              <p className="meny-fraga" data-testid="demo-senare">
                {TEXTER.demo.senare}
              </p>
            ) : null}
            <button
              type="button"
              data-testid="flik-ang"
              className={panel === "spel" && varld === "ang" ? "pa" : ""}
              onClick={() => valjVarld("ang")}
            >
              {TEXTER.flikar.angen}
            </button>
            <button type="button" className="last" data-testid="flik-gard" data-last="ja" onClick={lasMeny}>
              <span>{TEXTER.flikar.garden}</span>
              <Lock aria-hidden />
            </button>
            <button type="button" className="last" data-testid="flik-byggbok" data-last="ja" onClick={lasMeny}>
              <span>{TEXTER.flikar.byggboken}</span>
              <Lock aria-hidden />
            </button>
            <button type="button" className="last" data-testid="album-knapp" data-last="ja" onClick={lasMeny}>
              <span>{ALBUM.texter.knapp}</span>
              <Lock aria-hidden />
            </button>
            <button type="button" data-testid="ut-pa-aventyr" onClick={() => { setMenyOpp(false); setBokOpp(false); oppnaKarta(); }}>
              <span>{OMR.karta.knapp}</span>
            </button>
            <button type="button" className="last" data-testid="uppdrag-knapp" data-last="ja" onClick={lasMeny}>
              <span>{UPP.texter.rubrik}</span>
              <Lock aria-hidden />
            </button>
            <button type="button" className="last" data-testid="ordbok" data-last="ja" onClick={lasMeny}>
              <span>Bok</span>
              <Lock aria-hidden />
            </button>
            <button
              type="button"
              data-testid="intro-meny"
              onClick={() => {
                setMenyOpp(false);
                setIntroNy((n) => n + 1);
                setIntro(true);
              }}
            >
              {(introJson as { meny: string }).meny}
            </button>
            <button
              type="button"
              className="farlig"
              data-testid="meny-borja"
              onClick={() => {
                setMenySaker(true);
                requestAnimationFrame(() => {
                  document.querySelector("[data-testid=meny-borja-fraga]")?.scrollIntoView({ block: "end" });
                });
              }}
            >
              {TEXTER.borja_om.knapp}
            </button>
            {menySaker ? (
              <div data-testid="meny-borja-fraga">
                <p className="meny-fraga">{TEXTER.borja_om.fraga}</p>
                <button type="button" data-testid="meny-borja-ja" onClick={borjaOm}>
                  {TEXTER.borja_om.ja}
                </button>
                <button type="button" data-testid="meny-borja-nej" onClick={() => setMenySaker(false)}>
                  {TEXTER.backup.las_in_nej}
                </button>
              </div>
            ) : null}
          </nav>
        ) : null}
        <div className="hud-bot">
          <button
            type="button"
            className={varld === "gard" && !omrade ? "bok-knapp bygg" : "bok-knapp"}
            data-testid={varld === "gard" && !omrade ? "bygg-nagot" : "pennans-bok"}
            onClick={() => {
              if (varld === "gard" && !omrade && !kartaOpp) {
                oppnaBygglage();
                return;
              }
              setPanel("spel");
              setBokOpp(true);
            }}
          >
            {varld === "gard" && !omrade ? (
              <>
                <Pencil aria-hidden />
                {TEXTER.bygg_nagot}
              </>
            ) : (
              "Pennans bok"
            )}
          </button>
        </div>
      </section>

      {bokOpp ? (
      <div className="bok-skarm" data-testid="bok-skarm" onClick={stangBok}>
      <section className={andrar ? "bok andrar" : "bok"} data-andrar={andrar ? "ja" : "nej"} role="dialog" aria-label="Pennans bok" onClick={(e) => e.stopPropagation()}>
        <header className="bok-huvud">
          <h2>{panel === "byggbok" ? TEXTER.flikar.byggboken : "Pennans bok"}</h2>
          <button
            type="button"
            className={lage === "skriv" ? "penna pa" : "penna"}
            aria-label={lage === "skriv" ? "Visa ordkort" : "Skriv själv"}
            data-testid="pennan"
            onClick={() => {
              setLage((l) => (l === "skriv" ? "kort" : "skriv"));
              setForslag(null);
            }}
          >
            <Pencil aria-hidden />
          </button>
          <button type="button" className="stang-x" data-testid="stang-bok" aria-label="Stäng" onClick={stangBok}>
            ×
          </button>
        </header>
        {byggPuff ? (
          <p className="bygg-puff" data-testid="bygg-puff">
            {byggPuff}
          </p>
        ) : null}

        {panel === "spel" || (panel === "byggbok" && lage === "skriv") ? (
          <>
            <div className="bok-mitt">
            {(onskaOpp || (onskan && !onskaSyns)) && onskan ? (
              <div className="onska-remsa" data-testid="onska-remsa">
                {andrar && onskaDjur ? (
                  <div className="onska-topp" data-testid="onska-topp">
                    <OnskaAnsikte djur={onskaDjur} />
                    <p className="onska-text">
                      {fyll(FIR.onskan.onskar, { djur: bestamdAv(onskaDjur.kropp, true) })} {onskan.text}
                    </p>
                  </div>
                ) : (
                  <p className="onska-text">
                    ★ {FIR.onskan.rubrik} {onskan.text}
                  </p>
                )}
                {onskaEx.length ? (
                  <div className="onska-hjalp" data-testid="onska-hjalp">
                    <p className="onska-led">{FIR.onskan.led}</p>
                    <div className="rad-kort">
                      {onskaEx.map((ex, i) => (
                        <button
                          key={ex}
                          type="button"
                          className="onska-chip"
                          data-testid={`onska-ex-${i}`}
                          onClick={() => fyllExempel(ex)}
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {gavaTill ? (
              <div className="onska-remsa" data-testid="gava-remsa">
                <p>
                  {fyll(VILDA.regler.ruta, {
                    namn: gavaTill.startsWith("egen:")
                      ? (ang.find((a) => a.uid === gavaTill.slice(5))?.formel ??
                        hemma.find((h) => h.spec.uid === gavaTill.slice(5))?.spec.formel ??
                        "")
                      : (VILDA.djur.find((d) => d.id === gavaTill)?.namn ?? ""),
                  })}
                </p>
              </div>
            ) : null}
            {!gavaTill && !andrar && varld === "ang" ? (
              <div className="skapar-guide" data-testid="skapar-guide">
                <p>{upplevelse.guide}</p>
                <details>
                  <summary>{upplevelse.examplesTitle}</summary>
                  <div className="ideer">
                    {upplevelse.examples.map(ex => <button type="button" className="kort" key={ex} onClick={() => fyllExempel(ex)}>{ex}</button>)}
                  </div>
                </details>
              </div>
            ) : null}
            {forslag ? (
              <div className="forslag" data-testid="forslag">
                <p>{forslag.text}</p>
                <div className="rad-kort">
                  {forslag.forslag.map((f) => (
                    <button key={f.id} type="button" className="kort" data-testid={`forslag-${f.id}`} onClick={() => valjForslag(f)}>
                      {f.visa}
                    </button>
                  ))}
                  <button type="button" className="nej" data-testid="nej" onClick={nejForslag}>
                    Nej
                  </button>
                </div>
              </div>
            ) : null}
            {behover && !forslag ? (
              <div className="behover" data-testid="behover">
                <p>{behover.text}</p>
                <div className="rad-kort">
                  {behover.djur.map((d) => (
                    <button key={d.id} type="button" className="kort" data-testid={`prova-${d.id}`} onClick={() => utfor(d.id, { hand: false })}>
                      {d.visa}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {lage === "kort" && !forslag && !behover ? (
              <>
                <div className="flikar" role="tablist">
                  {FLIKAR.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      role="tab"
                      aria-selected={flik === f.id}
                      className={["flik", flik === f.id ? "pa" : "", onskaKort.some((o) => o.klass === f.id) ? "traff" : ""].filter(Boolean).join(" ")}
                      onClick={() => {
                        setFlik(f.id);
                        document.querySelector(".kort-yta")?.scrollTo(0, 0);
                      }}
                    >
                      {f.namn}
                    </button>
                  ))}
                </div>
                <div className="kort-yta">
                  <div className="rutnat">
                    {kort.map((ord) => {
                      const vald = val[ord.klass as Slot]?.id === ord.id;
                      const markerad = onskaIds.has(ord.id);
                      const gang = kortGang[ord.id] ?? 0;
                      return (
                        <div key={ord.id} className="kort-cell">
                          <button
                            type="button"
                            className={vald ? "kort vald" : markerad ? "kort markerad" : "kort"}
                            data-testid={`kort-${ord.id}`}
                            onClick={() => valjKort(ord)}
                          >
                            {ord.klass === "djur" && kortIkon(ord.id) ? (
                              <img className="kort-ikon" alt="" src={kortIkon(ord.id) ?? ""} />
                            ) : null}
                            {kanEtikett(ord)}
                          </button>
                          {gang >= 3 ? (
                            <button type="button" className="skriv-mig" onClick={() => oppnaSkrivMig(ord)}>
                              Skriv mig! {ord.visa.slice(0, 2)}…
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : null}
            </div>
            <div className="remsa" data-testid="remsa">
              {text ? (
                text
              ) : (
                <span className="tom">
                  {gavaTill
                    ? TEXTER_AV.gavoruta.placeholder
                    : varld === "gard" && !omrade
                      ? TEXTER.penna_bygg.placeholder
                      : " "}
                </span>
              )}
              {lage === "skriv" ? <i className="caret" /> : null}
            </div>
            <button type="button" className={visaOnskaHjalp && text.trim() ? "vakna redo" : "vakna"} data-testid="vakna" onClick={vaknaNu}>
              {vaknaText}
            </button>
            {lage === "skriv" && !forslag && !behover ? (
              <div className="tangenter" data-testid="tangentbord">
                {RADER.slice(0, 2).map((rad) => (
                  <div className="rad" key={rad[0]}>
                    {rad.map((t) => (
                      <button key={t} type="button" className="tangent" onClick={() => skrivTecken(t)}>
                        {t}
                      </button>
                    ))}
                  </div>
                ))}
                <div className="rad">
                  <button type="button" className="tangent radera" aria-label="Sudda" onClick={sudda}>
                    ⌫
                  </button>
                  {RADER[2]!.map((t) => (
                    <button key={t} type="button" className="tangent" onClick={() => skrivTecken(t)}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="rad">
                  <button type="button" className="tangent mellanslag" data-testid="mellanslag" aria-label="Mellanslag" onClick={() => skrivTecken(" ")}>
                    mellanslag
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : panel === "uppdrag" ? (
          <div className="kort-yta uppdrag" data-testid="uppdragbok">
            <h2>{UPP.texter.rubrik}</h2>
            <div className="rad-kort">
              <button type="button" className={uppFlik === "pagar" ? "kort" : "nej"} data-testid="flik-pagar" onClick={() => setUppFlik("pagar")}>
                {UPP.texter.flik_pagaende}
              </button>
              <button type="button" className={uppFlik === "klar" ? "kort" : "nej"} data-testid="flik-klara" onClick={() => setUppFlik("klar")}>
                {UPP.texter.flik_klara}
              </button>
            </div>
            {UPP.uppdrag.filter((u) => (uppFlik === "klar" ? uppdragSpar[u.id] === "klar" : uppdragSpar[u.id] === "pagar")).length === 0 ? (
              <p>{UPP.texter.inga}</p>
            ) : null}
            {UPP.uppdrag
              .filter((u) => (uppFlik === "klar" ? uppdragSpar[u.id] === "klar" : uppdragSpar[u.id] === "pagar"))
              .map((u) => (
                <p key={u.id} className="uppdrag-rad" data-testid={`uppdrag-${u.id}`}>
                  {u.text}
                </p>
              ))}
          </div>
        ) : (
          <div className="byggbok-wrap" data-testid="byggbok">
            <div className="kort-yta byggbok">
              {onskan?.kalla === "bygg" ? (
                <p className="onska-text">
                  ★ {FIR.onskan.rubrik} {onskan.text}
                </p>
              ) : null}
              <h2>{byggSida.titel}</h2>
              <p className="bygg-beskriv">{byggSida.beskrivning}</p>
              {agdaSidor.length > 1 ? (
                <div className="rad-kort bygg-sidor">
                  {agdaSidor.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={s.id === byggSida.id ? "kort vald" : "kort"}
                      data-testid={`bygg-sida-${s.id}`}
                      onClick={() => {
                        setByggSidaId(s.id);
                        setByggPuff(null);
                      }}
                    >
                      {s.titel}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="rutnat">
                <button type="button" className="kort bygg-exempel" data-testid="bygg-exempel" onClick={() => byggFras(byggSida.exempel)}>
                  {byggSida.exempel}
                </button>
                {byggSida.ord.map((id) => {
                  const fras = frasForByggOrd(id);
                  return (
                    <button key={id} type="button" className="kort" data-testid={`byggord-${id}`} onClick={() => byggFras(fras)}>
                      {fras}
                    </button>
                  );
                })}
              </div>
              {kopRad ? (
                <p className="bygg-puff inne" data-testid="for-fa">
                  {kopRad}
                </p>
              ) : null}
            </div>
            {lastaSidor.length ? (
              <div className="last-rad" data-testid="bygg-last">
                {lastaSidor.map((sida) => (
                  <button
                    key={sida.id}
                    type="button"
                    className="last-ikon"
                    data-testid={`bygg-${sida.id}`}
                    onClick={() => forsokKop("bygg", sida.id, sida.titel, sida.kostnad)}
                  >
                    <Lock aria-hidden />
                    <span className="last-pris">★ {sida.kostnad}</span>
                    <span>{sida.titel}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </section>
      </div>
      ) : null}

      {skylt ? (
        <div className="skarm" role="dialog" data-testid="skylt">
          <div className="ark">
            <p className="skylt-text" data-testid="skylt-text">
              {skylt.text}
            </p>
            {skylt.nytt ? (
              <p className="skylt-text" data-testid="nytt-uppdrag">
                {skylt.nytt}
              </p>
            ) : null}
            <button type="button" className="stang" onClick={() => setSkylt(null)}>
              Stäng
            </button>
          </div>
        </div>
      ) : null}

      {valj ? (
        <div className="skarm" role="dialog" data-testid="valj-djur">
          <div className="ark">
            <p className="skylt-text">{valj.rubrik}</p>
            {valj.eller ? <p className="skylt-text">{valj.eller}</p> : null}
            {valj.djur.map((d) => (
              <button key={d.uid} type="button" className="plats-knapp" data-testid={`valj-${d.uid}`} onClick={() => valjKor.current(d)}>
                {d.formel}
              </button>
            ))}
            <button type="button" className="stang" onClick={() => setValj(null)}>
              Stäng
            </button>
          </div>
        </div>
      ) : null}

      {visKort?.slag === "djur" ? (
        <div className="skarm" role="dialog" aria-label="Formelkort" data-testid="formel">
          <div className="ark">
            <FormelBild v={visKort.spec} />
            <p className="formel-text" data-testid="formel-text">
              {visKort.spec.formel}
            </p>
            {visKort.spec.overraskningar.map((o) => (
              <p key={o.effekt}>{o.text}</p>
            ))}
            <button
              type="button"
              className="kort"
              data-testid="ta-foto"
              onClick={() => {
                const text = sparaFoto(visKort.spec);
                visaBanner(text, "ovr");
                if (text === ALBUM.texter.foto_klart) visaMossa({ foto: true, poang: poangAv(visKort.spec) });
              }}
            >
              {ALBUM.texter.ta_foto}
            </button>
            <button type="button" className="stang" onClick={() => setVisKort(null)}>
              Stäng
            </button>
          </div>
        </div>
      ) : null}

      {visKort?.slag === "bygg" ? (
        <div className="skarm" role="dialog" aria-label="Formelkort" data-testid="formel">
          <div className="ark">
            <p className="formel-text" data-testid="formel-text">
              {visKort.formel}
            </p>
            <button type="button" className="stang" onClick={() => setVisKort(null)}>
              Stäng
            </button>
          </div>
        </div>
      ) : null}

      {ordbok ? (
        <div className="skarm" role="dialog" aria-label="Ordboken" data-testid="ordbok-sida">
          <div className="ark sida">
            <h2>Ordboken</h2>
            <p data-testid="hittat">{fyll(FIR.framsteg.text, { n: hittatAntal, total: totalOrd })}</p>
            <p>{fyll(FIR.stjarnor.har, { n: stjarnor })}</p>
            {kopRad ? <p>{kopRad}</p> : null}
            {SIDOR.sidor.map((sida) => {
              const agd = koptaSidor.includes(sida.id);
              const n = sida.ord.filter((id) => funna[id]).length;
              const opp = sidOpp === sida.id;
              return (
                <article key={sida.id} className="sida-kort" data-testid={`sida-${sida.id}`}>
                  <button
                    type="button"
                    className="kort"
                    onClick={() => {
                      if (!agd) forsokKop("djur", sida.id, sida.titel, djurPris(koptaSidor.length));
                      else setSidOpp(opp ? null : sida.id);
                    }}
                  >
                    {sida.titel}
                    {agd ? ` ${n}/${sida.ord.length}` : ""}
                  </button>
                  {opp && agd ? (
                    <>
                      <ul className="ord-lista">
                        {sida.ord.map((id) => {
                          const rad = streck(id, !!funna[id]);
                          return (
                            <li key={id} className={funna[id]?.guld ? "guld" : funna[id] ? "" : "hemlig"}>
                              <span>{rad.ord}</span>
                              {rad.gata ? <small>{rad.gata}</small> : null}
                            </li>
                          );
                        })}
                      </ul>
                      <div className="rad-kort">
                        {sida.prova.map((p) => (
                          <button
                            key={p}
                            type="button"
                            className="kort"
                            onClick={() => {
                              textRef.current = p;
                              setText(p);
                              setHand(true);
                              setLage("skriv");
                              setOrdbok(false);
                            }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null}
                </article>
              );
            })}
            <h3>Ord du hittat</h3>
            <p>Hemliga ord: {kvar} kvar</p>
            {hittade.length === 0 ? <p>Inga ord än. Väck ett djur, så hamnar orden här.</p> : null}
            <ul className="ord-lista">
              {hittade.map((o) => (
                <li key={o.id} className={funna[o.id]?.guld ? "guld" : ""}>
                  {o.visa}
                </li>
              ))}
            </ul>
            <h3>Hemliga</h3>
            <ul className="ord-lista">
              {hemliga.map((o) =>
                funna[o.id] ? (
                  <li key={o.id} className={funna[o.id]?.guld ? "guld" : ""}>
                    {o.visa}
                  </li>
                ) : (
                  <li key={o.id} className="hemlig" aria-label="Hemligt ord">
                    ?
                  </li>
                ),
              )}
            </ul>
            <h3>Formler</h3>
            {formler.length === 0 ? <p>Håll fingret på ett djur om du vill spara dess formel.</p> : null}
            <div className="formel-lista">
              {formler.map((f) => (
                <button key={f.text} type="button" onClick={() => setVisKort({ slag: "djur", spec: f.spec })}>
                  {f.text}
                </button>
              ))}
            </div>
            <h3>De som vilar</h3>
            {sovande.length === 0 ? <p>Inga djur vilar i boken än.</p> : null}
            <div className="sov-lista">
              {sovande.map((s) => (
                <div className="sov-rad" key={s.uid}>
                  <span>{s.formel}</span>
                  <button
                    type="button"
                    className="kom-hit"
                    onClick={() => {
                      const somnad = useMinne.getState().kallaHit(s.uid);
                      if (somnad) visaBanner(replik(somnad, "sover"), "sov");
                      setOrdbok(false);
                    }}
                  >
                    Kom hit!
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="stang" onClick={() => setOrdbok(false)}>
              Stäng
            </button>
          </div>
        </div>
      ) : null}

      {kop ? (
        <div className="skarm" role="dialog" data-testid="kop-fraga">
          <div className="ark">
            <p>{fyll(FIR.stjarnor.kop, { sida: kop.titel, n: kop.pris })}</p>
            <div className="rad-kort">
              <button type="button" className="kort" data-testid="kop-ja" onClick={bekraftaKop}>
                {FIR.stjarnor.kop_ja}
              </button>
              <button type="button" className="nej" data-dialog-close onClick={() => setKop(null)}>
                {FIR.stjarnor.kop_nej}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {foralder ? (
        <div className="skarm" role="dialog" aria-label="För vuxna" data-testid="foralder">
          <div className="ark sida">
            <h2>För vuxna</h2>
            <p className="kredit" data-testid="groda-kredit">Groda: "Frog" av jeremy (CC BY 3.0)</p>
            <ForalderLiv />
            <h3>Startläge</h3>
            <p>Så här börjar pennan nästa gång den öppnas.</p>
            <div className="valj-lage">
              <button
                type="button"
                className={startLage === "kort" ? "pa" : ""}
                onClick={() => {
                  useMinne.getState().sattStart("kort");
                  setLage("kort");
                }}
              >
                Ordkort
              </button>
              <button
                type="button"
                className={startLage === "skriv" ? "pa" : ""}
                onClick={() => {
                  useMinne.getState().sattStart("skriv");
                  setLage("skriv");
                }}
              >
                Skriv själv
              </button>
            </div>
            <h3>Ljud</h3>
            <button
              type="button"
              className={ljudPa ? "pa ljud-knapp" : "ljud-knapp"}
              data-testid="ljud-knapp"
              aria-pressed={ljudPa}
              onClick={() => {
                const nasta = !useMinne.getState().ljudPa;
                useMinne.getState().sattLjud(nasta);
                ljud.satt(nasta);
              }}
            >
              {ljudPa ? LJUD_PA : LJUD_AV}
            </button>
            <h3>{TEXTER.backup.rubrik}</h3>
            <p>{TEXTER.backup.spara_hjalp}</p>
            <button type="button" className="kort" data-testid="spara-kopia" onClick={sparaKopia}>
              {TEXTER.backup.spara}
            </button>
            <button type="button" className="kort" data-testid="las-kopia" onClick={() => filRef.current?.click()}>
              {TEXTER.backup.las_in}
            </button>
            <input
              ref={filRef}
              className="dold-fil"
              type="file"
              accept="application/json,.json"
              data-testid="kopia-fil"
              onChange={(e) => {
                const fil = e.target.files?.[0];
                e.target.value = "";
                if (fil) void lasFil(fil);
              }}
            />
            {foralderRad ? <p data-testid="backup-rad">{foralderRad}</p> : null}
            {kopia ? (
              <div data-testid="backup-fraga" role="dialog" aria-label="Bekräfta import">
                <p>{TEXTER.backup.las_in_fraga}</p>
                <div className="rad-kort">
                  <button type="button" className="kort" data-testid="backup-ja" onClick={lasInKopia}>
                    {TEXTER.backup.las_in_ja}
                  </button>
                  <button type="button" className="nej" data-dialog-close onClick={() => setKopia(null)}>
                    {TEXTER.backup.las_in_nej}
                  </button>
                </div>
              </div>
            ) : null}
            <h3>Önskelista</h3>
            <p>Ord som Trollpennan inte kunde än.</p>
            {onskelista.length === 0 ? <p>Inget nytt ord sparat än.</p> : null}
            <ul className="onske-lista" data-testid="onskelista">
              {onskelista.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
            <h3>{TEXTER.borja_om.knapp}</h3>
            <button type="button" className="farlig" data-testid="borja-om" style={{ width: "100%" }} onClick={() => setSaker(true)}>
              {TEXTER.borja_om.knapp}
            </button>
            {saker ? (
              <div data-testid="borja-fraga" role="dialog" aria-label="Bekräfta återställning">
                <p>{TEXTER.borja_om.fraga}</p>
                <div className="rad-kort">
                  <button type="button" className="kort" data-testid="borja-ja" onClick={borjaOm}>
                    {TEXTER.borja_om.ja}
                  </button>
                  <button type="button" className="nej" data-testid="borja-nej" data-dialog-close onClick={() => setSaker(false)}>
                    {TEXTER.backup.las_in_nej}
                  </button>
                </div>
              </div>
            ) : null}
            <p />
            <button
              type="button"
              className="stang"
              onClick={() => {
                setSaker(false);
                setForalder(false);
              }}
            >
              Stäng
            </button>
          </div>
        </div>
      ) : null}
      {mossaOpp ? (
        <div className="skarm" role="dialog" data-testid="mossa-panel" aria-label={MOSSA.figur.namn}>
          <div className="ark sida">
            <h2>{MOSSA.figur.namn}</h2>
            <p data-testid="mossa-halsning">{halsning}</p>
            {mossaLista.map((p) => {
              const u = MOSSA.uppdrag.find((x) => x.id === p.id);
              return (
                <p key={p.id} className={p.klar ? "mossa-klar" : ""} data-testid={`mossa-${p.id}`} data-klar={p.klar ? "ja" : "nej"}>
                  {p.klar ? "✓ " : ""}
                  {u?.text}
                </p>
              );
            })}
            {mossaExtra && mossaLista.length > 0 && mossaLista.every((p) => p.klar) ? <p data-testid="mossa-alla">{MOSSA.alla_klara}</p> : null}
            <button type="button" className="stang" onClick={() => setMossaOpp(false)}>
              Stäng
            </button>
          </div>
        </div>
      ) : null}
      {albumOpp ? <AlbumVy stang={() => setAlbumOpp(false)} /> : null}
    </main>
  );
}

function HoldOppnare({ haller, oppna }: { haller: boolean; oppna: () => void }) {
  const oppnaRef = useRef(oppna);
  oppnaRef.current = oppna;
  useEffect(() => {
    if (!haller) return;
    const timer = window.setTimeout(() => oppnaRef.current(), 3000);
    return () => window.clearTimeout(timer);
  }, [haller]);
  return null;
}

declare global {
  interface Window {
    __troll?: {
      vakna: (mening?: string) => void;
      skriv: (mening: string) => void;
      lage: (l: Lage) => void;
      kort: (id: string) => void;
      platser: () => { uid: string; x: number; y: number }[];
      state: () => unknown;
      aterstall: () => void;
      formel: () => void;
      ordbok: (oppna: boolean) => void;
      foralder: (oppna: boolean) => void;
      plats: (p: Varld) => void;
      onska: (id: string, oppna?: boolean) => void;
      stjarnor: (n: number) => void;
      kop: (id: string) => void;
      aldras: () => void;
      ljudlogg: () => string[];
      kvall: () => void;
      dag: () => void;
      humor: (uid: string, id: string) => void;
      favorit: (uid: string, tagg: string) => void;
      vila: (ms: number) => void;
      geGava: (uid: string) => void;
      album: (oppna: boolean) => void;
      fotoNu: () => string;
      inHem: () => boolean;
    };
  }
}
