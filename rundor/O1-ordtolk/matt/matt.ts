import { tolka } from "../../../src/tolk/tolka.ts";
import { lasToken, langstaSuffix } from "../../../src/tolk/lexikon.ts";
import { readFileSync, writeFileSync } from "node:fs";
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
for (const w of nouns) prova("kelly", w);
for (const w of djur) prova("djur", w);
writeFileSync("suffixfel.tsv", rows.join("\n")+"\n");
console.log(n);
const bySuf: Record<string,number> = {};
for (const r of rows.slice(1)) { const s=r.split("\t")[4]!; bySuf[s]=(bySuf[s]??0)+1; }
console.log(Object.entries(bySuf).sort((a,b)=>b[1]-a[1]).slice(0,20));
const kort = rows.slice(1).filter(r=>r.split("\t")[4]!.length<=3).length;
console.log("med suffix <=3 tecken:", kort);
