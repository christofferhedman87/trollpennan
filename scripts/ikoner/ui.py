"""UI-ikoner (48×48), ordklassmärken och sektionsikoner."""
from bas import *

S = 48

# ---------------------------------------------------------------- UI
@ikon("ui", "penna", S)
def _():
    return (gnista(9, 10, 5) +
            '<g transform="rotate(40 25 25)">' +
            p("M19 14h12v20H19z", P["pennlila"]) +
            p("M19 34h12l-6 10z", P["guld"]) +
            linje("M25 38.5v5.5", w=2) +
            p("M19 14V10a6 6 0 0 1 12 0v4z", P["pennrosa"]) +
            glans("M22.5 17.5v13", 2.5) + "</g>")


@ikon("ui", "lyssna", S)
def _():
    return (p("M7 19h7l10-8v26l-10-8H7z", P["gul"]) +
            linje("M30 18a8 8 0 0 1 0 12") + linje("M35.5 12.5a15.5 15.5 0 0 1 0 23"))


@ikon("ui", "ljud-av", S)
def _():
    return (p("M7 19h7l10-8v26l-10-8H7z", P["gra"]) +
            linje("M30 18l11 12M41 18 30 30"))


@ikon("ui", "angra", S)
def _():
    return (linje("M17 11 9 19l8 8", w=3.5) +
            linje("M10 19h17a10.5 10.5 0 0 1 0 21h-6", w=3.5))


@ikon("ui", "sudda", S)
def _():
    return ('<g transform="rotate(-35 24 23)">' +
            r(7, 15, 34, 16, 4.5, P["rosa"]) +
            p("M7 19.5a4.5 4.5 0 0 1 4.5-4.5H20v16h-8.5A4.5 4.5 0 0 1 7 26.5z", P["vit"]) +
            glans("M24 19h12", 2.5) + "</g>" +
            linje("M13 41h24", w=3))


@ikon("ui", "radera", S)
def _():
    return (p("M18 11h20a5 5 0 0 1 5 5v16a5 5 0 0 1-5 5H18L5 24z", P["vit"]) +
            linje("M23 18.5l10 11M33 18.5l-10 11", w=3))


@ikon("ui", "tarning", S)
def _():
    prick = lambda x, y: c(x, y, 3, INK, 'stroke="none"')
    return ('<g transform="rotate(-12 24 25)">' +
            r(9, 10, 30, 30, 8, P["vit"]) +
            prick(17.5, 18.5) + prick(30.5, 18.5) + prick(24, 25) + prick(17.5, 31.5) + prick(30.5, 31.5) +
            "</g>" + gnista(40, 8, 5.5))


@ikon("ui", "stang", S)
def _():
    return linje("M14 14l20 20M34 14 14 34", w=4.5)


@ikon("ui", "stjarna", S)
def _():
    return (stjarna5(24, 26, 20, 9.5, P["guld"]) +
            c(19.5, 25, 1.6, INK, 'stroke="none"') + c(28.5, 25, 1.6, INK, 'stroke="none"') +
            linje("M21 30q3 2.5 6 0", w=2.2) + glans("M18 15l3-6", 2.2))


@ikon("ui", "las", S)
def _():
    return (linje("M16 21v-5a8 8 0 0 1 16 0v5", w=3.5) +
            r(10, 21, 28, 21, 6, P["guld"]) +
            c(24, 30, 3, INK, 'stroke="none"') + linje("M24 32v4", w=3))


@ikon("ui", "karta", S)
def _():
    return (p("M5 12l12-4 14 4 12-4v28l-12 4-14-4-12 4z", P["gradde"]) +
            linje("M17 8v28M31 12v28", w=2.5) +
            linje("M9 30c4-1 5-6 10-6s7 6 12 3", w=2.5, farg=P["rod"], extra='stroke-dasharray="1 4.5"') +
            linje("M33 17l5 5M38 17l-5 5", w=3, farg=P["rod"]))


@ikon("ui", "dalen", S)
def _():
    # kikare
    return (r(6, 18, 15, 20, 7, P["lila"]) + r(27, 18, 15, 20, 7, P["lila"]) +
            r(19, 21, 10, 9, 2, P["lila_m"]) +
            c(13.5, 32, 5, P["bla_l"]) + c(34.5, 32, 5, P["bla_l"]) +
            r(9, 10, 9, 9, 3, P["lila_m"]) + r(30, 10, 9, 9, 3, P["lila_m"]) +
            glans("M11.5 31.5l2-2", 2) + glans("M32.5 31.5l2-2", 2))


@ikon("ui", "uppdrag", S)
def _():
    return (p("M11 7h20l7 7v27H11z", P["vit"]) + p("M31 7v7h7", P["gradde"]) +
            linje("M16 19h14M16 25h16M16 31h9", w=2.5) +
            c(33, 36, 6.5, P["rod"]) + gnista(33, 36, 3, P["vit"]))


@ikon("ui", "boken", S)
def _():
    return (p("M9 9h26a4 4 0 0 1 4 4v27H13a4 4 0 0 1-4-4z", P["pennlila"]) +
            p("M9 36a4 4 0 0 1 4-4h26v8H13a4 4 0 0 1-4-4z", P["vit"]) +
            stjarna5(25, 20, 7, 3.4, P["guld"], 2.2))


@ikon("ui", "album", S)
def _():
    return (p("M9 9h26a4 4 0 0 1 4 4v27H13a4 4 0 0 1-4-4z", P["rosa"]) +
            p("M9 36a4 4 0 0 1 4-4h26v8H13a4 4 0 0 1-4-4z", P["vit"]) +
            e(24, 22, 4.5, 3.8, P["vit"], 'stroke-width="2.2"') +
            c(17.5, 16.5, 2, P["vit"], 'stroke-width="2"') + c(22, 13.5, 2, P["vit"], 'stroke-width="2"') +
            c(26.5, 13.5, 2, P["vit"], 'stroke-width="2"') + c(31, 16.5, 2, P["vit"], 'stroke-width="2"'))


@ikon("ui", "ordbok", S)
def _():
    return (p("M9 9h26a4 4 0 0 1 4 4v27H13a4 4 0 0 1-4-4z", P["gron"]) +
            p("M9 36a4 4 0 0 1 4-4h26v8H13a4 4 0 0 1-4-4z", P["vit"]) +
            linje("M17 27l6-14 6 14M19.3 22h7.4", w=3, farg=P["vit"]) +
            linje("M17 27l6-14 6 14M19.3 22h7.4", w=1.2) + gnista(34, 14, 3.5))


@ikon("ui", "stall", S)
def _():
    # hästsko
    return (p("M12 10h7v14a5 5 0 0 0 10 0V10h7v14a12 12 0 0 1-24 0z", P["sten"]) +
            c(15.5, 15, 1.4, INK, 'stroke="none"') + c(32.5, 15, 1.4, INK, 'stroke="none"') +
            c(16.5, 25, 1.4, INK, 'stroke="none"') + c(31.5, 25, 1.4, INK, 'stroke="none"') +
            glans("M14.5 30q3 5 7 6", 2.2) + gnista(39, 39, 4.5))


@ikon("ui", "lada", S)
def _():
    return (p("M7 19l17-6 17 6v19l-17 6-17-6z", P["tra"]) +
            linje("M7 19l17 6 17-6M24 25v19", w=2.5) +
            p("M7 19l-4 6 17 6 4-6z", P["brun_l"]) + p("M41 19l4 6-17 6-4-6z", P["brun_l"]))


@ikon("ui", "intro", S)
def _():
    return (r(8, 20, 32, 20, 4, P["svart"]) +
            p("M7 12.5l30-6 1.5 7.5-30 6z", P["vit"]) +
            linje("M14 11.5l4 6.5M22 10l4 6.5M30 8.5l4 6.5", w=2.5) +
            p("M21 25v10l9-5z", P["guld"], 'stroke-width="2.2"'))


@ikon("ui", "guldord", S)
def _():
    return (p("M24 5l12 15-12 23L12 20z", P["guld"]) +
            linje("M24 25v10", w=2.5) + c(24, 22, 2.6, P["vit"], 'stroke-width="2.2"') +
            glans("M16.5 19.5 22 12", 2.4) + gnista(40, 10, 4.5, P["vit"]))


@ikon("ui", "agg", S)
def _():
    return (p("M24 5c9 0 15 14 15 23a15 15 0 0 1-30 0C9 19 15 5 24 5z", P["gradde"]) +
            c(16, 30, 2.2, P["lila_l"], 'stroke="none"') + c(31, 18, 2, P["lila_l"], 'stroke="none"') +
            c(33, 33, 1.6, P["lila_l"], 'stroke="none"') +
            linje("M20 22a4.5 4.5 0 1 1 6.5 4c-1.6.9-2.5 2-2.5 3.8", w=3) +
            c(24, 35, 1.8, INK, 'stroke="none"'))


@ikon("ui", "skift", S)
def _():
    return p("M24 7 7 26h9v14h16V26h9z", P["vit"])


@ikon("ui", "bock", S)
def _():
    return linje("M11 25l9 9 17-19", w=4.5)


@ikon("ui", "hem", S)
def _():
    return (p("M12 22h24v18H12z", P["rod"]) + p("M6 25 24 9l18 16", P["lila_m"]) +
            dorr(20, 40, 8, 11, P["gul"]))


@ikon("ui", "trolla", S)
def _():
    return (gnista(22, 25, 16, P["guld"]) + gnista(38, 10, 6, P["pennrosa"]) +
            gnista(38, 38, 4.5, P["vit"]) + gnista(8, 9, 4, P["vit"]))


@ikon("ui", "pil", S)
def _():
    return linje("M19 12l12 12-12 12", w=4.5)


@ikon("ui", "info", S)
def _():
    return c(24, 24, 17, P["bla_l"]) + linje("M24 22v11", w=4) + c(24, 15.5, 2.4, INK, 'stroke="none"')


# ---------------------------------------------------------------- Ordklassmärken
# Formerna följer Montessoris grammatiksymboler: substantiv = stor triangel,
# adjektiv = mindre triangel, preposition = halvmåne, verb = cirkel, småord = stav.
ORDKLASS = {
    "vad": "#FFD23F", "hurdan": "#7CC8FF", "har": "#6EE0A8", "gor": "#FF8C7A", "smaord": "#CFC6F2",
}


@ikon("ordklass", "vad", S)
def _():
    return p("M24 6.5 42.5 39.5h-37z", ORDKLASS["vad"]) + glans("M19 26l4.5-8", 2.5)


@ikon("ordklass", "hurdan", S)
def _():
    return p("M24 13.5 37.5 37.5h-27z", ORDKLASS["hurdan"]) + glans("M20.5 29.5l3-5.5", 2.5)


@ikon("ordklass", "har", S)
def _():
    return p("M30 8a16.5 16.5 0 1 0 0 32a20 20 0 0 1 0-32z", ORDKLASS["har"]) + glans("M14 20.5q1-4.5 5-7", 2.5)


@ikon("ordklass", "gor", S)
def _():
    return c(24, 24, 15.5, ORDKLASS["gor"]) + glans("M15.5 20q1.5-5 6-6.5", 2.5)


@ikon("ordklass", "smaord", S)
def _():
    return r(7, 18.5, 34, 11, 5.5, ORDKLASS["smaord"])


# ---------------------------------------------------------------- Sektioner
@ikon("kategori", "djur", S)
def _():
    return (e(24, 31, 10, 8.5, P["brun_l"]) +
            e(12, 21, 4, 5, P["brun_l"]) + e(19.5, 13.5, 4, 5, P["brun_l"]) +
            e(28.5, 13.5, 4, 5, P["brun_l"]) + e(36, 21, 4, 5, P["brun_l"]) +
            glans("M19 28.5q2.5-3 6-3.5", 2.4))


@ikon("kategori", "hus", S)
def _():
    return (p("M11 22h26v19H11z", P["rod"]) + p("M5 25 24 8l19 17", P["lila_m"]) +
            r(14.5, 27, 8, 8, 2, P["bla_l"]) + dorr(26, 41, 8, 11))


@ikon("kategori", "natur", S)
def _():
    return (p("M22 30h4v12h-4z", P["brun"]) +
            c(24, 21, 14, P["gron"]) + glans("M15 17q2.5-6 8.5-7", 2.6) +
            c(17, 24, 2, P["rosa"], 'stroke="none"') + c(30, 15, 2, P["rosa"], 'stroke="none"') + c(31, 27, 2, P["rosa"], 'stroke="none"'))


@ikon("kategori", "lek", S)
def _():
    return (linje("M7 42 16 7M41 42 32 7M14 7h20", w=3.5) +
            linje("M20 7v22M28 7v22", w=2.2) + r(16.5, 28, 15, 5, 2.5, P["rosa"]))


@ikon("kategori", "farg", S)
def _():
    return (p("M24 6C12 6 5 14 5 23c0 9 6 16 14 16 4 0 4-4 3-6-1.5-3 1-5 4-5h6c6 0 11-4 11-10C43 11 35 6 24 6z", P["gradde"]) +
            c(14, 19, 3.6, P["rod"], 'stroke-width="2.2"') + c(23, 13, 3.6, P["gul"], 'stroke-width="2.2"') +
            c(32.5, 15, 3.6, P["bla"], 'stroke-width="2.2"') + c(13.5, 29, 3.6, P["gron"], 'stroke-width="2.2"'))


@ikon("kategori", "storlek", S)
def _():
    return (c(14, 31, 6, P["lila_l"]) + c(31, 24, 13, P["lila"]) +
            glans("M24 18q2-4 6-5", 2.4) + glans("M10.5 29.5l1.5-2", 2))


@ikon("kategori", "monster", S)
def _():
    dots = "".join(c(x, y, 2.6, P["vit"], 'stroke="none"') for x, y in [(17, 15), (29, 13), (35, 25), (24, 24), (14, 28), (28, 34), (19, 37)])
    return c(24, 25, 17, P["rosa"]) + dots


@ikon("kategori", "material", S)
def _():
    return (r(6, 29, 17, 11, 2, P["rod"]) + r(25, 29, 17, 11, 2, P["rod"]) +
            r(15, 17, 18, 11, 2, P["rod_m"]) + r(9, 6, 14, 10, 2, P["bla_l"]) +
            glans("M11.5 9.5h6", 2.2))


@ikon("kategori", "form", S)
def _():
    # trollspegel: "ser ut som"
    return (p("M24 41v-4", "none") + p("M16 44h16", "none") +
            e(24, 21, 12, 15, P["lila"]) + e(24, 21, 8, 11, P["bla_l"]) +
            glans("M20 17l3-4M19.5 23l7-8", 2.2) + linje("M24 36v6M17 44h14", w=3.5) + gnista(39, 8, 4))


@ikon("kategori", "tillbehor", S)
def _():
    return (e(24, 37, 19, 5.5, P["lila_m"]) + p("M13 37V15a3 3 0 0 1 3-3h16a3 3 0 0 1 3 3v22", P["lila"]) +
            r(13, 27, 22, 6, 0, P["guld"]) + glans("M17 16v8", 2.5))


@ikon("kategori", "delar", S)
def _():
    return (p("M12 42V18h24v24z", P["sten"]) +
            p("M10 18v-8h6v4h5v-4h6v4h5v-4h6v8z", P["sten_l"]) +
            dorr(19, 42, 10, 12, P["brun_l"]) + linje("M24 10V3", w=2.5) + p("M24 3h9l-3 3 3 3h-9", P["rod"], 'stroke-width="2.2"'))


@ikon("kategori", "formaga", S)
def _():
    return (p("M8 34c0-14 10-25 32-27-3 6-5 9-11 11 4 0 6 0 8-1-3 6-7 9-13 10 3 1 5 1 7 0-4 6-10 9-23 7z", P["vit"]) +
            linje("M17 30q8-5 16-15", w=2.2) + gnista(38, 34, 4.5))


@ikon("kategori", "egenskap", S)
def _():
    return (linje("M10 33q6-12 16-5t14-9", w=7) + linje("M10 33q6-12 16-5t14-9", w=3.5, farg=P["pennrosa"]) +
            gnista(34, 13, 8) + gnista(13, 14, 4.5, P["vit"]) + gnista(36, 37, 4, P["vit"]))


@ikon("ui", "tangentbord", S)
def _():
    tangent = lambda x, y, w=6, f=None: r(x, y, w, 5.5, 1.6, f or P["vit"], 'stroke-width="2"')
    return (r(4, 12, 40, 26, 6, P["lila_l"]) +
            tangent(9, 17) + tangent(17, 17, f="#FFE3EE") + tangent(25, 17) + tangent(33, 17, f="#FFE3EE") +
            tangent(9, 25, f="#FFE3EE") + tangent(17, 25) + tangent(25, 25) + tangent(33, 25) +
            r(14, 32, 20, 3.2, 1.6, P["guld"], 'stroke-width="1.8"'))


@ikon("ui", "ordhjalp", S)
def _():
    kort = lambda rot, f, inner: (f'<g transform="rotate({rot} 24 40)">' + r(15, 9, 18, 25, 4, P["vit"]) + inner + "</g>")
    return (kort(-22, P["vit"], c(24, 18, 4, P["gul"], 'stroke-width="2"')) +
            kort(0, P["vit"], p("M19 22l5-8 5 8z", P["bla_l"], 'stroke-width="2"')) +
            kort(22, P["vit"], c(24, 18, 4, P["rosa"], 'stroke-width="2"')) +
            linje("M19 28h10", w=2.2) + gnista(40, 8, 4.5))
