// P2-1: lägger till introts nya testid i check:struktur-baslinjen (körs av kor.sh, inte i patchen: filen delas av alla rundor).
const fs=require("fs"),f="rundor/R1-dela-spel/testid-baslinje.json",b=JSON.parse(fs.readFileSync(f));
const plus={"\"intro-skriv\"":1,"\"intro-ruta\"":1,"\"intro-vakna\"":1,"\"intro-hjalp\"":1,"\"intro-tangentbord\"":1,"\"intro-tangent\"":1,"\"intro-tillbaka\"":1,"\"intro-ide\"":1,"\"intro-ideer\"":1};
for(const [k,v] of Object.entries(plus)) b[k]=(b[k]??0)+v;
const s=Object.fromEntries(Object.keys(b).sort().map(k=>[k,b[k]]));
fs.writeFileSync(f,JSON.stringify(s,null,2)+"\n");
