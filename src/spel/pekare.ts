// R9H: regler för vilket tryck som får nå ett djur. Ren logik, testas i Node (r9h.test.ts).
//
// 1) Phaser lyssnar på hela fönstret (windowEvents) och räknar då även tryck som började på en knapp, på kartan eller på
//    3D-duken ovanpå 2D-duken. Sådana tryck får aldrig nå 2D-djur/saker – annars dyker "Till stallet" eller
//    "Vad vill du ge?" upp utan att barnet tryckt på något djur. `paDuken` säger om trycket började på Phaser-duken.
// 2) three.js-strålen träffar även osynliga delar (puff, plask-ring). Bara en synlig träff får ta trycket; annars går
//    det vidare till nästa (närmaste synliga) djur i stället för att fastna på djuret bakom.

type Pekare = { downElement?: unknown; manager?: { canvas?: unknown } | null };

export function paDuken(p: Pekare): boolean {
  const duk = p.manager?.canvas;
  return !!duk && p.downElement === duk;
}

type Nod = { visible: boolean; parent: Nod | null };

export function synligKedja(o: Nod | null | undefined): boolean {
  for (let n = o; n; n = n.parent) if (!n.visible) return false;
  return !!o;
}
