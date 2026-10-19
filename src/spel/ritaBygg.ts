import * as PhaserNS from "phaser";
import type PhaserLib from "phaser";
import { byggMedId, materialMed } from "../tolk/byggtolk.ts";
import type { SparatBygge } from "./bygge.ts";
import { hexTal } from "./kit.ts";

const Phaser = PhaserNS as unknown as typeof PhaserLib;
type Gfx = PhaserLib.GameObjects.Graphics;
type Yta = { kropp: number; tak: number; alpha: number; mat: string | null };
type HusOpt = {
  w: number;
  h: number;
  takH: number;
  fonster: number;
  dorr?: boolean;
  vitaKnutar?: boolean;
  peppar?: boolean;
  stall?: boolean;
  rundDorr?: boolean;
};

const KANT = 4073251;
const TRUNK = 9268835;
const GLAS = 11789820;
function mork(n: number, t = 0.72): number {
	const r = Math.round((n >> 16 & 255) * t);
	const g = Math.round((n >> 8 & 255) * t);
	const b = Math.round((n & 255) * t);
	return r << 16 | g << 8 | b;
}
function ljus(n: number, t = 0.35): number {
	const mix = (c: number) => Math.round(c + (255 - c) * t);
	return mix(n >> 16 & 255) << 16 | mix(n >> 8 & 255) << 8 | mix(n & 255);
}
function delAntal(spec: SparatBygge, id: string, standard: number): number {
	const d = spec.delar.find((x) => x.id === id);
	return d ? d.antal : standard;
}
function delFarg(spec: SparatBygge, id: string, fallback: number): number {
	const d = spec.delar.find((x) => x.id === id);
	return d?.fargHex ? hexTal(d.fargHex) : fallback;
}
function ytaAv(spec: SparatBygge): Yta {
	const bo = byggMedId(spec.bygg);
	const mat = materialMed(spec.material);
	const bas = spec.fargHex ?? mat?.farg ?? bo?.standardfarg ?? "#E57373";
	const kropp = hexTal(bas);
	return {
		kropp,
		tak: delFarg(spec, "tak", mork(kropp, .62)),
		alpha: mat?.alpha ?? 1,
		mat: spec.material
	};
}
function kant(g: Gfx, bredd = 7) {
	g.lineStyle(bredd, KANT, 1);
}
function fonster(g: Gfx, x: number, y: number, s: number) {
	g.fillStyle(GLAS, 1);
	g.fillRoundedRect(x, y, s, s * .86, 4);
	kant(g, 4);
	g.strokeRoundedRect(x, y, s, s * .86, 4);
	g.lineStyle(3, 16777215, .9);
	g.lineBetween(x + s / 2, y + 2, x + s / 2, y + s * .86 - 2);
	g.lineBetween(x + 2, y + s * .43, x + s - 2, y + s * .43);
}
function dorr(g: Gfx, x: number, y: number, w: number, h: number, rund: boolean) {
	g.fillStyle(6111287, 1);
	if (rund) g.fillCircle(x + w / 2, y + h * .55, w * .48);
	else g.fillRoundedRect(x, y, w, h, {
		tl: w / 2,
		tr: w / 2,
		bl: 2,
		br: 2
	});
	kant(g, 4);
	if (rund) g.strokeCircle(x + w / 2, y + h * .55, w * .48);
	else g.strokeRoundedRect(x, y, w, h, {
		tl: w / 2,
		tr: w / 2,
		bl: 2,
		br: 2
	});
	g.fillStyle(16761095, 1);
	g.fillCircle(x + w * .78, y + h * .55, 4);
}
function tak(g: Gfx, x: number, botten: number, w: number, h: number, farg: number) {
	g.fillStyle(farg, 1);
	g.fillTriangle(x, botten, x + w / 2, botten - h, x + w, botten);
	kant(g, 7);
	g.strokeTriangle(x, botten, x + w / 2, botten - h, x + w, botten);
}
function flagga(g: Gfx, x: number, y: number, farg: number, tid: number) {
	g.lineStyle(4, 6111287, 1);
	g.lineBetween(x, y, x, y - 70);
	const vink = Math.sin(tid * 6) * 8;
	g.fillStyle(farg, 1);
	g.fillTriangle(x, y - 70, x + 36, y - 58 + vink, x, y - 46);
	kant(g, 3);
	g.strokeTriangle(x, y - 70, x + 36, y - 58 + vink, x, y - 46);
}
function skorsten(g: Gfx, x: number, y: number, tid: number) {
	g.fillStyle(7162945, 1);
	g.fillRect(x, y, 22, 48);
	kant(g, 4);
	g.strokeRect(x, y, 22, 48);
	g.fillStyle(11583173, .55);
	const dy = tid * 40 % 36;
	g.fillCircle(x + 11, y - 8 - dy, 8);
	g.fillCircle(x + 18, y - 20 - dy * .6, 6);
}
function materialPa(g: Gfx, spec: SparatBygge, x: number, y: number, w: number, h: number) {
	const id = spec.material;
	if (!id) return;
	if (id === "trä") {
		g.lineStyle(3, 6111287, .45);
		for (let i = 16; i < h; i += 16) g.lineBetween(x + 8, y + i, x + w - 8, y + i);
	} else if (id === "sten") {
		g.fillStyle(16777215, .28);
		for (let rad = 0; rad < 3; rad++) for (let k = 0; k < 4; k++) g.fillCircle(x + 18 + k * 28 + rad % 2 * 12, y + 22 + rad * 26, 10);
	} else if (id === "glas") {
		g.lineStyle(4, 16777215, .7);
		g.lineBetween(x + 16, y + 16, x + w * .45, y + h * .7);
	} else if (id === "is") {
		g.fillStyle(16777215, .85);
		g.fillTriangle(x + 10, y + h - 8, x + 22, y + 18, x + 34, y + h - 8);
		g.fillTriangle(x + w - 40, y + h - 8, x + w - 28, y + 10, x + w - 14, y + h - 8);
	} else if (id === "godis") {
		const prick = [
			15022389,
			16635957,
			2001125,
			4431943
		];
		for (let i = 0; i < 8; i++) {
			g.fillStyle(prick[i % prick.length], 1);
			g.fillCircle(x + 20 + i % 4 * 28, y + 24 + Math.floor(i / 4) * 28, 7);
		}
	} else if (id === "choklad") {
		g.lineStyle(3, 4073251, .45);
		for (let i = 1; i < 4; i++) {
			g.lineBetween(x + w / 4 * i, y + 6, x + w / 4 * i, y + h - 6);
			g.lineBetween(x + 6, y + h / 4 * i, x + w - 6, y + h / 4 * i);
		}
	} else if (id === "kristall") {
		g.fillStyle(16777215, .55);
		g.fillTriangle(x + w * .3, y + h * .7, x + w * .5, y + 8, x + w * .7, y + h * .7);
	} else if (id === "guld") {
		g.fillStyle(16777215, .45);
		g.fillRect(x + w * .15, y + 8, 10, h * .7);
	}
}
function monsterPa(g: Gfx, spec: SparatBygge, x: number, y: number, w: number, h: number) {
	if (spec.monster === "randig" || spec.monster === "tigerrandig") {
		g.fillStyle(16777215, .35);
		for (let i = 0; i < 5; i++) g.fillRect(x + 8 + i * (w / 5), y, w / 12, h);
	} else if (spec.monster === "prickig" || spec.monster === "spräcklig") {
		g.fillStyle(16777215, .9);
		for (let i = 0; i < 6; i++) g.fillCircle(x + 22 + i % 3 * (w / 3.2), y + 20 + Math.floor(i / 3) * 36, 8);
	}
}
function husKropp(g: Gfx, spec: SparatBygge, yta: Yta, ox: number, tid: number, opt: HusOpt) {
	const w = opt.w;
	const h = opt.h;
	const x = ox - w / 2;
	const topp = 20 - h;
	g.fillStyle(yta.kropp, yta.alpha);
	g.fillRoundedRect(x, topp, w, h, 8);
	kant(g);
	g.strokeRoundedRect(x, topp, w, h, 8);
	materialPa(g, spec, x, topp, w, h);
	monsterPa(g, spec, x, topp, w, h);
	if (opt.vitaKnutar) {
		g.fillStyle(16777215, 1);
		g.fillRect(x - 4, topp, 14, h);
		g.fillRect(x + w - 10, topp, 14, h);
	}
	if (opt.peppar) {
		g.lineStyle(6, 16777215, 1);
		g.strokeRoundedRect(x + 8, topp + 8, w - 16, h - 16, 6);
		const godis = [
			15022389,
			16635957,
			15483002,
			4431943
		];
		for (let i = 0; i < 6; i++) {
			g.fillStyle(godis[i % godis.length], 1);
			g.fillCircle(x + 24 + i * 28, topp - 8, 8);
		}
	}
	tak(g, x - 16, topp + 8, w + 32, opt.takH, yta.tak);
	const nf = opt.fonster;
	const fw = 36;
	const per = Math.ceil(nf / (nf > 3 ? 2 : 1));
	for (let i = 0; i < nf; i++) {
		const r = Math.floor(i / per);
		const c = i % per;
		fonster(g, x + w / (per + 1) * (c + 1) - fw / 2, topp + 28 + r * 58, fw);
	}
	if (opt.dorr) dorr(g, ox - 28, -66, 56, 86, !!opt.rundDorr);
	if (opt.stall) {
		g.lineStyle(6, 16777215, 1);
		g.strokeLineShape(new Phaser.Geom.Line(ox - 22, -58, ox + 22, 4));
		g.strokeLineShape(new Phaser.Geom.Line(ox + 22, -58, ox - 22, 4));
	}
	const ns = delAntal(spec, "skorsten", 0);
	for (let i = 0; i < ns; i++) skorsten(g, x + w * .72 + i * 28, topp - opt.takH * .4, tid + i);
	const nt = delAntal(spec, "torn", 0);
	for (let i = 0; i < nt; i++) {
		const tx = x - 20 + i * 36;
		g.fillStyle(yta.kropp, 1);
		g.fillRect(tx, topp - 70, 28, 78);
		kant(g, 4);
		g.strokeRect(tx, topp - 70, 28, 78);
		tak(g, tx - 6, topp - 64, 40, 36, yta.tak);
	}
	const fl = delAntal(spec, "flagga", 0);
	for (let i = 0; i < fl; i++) flagga(g, x + 20 + i * 40, topp - opt.takH + 10, delFarg(spec, "flagga", 15022389), tid);
	return {
		w: w + 40,
		h: h + opt.takH + 80
	};
}
function ritaSkatt(g: Gfx, id: string, ox: number, tid: number): { w: number; h: number } {
  if (id === "silverkotte") {
    g.fillStyle(0xcfd8dc, 1);
    g.fillEllipse(ox, -28, 50, 70);
    g.fillStyle(0xb0bec5, 1);
    for (let i = 0; i < 5; i++) g.fillEllipse(ox - 12 + i * 6, -48 + i * 10, 16, 12);
    return { w: 70, h: 90 };
  }
  if (id === "fyrklöver") {
    g.fillStyle(0x43a047, 1);
    g.fillCircle(ox - 12, -40, 14);
    g.fillCircle(ox + 12, -40, 14);
    g.fillCircle(ox - 12, -16, 14);
    g.fillCircle(ox + 12, -16, 14);
    g.fillRect(ox - 3, -20, 6, 36);
    return { w: 70, h: 80 };
  }
  if (id === "parla") {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(ox, -24, 26);
    g.fillStyle(0xb3e5fc, 0.8);
    g.fillCircle(ox - 8, -32, 8);
    return { w: 70, h: 70 };
  }
  if (id === "fyrlampa") {
    g.fillStyle(0xc62828, 1);
    g.fillRect(ox - 16, -36, 32, 28);
    g.fillStyle(0xfff176, 0.9);
    g.fillCircle(ox, -48 + Math.sin(tid * 6) * 2, 10);
    g.fillStyle(0x5d4037, 1);
    g.fillRect(ox - 6, -8, 12, 20);
    return { w: 60, h: 80 };
  }
  if (id === "kristall") {
    g.fillStyle(0x7e57c2, 1);
    g.fillTriangle(ox, -70, ox + 22, -10, ox - 22, -10);
    g.fillStyle(0xffffff, 0.4);
    g.fillTriangle(ox, -60, ox + 6, -20, ox - 4, -20);
    return { w: 60, h: 80 };
  }
  g.fillStyle(0x6d4c41, 1);
  g.fillRoundedRect(ox - 36, -28, 72, 40, 4);
  g.fillStyle(0xffc107, 1);
  g.fillRect(ox - 40, -36, 80, 14);
  g.fillStyle(0xfff176, 1);
  g.fillCircle(ox - 10, -8, 6);
  g.fillCircle(ox + 8, -4, 5);
  return { w: 100, h: 70 };
}

function ritaEtt(g: Gfx, spec: SparatBygge, tid: number, ox: number): { w: number; h: number } {
	if (spec.bygg.startsWith("skatt:")) return ritaSkatt(g, spec.bygg.slice(6), ox, tid);
	const yta = ytaAv(spec);
	const id = spec.bygg;
	const bob = spec.material === "moln" ? Math.sin(tid * 2) * 10 : 0;
	if (spec.material === "moln") {
		g.fillStyle(16777215, .95);
		for (const [dx, dy, r] of [
			[
				-70,
				-40,
				46
			],
			[
				0,
				-70,
				58
			],
			[
				70,
				-36,
				44
			],
			[
				0,
				-20,
				50
			]
		]) g.fillCircle(ox + dx, -80 + dy + bob, r);
	}
	if (id === "hus" || id === "stuga" || id === "pepparkakshus" || id === "stall" || id === "hundkoja") {
		const smal = id === "stuga" || id === "hundkoja";
		return husKropp(g, spec, yta, ox, tid, {
			w: smal ? 250 : id === "stall" ? 380 : 320,
			h: smal ? 170 : 200,
			takH: id === "hundkoja" ? 90 : 120,
			fonster: delAntal(spec, "fönster", id === "hundkoja" ? 0 : 2),
			dorr: id !== "hundkoja" && delAntal(spec, "dörr", 1) > 0,
			vitaKnutar: id === "stuga",
			peppar: id === "pepparkakshus",
			stall: id === "stall",
			rundDorr: id === "hundkoja"
		});
	}
	if (id === "slott") {
		const tornN = delAntal(spec, "torn", 2);
		const w = 280 + tornN * 36;
		const x = ox - w / 2;
		g.fillStyle(yta.kropp, yta.alpha);
		g.fillRect(x, -150, w, 170);
		kant(g);
		g.strokeRect(x, -150, w, 170);
		g.fillStyle(yta.kropp, 1);
		for (let i = 0; i < 8; i++) g.fillRect(x + i * (w / 8), -180, w / 12, 36);
		materialPa(g, spec, x, -150, w, 170);
		for (let i = 0; i < tornN; i++) {
			const tx = x + w / (tornN + 1) * (i + 1) - 22;
			g.fillStyle(yta.kropp, 1);
			g.fillRect(tx, -260, 44, 200);
			kant(g, 5);
			g.strokeRect(tx, -260, 44, 200);
			tak(g, tx - 8, -254, 60, 54, yta.tak);
		}
		const nf = delAntal(spec, "fönster", 2);
		for (let i = 0; i < nf; i++) fonster(g, x + 30 + i % 4 * 70, -120 - Math.floor(i / 4) * 60, 32);
		dorr(g, ox - 30, -70, 60, 90, true);
		const fl = delAntal(spec, "flagga", 0);
		for (let i = 0; i < fl; i++) flagga(g, x + 16 + i * 36, -230, delFarg(spec, "flagga", 15022389), tid);
		return {
			w: w + 20,
			h: 340
		};
	}
	if (id === "torn" || id === "fyr") {
		const x = ox - 40;
		if (id === "fyr") for (let i = 0; i < 8; i++) {
			g.fillStyle(i % 2 ? 15022389 : 16777215, 1);
			g.fillRect(x, -20 - i * 28, 80, 28);
		}
		else {
			g.fillStyle(yta.kropp, 1);
			g.fillRect(x, -240, 80, 260);
		}
		kant(g);
		g.strokeRect(x, -240, 80, 260);
		tak(g, x - 10, -234, 100, 70, yta.tak);
		const nf = delAntal(spec, "fönster", id === "fyr" ? 1 : 2);
		for (let i = 0; i < nf; i++) fonster(g, ox - 16, -60 - i * 70, 32);
		if (id === "fyr") {
			const svep = tid * 1.4 % (Math.PI * 2);
			g.fillStyle(16774557, .35);
			g.fillTriangle(ox, -280, ox + Math.cos(svep) * 160, -280 + Math.sin(svep) * 40, ox, -250);
			g.fillStyle(16771899, 1);
			g.fillCircle(ox, -270, 16);
		}
		if (delAntal(spec, "flagga", 0)) flagga(g, ox, -230, delFarg(spec, "flagga", 15022389), tid);
		return {
			w: 140,
			h: 360
		};
	}
	if (id === "träd" || id === "äppelträd" || id === "trädhus") {
		g.fillStyle(TRUNK, 1);
		g.fillRect(ox - 16, -40, 32, 90);
		g.fillStyle(yta.kropp, 1);
		g.fillCircle(ox - 36, -80, 48);
		g.fillCircle(ox + 36, -80, 48);
		g.fillCircle(ox, -120, 56);
		kant(g, 6);
		g.strokeCircle(ox - 36, -80, 48);
		g.strokeCircle(ox + 36, -80, 48);
		g.strokeCircle(ox, -120, 56);
		if (id === "äppelträd") {
			g.fillStyle(15022389, 1);
			for (let i = 0; i < 6; i++) g.fillCircle(ox - 30 + i % 3 * 30, -130 + Math.floor(i / 3) * 36, 8);
		}
		if (id === "trädhus") {
			husKropp(g, spec, yta, ox, tid, {
				w: 150,
				h: 90,
				takH: 60,
				fonster: delAntal(spec, "fönster", 1),
				dorr: true
			});
			g.lineStyle(5, TRUNK, 1);
			for (let i = 0; i < 5; i++) g.lineBetween(ox + 20, -10 + i * 16, ox + 48, -18 + i * 16);
		}
		return {
			w: 200,
			h: 240
		};
	}
	if (id === "gran") {
		g.fillStyle(TRUNK, 1);
		g.fillRect(ox - 10, -10, 20, 40);
		g.fillStyle(yta.kropp, 1);
		for (let i = 0; i < 3; i++) {
			const tw = 150 - i * 36;
			const ty = -20 - i * 54;
			g.fillTriangle(ox - tw / 2, ty, ox, ty - 70, ox + tw / 2, ty);
			kant(g, 5);
			g.strokeTriangle(ox - tw / 2, ty, ox, ty - 70, ox + tw / 2, ty);
		}
		return {
			w: 170,
			h: 250
		};
	}
	if (id === "palm") {
		g.lineStyle(16, TRUNK, 1);
		g.beginPath();
		g.arc(ox + 20, 10, 70, Math.PI * .9, Math.PI * 1.45, false);
		g.strokePath();
		g.fillStyle(yta.kropp, 1);
		for (let i = 0; i < 5; i++) {
			const a = -2.4 + i * .55;
			g.fillEllipse(ox - 10 + Math.cos(a) * 50, -90 + Math.sin(a) * 30, 70, 18);
		}
		return {
			w: 180,
			h: 220
		};
	}
	if (id === "buske") {
		g.fillStyle(yta.kropp, 1);
		g.fillCircle(ox - 40, -20, 40);
		g.fillCircle(ox + 40, -16, 42);
		g.fillCircle(ox, -46, 48);
		kant(g, 6);
		g.strokeCircle(ox, -46, 48);
		return {
			w: 180,
			h: 140
		};
	}
	if (id === "blomma") {
		g.lineStyle(8, 4431943, 1);
		g.lineBetween(ox, 20, ox, -50);
		g.fillStyle(yta.kropp, 1);
		for (let i = 0; i < 5; i++) {
			const a = i / 5 * Math.PI * 2;
			g.fillCircle(ox + Math.cos(a) * 28, -70 + Math.sin(a) * 28, 18);
		}
		g.fillStyle(16635957, 1);
		g.fillCircle(ox, -70, 14);
		return {
			w: 120,
			h: 150
		};
	}
	if (id === "svamp") {
		g.fillStyle(16775402, 1);
		g.fillRoundedRect(ox - 18, -30, 36, 60, 8);
		g.fillStyle(yta.kropp, 1);
		g.fillEllipse(ox, -40, 150, 80);
		kant(g, 6);
		g.strokeEllipse(ox, -40, 150, 80);
		g.fillStyle(16777215, 1);
		g.fillCircle(ox - 30, -50, 10);
		g.fillCircle(ox + 20, -36, 8);
		g.fillCircle(ox + 4, -62, 7);
		return {
			w: 170,
			h: 140
		};
	}
	if (id === "damm" || id === "vallgrav") {
		const w = id === "vallgrav" ? 340 : 260;
		const h = id === "vallgrav" ? 90 : 120;
		g.fillStyle(mork(yta.kropp, .7), 1);
		g.fillEllipse(ox, -10, w + 16, h + 16);
		g.fillStyle(yta.kropp, .95);
		g.fillEllipse(ox, -16, w, h);
		g.fillStyle(16777215, .8);
		g.fillEllipse(ox - w * .2, -24, 28, 10);
		g.fillEllipse(ox + 20, -8, 16, 6);
		return {
			w: w + 20,
			h: h + 30
		};
	}
	if (id === "staket") {
		g.fillStyle(16777215, 1);
		for (let i = 0; i < 5; i++) {
			const x = ox - 90 + i * 44;
			g.fillTriangle(x, -70, x + 16, -96, x + 32, -70);
			g.fillRect(x, -70, 32, 90);
		}
		g.fillStyle(15658734, 1);
		g.fillRect(ox - 96, -48, 210, 12);
		g.fillRect(ox - 96, -16, 210, 12);
		kant(g, 4);
		g.strokeRect(ox - 96, -48, 210, 12);
		return {
			w: 230,
			h: 130
		};
	}
	if (id === "mur") {
		g.fillStyle(yta.kropp, 1);
		g.fillRect(ox - 150, -50, 300, 80);
		for (let i = 0; i < 8; i++) g.fillRect(ox - 150 + i * 38, -78, 24, 32);
		kant(g, 5);
		g.strokeRect(ox - 150, -50, 300, 80);
		return {
			w: 320,
			h: 120
		};
	}
	if (id === "bro" || id === "regnbågsbro") {
		if (id === "regnbågsbro") {
			[
				15022389,
				16485376,
				16635957,
				4431943,
				2001125,
				3754411,
				9315498
			].forEach((f, i) => {
				g.lineStyle(10, f, 1);
				g.beginPath();
				g.arc(ox, 30, 150 - i * 10, Math.PI, 0, false);
				g.strokePath();
			});
			return {
				w: 320,
				h: 180
			};
		}
		g.lineStyle(18, yta.kropp, 1);
		g.beginPath();
		g.arc(ox, 40, 130, Math.PI, 0, false);
		g.strokePath();
		g.lineStyle(6, ljus(yta.kropp, .4), 1);
		g.beginPath();
		g.arc(ox, 20, 130, Math.PI, 0, false);
		g.strokePath();
		return {
			w: 280,
			h: 150
		};
	}
	if (id === "port") {
		g.fillStyle(yta.kropp, 1);
		g.fillRect(ox - 80, -140, 36, 160);
		g.fillRect(ox + 44, -140, 36, 160);
		g.fillRoundedRect(ox - 70, -120, 140, 130, {
			tl: 70,
			tr: 70,
			bl: 0,
			br: 0
		});
		kant(g, 6);
		g.strokeRoundedRect(ox - 70, -120, 140, 130, {
			tl: 70,
			tr: 70,
			bl: 0,
			br: 0
		});
		g.lineStyle(4, 2171169, 1);
		g.strokeLineShape(new Phaser.Geom.Line(ox - 50, -40, ox + 50, -40));
		g.strokeLineShape(new Phaser.Geom.Line(ox - 50, -80, ox + 50, -80));
		return {
			w: 200,
			h: 180
		};
	}
	if (id === "koja") {
		g.fillStyle(yta.kropp, 1);
		g.fillTriangle(ox - 90, 20, ox, -110, ox + 90, 20);
		kant(g, 6);
		g.strokeTriangle(ox - 90, 20, ox, -110, ox + 90, 20);
		g.lineStyle(4, mork(yta.kropp, .55), 1);
		for (let i = 0; i < 4; i++) g.lineBetween(ox - 70 + i * 8, 10 - i * 18, ox + 70 - i * 8, 10 - i * 18);
		g.fillStyle(4073251, 1);
		g.fillTriangle(ox - 28, 20, ox, -20, ox + 28, 20);
		return {
			w: 200,
			h: 160
		};
	}
	if (id === "tält") {
		g.fillStyle(yta.kropp, 1);
		g.fillTriangle(ox - 100, 20, ox, -120, ox + 100, 20);
		kant(g);
		g.strokeTriangle(ox - 100, 20, ox, -120, ox + 100, 20);
		g.fillStyle(mork(yta.kropp, .55), 1);
		g.fillTriangle(ox - 28, 20, ox, -30, ox + 28, 20);
		g.lineStyle(5, TRUNK, 1);
		g.lineBetween(ox, -120, ox, -148);
		if (delAntal(spec, "flagga", 1)) flagga(g, ox, -80, delFarg(spec, "flagga", 15022389), tid);
		return {
			w: 210,
			h: 190
		};
	}
	if (id === "bänk") {
		g.fillStyle(yta.kropp, 1);
		g.fillRoundedRect(ox - 90, -28, 180, 22, 6);
		g.fillRect(ox - 80, -70, 12, 50);
		g.fillRect(ox + 68, -70, 12, 50);
		g.fillRect(ox - 86, -70, 172, 14);
		g.fillRect(ox - 70, -6, 14, 28);
		g.fillRect(ox + 56, -6, 14, 28);
		kant(g, 4);
		g.strokeRoundedRect(ox - 90, -28, 180, 22, 6);
		return {
			w: 200,
			h: 120
		};
	}
	if (id === "lykta") {
		g.fillStyle(3622735, 1);
		g.fillRect(ox - 6, -120, 12, 140);
		const glod = .65 + Math.sin(tid * 4) * .35;
		g.fillStyle(16771899, glod);
		g.fillCircle(ox, -132, 18);
		g.fillStyle(16774557, .35 * glod);
		g.fillCircle(ox, -132, 36);
		kant(g, 4);
		g.strokeRect(ox - 16, -150, 32, 36);
		return {
			w: 80,
			h: 190
		};
	}
	if (id === "brunn") {
		g.fillStyle(5227511, 1);
		g.fillEllipse(ox, -10, 120, 36);
		g.fillStyle(yta.kropp, 1);
		g.fillEllipse(ox, -20, 140, 44);
		g.fillStyle(16777215, .3);
		g.fillEllipse(ox, -24, 90, 22);
		g.fillRect(ox - 50, -90, 10, 70);
		g.fillRect(ox + 40, -90, 10, 70);
		tak(g, ox - 70, -84, 140, 50, 9268835);
		g.lineStyle(3, 6111287, 1);
		g.lineBetween(ox, -70, ox + 36, -30);
		g.fillStyle(9268835, 1);
		g.fillRect(ox + 28, -36, 16, 14);
		return {
			w: 180,
			h: 160
		};
	}
	if (id === "fontän") {
		g.fillStyle(yta.kropp, 1);
		g.fillEllipse(ox, 0, 180, 50);
		g.fillStyle(5227511, 1);
		g.fillEllipse(ox, -6, 140, 30);
		const dropp = tid * 2 % 1;
		g.fillStyle(8508666, 1);
		for (let i = 0; i < 5; i++) {
			const p = (dropp + i / 5) % 1;
			const a = Math.sin(p * Math.PI);
			g.fillCircle(ox - 40 + i * 20, -20 - a * 90, 5);
		}
		return {
			w: 200,
			h: 160
		};
	}
	if (id === "gunga") {
		const s = Math.sin(tid * 2) * 28;
		g.lineStyle(8, yta.kropp, 1);
		g.lineBetween(ox - 70, 20, ox - 20, -120);
		g.lineBetween(ox + 70, 20, ox + 20, -120);
		g.lineBetween(ox - 24, -120, ox + 24, -120);
		g.lineStyle(3, 6111287, 1);
		g.lineBetween(ox - 16, -116, ox - 30 + s, -30);
		g.lineBetween(ox + 16, -116, ox + 6 + s, -30);
		g.fillStyle(yta.kropp, 1);
		g.fillRoundedRect(ox - 36 + s, -36, 48, 12, 4);
		return {
			w: 180,
			h: 170
		};
	}
	if (id === "rutschkana") {
		g.fillStyle(yta.kropp, 1);
		g.fillRect(ox - 70, -130, 70, 16);
		for (let i = 0; i < 5; i++) g.fillRect(ox - 62, -110 + i * 26, 50, 8);
		g.lineStyle(16, yta.kropp, 1);
		g.lineBetween(ox - 20, -120, ox + 90, 10);
		g.lineStyle(8, ljus(yta.kropp, .4), 1);
		g.lineBetween(ox - 20, -128, ox + 96, 2);
		return {
			w: 200,
			h: 180
		};
	}
	if (id === "studsmatta") {
		g.fillStyle(2171169, 1);
		g.fillEllipse(ox, -10, 200, 56);
		g.lineStyle(12, yta.kropp, 1);
		g.strokeEllipse(ox, -10, 200, 56);
		g.fillStyle(TRUNK, 1);
		g.fillRect(ox - 90, -8, 10, 28);
		g.fillRect(ox + 80, -8, 10, 28);
		return {
			w: 220,
			h: 90
		};
	}
	if (id === "sandlåda") {
		g.fillStyle(TRUNK, 1);
		g.fillRect(ox - 100, -20, 200, 16);
		g.fillRect(ox - 100, 16, 200, 16);
		g.fillRect(ox - 100, -20, 16, 52);
		g.fillRect(ox + 84, -20, 16, 52);
		g.fillStyle(yta.kropp, 1);
		g.fillRect(ox - 84, -6, 168, 24);
		g.fillStyle(9268835, 1);
		g.fillRect(ox + 40, -40, 8, 36);
		g.fillTriangle(ox + 36, -8, ox + 70, -4, ox + 40, 4);
		return {
			w: 220,
			h: 90
		};
	}
	if (id === "karusell") {
		const rot = tid * .8;
		g.fillStyle(mork(yta.kropp, .75), 1);
		g.fillEllipse(ox, 10, 180, 40);
		g.fillStyle(9268835, 1);
		g.fillRect(ox - 8, -80, 16, 90);
		for (let i = 0; i < 6; i++) {
			const a = rot + i / 6 * Math.PI * 2;
			g.fillStyle(i % 2 ? yta.kropp : 16774557, 1);
			g.fillCircle(ox + Math.cos(a) * 60, -10 + Math.sin(a) * 16, 12);
		}
		g.fillStyle(yta.kropp, 1);
		g.fillEllipse(ox, -90, 150, 36);
		kant(g, 4);
		g.strokeEllipse(ox, -90, 150, 36);
		return {
			w: 200,
			h: 160
		};
	}
	if (id === "klätterställning") {
		g.lineStyle(8, yta.kropp, 1);
		for (let i = 0; i < 3; i++) {
			g.lineBetween(ox - 70 + i * 70, 20, ox - 70 + i * 70, -120);
			g.lineBetween(ox - 70, -20 - i * 40, ox + 70, -20 - i * 40);
		}
		tak(g, ox - 90, -120, 180, 40, mork(yta.kropp, .8));
		return {
			w: 200,
			h: 180
		};
	}
	if (id === "fågelholk") {
		g.fillStyle(TRUNK, 1);
		g.fillRect(ox - 8, -80, 16, 110);
		g.fillStyle(yta.kropp, 1);
		g.fillRoundedRect(ox - 36, -150, 72, 70, 6);
		kant(g, 4);
		g.strokeRoundedRect(ox - 36, -150, 72, 70, 6);
		tak(g, ox - 48, -146, 96, 40, yta.tak);
		g.fillStyle(4073251, 1);
		g.fillCircle(ox, -116, 10);
		return {
			w: 120,
			h: 200
		};
	}
	return husKropp(g, spec, yta, ox, tid, {
		w: 260,
		h: 170,
		takH: 90,
		fonster: delAntal(spec, "fönster", 1),
		dorr: true
	});
}
export function ritaBygge(g: Gfx, spec: SparatBygge, tid: number): { w: number; h: number } {
	g.clear();
	const n = Math.max(1, Math.min(3, spec.antal));
	const gap = spec.bygg === "blomma" || spec.bygg === "staket" || spec.bygg === "lykta" ? 120 : 200;
	let w = 0;
	let h = 0;
	const start = -((n - 1) * gap) / 2;
	for (let i = 0; i < n; i++) {
		const r = ritaEtt(g, spec, tid + i, start + i * gap);
		w = Math.max(w, Math.abs(start + i * gap) + r.w / 2);
		h = Math.max(h, r.h);
	}
	return {
		w: w * 2,
		h
	};
}
export function byggeRorSig(spec: SparatBygge): boolean {
	if (spec.bygg === "skatt:fyrlampa") return true;
	return spec.material === "moln" || spec.bygg === "fontän" || spec.bygg === "karusell" || spec.bygg === "lykta" || spec.bygg === "fyr" || spec.bygg === "gunga" || spec.delar.some((d) => d.id === "flagga" || d.id === "skorsten");
}
