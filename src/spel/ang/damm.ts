// B6.3 (G, I): ängens damm på ett ställe. Vattnet, kanten, ringarna och näckrosorna ritas härifrån, och
// placeringen på ängen (platser.json, ängens zon "damm") ska täcka samma cirkel – b6-3.test.ts kontrollerar det.
//
// Rotorsak till att vattnet "försvann" (G): marken svajar i vertexshadern (himmel.tsx, ±SVAJ_AMP vid mitten),
// men vattnet låg bara 0,02 över marken. När vågen gick över dammen stack marken upp genom vattnet och dolde det
// (djuptest, inte renderOrder/depthWrite/transparens/ljuspoolen; ängen har ingen ljuspool). Med många saker zoomar
// kameran ut (KameraRam), då blir vinkeln flackare och marken skymmer en större del av ytan, därför syntes det först
// med sju saker. Nu ligger vattnet högre än markens största svaj, med marginal.
/** Markens största höjd från svajet (världsenheter). Används i shadern i himmel.tsx. */
export const SVAJ_AMP = 0.06;
/** Dammens mitt (x, z), vattnets radie, kantens yttre radie och vattenytans höjd. */
export const DAMM = { x: 1.12, z: -0.35, r: 0.72, kant: 0.76, y: SVAJ_AMP + 0.035 } as const;

/** B6.3 (Doodle 09:17): kamerans standardlägen på ängen (KameraRam: stående och liggande). */
export const KAMEROR: readonly (readonly [number, number, number])[] = [
  [0, 4.15, 9.8],
  [0, 3.9, 8.6],
];

/** Punkter på vattnet som ska synas: mitten, en ring på halva radien och kanten (16 riktningar). */
const SIKTPUNKTER: [number, number][] = [[DAMM.x, DAMM.z]];
for (let i = 0; i < 16; i++) {
  const v = (i * Math.PI) / 8;
  for (const r of [DAMM.r * 0.5, DAMM.r * 0.97]) SIKTPUNKTER.push([DAMM.x + Math.cos(v) * r, DAMM.z + Math.sin(v) * r]);
}

/**
 * B6.3 (Doodle 09:17): siktzonen mellan kameran och dammen. En kropp – en lodrät cylinder med radien `radie` (halva bredden
 * ur bbox + vickning + marginal) och höjden `hojd` (överkanten, pratbubblan inräknad) – får inte stå i vägen för någon
 * siktlinje från kameran (båda standardlägena) till någon punkt på vattnet. Ren geometri, ingen slump: linjen från punkten P
 * (t = 0) till kameran C (t = 1) går genom cylinderns cirkel för t i [t1, t2]; den skymmer om linjen där är lägre än höjden.
 */
export function siktFri(wx: number, wz: number, radie: number, hojd: number): boolean {
  for (const [cx, cy, cz] of KAMEROR)
    for (const [px, pz] of SIKTPUNKTER) {
      const dx = cx - px;
      const dz = cz - pz;
      const fx = px - wx;
      const fz = pz - wz;
      const a = dx * dx + dz * dz;
      const b = 2 * (fx * dx + fz * dz);
      const c = fx * fx + fz * fz - radie * radie;
      const disk = b * b - 4 * a * c;
      if (disk < 0) continue;
      const rot = Math.sqrt(disk);
      const t1 = Math.max(0, (-b - rot) / (2 * a));
      const t2 = Math.min(1, (-b + rot) / (2 * a));
      if (t1 > t2) continue;
      // lägsta punkten på linjen inom cirkeln är där t är minst (linjen stiger mot kameran)
      if (DAMM.y + t1 * (cy - DAMM.y) < hojd) return false;
    }
  return true;
}
