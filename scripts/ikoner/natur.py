"""Kortkonst 96×96: natur (bygg_ord typ natur) och lek (typ lek)."""
from bas import *
from byggnader import forenad, MORK


def tuva(x, y):
    return linje(f"M{x-5} {y}l2-6M{x} {y}v-8M{x+5} {y}l-2-6", w=2.5, farg=P["gron_m"])


@ikon("kort", "staket")
def _():
    spjala = lambda x: p(f"M{x} 84V50l5-6 5 6v34z", P["vit"])
    return (skugga(48, 86, 42, 4) +
            r(6, 56, 84, 7, 2, P["vit"]) + r(6, 71, 84, 7, 2, P["vit"]) +
            "".join(spjala(x) for x in (10, 27, 43, 59, 76)) +
            tuva(22, 86) + tuva(72, 86))


@ikon("kort", "träd")
def _():
    krona = forenad(['<circle cx="48" cy="38" r="26" {F}/>', '<circle cx="28" cy="50" r="14" {F}/>',
                     '<circle cx="68" cy="50" r="14" {F}/>'], P["gron"])
    return (skugga(48, 87, 26, 5) + p("M42 87V56h12v31z", P["brun"]) +
            krona + glans("M30 30q6-11 18-13", 3.5) + linje("M54 66q-3-6 2-10", w=2.5))


@ikon("kort", "blomma")
def _():
    blad = "".join(f'<g transform="rotate({v} 48 36)"><ellipse cx="48" cy="20" rx="9" ry="12" fill="{P["rosa"]}"/></g>' for v in range(0, 360, 60))
    return (skugga(48, 88, 16, 3) +
            linje("M48 52v34", w=8) + linje("M48 52v34", w=3.5, farg=P["gron_m"]) +
            p("M48 74c-6-10-16-10-20-6 4 6 12 8 20 6z", P["gron"]) +
            p("M48 68c6-10 16-10 20-6-4 6-12 8-20 6z", P["gron"]) +
            blad + c(48, 36, 9, P["gul"]) + glans("M44 33l3-3", 2.5))


@ikon("kort", "buske")
def _():
    bus = forenad(['<circle cx="30" cy="62" r="17" {F}/>', '<circle cx="50" cy="52" r="20" {F}/>',
                   '<circle cx="68" cy="64" r="16" {F}/>', '<rect x="14" y="62" width="70" height="22" rx="10" {F}/>'], P["gron_m"])
    bar = "".join(c(x, y, 3.4, P["rod"], 'stroke-width="2.2"') for x, y in [(30, 58), (46, 46), (58, 60), (70, 70), (36, 74), (52, 72)])
    return skugga(49, 86, 38, 4) + bus + glans("M36 46q6-10 18-11", 3) + bar


@ikon("kort", "damm")
def _():
    return (e(48, 66, 42, 19, P["bla_l"]) +
            linje("M18 64q5-3 10 0M56 76q5-3 10 0M64 58q4-2 8 0", w=2.5, farg=P["bla_m"]) +
            p("M30 70a12 7 0 1 0 12-6l-6 5z", P["gron"]) +
            c(60, 64, 4, P["rosa"], 'stroke-width="2.4"') + c(60, 64, 1.6, P["gul"], 'stroke="none"') +
            p("M20 56q2-14 4-18M24 56q4-10 10-12", "none", 'stroke-width="2.8"') + e(24, 37, 2.8, 6, P["brun"], 'stroke-width="2.2"'))


@ikon("kort", "bänk")
def _():
    return (skugga(48, 86, 38, 4) +
            linje("M18 64v20M78 64v20M22 50v14M74 50v14", w=5) +
            r(10, 58, 76, 8, 3, P["tra"]) +
            r(14, 36, 68, 8, 3, P["tra"]) + r(14, 46, 68, 7, 3, P["tra"]) +
            glans("M18 39h30", 2.5, .45))


@ikon("kort", "lykta")
def _():
    return (skugga(48, 88, 14, 3) +
            c(48, 30, 20, P["gul"], 'stroke="none" opacity=".35"') +
            r(45, 44, 6, 42, 2, MORK) + r(39, 82, 18, 5, 2, MORK) +
            p("M38 26h20l-3 18H41z", P["gul"]) + linje("M44 27l1 16M52 27l-1 16", w=2) +
            p("M35 26h26l-5-8H40z", MORK) + c(48, 15, 3, MORK) +
            glans("M42 30l1 8", 2.2))


@ikon("kort", "äppelträd")
def _():
    krona = forenad(['<circle cx="48" cy="38" r="26" {F}/>', '<circle cx="28" cy="50" r="14" {F}/>',
                     '<circle cx="68" cy="50" r="14" {F}/>'], P["gron"])
    apple = "".join(c(x, y, 5, P["rod"], 'stroke-width="2.6"') + glans(f"M{x-2} {y-1.5}l1-1", 1.8) for x, y in [(34, 34), (56, 28), (62, 50), (40, 52), (24, 52)])
    return (skugga(48, 87, 26, 5) + p("M42 87V56h12v31z", P["brun"]) + krona + glans("M30 26q6-9 15-11", 3) + apple +
            c(70, 84, 4.5, P["rod"], 'stroke-width="2.6"'))


@ikon("kort", "gran")
def _():
    return (skugga(48, 88, 22, 4) + r(43, 74, 10, 13, 1.5, P["brun"]) +
            p("M20 78 48 50l28 28z", P["gron_m"]) + p("M25 60 48 34l23 26z", P["gron_m"]) +
            p("M31 42 48 16l17 26z", P["gron_m"]) + glans("M30 72 44 58M33 54l12-12M37 37l9-11", 2.6, .35) +
            stjarna5(48, 13, 6, 3, P["guld"], 2.2))


@ikon("kort", "svamp")
def _():
    return (skugga(48, 87, 24, 4) +
            p("M38 86c-1-10 0-24 2-34h16c2 10 3 24 2 34z", P["gradde"]) +
            p("M12 54C12 30 28 16 48 16s36 14 36 38z", P["rod"]) +
            linje("M18 54h60", w=4) +
            e(30, 36, 5, 4, P["vit"], 'stroke-width="2.4"') + e(50, 28, 6, 4.5, P["vit"], 'stroke-width="2.4"') +
            e(68, 40, 5, 4, P["vit"], 'stroke-width="2.4"') + e(46, 45, 4, 3, P["vit"], 'stroke-width="2.4"') +
            glans("M20 44q4-14 16-20", 3, .45))


@ikon("kort", "brunn")
def _():
    return (skugga(48, 87, 34, 5) +
            linje("M24 62V24M72 62V24", w=5) +
            p("M14 28 48 10l34 18z", P["rod"]) +
            linje("M24 38h48", w=3) + linje("M54 38v10", w=2.5) + p("M49 48h10l-1.5 8h-7z", P["sten"], 'stroke-width="2.5"') +
            p("M16 62h64v18a32 8 0 0 1-64 0z", P["sten"]) + e(48, 62, 32, 8, P["bla_m"]) +
            linje("M16 70h64", w=2.2) + linje("M32 62v8M48 62v8M64 62v8M24 70v10M40 70v12M56 70v12M72 70v10", w=2.2))


@ikon("kort", "fontän")
def _():
    return (skugga(48, 87, 38, 5) +
            linje("M48 52q-4-26-20-20M48 52q4-26 20-20", w=7) +
            linje("M48 52q-4-26-20-20M48 52q4-26 20-20", w=3.5, farg=P["bla_l"]) +
            linje("M48 52V18", w=7) + linje("M48 52V18", w=3.5, farg=P["bla_l"]) +
            c(48, 15, 4, P["bla_l"], 'stroke-width="2.5"') +
            p("M10 62h76v14a38 9 0 0 1-76 0z", P["sten_l"]) + e(48, 62, 38, 9, P["bla"]) +
            linje("M28 63q5-3 10 0M58 63q5-3 10 0", w=2.2, farg=P["vit"]) + r(44, 50, 8, 10, 2, P["sten"]))


@ikon("kort", "palm")
def _():
    blad = lambda d: p(d, P["gron"])
    return (skugga(52, 87, 24, 4) +
            p("M50 87c0-20-2-38-8-54l8-2c6 18 8 36 8 56z", P["tra"]) +
            linje("M44 43l8-2M46 55l9-2M48 68l9-1M49 79l9-1", w=2.2) +
            blad("M46 30C38 16 22 14 12 22c12 0 22 4 34 8z") +
            blad("M46 30C44 16 54 6 68 8c-10 6-16 12-22 22z") +
            blad("M46 30C58 20 76 22 84 34c-14-6-26-6-38-4z") +
            blad("M46 30C34 30 22 38 18 52c8-10 18-16 28-22z") +
            blad("M46 30c10 4 18 14 18 26-6-10-12-16-18-26z") +
            c(42, 34, 4.5, P["brun"], 'stroke-width="2.5"') + c(50, 35, 4.5, P["brun"], 'stroke-width="2.5"'))


@ikon("kort", "vallgrav")
def _():
    return (e(48, 64, 44, 22, P["bla"]) + e(48, 62, 28, 12, P["gron"]) +
            linje("M10 66q4-3 8 0M78 70q4-3 8 0M44 82q4-3 8 0", w=2.2, farg=P["vit"]) +
            r(38, 34, 20, 26, 2, P["sten_l"]) + p("M36 36v-6h5v3h4.5v-3h5v3H55v-3h5v6z", P["sten_l"]) +
            p("M44 60v-8a4 4 0 0 1 8 0v8z", P["brun"]) +
            linje("M48 30V18", w=2.5) + p("M48 17h9l-3 3 3 3h-9", P["rosa"], 'stroke-width="2.4"'))


# ---------------------------------------------------------------- Lek
@ikon("kort", "gunga")
def _():
    return (skugga(48, 87, 36, 4) +
            linje("M12 86 24 16M84 86 72 16", w=6) + linje("M12 86 24 16M84 86 72 16", w=2.5, farg=P["rod"]) +
            r(18, 12, 60, 8, 3, P["rod"]) +
            linje("M38 20v44M58 20v44", w=2.5) + r(32, 62, 32, 7, 3, P["gul"]))


@ikon("kort", "rutschkana")
def _():
    return (skugga(48, 87, 40, 4) +
            linje("M18 86V26M30 86V26", w=4) + linje("M18 40h12M18 54h12M18 68h12M18 80h12", w=3) +
            r(14, 22, 20, 7, 2.5, P["gul"]) +
            p("M30 26c12 0 18 10 24 26s14 30 32 30v6c-24 0-32-16-38-32S40 34 30 34z", P["bla"]) +
            glans("M36 30c8 2 12 10 16 20", 2.5, .5))


@ikon("kort", "studsmatta")
def _():
    return (skugga(48, 87, 40, 4) +
            linje("M16 66v18M80 66v18M36 70v16M60 70v16", w=4) +
            e(48, 62, 40, 12, P["bla"]) + e(48, 62, 32, 8, MORK) +
            linje("M18 36l-4-6M78 36l4-6M48 30v-8", w=3, farg=P["pennrosa"]) +
            gnista(30, 26, 5) + gnista(66, 22, 6, P["vit"]) +
            c(48, 44, 7, P["gul"], 'stroke-width="3"'))


@ikon("kort", "sandlåda")
def _():
    return (skugga(48, 87, 42, 4) +
            p("M8 60 22 48h52l14 12v22H8z", P["tra"]) + p("M14 60 24 52h48l10 8z", P["gul"]) +
            linje("M8 60h80", w=3) +
            p("M58 40h12l-2 14h-8z", P["rosa"]) + linje("M58 40q6-8 12 0", w=2.5) +
            linje("M30 40l8 12", w=3) + p("M24 34l6-2 4 8-6 2z", P["bla"], 'stroke-width="2.5"') +
            linje("M20 70h56", w=2.2))


@ikon("kort", "karusell")
def _():
    rand = "".join(p(f"M48 14 {x0} 40h{w}z", P["vit"], 'stroke="none"') for x0, w in [(24, 8), (40, 8), (56, 8)])
    return (skugga(48, 87, 38, 5) +
            linje("M48 40v38", w=5) + linje("M28 40v26M68 40v26", w=3) +
            p("M48 14 14 40h68z", P["rod"]) + rand + p("M48 14 14 40h68z", "none") +
            p("M14 40q8 6 17 0 8 6 17 0 8 6 17 0 8 6 17 0", P["rod"]) +
            e(28, 66, 7, 5, P["gul"]) + e(68, 66, 7, 5, P["rosa"]) +
            e(48, 78, 38, 7, P["lila"]) + stjarna5(48, 11, 5, 2.5, P["guld"], 2))


@ikon("kort", "klätterställning")
def _():
    return (skugga(48, 87, 40, 4) +
            p("M10 84A38 38 0 0 1 86 84z", P["gron_l"], 'opacity=".5" stroke="none"') +
            linje("M10 84A38 38 0 0 1 86 84", w=4.5) +
            linje("M48 46V84M22 56q26 8 52 0M14 70q34 8 68 0M30 84q2-28 18-38M66 84q-2-28-18-38", w=3.2, farg=P["rod"]) +
            linje("M10 84A38 38 0 0 1 86 84", w=2.5, farg=P["bla"]) +
            c(48, 46, 3.5, P["gul"], 'stroke-width="2.4"'))
