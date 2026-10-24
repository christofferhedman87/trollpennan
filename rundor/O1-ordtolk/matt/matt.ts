import { tolka } from "../../../src/tolk/tolka.ts";
import { lasToken, langstaSuffix } from "../../../src/tolk/lexikon.ts";
import { tolkaMedReserv } from "../../../src/tolk/reserv.ts";
import { readFileSync } from "node:fs";
const kelly = JSON.parse(readFileSync("/workspace/arkitekt-mat/kelly.json","utf8")) as any[];
const nouns = [...new Set(kelly.filter(k=>true).map(k=>String(k.gf).toLowerCase()).filter(w=>/^[a-zåäö]+$/.test(w)))];
const djur = ["kapybara","capybara","bältdjur","myrslok","tapir","okapi","jaguar","gepard","leopard","puma","lodjur","järv","grävling","mård","vessla","hermelin","illern","sengångare","lemur","gorilla","schimpans","orangutang","babian","lama","jak","bison","wombat","näbbdjur","dromedar","antilop","gasell","gnu","hyena","surikat","mangust","piggsvin","skunk","tvättbjörn","bläckfisk","sjöhäst","manet","sjöko","valross","säl","pelikan","kakadua","undulat","kanariefågel","koltrast","rödhake","domherre","talgoxe","skata","kaja","måsfågel","albatross","kondor","gam","struts","emu","kasuar","axolotl","kameleont","leguan","gecko","salamander","ödla","sköldpadda","alligator","kobra","pyton","anakonda","skorpion","tarantel","snigel","mask","larv","marsvin","chinchilla","degu","gerbil","ökenråtta","lämmel","bäver","utter","mink","älg","ren","rådjur","dovhjort","mufflon","ibex","stenbock","jakuar"];
const rows: string[] = ["lista\tord\tblev\tokänd_del\tsuffix"];
let n: Record<string,number> = {kelly:0,kellyTraff:0,djur:0,djurTraff:0};
function prova(lista: string, w: string) {
  n[lista]++;
  if (lasToken(w)) return; // hel ordmatchning finns
  const s = langstaSuffix(w);
  if (!s) return;
  const u: any = tolka(w);
  if (u.typ !== "skapad") return;
  const del = (u.okanda ?? []).filter((x: string) => x !== w);
  if (!del.length) return; // prefixet var känt = äkta sammansättning
  n[lista+"Traff"]++;
  rows.push([lista+":"+(kelly.find(k=>String(k.gf).toLowerCase()===w)?.pos??"djur"), w, u.varelse.formel, del.join("+"), s.form].join("\t"));
}
const facit = readFileSync("facit-o1a.tsv", "utf8").trim().split("\n").slice(1).map((line) => {
  const [lista, ord, , , facitKol, forvantat] = line.split("\t");
  return { lista, ord: ord ?? "", facit: facitKol ?? "", forvantat: forvantat ?? "" };
});
const rattOrd = new Set(facit.filter((r) => r.facit === "ratt").map((r) => r.ord));
const felDjur: Record<string, number> = { kelly: 0, djur: 0 };
function raknaFelDjur(lista: string, w: string) {
  if (lasToken(w) || rattOrd.has(w)) return;
  const u = tolkaMedReserv(w);
  if (u.typ !== "skapad" || u.varelse.kropp === "agg") return;
  // Äkta sammansättning (barnbarn, sjöhäst, måsfågel) har inget okänt led och räknas inte.
  const bas = tolka(w);
  const okanda = (bas.typ === "skapad" || bas.typ === "behover_djur" ? bas.okanda : []).filter((x) => x !== w);
  if (!okanda.length) return;
  const s = langstaSuffix(w);
  const franEfterled = s?.ord.del?.kropp ?? s?.ord.id;
  if (!s || franEfterled !== u.varelse.kropp) return;
  felDjur[lista] = (felDjur[lista] ?? 0) + 1;
}
for (const w of nouns) { prova("kelly", w); raknaFelDjur("kelly", w); }
for (const w of djur) { prova("djur", w); raknaFelDjur("djur", w); }
let rattBehallna = 0;
for (const r of facit) {
  if (r.facit !== "ratt") continue;
  const u = tolkaMedReserv(r.ord);
  if (u.typ === "skapad" && u.varelse.kropp === r.forvantat) rattBehallna++;
}
console.log(n);
console.log("fel_djur", felDjur);
console.log("ratt_behallna", rattBehallna, "av", facit.filter((r) => r.facit === "ratt").length);
const bySuf: Record<string,number> = {};
for (const r of rows.slice(1)) { const s=r.split("\t")[4]!; bySuf[s]=(bySuf[s]??0)+1; }
console.log(Object.entries(bySuf).sort((a,b)=>b[1]-a[1]).slice(0,20));
const kort = rows.slice(1).filter(r=>r.split("\t")[4]!.length<=3).length;
console.log("med suffix <=3 tecken:", kort);
