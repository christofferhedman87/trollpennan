import { type Sparad } from "./brygga.ts";
import { type Plats } from "./platser.ts";
import { arSmasak, simmar } from "./entiteter.ts";
import { tacker, xSkala, type Ruta } from "./skarm.ts";
import { framfor, sakRuta } from "./skymning.ts";
import { PLACERING, regelFor, rollFor, kroppMatt, kameraFor, SKARM, GOLV, KANT_PX, RESERV_MAX, SKARM_RESERVERAT, type Roll, type Lage } from "./placeringGrund.ts";
import { MATFEL, huvudFyllnad, siluettAndel, rader, underMinne, TOM, varst, underlag, type Satt } from "./placeringStod.ts";
import { dekorSkymd, dekorUtK, dekorUtH } from "./placeringDekor.ts";

export function placeraNiva(alla: readonly Sparad[], plats: Plats | undefined, vandDel: number, krympAldre: boolean, nyStorlek?: number, nyZmax?: number, aldreTak?: number): Map<string, Lage> {
  const regel = regelFor(plats);
  const P = PLACERING;
  // P3a-fix: regeln räknar med en säkerhetsmarginal mot skärmprovet (rutor och 6 px-celler är grövre än pixlarna;
  // torr2: elefantens huvud 10 % räknat, 10,5 % mätt) – gränserna själva är oförändrade
  const sak = P.sakerhet ?? 0;
  const [nyGrans, aldreGrans, nyaAntal, huvudMax] = [P.max_skymd - sak, (P.max_skymd_aldre ?? P.max_skymd) - sak, P.nya_antal ?? 1, (P.huvud_skymd ?? 1) + 0.005 - sak]; // huvudet: ≥ 90 % i hela procent är godkänt, som i skärmprovet (Arkitekten 10:31)
  const vick = P.vickning;
  const bakLucka = P.bak_lucka ?? 0.5;
  const kam = kameraFor(plats);
  const satta: Satt[] = regel.fasta.map((f) => ({ id: `fast:${f.namn}`, x: f.x, z: f.z, halv: f.halv, djup: f.djup, r: sakRuta(f.x, f.z, f.halv, f.hojd, f.djup, 0, kam), k: TOM, tackt: 0, huvud: 0, grans: f.max_skymd ?? nyGrans, plan: f.plan, fh: 1 }));
  for (const s of satta) s.k = s.r; // en fast sak står still
  const plana = satta.filter((s) => s.plan);
  const efterAlder = [...alla].sort((a, b) => b.skapad - a.skapad || (a.uid < b.uid ? 1 : -1));
  // P3a-fix (beslut B, budgetarna): den nya först, sedan byggnaderna (rollen bak), sedan de andra – var och en efter ålder.
  // Bara de egna kan då tränga undan en byggnad: ett nytt djur söver aldrig en byggnad (Doodle: slottet blev kvar utan ruta)
  const arBak = (d: Sparad) => rollFor(d, plats) === "bak";
  const nyastBakUid = efterAlder.find(arBak)?.uid;
  const byggMax = (P.byggnad_max_skymd ?? 0.1) - sak;
  const ordning = [...efterAlder.slice(0, 1), ...efterAlder.slice(1).filter(arBak), ...efterAlder.slice(1).filter((d) => !arBak(d))];
  const ut = new Map<string, Lage>();
  const steg = P.krymp_steg ?? 0.1;
  let tak = aldreTak ?? 1; // äldre ritas aldrig större än en nyare (krympningen följer åldern, som perspektiv)
  ordning.forEach((d0, nr) => {
    // P3a-fix (beslut C): den nya står alltid i bild – finns ingen ruta på vattnet (grottans lilla damm) eller i luften
    // står den på marken (Doodle 21 okt: sälen fick stallplatsen längst bak, z −6,5, utan banner)
    const roll0 = rollFor(d0, plats);
    const roller: Roll[] = nr === 0 && (roll0 === "vatten" || roll0 === "luft") ? [roll0, "mark"] : [roll0];
    let roll = roll0;
    let band = regel.band[roll] ?? regel.band.mark!;
    let rad = rader(band, roll);
    let grans = efterAlder.indexOf(d0) < nyaAntal ? nyGrans : aldreGrans; // gränsen följer åldern, inte ordningen
    // småsaker (storlek.json smasak) står främst och når minst smasak_px på skärmen (beslut C)
    const sma = arSmasak(d0.kropp);
    // En grupp som bara är småsaker får 0 % skymning. Nyaste byggnaden och sjukhuset högst byggnad_max_skymd.
    if (sma && alla.every((x) => arSmasak(x.kropp))) grans = 0;
    if (d0.uid === nyastBakUid || d0.kropp === "sjukhus") grans = Math.min(nyGrans, byggMax);
    const fh0 = huvudFyllnad(d0.kropp);
    const underFor = (d: Sparad) => {
      let perKropp = underMinne.get(d.kropp);
      if (!perKropp) underMinne.set(d.kropp, (perKropp = new Map()));
      const rollN = roll === "mark" ? 0 : roll === "vatten" ? 1 : roll === "luft" ? 2 : 3;
      const z0 = Math.round(band.z[0] * 1000) + 30000;
      const z1 = Math.round(band.z[1] * 1000) + 30000;
      const nyckel = ((Math.round((d.skala || 1) * 1000) * 4 + rollN) * 100000 + z0) * 100000 + z1;
      let under = perKropp.get(nyckel);
      if (!under) perKropp.set(nyckel, (under = new Map()));
      return under;
    };
    type Fynd = { lage: Lage; m: ReturnType<typeof kroppMatt>; huvud: number; tackt: number; fel: number; kost: number; k?: Ruta };
    // den nyaste: främsta lediga rutan; äldre: bakersta (de äldsta hamnar längst bak och lämnar framkanten fri)
    // medStall: leta också fram den minst dåliga rutan om ingen är ledig
    // (fel = 0: ingen kropp i vägen men för skymd, 1: utanför bild, 2: i en annan kropp; sedan minst skymning)
    let golvFel = false; // någon ruta var för liten för att synas (saker, synlig_golv) – då kan en större storlek rymmas
    const sok = (d: Sparad, medStall: boolean): { fri: Fynd | null; stall: Fynd | null } => {
      let stall: Fynd | null = null;
      const under = underFor(d);
      const n = rad.length;
      for (let ri = 0; ri < n; ri++) {
        const ri2 = nr === 0 || sma ? ri : n - 1 - ri;
        const { z, y, xs } = rad[ri2]!;
        if (nr === 0 && nyZmax !== undefined && z > nyZmax + 1e-9) continue; // den nya byggnaden längre bak (Arkitekten 10:31 a)
        // Äldre byggnad får inte stå närmare kameran än den nyaste byggnaden (högre z).
        const nyastBak = roll === "bak" && d0.uid !== nyastBakUid ? satta.find((s) => s.roll === "bak" && !s.id.startsWith("fast:")) : undefined;
        if (nyastBak && z > nyastBak.z + 1e-9) continue;
        const m = kroppMatt(d, z, plats, roll, vandDel);
        let m0: ReturnType<typeof kroppMatt> | null = null;
        const bredd = m.halv + m.vand[0] + (vick[roll] ?? 0);
        const djup = m.djup + m.vand[1];
        // skärmens y beror inte på x, och skärmens x är linjär i x på varje djup och höjd: radens ruta räknas en gång
        const r0 = sakRuta(0, z, bredd, m.hojd, djup, y + m.y0, kam);
        // stora saker står bakom alla djur och saker på marken (B6.1 E, bak_lucka): banden överlappar, så en rad som
        // hamnar fel mot de redan satta är aldrig ledig (stallet får fortfarande leta i den)
        // P3a-fix: bara de som står i samma bredd (x) räknas – ett djur bredvid slottet får stå längre bak än det
        // (skymningen räknas ändå); annars trängde en ny byggnad främst i skogen undan alla djur bakom den
        const bakI = (s: Satt, x: number, h: number) => Math.abs(s.x - x) < s.halv + h;
        const bakRad = satta.filter((s) => s.r !== TOM && ((roll === "mark" && s.roll === "bak" && s.z > z - bakLucka) || (roll === "bak" && s.roll === "mark" && s.z < z + bakLucka)));
        if (!medStall && (r0.y0 < 0 || r0.y1 > SKARM.h || r0.x1 - r0.x0 > SKARM.w)) continue;
        const [ya, yb] = [y + m.y0, y + m.y0 + m.hojd];
        const sk = [xSkala(ya, z + djup, kam), xSkala(yb, z + djup, kam), xSkala(ya, z - djup, kam), xSkala(yb, z - djup, kam)];
        const [sMin, sMax] = [Math.min(...sk), Math.max(...sk)];
        // P3a torr 6: bara de satta som når raden på djupet kan krocka (samma villkor som nedan, delat i z och x)
        const iRaden = satta.filter((s) => !s.plan && Math.abs(s.z - z) < s.djup + m.djup);
        for (let xi = 0; xi < xs.length; xi++) {
          const x = xs[xi]!;
          const bakFel = bakRad.some((s) => bakI(s, x, m.halv));
          if (bakFel && !medStall) continue;
          // rätt underlag (i den storlek som ritas men med full vandring, som B6.3: avståndet till vattnet ändras inte när
          // det blir trångt), inte i en reserverad världsruta (grinden), inte i en plan fast sak (dammen) om den inte simmar
          const ck = ri2 * 1000 + xi;
          let ok = under.get(ck);
          if (ok === undefined) under.set(ck, (ok = underlag(roll, plats, x, z, d, (m0 ??= kroppMatt(d, z, plats, roll, 1)))));
          if (!ok) continue;
          if (regel.varld_reserverat.some((v) => x + m.halv > v.x[0] && x - m.halv < v.x[1] && z + m.djup > v.z[0] && z - m.djup < v.z[1])) continue;
          if (roll !== "vatten" && plana.some((s) => Math.abs(s.x - x) < s.halv + m.halv && Math.abs(s.z - z) < s.djup + m.djup)) continue;
          // hel på skärmen (räknas först: billigast, och utanför bild behövs inget mer om den inte ska till stallet)
          const [lo, hi] = [x - bredd, x + bredd];
          const r: Ruta = { x0: 187.5 + Math.min(lo * sMin, lo * sMax), x1: 187.5 + Math.max(hi * sMin, hi * sMax), y0: r0.y0, y1: r0.y1 };
          const ute = r.x0 < KANT_PX || r.x1 > SKARM.w - KANT_PX || r.y0 < 0 || r.y1 > SKARM.h; // P3a-fix: en bit från bildkanten (hästen nådde kanten med 3 px, torr1)
          if (ute && !medStall) continue;
          // en sak eller ett djur som ritas för litet för att synas (b66: försvinner i gräset) står inte där
          // P3a torr 6: gäller också djur (ett äldre som krympts mot 40 % – bladlusen 13 × 15 px) och mäts på kroppen
          // själv (kärnan), minus mätfelet (matfel_px): b66 mätte sax 9 × 22 där regeln räknade 9 × 24
          const c = sakRuta(x, z, m.kx, m.kh, m.kd, y + m.ky0, kam);
          // Arkitekten 10:31: minsta storleken mäts som skärmen – den ritade siluettens ruta, inte modellens låda
          // (siluett_andel, mätt med kalibrera.ts; ej mätta: _standard och mätfelet som förut)
          const [aw, ah, kand] = siluettAndel(d.kropp);
          const [rw, rh] = [(c.x1 - c.x0) * aw - (kand ? 0 : MATFEL), (c.y1 - c.y0) * ah - (kand ? 0 : MATFEL)];
          const smaForLiten = sma && Math.max(c.x1 - c.x0, c.y1 - c.y0) < (P.smasak_min_px ?? 40);
          if (smaForLiten || (GOLV && (Math.max(rw, rh) < GOLV.storst_px || Math.min(rw, rh) < GOLV.minst_px || rw * rh < GOLV.yta_px))) {
            golvFel = true;
            if (medStall && (!stall || stall.fel > 1)) stall = { lage: { x, y, z, roll, r, stall: true, vand: vandDel }, m, huvud: 0, tackt: 0, fel: 1, kost: 0 };
            continue;
          }
          // går inte in i en annan kropp
          let krock = false;
          for (const s of iRaden) if (Math.abs(s.x - x) < s.halv + m.halv) { krock = true; break; }
          if (krock) {
            if (medStall && !stall) stall = { lage: { x, y, z, roll, r: TOM, stall: true, vand: vandDel }, m, huvud: 0, tackt: 0, fel: 2, kost: 0 };
            continue;
          }
          if (ute) {
            if (!stall || stall.fel > 1) stall = { lage: { x, y, z, roll, r, stall: true, vand: vandDel }, m, huvud: 0, tackt: 0, fel: 1, kost: 0 };
            continue;
          }
          // skymning: den nya av dem framför och av de reserverade skärmrutorna (hela rutan och huvudet), och var och en
          // bakom av den nya – mot var och ens egen gräns
          // huvudet: övre halvan av rutan (räknas utan nytt objekt)
          // P3a torr 4: andelen räknas på kroppen själv (kärnan c), inte på rutan den rör sig inom (r) – i värsta läget,
          // när den och den framför har vandrat/guppat mot varandra (varst)
          let tackt = 0;
          let huvud = 0;
          for (const q of SKARM_RESERVERAT) {
            tackt += varst(q, q, r, c, false);
            huvud += varst(q, q, r, c, true) / fh0;
          }
          dekorSkymd(plats, r, c, z, false); // ett svep: kropp och huvud (dekorUtK/dekorUtH)
          tackt += dekorUtK;
          huvud += dekorUtH / fh0;
          // Småsaker står aldrig bakom HUD eller dekor.
          if (sma && tackt > 0 && !medStall) continue;
          let kost = Math.max(0, tackt - grans) + Math.max(0, huvud - huvudMax);
          for (const s of satta) {
            if (kost > 0 && !medStall) break;
            if (s.r === TOM) continue;
            if (sma && s.sma) {
              const cx = (c.x0 + c.x1) / 2;
              const cy = (c.y0 + c.y1) / 2;
              const sx = (s.k.x0 + s.k.x1) / 2;
              const sy = (s.k.y0 + s.k.y1) / 2;
              if (
                Math.hypot(cx - sx, cy - sy) < (P.smasak_center_px ?? 40) ||
                tacker(s.k, c) > 0 ||
                tacker(c, s.k) > 0 ||
                tacker(s.r, r) > 0 ||
                tacker(r, s.r) > 0 ||
                varst(s.r, s.k, r, c, false) > 0 ||
                varst(r, c, s.r, s.k, false) > 0
              ) kost += 10;
            }
            // P3a-fix: i samma rad (±0,05) räknas skymningen åt båda hållen – vilken som hamnar framför avgörs av vandringen
            // (skogen: kaninen bredvid hästen i samma rad syntes 83 %, regeln räknade ingen skymning)
            const samma = Math.abs(s.z - z) <= 0.05;
            // en plan fast sak (dammen) ligger på marken och skymmer ingen
            if ((s.z > z + 0.05 || samma) && !s.plan) {
              const a = varst(s.r, s.k, r, c, false);
              const b = varst(s.r, s.k, r, c, true) / fh0;
              kost += Math.max(0, tackt + a - grans) - Math.max(0, tackt - grans) + Math.max(0, huvud + b - huvudMax) - Math.max(0, huvud - huvudMax);
              tackt += a;
              huvud += b;
            }
            if ((z > s.z + 0.05 || samma) && !(s.plan && roll === "vatten")) {
              kost += Math.max(0, s.tackt + varst(r, c, s.r, s.k, false) - s.grans) + (s.plan ? 0 : Math.max(0, s.huvud + varst(r, c, s.r, s.k, true) / s.fh - huvudMax));
            }
          }
          if (bakFel) kost += 1;
          if (kost <= 1e-9) return { fri: { lage: { x, y, z, roll, r, stall: false, vand: vandDel, kropp: c }, m, huvud, tackt, fel: 0, kost, k: c }, stall };
          const lage: Lage = { x, y, z, roll, r, stall: true, vand: vandDel };
          if (medStall && (!stall || stall.fel > 0 || kost < stall.kost - 1e-9)) stall = { lage, m, huvud, tackt, fel: 0, kost };
        }
      }
      return { fri: null, stall };
    };
    const skalad = (k: number): Sparad => (k === 1 ? d0 : { ...d0, skala: (d0.skala || 1) * k });
    // storlekarna att pröva: full (eller som den närmast nyare), sedan i steg ned till krymp_aldre_min
    const storlekar: number[] = [];
    if (nr === 0 && nyStorlek) storlekar.push(nyStorlek);
    else if (nr > 0 && krympAldre) {
      const golvK = P.krymp_aldre_min ?? 1;
      const start = arBak(d0) ? 1 : tak;
      if (start >= golvK - 1e-9) for (let k = start; k >= golvK - 1e-9; k -= steg) storlekar.push(Math.round(k * 100) / 100);
      else if (Number.isFinite(start)) storlekar.push(Math.round(start * 100) / 100);
    } else storlekar.push(1);
    if (!storlekar.length) storlekar.push(1);
    let fynd: Fynd | null = null;
    let krymp = 1;
    let minsta: { fri: Fynd | null; stall: Fynd | null } = { fri: null, stall: null };
    for (const rollNu of roller) {
    if (fynd) break;
    [roll, band] = [rollNu, regel.band[rollNu] ?? regel.band.mark!];
    rad = rader(band, roll);
    golvFel = false;
    // ryms den inte ens i den minsta storleken somnar den direkt (och då behöver inget annat prövas)
    minsta = sok(skalad(storlekar.at(-1)!), true);
    if (minsta.fri) {
      for (const k of storlekar.slice(0, -1)) {
        const f = sok(skalad(k), false).fri;
        if (f) {
          [fynd, krymp] = [f, k];
          break;
        }
      }
      if (!fynd) [fynd, krymp] = [minsta.fri, storlekar.at(-1)!];
    } else if (golvFel) {
      // för liten i den minsta storleken: en större kan få en ruta längre fram
      for (const k of storlekar.slice(0, -1)) {
        const f = sok(skalad(k), false).fri;
        if (f) {
          [fynd, krymp] = [f, k];
          break;
        }
      }
    }
    // den nya får alltid en ruta: ryms den inte i full storlek ritas den mindre, ned till krymp_min – och då i den storlek
    // som ger den främsta rutan (Arkitekten: den nyaste står främst; torrkörning 3: elefanten tog 80 % på z 1,05 och
    // katten och grisen hamnade framför den, med 60 % står den på z 3,45 längst fram)
    // P3a-fix (beslut C): också när den ryms i full storlek får den nya den främsta rutan – en mindre storlek vinner om den
    // står längre fram (Doodle 21 okt: det nya slottet i skogen hamnade längst bak). En småsak får växa (smasak_vaxa) tills
    // den når smasak_px.
    if (nr === 0 && krymp === 1 && !nyStorlek) {
      const redanStor = sma && fynd ? Math.max((fynd.k ?? fynd.lage.r).x1 - (fynd.k ?? fynd.lage.r).x0, (fynd.k ?? fynd.lage.r).y1 - (fynd.k ?? fynd.lage.r).y0) >= (P.smasak_min_px ?? 40) - 1e-9 : false;
      const prova = [...(sma && !redanStor ? (P.smasak_vaxa ?? []) : []), ...[0.9, 0.8, 0.7, 0.6].filter((k) => k >= (P.krymp_min ?? 0.6) - 1e-9)];
      for (const k2 of prova) {
        const f = sok(skalad(k2), false).fri;
        if (f && (!fynd || f.lage.z > fynd.lage.z + 1e-9)) [fynd, krymp] = [f, k2];
      }
    }
    }
    // P3a-fix (beslut B): ryms den inte ens minst och ingen ur budgeten kan somna, får den äldre bli ännu mindre
    // (reserv_krymp) – golvet (synlig_golv) gäller fortfarande, så den syns
    for (const k of nr > 0 && krympAldre && !fynd && alla.length <= RESERV_MAX ? (P.reserv_krymp ?? []).filter((k) => k <= tak + 1e-9) : []) {
      const f = sok(skalad(k), false).fri;
      if (f) {
        [fynd, krymp] = [f, k];
        break;
      }
    }
    if (!fynd) {
      const st = minsta.stall;
      if (!st) {
        // inget läge alls på rätt underlag (bör inte hända): längst bak i mitten, i stallet
        const z = band.z[0];
        const m = kroppMatt(d0, z, plats, roll, vandDel);
        ut.set(d0.uid, { x: 0, y: band.y?.[0] ?? 0, z, roll, r: sakRuta(0, z, m.halv, m.hojd, m.djup, m.y0, kam), stall: true, vand: vandDel });
        return;
      }
      // i stallet tar den ingen plats på skärmen, men ingen annan ställs ovanpå den
      // den sover i den storlek rutan räknades för (den minsta den fick pröva)
      const kMin = storlekar.at(-1)!;
      ut.set(d0.uid, kMin < 1 ? { ...st.lage, stall: true, krymp: kMin } : { ...st.lage, stall: true });
      // P3a-fix (beslut B): den som inte somnar ritas där – på skärmen räknas den då som skymmande för de äldre
      const syns = st.fel === 0 && st.lage.r !== TOM;
      satta.push({ id: d0.uid, x: st.lage.x, z: st.lage.z, halv: st.m.halv, djup: st.m.djup, r: syns ? st.lage.r : TOM, k: syns ? st.lage.r : TOM, tackt: 0, huvud: 0, grans: 1, fh: fh0, sma });
      return;
    }
    const lage = krymp !== 1 ? { ...fynd.lage, krymp } : fynd.lage;
    ut.set(d0.uid, lage);
    if (nr > 0 && !arBak(d0) && Number.isFinite(krymp)) {
      // reserv_krymp hos en nyare får inte dra de äldre under krymp_aldre_min: de prövar golvet först
      const golv = aldreTak !== undefined ? (P.krymp_aldre_min ?? krymp) : 0;
      tak = Math.min(tak, Math.max(krymp, golv));
    }
    for (const s of satta)
      if (s.r !== TOM && (framfor({ z: lage.z }, s) || Math.abs(lage.z - s.z) <= 0.05) && !(s.plan && roll === "vatten")) {
        s.tackt += varst(lage.r, fynd.k ?? lage.r, s.r, s.k, false);
        s.huvud += varst(lage.r, fynd.k ?? lage.r, s.r, s.k, true) / s.fh;
      }
    satta.push({ id: d0.uid, x: lage.x, z: lage.z, halv: fynd.m.halv, djup: fynd.m.djup, r: lage.r, k: fynd.k ?? lage.r, tackt: fynd.tackt, huvud: fynd.huvud, grans, roll, fh: fh0, sma });
  });
  // regelns egen räkning per synlig, när alla står (rundor/P3a-fix/kalibrera.ts jämför den med skärmprovets id-pass)
  for (const s of satta) {
    const l = ut.get(s.id);
    if (l && !l.stall) ut.set(s.id, { ...l, skymd: { tackt: s.tackt, huvud: s.huvud } });
  }
  return ut;
}
