// B6.3 (G, I): ängens damm på ett ställe. Vattnet, kanten, ringarna och näckrosorna ritas härifrån, och
// placeringen på ängen (platser.json, ängens zon "damm") ska täcka samma cirkel – b6-3.test.ts kontrollerar det. Att
// dammen syns (inget på marken framför den) sköter placeringsregeln: den är en fast sak i data/placering.json (P3a).
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
