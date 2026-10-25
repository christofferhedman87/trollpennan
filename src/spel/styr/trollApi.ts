import { byggMedId } from "@/tolk/byggtolk.ts";
import { ordLista } from "@/tolk/tolka.ts";
import { brygga } from "../brygga.ts";
import { ALBUM, fasAv, hoppaDag, hoppaKvall, kvallStyrka, nyttLiv, poangAv, sparaFoto, synkaVisning, tickLiv, visningsTid } from "../liv.ts";
import { ljud } from "../ljud.ts";
import { type Lage, type OnskaSpar, useMinne } from "../minne.ts";
import { platsMed } from "../platser.ts";
import { ONSK, ONSK_BYGG } from "../onska.ts";
import * as rostKo from "../rostKo.ts";
import { bokstav } from "../ui/hjalp.ts";
import { BYGGSIDOR, SIDOR } from "../ui/spelData.ts";
import type { Varld } from "../ui/typer.ts";
import type { SpelKarna } from "./typer.ts";

export function skapaTrollApi(k: SpelKarna) {
  const { setText, setLage, setHand, setForslag, setBubblor, setBanners, setVisKort, setOrdbok, setForalder, setNatt, setAlbumOpp, setBokOpp, setPanel, setMeny, setBoUid, setOnskaOpp, setOnskaPos, setOnskaSyns, setKartaOpp, setKartaText, setOmrade, setGavaTill, setSkylt, setValj, setIntro, textRef, handRef, onskaSkrivRef, omUidRef, omradeRef, gavaRef, vantarRef, introRef } = k.t;
  const { visaMossa } = k.b;
  const { visaVarld, synkaAv } = k.v;
  const { oppnaOnska } = k.o;
  const { rensaSkriv, utforRef } = k.s;
  const { valjKort } = k.sk;
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
        if (t.trim()) utforRef.current(t, { hand: true });
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
          plats: s.plats,
          oppnadePlatser: s.oppnadePlatser,
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
        rostKo.tryck();
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
      plats: (p: Varld | string) => {
        if (p === "gard") {
          visaVarld("gard");
          return;
        }
        if (p === "ang" || platsMed(p)) {
          useMinne.getState().oppnaPlats(p);
          visaVarld("ang");
        }
      },
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
      bytPlats: (id: string) => useMinne.getState().bytPlats(id),
      platsAntal: () => Object.fromEntries(Object.entries(useMinne.getState().platsSkapelser).map(([k, v]) => [k, v.length])),
      nollstall: () => {
        api.aterstall();
        introRef.current = false;
        setIntro(false);
        useMinne.setState({ introSedd: true, oppnadePlatser: ["skogen", "sjon", "grottan"] });
      },
      mina: () => useMinne.getState().ang,
      flyttaDjuret: (uid: string, mal: string) => {
        if (mal !== "gard") return;
        const start = useMinne.getState();
        const djur = start.ang.find((a) => a.uid === uid) ?? start.hemma.find((h) => h.spec.uid === uid)?.spec;
        if (!djur) return;
        const finns = start.garden.find((g) => byggMedId(g.bygg)?.hem);
        const hemUid = finns?.uid ?? "gard-hem-1";
        if (!finns) {
          start.laggByggen([{
            uid: hemUid,
            bygg: "hus",
            formel: "ett hus",
            ord: "hus",
            antal: 1,
            fargId: null,
            fargHex: null,
            monster: null,
            material: null,
            delar: [],
            x: 0.5,
            y: 0.5,
            boende: [],
          }]);
        }
        if (useMinne.getState().flyttaIn(uid, hemUid) === "ok") return;
        const s = useMinne.getState();
        useMinne.setState({
          ang: s.ang.filter((a) => a.uid !== uid),
          hemma: [...s.hemma.filter((h) => h.spec.uid !== uid), { spec: djur, hem: hemUid }],
          garden: s.garden.map((g) => (g.uid === hemUid && !g.boende.includes(uid) ? { ...g, boende: [...g.boende, uid] } : g)),
        });
        brygga.taBort(uid);
        brygga.synkaGard();
      },
      visa: (mal: "ang" | "gard") => visaVarld(mal),
      tillstand: () => api.state(),
      rensa: () => api.nollstall(),
    };
  if (typeof window !== "undefined" && (import.meta.env.DEV || navigator.webdriver === true) && !window.__tredSyn) {
    const synFn = () => Object.entries(synFn).map(([uid, v]) => ({ uid, ...(v as object) }));
    window.__tredSyn = synFn as unknown as NonNullable<Window["__tredSyn"]>;
  }
  return api;
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
      plats: (p: Varld | string) => void;
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
      bytPlats: (id: string) => boolean;
      platsAntal: () => Record<string, number>;
      nollstall: () => void;
      mina: () => { uid: string }[];
      flyttaDjuret: (uid: string, mal: string) => void;
      visa: (mal: "ang" | "gard") => void;
      tillstand: () => unknown;
      rensa: () => void;
    };
  }
}
