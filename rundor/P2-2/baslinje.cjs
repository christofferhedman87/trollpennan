// P2-2: lägger till titelskärmens och guidens nya testid i check:struktur-baslinjen (körs av kor.sh, inte i patchen: filen delas av alla rundor).
const fs=require("fs"),f="rundor/R1-dela-spel/testid-baslinje.json",b=JSON.parse(fs.readFileSync(f));
const plus=["intro-ljud","titel","titel-fortsatt","titel-rad","titel-borja-om","titel-borja","titel-angra","titel-fraga","titel-nej","titel-ja","coach"];
for(const k of plus){const q=JSON.stringify(k);b[q]=(b[q]??0)+1;}
const s=Object.fromEntries(Object.keys(b).sort().map(k=>[k,b[k]]));
fs.writeFileSync(f,JSON.stringify(s,null,2)+"\n");
