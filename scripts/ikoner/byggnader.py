"""Kortkonst 96×96: byggnader och djurhem (bygg_ord med typ byggnad/djurhem)."""
from bas import *

MORK = "#3A3048"


def forenad(former, fill):
    """Ritar flera cirklar/former som en sammanhängande klistermärkesform.
    former: lista av SVG-elementsträngar utan fill/stroke-attribut (använd {F}-platshållare)."""
    under = "".join(f.replace("{F}", f'fill="{INK}" stroke-width="8"') for f in former)
    over = "".join(f.replace("{F}", f'fill="{fill}" stroke="none"') for f in former)
    return under + over


@ikon("kort", "hus")
def _():
    return (skugga(48, 86, 34, 5) +
            r(60, 20, 9, 20, 1.5, P["sten"]) +
            r(20, 46, 56, 38, 3, P["rod"]) + glans("M25 53v25", 3, .35) +
            p("M11 50 48 17l37 33z", P["lila_m"]) + glans("M21 45 45 24") +
            fonster(28, 56, 15, 14) + dorr(54, 84, 15, 23, P["gul"]))


@ikon("kort", "stuga")
def _():
    return (skugga(48, 86, 38, 5) +
            r(62, 16, 8, 16, 1.5, P["sten"]) +
            r(15, 46, 66, 38, 2, P["rod_m"]) +
            r(15, 46, 6, 38, 0, P["vit"]) + r(75, 46, 6, 38, 0, P["vit"]) +
            p("M7 49 21 25h54l14 24z", MORK) + glans("M25 30h44", 3, .3) +
            r(25, 54, 18, 18, 2, P["vit"]) + fonster(28.5, 57.5, 11, 11) +
            dorr(52, 84, 14, 22, P["bla"]))


@ikon("kort", "koja")
def _():
    return (skugga(48, 86, 30, 5) +
            p("M23 84 26 48h44l3 36z", P["tra"]) +
            linje("M38 50v34M51 49v35M63 49v35", w=2.5) +
            r(33, 61, 13, 23, 2, P["brun"]) + c(43, 73, 1.3, INK, 'stroke="none"') +
            r(55, 58, 11, 10, 1.5, P["bla_l"]) +
            p("M14 54 80 36l4 8-68 18z", P["brun_m"]) + glans("M22 54 74 40", 2.5, .35) +
            linje("M61 47l4 4", w=2.5))


@ikon("kort", "tält")
def _():
    return (skugga(48, 86, 38, 5) +
            p("M9 84 48 22l39 62z", P["orange"]) +
            p("M48 22 27 84h10z", P["vit"], 'stroke="none"') + p("M48 22 59 84h10z", P["vit"], 'stroke="none"') +
            p("M9 84 48 22l39 62z", "none") +
            p("M48 44 38 84h20z", MORK) + p("M48 44q4 22 14 40h-4z", P["gradde"]) +
            linje("M48 22V9", w=3) + p("M48 8h13l-4 4 4 4H48", P["rosa"], 'stroke-width="3"'))


@ikon("kort", "slott")
def _():
    return (skugga(48, 87, 40, 5) +
            r(30, 40, 36, 44, 2, P["sten_l"]) +
            p("M30 41V32h6v4h6v-4h6v4h6v-4h6v4h6v5", P["sten_l"]) +
            r(11, 36, 19, 48, 2, P["sten"]) + r(66, 36, 19, 48, 2, P["sten"]) +
            p("M7 38 20.5 13 34 38z", P["lila"]) + p("M62 38 75.5 13 89 38z", P["lila"]) +
            glans("M14 33 20 21") + glans("M69 33l6-12") +
            linje("M20.5 13V5M75.5 13V5", w=3) +
            p("M20.5 4.5h8l-2.5 2.5 2.5 2.5h-8", P["rosa"], 'stroke-width="2.5"') +
            p("M75.5 4.5h8l-2.5 2.5 2.5 2.5h-8", P["gul"], 'stroke-width="2.5"') +
            r(17.5, 50, 6, 11, 3, MORK) + r(72.5, 50, 6, 11, 3, MORK) +
            c(48, 52, 4.5, P["bla_l"]) +
            p("M39 84V70a9 9 0 0 1 18 0v14z", P["brun_m"]) + linje("M45 64v20M51 64v20M39 74h18", w=2.2))


@ikon("kort", "torn")
def _():
    return (skugga(48, 86, 18, 4) +
            p("M34 84V36h28v48z", P["sten_l"]) +
            linje("M34 52q14 4 28 0M34 68q14 4 28 0", w=2.2) +
            p("M27 38 48 9l21 29z", P["rosa"]) + glans("M34 34l11-16") +
            linje("M48 9V2.5", w=3) + p("M48 2h9l-3 3 3 3h-9", P["gul"], 'stroke-width="2.5"') +
            p("M44 60v-6a4 4 0 0 1 8 0v6z", MORK) +
            dorr(41, 84, 14, 15, P["brun"]))


@ikon("kort", "mur")
def _():
    return (skugga(48, 86, 42, 4) +
            p("M8 84V34h10v6h7.5v-6h10v6H43v-6h10v6h7.5v-6h10v6H78v-6h10v50z", P["sten"]) +
            linje("M8 50h80M8 62h80M8 74h80", w=2.5) +
            linje("M26 50v12M50 50v12M72 50v12M38 62v12M62 62v12M26 74v10M50 74v10M72 74v10M30 40v10M56 40v10", w=2.5) +
            glans("M13 46v-7", 2.5) + c(80, 80, 3, P["rosa"], 'stroke-width="2"') + linje("M80 83v3", w=2))


@ikon("kort", "port")
def _():
    return (skugga(48, 86, 42, 4) +
            r(9, 32, 20, 52, 2, P["sten"]) + r(67, 32, 20, 52, 2, P["sten"]) +
            r(6, 26, 26, 8, 2, P["sten_l"]) + r(64, 26, 26, 8, 2, P["sten_l"]) +
            p("M29 84V54a19 19 0 0 1 38 0v30z", P["sten_l"]) +
            p("M35 84V54a13 13 0 0 1 26 0v30z", P["brun"]) +
            linje("M48 41v43", w=2.5) +
            "".join(c(x, y, 1.5, INK, 'stroke="none"') for x, y in [(41, 58), (55, 58), (41, 70), (55, 70), (41, 80), (55, 80)]) +
            p("M48 33l3 3-3 3-3-3z", P["guld"], 'stroke-width="2"'))


@ikon("kort", "bro")
def _():
    return (e(48, 85, 40, 6, P["bla_l"]) +
            linje("M24 86q4-2 8 0M58 87q4-2 8 0", w=2.2) +
            p("M5 50H91V84H79V73A42 42 0 0 0 17 73V84H5Z", P["sten"]) +
            linje("M5 42h86", w=3.5) + linje("M10 42v8M26 42v8M42 42v8M58 42v8M74 42v8M88 42v8", w=3) +
            linje("M29 61l-3-5M48 56v-6M67 61l3-5", w=2.5) + glans("M10 56h18", 2.5, .4))


@ikon("kort", "pepparkakshus")
def _():
    kant = "M15 48 48 20l33 28"
    return (skugga(48, 86, 34, 5) +
            r(20, 46, 56, 38, 4, "#C98546") +
            p("M11 51 48 18l37 33z", "#9A5A2C") +
            linje(kant, w=10) + linje(kant, w=5, farg=P["vit"]) +
            c(36, 38, 3, P["rosa"], 'stroke-width="2.2"') + c(48, 30, 3, "#6EE0A8", 'stroke-width="2.2"') + c(60, 38, 3, P["gul"], 'stroke-width="2.2"') +
            linje("M20 54q3.5 3 7 0t7 0 7 0 7 0 7 0 7 0 7 0 7 0", w=6.5) +
            linje("M20 54q3.5 3 7 0t7 0 7 0 7 0 7 0 7 0 7 0 7 0", w=3, farg=P["vit"]) +
            r(27, 60, 14, 12, 3, P["gul"]) + linje("M34 61v10", w=2) +
            p("M53 84V69a7.5 7.5 0 0 1 15 0v15z", P["rosa_l"]) +
            linje("M55 72l11-4M55 78l11-4", w=2.2, farg=P["rosa_m"]))


@ikon("kort", "fyr")
def _():
    return (skugga(48, 88, 30, 4) +
            p("M14 88q4-11 15-11h38q11 0 15 11z", P["sten"]) +
            p("M36 78 40 31h16l4 47z", P["vit"]) +
            p("M37.3 63 38.5 49h19l1.2 14z", P["rod"]) +
            p("M38.9 44 39.5 36h17l.6 8z", P["rod"]) +
            r(33, 27, 30, 5, 2, P["rod_m"]) +
            r(39, 14, 18, 13, 2, P["gul"]) + linje("M45 15v11M51 15v11", w=2) +
            p("M36.5 14.5 48 5l11.5 9.5z", P["rod"]) +
            linje("M31 18h-9M65 18h9M32 10l-6-4M64 10l6-4", w=3.5, farg=P["guld"]) +
            dorr(44, 78, 9, 11, P["brun"]))


@ikon("kort", "trädhus")
def _():
    krona = forenad(['<circle cx="48" cy="32" r="25" {F}/>', '<circle cx="24" cy="42" r="13" {F}/>',
                     '<circle cx="72" cy="40" r="13" {F}/>'], P["gron"])
    return (skugga(50, 87, 30, 5) +
            p("M43 87V44h12v43z", P["brun"]) +
            krona + glans("M30 20q6-9 16-11", 3) +
            r(35, 34, 26, 19, 2, P["rod"]) + p("M31 36 48 23l17 13z", P["lila_m"]) +
            r(43, 39, 10, 9, 1.5, P["bla_l"]) +
            linje("M23 87 30 52M31 87l6-35", w=3) + linje("M25 78h7M27 68h7M29 59h6.5", w=2.5))


@ikon("kort", "regnbågsbro")
def _():
    farger = [P["rod"], P["orange"], P["gul"], P["gron"], P["bla"], P["lila"]]
    radier = [38, 33, 28, 23, 18, 13]
    bagar = "".join(linje(f"M{48-rr} 78A{rr} {rr} 0 0 1 {48+rr} 78", w=5.6, farg=f) for rr, f in zip(radier, farger))
    moln = lambda x: forenad([f'<circle cx="{x-8}" cy="80" r="7" {{F}}/>', f'<circle cx="{x+1}" cy="76" r="9" {{F}}/>',
                               f'<circle cx="{x+9}" cy="81" r="6" {{F}}/>', f'<rect x="{x-14}" y="80" width="28" height="8" rx="4" {{F}}/>'], P["vit"])
    bage = lambda R, w, f=None: linje(f"M{48-R} 78A{R} {R} 0 0 1 {48+R} 78", w=w, farg=f)
    return (bagar + bage(40.8, 4) + bage(10.2, 4) +
            glans("M20 56q8-12 20-14", 2.5, .5) +
            moln(16) + moln(80))


@ikon("kort", "stall")
def _():
    return (skugga(48, 86, 38, 5) +
            r(13, 46, 70, 38, 2, P["brun_l"]) +
            linje("M24 47v37M72 47v37", w=2.2) +
            p("M7 49 22 30h52l15 19z", P["gron_m"]) + glans("M26 35h42", 3, .35) +
            r(36, 55, 24, 29, 2, P["rod_m"]) + linje("M36 69h24", w=3) +
            linje("M39 72l18 10M57 72 39 82", w=2.5, farg=P["vit"]) +
            p("M48 38a5 5 0 0 0-5 5v3h2.5v-3a2.5 2.5 0 0 1 5 0v3H53v-3a5 5 0 0 0-5-5z", P["guld"], 'stroke-width="2"') +
            r(17, 56, 13, 10, 1.5, P["gul"]) + linje("M19 61l3-3M22 64l5-5M25 65l3-3", w=1.8, farg=P["guld_m"]) +
            r(66, 56, 13, 10, 1.5, P["gul"]) + linje("M68 61l3-3M71 64l5-5M74 65l3-3", w=1.8, farg=P["guld_m"]))


@ikon("kort", "lada")
def _():
    return (skugga(48, 86, 38, 5) +
            p("M16 84V50l7-18 25-13 25 13 7 18v34z", P["rod"]) +
            linje("M11 51 20 31 48 16l28 15 9 20", w=9) + linje("M11 51 20 31 48 16l28 15 9 20", w=4, farg=P["vit"]) +
            r(32, 56, 32, 28, 1.5, P["vit"]) + r(36, 60, 24, 24, 0, P["rod_m"]) +
            linje("M36 60l24 24M60 60 36 84", w=4, farg=P["vit"]) +
            r(41, 30, 14, 14, 1.5, P["vit"]) + r(44, 33, 8, 11, 0, P["gul"], 'stroke="none"') +
            linje("M45 40l2-3M49 41l2-4", w=1.8, farg=P["guld_m"]))


@ikon("kort", "hönshus")
def _():
    return (skugga(50, 87, 34, 5) +
            linje("M28 70v16M66 70v16", w=6) + linje("M28 70v16M66 70v16", w=2.5, farg=P["brun_l"]) +
            r(18, 40, 58, 32, 3, P["gul"]) + glans("M23 47v20", 3, .35) +
            p("M10 44 47 20l37 24z", P["rod"]) + glans("M20 40l22-14") +
            c(47, 56, 7, MORK) +
            p("M60 70 86 84l-3 5-27-15z", P["tra"]) + linje("M66 76l-2 4M73 80l-2 4M80 83l-2 4", w=2.2) +
            c(31, 82, 4.5, P["vit"], 'stroke-width="2.5"') + p("M26.5 82l-3.5 1.5 3.5 1.5", P["orange"], 'stroke-width="2"'))


@ikon("kort", "hundkoja")
def _():
    ben = "M41 44a2.6 2.6 0 1 1 3-3.2h8a2.6 2.6 0 1 1 3 3.2 2.6 2.6 0 1 1-3 3.2h-8a2.6 2.6 0 1 1-3-3.2z"
    return (skugga(48, 86, 34, 5) +
            p("M22 84V52h52v32z", P["brun_l"]) + linje("M22 62h10M64 62h10M22 74h10M64 74h10", w=2.2) +
            p("M13 56 48 26l35 30z", P["rod"]) + glans("M23 51l22-19") +
            p("M37 84V69a11 11 0 0 1 22 0v15z", MORK) +
            p(ben, P["vit"], 'stroke-width="2.4"') +
            e(76, 84, 8, 3.5, P["bla"]))


@ikon("kort", "fågelholk")
def _():
    return (skugga(48, 87, 14, 3) +
            r(44.5, 58, 7, 29, 1.5, P["brun"]) +
            p("M30 62V35l18-14 18 14v27z", P["bla"]) + glans("M35 40v16", 3, .4) +
            p("M23 38.5 48 16l25 22.5-4 4L48 23.5 27 42.5z", P["rod"]) +
            c(48, 41, 6, MORK) + linje("M48 52v6", w=3) + c(48, 59, 2, P["brun"], 'stroke-width="2"') +
            r(27, 60, 42, 6, 2, P["brun_l"]) +
            e(72, 26, 6, 5, P["gul"], 'stroke-width="2.5"') + c(75, 23.5, 1, INK, 'stroke="none"') + p("M78 25.5l3 1-3 1", P["orange"], 'stroke-width="1.8"'))


@ikon("kort", "hage")
def _():
    def stolpar(pts, h1, h2):
        return "".join(r(x - 2.5, y - h1, 5, h1 + h2, 1.5, P["tra"]) for x, y in pts)
    bak = [(14, 60.3), (30.5, 54.9), (48, 53), (65.5, 54.9), (82, 60.3)]
    fram = [(10, 71), (29, 78.5), (48, 81), (67, 78.5), (86, 71)]
    return (e(48, 68, 40, 15, P["gron_l"]) +
            linje("M10 62Q48 44 86 62", w=7) + linje("M10 62Q48 44 86 62", w=3, farg=P["tra"]) +
            stolpar(bak, 7, 9) +
            c(36, 66, 2.6, P["rosa"], 'stroke-width="1.8"') + c(58, 64, 2.6, P["gul"], 'stroke-width="1.8"') + c(48, 72, 2.4, P["vit"], 'stroke-width="1.8"') +
            linje("M8 72Q48 92 88 72", w=8) + linje("M8 72Q48 92 88 72", w=3.5, farg=P["tra"]) +
            stolpar(fram, 9, 11))


@ikon("kort", "väderkvarn")
def _():
    blad = '<path d="M43.5 32V4h11v28z" fill="#FFF1D6"/><path d="M43.5 11h11M43.5 18h11M43.5 25h11M49 4v28" stroke-width="1.6" opacity=".7"/><path d="M43.5 32V4h11v28z" stroke-width="3"/>'
    vingar = "".join(f'<g transform="rotate({v} 48 36)">{blad}</g>' for v in (20, 110, 200, 290))
    return (skugga(48, 88, 22, 4) +
            p("M34 87 39 40h18l5 47z", P["vit"]) + glans("M40 50l-2 28", 2.5, .4) +
            dorr(43.5, 87, 9, 13, P["bla"]) + c(48, 58, 3.5, P["bla_l"]) +
            p("M36.5 41.5 48 27.5l11.5 14z", P["rod"]) +
            vingar + c(48, 36, 4.5, P["brun"]))
