// B6.1: dataändringen i B6.1-kontroll, gjord per nyckel (inte som diff) så att den går att lägga på även om modellpaketen
// eller Copilot har ändrat andra delar av data/bengtsson.json. Idempotent: körs den två gånger händer inget andra gången.
// En text byts bara om den gamla texten står kvar OCH uppdraget har granskad:false; annars lämnas den och skrivs ut som VARNING.
//   node rundor/B6.1-kontroll/b61-data.mjs          (exit 0 = klart, 2 = filen saknas eller ser fel ut)
import fs from "node:fs";

const FIL = "data/bengtsson.json";
const varningar = [];
const andrat = [];

// (C) Färguppdragen "lånar färg från en tomat/himlen/solen/gräset" var bildspråk som en sjuåring inte kan översätta.
// Nu säger Bengtsson rakt ut vilken sak färgen finns på ("en vän i tomatens färg"), utan att låna något. Färgordet självt
// (röd/rött/röda …) får inte stå i repliken: R6A-regeln "ledtråden läcker inte svaret" (uppdragsmotor.test) gäller
// alla böjningar. Kravord, klart-texter och idéer är orörda.
const TEXTER = {
 "tva-farger": [
  "Kan två vänner låna varsin färg från en tomat och en klar sommarhimmel?",
  "Jag vill se två vänner: en i tomatens färg och en i himlens färg!"
 ],
 "sol-och-gras": [
  "Låt två vänner låna färger från solen och gräset!",
  "Jag vill se två vänner: en i solens färg och en i gräsets färg!"
 ],
 "skog-rod-van": [
  "En vän vill låna samma färg som en mogen tomat!",
  "Jag vill se en vän i samma färg som en tomat!"
 ],
 "sjo-bla-van": [
  "En vän vill låna färgen från en klar sommarhimmel!",
  "Jag vill se en vän i samma färg som himlen!"
 ],
 "sjo-tva-farger": [
  "Två vänner lånar färg från en tomat och från himlen. Den ena badar. Den andra sitter på stranden.",
  "En vän i tomatens färg badar i vattnet. En vän i himlens färg sitter på stranden."
 ],
 "grotta-gul-van": [
  "En vän vill låna färgen från solen där ute!",
  "Jag vill se en vän i samma färg som solen!"
 ],
 "grotta-tva-farger": [
  "Två vänner lånar färg från gräset och solen. Den ena sitter på en sten. Den andra står bredvid.",
  "En vän i gräsets färg sitter på en sten. En vän i solens färg står bredvid stenen."
 ]
};

if (!fs.existsSync(FIL)) { console.error(`${FIL} saknas`); process.exit(2); }
const rå = fs.readFileSync(FIL, "utf8");
const j = JSON.parse(rå);
if (!Array.isArray(j.uppdrag)) { console.error(`${FIL}: uppdrag saknas`); process.exit(2); }
for (const [id, [gammal, ny]] of Object.entries(TEXTER)) {
  const u = j.uppdrag.find((x) => x.id === id);
  if (!u) { varningar.push(`${id}: uppdraget finns inte, lämnas`); continue; }
  if (u.text_bengtsson === ny) continue;
  if (u.granskad !== false) { varningar.push(`${id}: granskad är inte false (Copilot har granskat), lämnas orörd`); continue; }
  if (u.text_bengtsson !== gammal) { varningar.push(`${id}: står inte som väntat (${JSON.stringify(u.text_bengtsson)}), lämnas orörd`); continue; }
  u.text_bengtsson = ny;
  andrat.push(`${FIL} uppdrag ${id}.text_bengtsson`);
}
if (andrat.length) fs.writeFileSync(FIL, JSON.stringify(j, null, 1) + (rå.endsWith("\n") ? "\n" : ""));
for (const a of andrat) console.log(`ändrat: ${a}`);
for (const v of varningar) console.log(`VARNING: ${v}`);
console.log(`b61-data: ${andrat.length} ändrade, ${varningar.length} varningar`);
