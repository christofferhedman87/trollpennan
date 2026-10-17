import fs from "node:fs";
import path from "node:path";

const root = path.resolve("public/kit-platshallare");

function svg(w, h, inner) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>\n`;
}

function write(rel, text) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
}

function prickar(sil) {
  let d = "";
  for (let y = 36; y < 490; y += 34) {
    for (let x = 28 + ((y / 34) % 2) * 16; x < 490; x += 34) {
      d += `<circle cx="${x}" cy="${y}" r="8" fill="#fff"/>`;
    }
  }
  return svg(512, 512, `<defs><clipPath id="c">${sil}</clipPath></defs><g clip-path="url(#c)">${d}</g>`);
}

function rander(sil) {
  let d = "";
  for (let i = -512; i < 768; i += 28) {
    d += `<line x1="${i}" y1="0" x2="${i + 220}" y2="512" stroke="#fff" stroke-width="12"/>`;
  }
  return svg(512, 512, `<defs><clipPath id="c">${sil}</clipPath></defs><g clip-path="url(#c)">${d}</g>`);
}

function glitter(sil) {
  const farger = ["#FFE082", "#F48FB1", "#80DEEA", "#FFF59D", "#CE93D8"];
  let d = "";
  let n = 0;
  for (let y = 48; y < 470; y += 36) {
    for (let x = 40; x < 480; x += 40) {
      const f = farger[n % farger.length];
      n += 1;
      if ((n + y) % 3 === 0) continue;
      d += `<circle cx="${x}" cy="${y}" r="4" fill="${f}"/>`;
      d += `<path d="M${x} ${y - 8} L${x + 2} ${y - 2} L${x + 8} ${y} L${x + 2} ${y + 2} L${x} ${y + 8} L${x - 2} ${y + 2} L${x - 8} ${y} L${x - 2} ${y - 2} Z" fill="${f}"/>`;
    }
  }
  return svg(512, 512, `<defs><clipPath id="c">${sil}</clipPath></defs><g clip-path="url(#c)">${d}</g>`);
}

function regnbage(sil) {
  const band = ["#E53935", "#FB8C00", "#FDD835", "#43A047", "#1E88E5", "#8E24AA"];
  let d = "";
  band.forEach((f, i) => {
    d += `<rect x="${40 + i * 70}" y="0" width="70" height="512" fill="${f}" opacity="0.9"/>`;
  });
  return svg(512, 512, `<defs><clipPath id="c">${sil}</clipPath></defs><g clip-path="url(#c)">${d}</g>`);
}

function kropp(id, sil, ansikte) {
  const bas = svg(512, 512, `<g fill="#F2F2F2">${sil}</g>`);
  const skugga = svg(
    512,
    512,
    `<g fill="#4a372c" opacity="0.62" transform="translate(16,24)">${sil}</g>`,
  );
  const linje = svg(
    512,
    512,
    `<g fill="none" stroke="#2C2416" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">${sil}</g>${ansikte}`,
  );
  write(`kroppar/${id}/bas.svg`, bas);
  write(`kroppar/${id}/skugga.svg`, skugga);
  write(`kroppar/${id}/linje.svg`, linje);
  write(`kroppar/${id}/prickar.svg`, prickar(sil));
  write(`kroppar/${id}/rander.svg`, rander(sil));
  write(`kroppar/${id}/glitter.svg`, glitter(sil));
  write(`kroppar/${id}/regnbage.svg`, regnbage(sil));
}

function ogon(x, y, gap) {
  return `<circle cx="${x - gap}" cy="${y}" r="7" fill="#2C2416"/><circle cx="${x + gap}" cy="${y}" r="7" fill="#2C2416"/><circle cx="${x - gap + 2}" cy="${y - 2}" r="2" fill="#fff"/><circle cx="${x + gap + 2}" cy="${y - 2}" r="2" fill="#fff"/>`;
}
function leende(x, y, b = 22) {
  return `<path d="M${x - b} ${y} Q${x} ${y + 16} ${x + b} ${y}" fill="none" stroke="#2C2416" stroke-width="6" stroke-linecap="round"/>`;
}

const ankare = {
  kanin: { huvud: [256, 108], ogon: [256, 168], mun: [256, 198], rygg: [250, 248], sida: [360, 300], svans: [140, 340], fotter: [256, 460], mitt: [256, 300] },
  katt: { huvud: [268, 112], ogon: [268, 176], mun: [268, 206], rygg: [250, 250], sida: [370, 300], svans: [120, 280], fotter: [270, 460], mitt: [270, 310] },
  hund: { huvud: [256, 112], ogon: [256, 178], mun: [256, 230], rygg: [256, 260], sida: [370, 320], svans: [120, 330], fotter: [256, 468], mitt: [256, 320] },
  drake: { huvud: [330, 108], ogon: [320, 145], mun: [400, 160], rygg: [230, 250], sida: [370, 320], svans: [100, 370], fotter: [250, 468], mitt: [260, 320] },
  häst: { huvud: [330, 78], ogon: [340, 115], mun: [370, 150], rygg: [240, 250], sida: [380, 300], svans: [110, 330], fotter: [270, 470], mitt: [260, 310] },
  fågel: { huvud: [256, 112], ogon: [250, 162], mun: [340, 185], rygg: [230, 240], sida: [360, 280], svans: [160, 250], fotter: [250, 450], mitt: [256, 300] },
  fisk: { huvud: [300, 200], ogon: [330, 230], mun: [390, 270], rygg: [270, 220], sida: [380, 300], svans: [90, 270], fotter: [280, 400], mitt: [280, 280] },
  groda: { huvud: [256, 168], ogon: [256, 188], mun: [256, 250], rygg: [256, 260], sida: [390, 320], svans: [120, 340], fotter: [256, 450], mitt: [256, 310] },
};

kropp(
  "kanin",
  `<ellipse cx="256" cy="320" rx="116" ry="124"/>
   <circle cx="256" cy="176" r="72"/>
   <ellipse cx="214" cy="78" rx="22" ry="70" transform="rotate(-10 214 78)"/>
   <ellipse cx="300" cy="74" rx="22" ry="72" transform="rotate(12 300 74)"/>
   <ellipse cx="150" cy="348" rx="28" ry="22"/>
   <ellipse cx="198" cy="452" rx="34" ry="18"/>
   <ellipse cx="318" cy="452" rx="34" ry="18"/>`,
  ogon(256, 168, 26) + leende(256, 196),
);

kropp(
  "katt",
  `<ellipse cx="274" cy="324" rx="108" ry="116"/>
   <circle cx="274" cy="186" r="74"/>
   <polygon points="214,150 168,58 250,132"/>
   <polygon points="330,146 378,52 292,124"/>
   <ellipse cx="156" cy="300" rx="24" ry="40" transform="rotate(-50 156 300)"/>
   <ellipse cx="112" cy="246" rx="18" ry="34" transform="rotate(-8 112 246)"/>
   <ellipse cx="214" cy="452" rx="28" ry="16"/>
   <ellipse cx="334" cy="450" rx="28" ry="16"/>`,
  ogon(274, 178, 24) +
    leende(274, 206, 16) +
    `<path d="M210 196 H168 M338 196 H380 M214 208 H160 M334 208 H388" stroke="#2C2416" stroke-width="3" stroke-linecap="round"/>`,
);

kropp(
  "hund",
  `<ellipse cx="256" cy="330" rx="122" ry="112"/>
   <circle cx="256" cy="186" r="78"/>
   <ellipse cx="180" cy="210" rx="30" ry="52"/>
   <ellipse cx="332" cy="210" rx="30" ry="52"/>
   <ellipse cx="256" cy="228" rx="38" ry="28"/>
   <ellipse cx="118" cy="328" rx="42" ry="18" transform="rotate(-24 118 328)"/>
   <ellipse cx="196" cy="458" rx="30" ry="16"/>
   <ellipse cx="324" cy="458" rx="30" ry="16"/>`,
  ogon(256, 176, 26) +
    `<ellipse cx="256" cy="214" rx="10" ry="7" fill="#2C2416"/>` +
    leende(256, 236, 18),
);

kropp(
  "drake",
  `<ellipse cx="246" cy="340" rx="128" ry="108"/>
   <ellipse cx="318" cy="210" rx="48" ry="72"/>
   <ellipse cx="352" cy="148" rx="62" ry="40"/>
   <polygon points="400,132 468,156 396,184"/>
   <polygon points="168,250 128,188 214,228"/>
   <polygon points="206,236 176,168 246,214"/>
   <polygon points="248,228 236,156 292,208"/>
   <ellipse cx="150" cy="360" rx="52" ry="20" transform="rotate(18 150 360)"/>
   <ellipse cx="92" cy="392" rx="36" ry="16" transform="rotate(36 92 392)"/>
   <ellipse cx="190" cy="462" rx="28" ry="14"/>
   <ellipse cx="310" cy="464" rx="28" ry="14"/>`,
  ogon(330, 142, 16) + `<path d="M392 158 Q420 168 448 156" fill="none" stroke="#2C2416" stroke-width="6" stroke-linecap="round"/>`,
);

kropp(
  "häst",
  `<ellipse cx="246" cy="328" rx="120" ry="96"/>
   <ellipse cx="318" cy="210" rx="34" ry="78"/>
   <ellipse cx="348" cy="118" rx="30" ry="46"/>
   <ellipse cx="392" cy="142" rx="36" ry="18"/>
   <circle cx="292" cy="96" r="22"/>
   <circle cx="276" cy="132" r="18"/>
   <circle cx="274" cy="166" r="16"/>
   <ellipse cx="118" cy="336" rx="46" ry="16" transform="rotate(8 118 336)"/>
   <rect x="176" y="392" width="26" height="78" rx="12"/>
   <rect x="230" y="404" width="26" height="68" rx="12"/>
   <rect x="292" y="396" width="26" height="76" rx="12"/>
   <rect x="348" y="388" width="24" height="82" rx="12"/>`,
  ogon(352, 112, 10) + `<ellipse cx="392" cy="132" rx="8" ry="6" fill="#2C2416"/>`,
);

kropp(
  "fågel",
  `<ellipse cx="256" cy="300" rx="102" ry="118"/>
   <circle cx="250" cy="168" r="56"/>
   <polygon points="292,162 392,186 292,208"/>
   <ellipse cx="168" cy="250" rx="34" ry="56" transform="rotate(-28 168 250)"/>
   <ellipse cx="150" cy="300" rx="22" ry="16"/>
   <ellipse cx="206" cy="438" rx="24" ry="12"/>
   <ellipse cx="286" cy="440" rx="24" ry="12"/>`,
  ogon(246, 162, 16) + `<path d="M300 186 L360 196" stroke="#2C2416" stroke-width="4" stroke-linecap="round"/>`,
);

kropp(
  "fisk",
  `<ellipse cx="286" cy="276" rx="132" ry="96"/>
   <polygon points="150,250 48,190 70,276 48,360 150,310"/>
   <ellipse cx="250" cy="188" rx="28" ry="16"/>
   <ellipse cx="230" cy="392" rx="26" ry="14"/>
   <ellipse cx="330" cy="394" rx="26" ry="14"/>`,
  ogon(330, 250, 0).replace('cx="330"', 'cx="338"') +
    `<circle cx="338" cy="250" r="12" fill="#2C2416"/><circle cx="342" cy="246" r="4" fill="#fff"/>` +
    `<path d="M400 268 Q430 280 448 266" fill="none" stroke="#2C2416" stroke-width="6" stroke-linecap="round"/>`,
);

kropp(
  "groda",
  `<ellipse cx="256" cy="318" rx="156" ry="102"/>
   <ellipse cx="176" cy="196" rx="52" ry="42"/>
   <ellipse cx="336" cy="196" rx="52" ry="42"/>
   <ellipse cx="150" cy="420" rx="46" ry="28"/>
   <ellipse cx="362" cy="420" rx="46" ry="28"/>`,
  `<circle cx="176" cy="190" r="16" fill="#2C2416"/><circle cx="336" cy="190" r="16" fill="#2C2416"/>
   <circle cx="180" cy="186" r="5" fill="#fff"/><circle cx="340" cy="186" r="5" fill="#fff"/>` +
    `<path d="M200 250 Q256 300 312 250" fill="none" stroke="#2C2416" stroke-width="7" stroke-linecap="round"/>`,
);

function del(rel, w, h, inner) {
  write(rel, svg(w, h, inner));
}

del(
  "formagor/vingar.svg",
  240,
  150,
  `<path d="M120 118 C100 70 30 60 18 24 C62 8 108 58 120 108" fill="#F2F2F2" stroke="#D5D5D5" stroke-width="4"/>
   <path d="M120 118 C140 70 210 60 222 24 C178 8 132 58 120 108" fill="#F2F2F2" stroke="#D5D5D5" stroke-width="4"/>`,
);
del(
  "formagor/fenor.svg",
  120,
  90,
  `<path d="M16 46 C40 10 90 16 108 40 C90 70 40 78 16 46 Z" fill="#F2F2F2" stroke="#D5D5D5" stroke-width="4"/>`,
);
del(
  "formagor/aura.svg",
  512,
  512,
  `<defs><radialGradient id="a"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="0.45" stop-color="#fff6c2" stop-opacity="0.45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><circle cx="256" cy="256" r="230" fill="url(#a)"/>`,
);
del(
  "formagor/flammor.svg",
  90,
  130,
  `<path d="M45 120 C20 90 8 70 22 40 C30 62 38 58 42 36 C52 58 58 50 70 28 C78 60 84 78 68 120 Z" fill="#F7F7F7"/>`,
);
del(
  "formagor/fartlinjer.svg",
  180,
  70,
  `<path d="M10 16 H150 M30 35 H170 M16 54 H130" stroke="#2C2416" stroke-width="8" stroke-linecap="round" opacity="0.8"/>`,
);
del(
  "formagor/studs.svg",
  140,
  50,
  `<path d="M16 10 Q40 40 64 10 M76 10 Q100 40 124 10" fill="none" stroke="#2C2416" stroke-width="6" stroke-linecap="round"/>`,
);

const kant = `stroke="#2C2416" stroke-width="6" stroke-linejoin="round"`;
del(
  "tillbehor/hatt.svg",
  200,
  140,
  `<ellipse cx="100" cy="108" rx="90" ry="18" fill="#F2F2F2" ${kant}/>
   <rect x="62" y="28" width="76" height="82" rx="16" fill="#F2F2F2" ${kant}/>`,
);
del(
  "tillbehor/krona.svg",
  170,
  100,
  `<polygon points="10,78 30,28 55,62 85,12 115,62 140,28 160,78" fill="#F2F2F2" ${kant}/>
   <rect x="14" y="74" width="142" height="16" rx="4" fill="#F2F2F2" ${kant}/>`,
);
del(
  "tillbehor/glasogon.svg",
  190,
  70,
  `<circle cx="52" cy="36" r="26" fill="none" stroke="#F2F2F2" stroke-width="12"/>
   <circle cx="138" cy="36" r="26" fill="none" stroke="#F2F2F2" stroke-width="12"/>
   <path d="M78 36 H112 M26 36 H8 M164 36 H182" stroke="#F2F2F2" stroke-width="10" stroke-linecap="round"/>`,
);
del(
  "tillbehor/halsduk.svg",
  170,
  110,
  `<path d="M20 20 H150 Q160 20 150 40 L120 100 H95 L78 48 H20 Z" fill="#F2F2F2" ${kant}/>`,
);
del(
  "tillbehor/rosett.svg",
  140,
  90,
  `<path d="M70 45 L12 16 L20 74 Z M70 45 L128 16 L120 74 Z" fill="#F2F2F2" ${kant}/>
   <circle cx="70" cy="45" r="12" fill="#F2F2F2" ${kant}/>`,
);
del(
  "tillbehor/horn.svg",
  80,
  130,
  `<polygon points="40,8 62,118 18,118" fill="#F2F2F2" ${kant}/>`,
);
del(
  "tillbehor/ryggsack.svg",
  150,
  170,
  `<rect x="28" y="36" width="94" height="120" rx="24" fill="#F2F2F2" ${kant}/>
   <path d="M48 40 C48 16 102 16 102 40" fill="none" stroke="#2C2416" stroke-width="8"/>
   <rect x="48" y="78" width="54" height="28" rx="6" fill="none" stroke="#2C2416" stroke-width="5"/>`,
);
del(
  "tillbehor/mantel.svg",
  240,
  280,
  `<path d="M120 16 L220 70 L200 260 Q120 230 40 260 L20 70 Z" fill="#F2F2F2" ${kant}/>
   <circle cx="120" cy="28" r="12" fill="#F2F2F2" ${kant}/>`,
);

const bakgrund = svg(
  750,
  900,
  `<defs>
     <linearGradient id="himmel" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="#8ECAE6"/>
       <stop offset="0.55" stop-color="#D7F0C8"/>
       <stop offset="1" stop-color="#7CB342"/>
     </linearGradient>
   </defs>
   <rect width="750" height="900" fill="url(#himmel)"/>
   <circle cx="620" cy="110" r="54" fill="#FFE082"/>
   <ellipse cx="180" cy="120" rx="70" ry="28" fill="#fff" opacity="0.85"/>
   <ellipse cx="230" cy="112" rx="46" ry="22" fill="#fff" opacity="0.9"/>
   <ellipse cx="500" cy="168" rx="54" ry="20" fill="#fff" opacity="0.75"/>
   <ellipse cx="160" cy="620" rx="280" ry="150" fill="#8BC34A"/>
   <ellipse cx="560" cy="640" rx="300" ry="170" fill="#7CB342"/>
   <ellipse cx="380" cy="700" rx="420" ry="180" fill="#689F38"/>
   <ellipse cx="200" cy="790" rx="150" ry="58" fill="#1D6E82"/>
   <ellipse cx="200" cy="782" rx="120" ry="36" fill="#4FC3D7" opacity="0.85"/>
   <ellipse cx="150" cy="786" rx="28" ry="8" fill="#fff" opacity="0.35"/>
   <path d="M90 760 Q86 720 100 700" stroke="#2E7D32" stroke-width="4" fill="none"/>
   <path d="M120 768 Q130 724 118 698" stroke="#2E7D32" stroke-width="4" fill="none"/>
   <circle cx="90" cy="640" r="10" fill="#F48FB1"/>
   <circle cx="150" cy="610" r="8" fill="#FFE082"/>
   <circle cx="430" cy="650" r="9" fill="#CE93D8"/>
   <circle cx="520" cy="620" r="11" fill="#F48FB1"/>
   <circle cx="600" cy="680" r="8" fill="#FFF176"/>
   <circle cx="300" cy="640" r="7" fill="#FF8A65"/>
   <rect x="70" y="760" width="8" height="36" rx="3" fill="#558B2F"/>
   <circle cx="74" cy="756" r="12" fill="#F06292"/>`,
);
write("bakgrund/ang.svg", bakgrund);

const lager = (id) => ({
  bas: `kroppar/${id}/bas.svg`,
  skugga: `kroppar/${id}/skugga.svg`,
  linje: `kroppar/${id}/linje.svg`,
});
const monster = (id) => ({
  prickar: `kroppar/${id}/prickar.svg`,
  ränder: `kroppar/${id}/rander.svg`,
  glitter: `kroppar/${id}/glitter.svg`,
  regnbåge: `kroppar/${id}/regnbage.svg`,
});

const kroppar = {};
for (const id of Object.keys(ankare)) {
  kroppar[id] = { lager: lager(id), monster: monster(id), ankare: ankare[id], tillbehorsskala: 1 };
}

const kit = {
  version: 1,
  duk: { b: 512, h: 512 },
  bakgrund: "bakgrund/ang.svg",
  damm: { x: 0.08, y: 0.78, b: 0.3, h: 0.14 },
  kroppar,
  formagor: {
    vingar: { fil: "formagor/vingar.svg", ankare: "rygg", pivot: [120, 118], bakom: true },
    fenor: { fil: "formagor/fenor.svg", ankare: "sida", pivot: [16, 46], bakom: false },
    aura: { fil: "formagor/aura.svg", ankare: "mitt", pivot: [256, 256], bakom: true },
    flammor: { fil: "formagor/flammor.svg", ankare: "mun", pivot: [45, 118], bakom: false },
    fartlinjer: { fil: "formagor/fartlinjer.svg", ankare: "svans", pivot: [170, 35], bakom: true },
    studs: { fil: "formagor/studs.svg", ankare: "fotter", pivot: [70, 8], bakom: true },
  },
  tillbehor: {
    hatt: { fil: "tillbehor/hatt.svg", ankare: "huvud", pivot: [100, 120] },
    krona: { fil: "tillbehor/krona.svg", ankare: "huvud", pivot: [85, 90] },
    glasögon: { fil: "tillbehor/glasogon.svg", ankare: "ogon", pivot: [95, 36] },
    halsduk: { fil: "tillbehor/halsduk.svg", ankare: "mun", pivot: [85, 24] },
    rosett: { fil: "tillbehor/rosett.svg", ankare: "sida", pivot: [70, 45] },
    horn: { fil: "tillbehor/horn.svg", ankare: "huvud", pivot: [40, 118] },
    ryggsäck: { fil: "tillbehor/ryggsack.svg", ankare: "rygg", pivot: [75, 30] },
    mantel: { fil: "tillbehor/mantel.svg", ankare: "rygg", pivot: [120, 24] },
  },
};

write("kit.json", JSON.stringify(kit, null, 2));
console.log("kit klart", Object.keys(kroppar).length, "kroppar");
