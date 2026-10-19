// R9K: dataändringarna i R9K-fix, gjorda per nyckel (inte som diff) så att de går att lägga på även om modellpaketen
// (M10–M12) eller Copilot har ändrat andra delar av samma filer. Idempotent: körs den två gånger händer inget andra gången.
// Varje text byts bara om den gamla texten står kvar; har någon annan redan ändrat den lämnas den och skrivs ut som VARNING.
//   node rundor/R9K-fix/r9k-data.mjs          (exit 0 = klart, 2 = en fil saknas eller ser fel ut)
import fs from "node:fs";

const varningar = [];
const andrat = [];
function las(fil) {
  const s = fs.readFileSync(fil, "utf8");
  return { j: JSON.parse(s), nl: s.endsWith("\n") };
}
function skriv(fil, { j, nl }) {
  fs.writeFileSync(fil, JSON.stringify(j, null, 1) + (nl ? "\n" : ""));
}
function byt(fil, var_, nu, gammal, ny, satt) {
  if (nu === ny) return;
  if (nu !== gammal) { varningar.push(`${fil} ${var_}: står inte som väntat (${JSON.stringify(nu)}), lämnas orörd`); return; }
  satt(ny); andrat.push(`${fil} ${var_}`);
}

// 2. Uppdragstexter som var för abstrakta för en sjuåring (Arkitektens utkast, granskad: false). Kravorden är orörda.
const TEXTER = {
 "skog-under-tradet": [
  "En vän vill ha grenar ovanför huvudet! Kan dina ord visa rätt plats?",
  "En vän vill sitta i skuggan under grenarna. Var sitter den? Skriv det!"
 ],
 "skog-stor-och-liten": [
  "Två vänner vill vara olika stora! Kan du låta orden visa skillnaden?",
  "Jag vill se två vänner. En ska vara stor som ett hus. En ska vara pytte, som en myra!"
 ],
 "sjo-tva-storlekar": [
  "Två simmande vänner vill vara olika stora! Kan dina ord visa skillnaden?",
  "Två vänner vill simma. En är stor som en båt. En är pytte, som en myra!"
 ],
 "grotta-stor-och-liten": [
  "Två vänner vill prova helt olika storlekar! Kan dina ord visa skillnaden?",
  "Två vänner vill bo här inne. En är stor som en björn. En är pytte, som en myra!"
 ],
 "sjo-i-baten": [
  "En vän vill sitta innanför kanterna, inte bredvid farkosten! Kan orden visa var?",
  "En vän vill sitta i en båt med åror. Kan du skriva det?"
 ],
 "sjo-pa-bryggan": [
  "Träplankorna blir en fin sittplats ovanför vattnet! Kan orden visa var en vän sitter?",
  "En vän vill dingla med tassarna ovanför vattnet. Var kan den sitta?"
 ],
 "grotta-under-bordet": [
  "En vän vill ha möbelns skiva ovanför huvudet! Kan orden visa rätt plats?",
  "En vän vill gömma sig under något som vi äter vid. Kan du skriva det?"
 ],
 "grotta-tva-farger": [
  "Två vänner lånar färg från gräset och solen! En sitter högre, den andra intill.",
  "Två vänner lånar färg från gräset och solen. Den ena sitter på en sten. Den andra står bredvid."
 ],
 "sjo-tva-farger": [
  "Två vänner lånar färg från en tomat och himlen! En vill bada, den andra stanna vid land.",
  "Två vänner lånar färg från en tomat och från himlen. Den ena badar. Den andra sitter på stranden."
 ],
 "grotta-glitter-i-kistan": [
  "En vän vill spara något som glimmar bakom ett lock! Kan orden visa både vännen och innehållet?",
  "En vän har en skattkista. Den vill gömma något som glittrar i den. Vad kan det vara?"
 ],
 "grotta-ljus-utanfor": [
  "En vän vill vila innanför väggarna och se ett sken utanför ingången! Kan du ordna båda?",
  "En vän vill sova i en koja. Utanför ska det lysa lite. Vad kan lysa?"
 ],
 "skog-ljus-vid-krypin": [
  "En vän vill vila inomhus och se ett sken utanför ingången! Kan du ordna båda platserna?",
  "En vän vill sova i ett tält. Utanför ska det lysa lite. Vad kan lysa?"
 ],
 "skog-mysig-lasplats": [
  "En vän vill läsa när kvällen kommer! Vad behövs för både berättelsen och skenet?",
  "En vän vill läsa en saga när det blir mörkt. Vad behöver den?"
 ],
 "sjo-las-och-lys": [
  "En vän vill läsa vid vattnet när det skymmer! Vad behövs för berättelsen och skenet?",
  "En vän vill läsa en saga vid vattnet när det blir mörkt. Vad behöver den?"
 ],
 "grotta-sken-och-saga": [
  "En vän vill läsa här inne! Vad behövs för både berättelsen och skenet?",
  "En vän vill läsa en saga här inne i mörkret. Vad behöver den?"
 ],
 "grotta-ordna-lasning": [
  "En vän vill bläddra bland ord och bilder utan att lämna sin sittplats!",
  "En vän vill sitta still och titta på bilder och ord. Vad kan den läsa?"
 ],
 "grotta-eget-krypin": [
  "En vän vill ha en egen liten vrå här inne! Vad kan ge väggar runt viloplatsen?",
  "En vän vill ha ett eget litet hem här inne. Vad kan den bo i?"
 ],
 "grotta-mjuk-vila": [
  "Gääsp! En vän vill vila utan att ligga direkt mot berget.",
  "Gääsp! Berget är så hårt. Var kan en vän sova mjukt?"
 ],
 "sjo-ovantad-kapten": [
  "Vem kan få skjuts trots att den redan kan simma? Låt en sådan vän bli passagerare!",
  "Ett djur som bor i vattnet vill åka båt! Kan du skriva det?"
 ],
 "sjo-tva-satt-att-resa": [
  "En vän vill åka över vattnet och en annan gå över det! Kan du ordna båda sätten?",
  "En vän vill ro över vattnet. En annan vill gå över en bro. Kan du ordna det?"
 ],
 "sjo-skugga-pa-stranden": [
  "Solen kittlar min näsa! Kan en vän få vila där strålarna inte når?",
  "Solen kittlar min näsa! Var kan en vän vila i skuggan på stranden?"
 ],
 "sjo-final-vattenglitter": [
  "Min minnesmaskin vill minnas både glittret och strandens färger! Vad kan en vän ta med?",
  "Min minnesmaskin vill ha något som glittrar och något som blommar. Kan en vän ta med det?"
 ],
 "grotta-final-bergets-berattelse": [
  "Min minnesmaskin behöver bergets glitter och något fullt av berättelser! Kan en vän ta med båda?",
  "Min minnesmaskin vill ha något som glittrar i berget och något med sagor i. Kan en vän ta med det?"
 ],
 "skog-hitta-riktningen": [
  "Min uppfinning visar bara vägen till mitt kylskåp! Vad hjälper en vän att hitta både väg och riktning?",
  "En vän har gått vilse i skogen. Vad kan visa vägen hem? Den behöver två saker."
 ],
 "ordet-med": [
  "Ditt djur vill ha något hos sig! Vilket litet ord binder ihop dem?",
  "Ditt djur vill ha något med sig. Skriv det med ordet med!"
 ],
 "ordet-i": [
  "Ditt djur vill vara innanför, inte utanför! Vilket litet ord visar platsen?",
  "Ditt djur vill sitta inne i något. Skriv det med ordet i!"
 ],
 "ordet-under": [
  "Ditt djur vill ha något över huvudet! Vilket ord visar var det står?",
  "Ditt djur vill stå under något. Skriv det med ordet under!"
 ],
 "ordet-pa": [
  "Ditt djur vill sitta en bit ovanför marken! Vilket litet ord visar platsen?",
  "Ditt djur vill sitta uppe på något. Skriv det med ordet på!"
 ],
 "hogt-och-lagt": [
  "Ditt djur vill jämföra två saker som når olika långt upp!",
  "Ditt djur vill stå vid två saker. En når upp till molnen. En når bara till knät."
 ],
 "varmt-och-kallt": [
  "Ditt djur vill jämföra två motsatser som känns olika mot tassen!",
  "Ditt djur vill ha något som värmer och något som kyler, som is!"
 ],
 "snabb-och-langsam": [
  "Två vänner tar sig fram i olika takt, en susar och en tar god tid på sig!",
  "Två vänner ska tävla. En susar fram som vinden. En kryper fram som en snigel."
 ],
 "ovantat-kompismote": [
  "Vilka två vänner skulle behöva resa riktigt långt från sina vanliga hem för att mötas?",
  "Ett djur från den kalla isen vill träffa ett djur från den varma djungeln. Vilka två?"
 ],
 "omvanda-storlekar": [
  "Min storleksmaskin har vänt på allt! Kan två vänner visa hur tokigt det blev?",
  "Min maskin har blivit tokig! Ett jättedjur blev som en myra, och en myra blev som ett hus!"
 ],
 "resa-fran-soffan": [
  "Ditt djur vill upptäcka fjärran platser men sitta kvar hemma! Hur går det till?",
  "Ditt djur vill se hela världen, men sitta kvar i soffan. Vad kan hjälpa?"
 ]
};
{
  const fil = "data/bengtsson.json"; const f = las(fil);
  for (const [id, [gammal, ny]] of Object.entries(TEXTER)) {
    const u = f.j.uppdrag.find((x) => x.id === id);
    if (!u) { varningar.push(`${fil} ${id}: uppdraget finns inte`); continue; }
    byt(fil, `${id}.text_bengtsson`, u.text_bengtsson, gammal, ny, (v) => { u.text_bengtsson = v; });
  }
  skriv(fil, f);
}

// 4. Humörikonen: en ikon per humör i data, ingen kod per humör.
const IKON = { glad: "😊", lekfull: "⚽", nyfiken: "❓", sugen: "🍎", pratsam: "💬", somnig: "💤" };
{
  const fil = "data/humor.json"; const f = las(fil);
  for (const h of f.j.humor) {
    if (h.ikon || !IKON[h.id]) continue;
    // ikon läggs direkt efter namn så att raden är lätt att hitta
    const ny = {};
    for (const [k, v] of Object.entries(h)) { ny[k] = v; if (k === "namn") ny.ikon = IKON[h.id]; }
    if (!("ikon" in ny)) ny.ikon = IKON[h.id];
    Object.keys(h).forEach((k) => delete h[k]); Object.assign(h, ny);
    andrat.push(`${fil} ${h.id}.ikon`);
  }
  const vis = "En liten ikon över djuret och en replik när man trycker. Ikonen per humör står i 'ikon' (R9K); ett humör utan ikon visar ingen.";
  if (f.j.regler.visning !== vis) { f.j.regler.visning = vis; andrat.push(`${fil} regler.visning`); }
  skriv(fil, f);
}

// 6. Grottans stenar: materialet "grass" (Kenneys gröna topp på klippa/klippblock) får stenfärg. Gäller dekor och startobjekt på platsen.
{
  const fil = "data/platser.json"; const f = las(fil);
  const g = f.j.platser.find((p) => p.id === "grottan");
  if (!g) { console.error(`STOPP: ${fil} saknar grottan`); process.exit(2); }
  const mf = { grass: "#9C96A6" };
  if (JSON.stringify(g.materialfarger) !== JSON.stringify(mf)) {
    const ny = {};
    for (const [k, v] of Object.entries(g)) { if (k === "materialfarger") continue; ny[k] = v; if (k === "dekor") ny.materialfarger = mf; }
    if (!("materialfarger" in ny)) ny.materialfarger = mf;
    Object.keys(g).forEach((k) => delete g[k]); Object.assign(g, ny);
    andrat.push(`${fil} grottan.materialfarger`);
  }
  skriv(fil, f);
}

// 8. Repliker som nämnde ängen på alla platser: platshållare som spelet fyller med platsen barnet är på.
{
  const fil = "data/ord.json"; const f = las(fil);
  const r = f.j.repliker;
  const rader = [
    ["fartlinjer", "Ingen på hela ängen springer fortare än jag!", "Ingen på hela {platsen} springer fortare än jag!"],
    ["studs", "Jag studsade så högt att jag såg hela ängen.", "Jag studsade så högt att jag såg hela {platsen}."],
  ];
  for (const [nyckel, gammal, ny] of rader) {
    const lista = r[nyckel] ?? [];
    const i = lista.indexOf(gammal) >= 0 ? lista.indexOf(gammal) : lista.indexOf(ny);
    if (i < 0) { varningar.push(`${fil} repliker.${nyckel}: "${gammal}" finns inte`); continue; }
    byt(fil, `repliker.${nyckel}[${i}]`, lista[i], gammal, ny, (v) => { lista[i] = v; });
  }
  skriv(fil, f);
}
{
  const fil = "data/texter-gard.json"; const f = las(fil);
  const lista = f.j.klapp.en;
  const gammal = "Ängen är finast när du är här.", ny = "{Platsen} är finast när du är här.";
  const i = lista.indexOf(gammal) >= 0 ? lista.indexOf(gammal) : lista.indexOf(ny);
  if (i < 0) varningar.push(`${fil} klapp.en: "${gammal}" finns inte`);
  else byt(fil, `klapp.en[${i}]`, lista[i], gammal, ny, (v) => { lista[i] = v; });
  skriv(fil, f);
}

for (const v of varningar) console.log(`VARNING: ${v}`);
console.log(`r9k-data: ${andrat.length} ändringar${andrat.length ? ": " + andrat.join(", ") : " (redan inlagt)"}`);
