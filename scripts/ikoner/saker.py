"""Kortkonst 96×96: material, delar, verb (Gör), byggegenskaper (Hurdan) och former (ser ut som)."""
from bas import *
from byggnader import forenad, MORK


# ---------------------------------------------------------------- Material (kuber)
def kub(topp, vanster, hoger, extra=""):
    return (skugga(48, 84, 30, 5) +
            p("M48 46 20 32v34l28 14z", vanster) + p("M48 46l28-14v34L48 80z", hoger) +
            p("M48 18 76 32 48 46 20 32z", topp) + extra)


@ikon("material", "trä")
def _():
    return kub("#E8B47A", P["tra"], P["tra_m"],
               e(48, 32, 10, 5, "none", 'stroke-width="2.2"') + e(48, 32, 4.5, 2.2, "none", 'stroke-width="2"') +
               linje("M26 44l18 9M26 55l18 9M54 54l16-8M54 64l16-8", w=2.2))


@ikon("material", "sten")
def _():
    return kub(P["sten_l"], P["sten"], P["sten_m"],
               linje("M30 46l6 6 0 8M60 52l6-4M58 64l8 2", w=2.2) + glans("M36 30l10-5", 2.5, .6))


@ikon("material", "glas")
def _():
    return (skugga(48, 84, 30, 5) +
            p("M48 46 20 32v34l28 14z", "#D8F1FF", 'opacity=".9"') + p("M48 46l28-14v34L48 80z", "#BDE6FF", 'opacity=".9"') +
            p("M48 18 76 32 48 46 20 32z", "#EEF9FF") +
            glans("M26 40v18M32 44v8", 3, .9) + glans("M56 50l12-6", 3, .9))


@ikon("material", "is")
def _():
    return kub("#E6FBFF", "#A8EEFA", "#6FD3EA",
               glans("M25 41v14", 3, .9) + glans("M55 48l14-7", 3, .9) +
               p("M60 18l3 6 6 1-5 4 1 6-5-3-5 3 1-6-5-4 6-1z", P["vit"], 'stroke-width="2"'))


@ikon("material", "godis")
def _():
    rander = (p("M28 36l8 4v34l-8-4z", P["vit"], 'stroke="none"') + p("M40 42l6 3v34l-6-3z", P["vit"], 'stroke="none"') +
              p("M56 42l8-4v34l-8 4z", P["vit"], 'stroke="none"') + p("M68 36l6-3v34l-6 3z", P["vit"], 'stroke="none"'))
    return (skugga(48, 84, 30, 5) +
            p("M48 46 20 32v34l28 14z", P["rosa"]) + p("M48 46l28-14v34L48 80z", "#FF9FCB") + rander +
            p("M48 46 20 32v34l28 14zM48 46l28-14v34L48 80z", "none") +
            p("M48 18 76 32 48 46 20 32z", P["rosa_l"]) +
            c(40, 30, 2.5, "#6EE0A8", 'stroke-width="1.8"') + c(54, 28, 2.5, P["gul"], 'stroke-width="1.8"') + c(50, 37, 2.5, P["bla_l"], 'stroke-width="1.8"'))


@ikon("material", "choklad")
def _():
    return kub("#9B5E3A", "#7A4528", "#5E3320",
               linje("M34 25l28 14M62 25 34 39", w=2.2) +
               linje("M20 49l28 14M48 63l28-14", w=2.2) + linje("M34 39v34M62 39v34", w=2.2))


@ikon("material", "moln")
def _():
    return forenad(['<circle cx="32" cy="54" r="15" {F}/>', '<circle cx="50" cy="42" r="19" {F}/>', '<circle cx="68" cy="54" r="14" {F}/>',
                    '<rect x="18" y="52" width="64" height="20" rx="10" {F}/>'], P["vit"]) + glans("M38 38q5-9 15-9", 3, .9) + \
        linje("M30 66h36", w=2.2, farg="#C9D6EE")


@ikon("material", "kristall")
def _():
    return (skugga(48, 85, 28, 4) +
            p("M48 10 60 30 54 82H42L36 30z", "#C8B5FF") + linje("M48 10v72M36 30h24", w=2.2) +
            p("M28 34l10 10-2 38h-8l-6-30z", "#A98BFF") + p("M70 38l6 16-4 28h-8l-2-34z", "#E2D6FF") +
            glans("M44 18l-4 10", 2.6, .9) + gnista(76, 18, 5, P["vit"]))


@ikon("material", "guld")
def _():
    return (skugga(48, 84, 34, 5) +
            p("M18 70 28 50h40l10 20z", P["guld"]) + p("M18 70h60v10H18z", P["guld_m"]) +
            p("M30 50l6-12h24l6 12z", "#FFE07A") + glans("M36 44h20", 2.6, .9) +
            gnista(70, 30, 6, P["vit"]) + gnista(22, 38, 4, P["vit"]))


# ---------------------------------------------------------------- Delar (Har, byggen)
@ikon("del", "fönster")
def _():
    return (r(22, 18, 52, 60, 4, P["vit"]) + r(29, 25, 38, 46, 2, P["bla_l"]) +
            linje("M48 25v46M29 48h38", w=3.5) + glans("M34 30l8-4", 3, .9) +
            p("M22 18c10 10 10 30 2 46-1-14-1-30-2-46z", P["rosa"], 'stroke-width="2.6"') +
            p("M74 18c-10 10-10 30-2 46 1-14 1-30 2-46z", P["rosa"], 'stroke-width="2.6"') +
            r(18, 76, 60, 7, 2.5, P["tra"]))


@ikon("del", "dörr")
def _():
    return (skugga(48, 86, 26, 4) +
            p("M24 84V38a24 24 0 0 1 48 0v46z", P["sten_l"]) +
            p("M30 84V39a18 18 0 0 1 36 0v45z", P["bla"]) +
            linje("M36 50h24M36 64h24", w=2.2) + c(59, 72, 2.8, P["guld"], 'stroke-width="2.2"') +
            c(48, 34, 5, P["bla_l"], 'stroke-width="2.4"'))


@ikon("del", "tak")
def _():
    return (skugga(48, 76, 38, 4) +
            p("M8 72 48 22l40 50z", P["rod"]) +
            linje("M26 50h44M18 62h60M36 38h24", w=2.2, farg=P["rod_m"]) +
            linje("M34 50l-3 12M50 50l-1 12M64 50l2 12M44 38l-2 12M56 38l2 12", w=2.2, farg=P["rod_m"]) +
            glans("M18 66 44 32", 3, .45))


@ikon("del", "skorsten")
def _():
    rok = forenad(['<circle cx="58" cy="24" r="8" {F}/>', '<circle cx="70" cy="16" r="6" {F}/>', '<circle cx="50" cy="16" r="6" {F}/>'], P["vit"])
    return (skugga(42, 86, 22, 4) +
            r(30, 40, 24, 46, 2, P["rod_m"]) + r(26, 36, 32, 8, 2, P["sten"]) +
            linje("M30 54h24M30 68h24M42 44v10M36 54v14M48 54v14M42 68v18", w=2.2, farg="#8E2A35") +
            rok)


@ikon("del", "flagga")
def _():
    return (skugga(34, 88, 12, 3) +
            linje("M30 86V12", w=5) + linje("M30 86V12", w=2, farg=P["brun_l"]) + c(30, 10, 4, P["guld"], 'stroke-width="2.6"') +
            p("M32 16c14-6 22 6 44-2v32c-22 8-30-4-44 2z", P["pennrosa"]) +
            stjarna5(52, 30, 7, 3.4, P["gul"], 2.2))


@ikon("del", "vingar")
def _():
    vinge = "M48 50C40 30 22 20 8 22c6 6 6 10 4 14 6 0 10 2 12 6-4 2-6 6-4 10 10 2 20 2 28-2z"
    return (p(vinge, P["vit"]) + '<g transform="matrix(-1 0 0 1 96 0)">' + p(vinge, P["vit"]) + "</g>" +
            linje("M16 30q12 2 22 10M20 44q10 0 18 4", w=2.2, farg="#C9D6EE") +
            linje("M80 30q-12 2-22 10M76 44q-10 0-18 4", w=2.2, farg="#C9D6EE") +
            e(48, 52, 6, 10, P["gul"]) + gnista(48, 80, 5))


@ikon("del", "hjul")
def _():
    return (skugga(48, 88, 30, 4) +
            c(48, 50, 34, P["tra"]) + c(48, 50, 26, P["gradde"]) +
            linje("M48 24v52M22 50h52M30 32l36 36M66 32 30 68", w=4) + c(48, 50, 7, P["tra_m"]) +
            glans("M24 38q6-14 20-18", 3, .5))


@ikon("del", "kupol")
def _():
    return (skugga(48, 86, 30, 4) +
            r(22, 62, 52, 22, 2, P["vit"]) + linje("M34 62v22M48 62v22M62 62v22", w=2.2) +
            p("M18 64c0-20 12-30 30-44 18 14 30 24 30 44z", P["guld"]) +
            linje("M48 20c-8 14-10 30-8 44M48 20c8 14 10 30 8 44", w=2.2, farg=P["guld_m"]) +
            linje("M48 20V8", w=3) + c(48, 7, 3.5, P["pennrosa"], 'stroke-width="2.4"') + glans("M28 54q2-14 14-24", 3, .55))


@ikon("del", "balkong")
def _():
    return (r(18, 14, 60, 52, 3, P["gradde"]) + p("M36 66V36a12 12 0 0 1 24 0v30z", P["bla_l"]) +
            linje("M48 24v42", w=2.2) +
            r(10, 60, 76, 7, 2, P["vit"]) + r(10, 82, 76, 6, 2, P["vit"]) +
            linje("M16 67v15M26 67v15M36 67v15M46 67v15M56 67v15M66 67v15M76 67v15", w=3.5) +
            c(20, 56, 5, P["rosa"], 'stroke-width="2.4"') + c(76, 56, 5, P["gul"], 'stroke-width="2.4"'))


@ikon("del", "trappa")
def _():
    return (skugga(50, 86, 38, 4) +
            p("M12 84V72h16V60h16V48h16V36h16V24h10v60z", P["sten_l"]) +
            linje("M12 72h16M28 60h16M44 48h16M60 36h16M76 24h10", w=4, farg=P["sten"]) +
            linje("M12 72h16V60h16V48h16V36h16V24h10", w=4) + glans("M80 30v40", 3, .5))


# ---------------------------------------------------------------- Verb (Gör) – djur och byggen
@ikon("verb", "flyger")
def _():
    return (forenad(['<circle cx="30" cy="74" r="10" {F}/>', '<circle cx="46" cy="70" r="13" {F}/>', '<circle cx="62" cy="75" r="9" {F}/>',
                     '<rect x="20" y="72" width="50" height="12" rx="6" {F}/>'], P["vit"]) +
            p("M40 50C34 30 20 20 6 22c6 6 6 10 4 14 6 0 10 2 12 6-4 2-6 6-4 10 10 2 16 2 22-2z", P["vit"]) +
            linje("M14 30q10 2 18 10M18 42q8 0 14 4", w=2.2, farg="#C9D6EE") +
            linje("M60 24l14-4M64 34l18-2M60 44l12 2", w=3.2, farg=P["pennlila"]))


@ikon("verb", "simmar")
def _():
    return (p("M14 54q8-8 16 0t16 0 16 0 16 0 16 0v28H14z", P["bla_l"]) +
            p("M14 54q8-8 16 0t16 0 16 0 16 0 16 0", "none") +
            p("M40 54c4-20 16-30 30-34-4 10-6 22-4 34z", P["bla"]) +
            linje("M24 70q8-6 16 0M54 72q8-6 16 0", w=2.5, farg=P["bla_m"]) + c(30, 34, 4, P["vit"], 'stroke-width="2.2"') + c(22, 22, 2.6, P["vit"], 'stroke-width="2"'))


@ikon("verb", "lyser")
def _():
    strale = "".join(f'<g transform="rotate({v} 48 48)"><path d="M48 10v10" stroke="{P["guld"]}" stroke-width="5"/><path d="M48 10v10" stroke-width="1.6"/></g>' for v in range(0, 360, 45))
    return (c(48, 48, 26, P["gul"], 'stroke="none" opacity=".35"') + strale +
            c(48, 48, 17, P["gul"]) + glans("M40 42q2-6 8-8", 3, .8) + c(43, 50, 2, INK, 'stroke="none"') + c(53, 50, 2, INK, 'stroke="none"') +
            linje("M44 56q4 3 8 0", w=2.4))


@ikon("verb", "sprutar-eld")
def _():
    return (skugga(48, 86, 22, 4) +
            p("M48 84c-18 0-26-12-24-26 2-10 10-14 10-26 8 6 10 12 10 18 4-4 6-12 4-22 14 8 26 22 26 34 0 14-10 22-26 22z", P["orange"]) +
            p("M48 84c-9 0-14-6-12-14 1-5 6-7 7-14 5 4 6 8 6 12 3-2 4-6 3-10 7 5 10 10 10 16 0 6-6 10-14 10z", P["gul"]) +
            glans("M32 58q0-6 4-10", 2.6, .6))


@ikon("verb", "springer-snabbt")
def _():
    return (skugga(54, 82, 28, 4) +
            p("M30 72c0-10 4-24 10-30h14c2 8 10 14 22 16 6 1 8 6 8 10v6H34c-2 0-4-1-4-2z", P["pennrosa"]) +
            r(28, 72, 58, 8, 3, P["vit"]) + linje("M44 48l8 4M42 56l10 4", w=2.5) +
            linje("M6 50h16M2 62h18M8 74h12", w=3.6, farg=P["pennlila"]))


@ikon("verb", "hoppar")
def _():
    return (skugga(48, 88, 22, 4) +
            linje("M18 80q30-80 60 0", w=3, extra='stroke-dasharray="2 7"') +
            c(48, 30, 13, P["gron"]) + c(44, 28, 2, INK, 'stroke="none"') + c(53, 28, 2, INK, 'stroke="none"') + linje("M45 34q3.5 2.5 7 0", w=2.2) +
            glans("M40 24l3-4", 2.4, .8) +
            linje("M38 84l20 0M42 80h12", w=3.5, farg=P["sten_m"]))


@ikon("verb", "dansar")
def _():
    not1 = p("M30 30v26", "none") + e(25, 57, 6, 4.5, P["pennlila"]) + linje("M30 57V24l14-4v6", w=3)
    not2 = e(62, 63, 6, 4.5, P["pennrosa"]) + linje("M67 63V36", w=3) + p("M67 36q10 2 12 12-4-6-12-6z", P["pennrosa"], 'stroke-width="2.4"')
    return (skugga(48, 86, 30, 4) + not1 + not2 +
            linje("M14 72q6-6 0-12M82 70q6-6 0-12", w=3, farg=P["gul"]) +
            gnista(48, 22, 6) + gnista(80, 22, 4, P["vit"]))


@ikon("verb", "snurrar")
def _():
    return (linje("M24 40A26 26 0 0 1 74 34", w=8) + linje("M24 40A26 26 0 0 1 74 34", w=4, farg=P["pennlila"]) +
            p("M66 22l12 12-16 4z", P["pennlila"], 'stroke-width="2.6"') +
            linje("M72 58A26 26 0 0 1 22 62", w=8) + linje("M72 58A26 26 0 0 1 22 62", w=4, farg=P["pennrosa"]) +
            p("M30 74 18 62l16-4z", P["pennrosa"], 'stroke-width="2.6"') + gnista(48, 49, 8))


@ikon("verb", "sjunger")
def _():
    return (p("M14 26h40a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8H34l-12 10V62h-8a8 8 0 0 1-8-8V34a8 8 0 0 1 8-8z", P["vit"]) +
            e(28, 50, 5, 4, P["pennlila"], 'stroke-width="2.4"') + linje("M32.5 50V34l12-3v15", w=2.6) + e(40, 47, 5, 4, P["pennlila"], 'stroke-width="2.4"') +
            e(76, 52, 5, 4, P["pennrosa"], 'stroke-width="2.4"') + linje("M80.5 52V34", w=2.6) + gnista(76, 22, 5))


# ---------------------------------------------------------------- Byggegenskaper (Hurdan, byggen)
def minihus(dx=0, dy=0, rot=0, vagg=None):
    g = f'<g transform="translate({dx} {dy}) rotate({rot} 48 56)">'
    return (g + r(30, 48, 36, 28, 2, vagg or P["rod"]) + p("M24 50 48 30l24 20z", P["lila_m"]) +
            r(36, 56, 9, 9, 1.5, P["bla_l"], 'stroke-width="2.6"') + dorr(51, 76, 9, 14, P["gul"]) + "</g>")


@ikon("egenskap", "magisk")
def _():
    return skugga(48, 80, 22, 4) + minihus(0, 2) + gnista(20, 28, 7) + gnista(76, 24, 9, P["pennrosa"]) + gnista(78, 60, 5, P["vit"]) + gnista(16, 60, 4.5, P["vit"]) + gnista(48, 16, 5)


@ikon("egenskap", "varm")
def _():
    return (skugga(48, 80, 22, 4) + minihus(0, 2) +
            linje("M30 26q-4-6 0-10t0-10M48 24q-4-6 0-10t0-10M66 26q-4-6 0-10t0-10", w=6) +
            linje("M30 26q-4-6 0-10t0-10M48 24q-4-6 0-10t0-10M66 26q-4-6 0-10t0-10", w=3, farg=P["orange"]))


@ikon("egenskap", "mysig")
def _():
    hjarta = "M48 30c-6-10-20-6-18 4 1 6 8 12 18 18 10-6 17-12 18-18 2-10-12-14-18-4z"
    return (skugga(48, 84, 22, 4) + minihus(0, 6, 0, P["orange"]) +
            '<g transform="translate(22 -3) scale(.55)">' + p(hjarta, P["pennrosa"], 'stroke-width="6"') + "</g>" +
            c(40, 64, 7, P["gul"], 'stroke="none" opacity=".45"'))


@ikon("egenskap", "upp_och_ner")
def _():
    return (minihus(0, -6, 180) + skugga(48, 88, 16, 3) +
            linje("M14 30a10 10 0 0 1 10-10", w=3.2) + p("M24 14l6 6-6 6", "none", 'stroke-width="3.2"') +
            linje("M82 66a10 10 0 0 1-10 10", w=3.2) + p("M72 82l-6-6 6-6", "none", 'stroke-width="3.2"'))


# ---------------------------------------------------------------- Former (ser ut som)
@ikon("form", "äpple")
def _():
    return (skugga(48, 86, 26, 4) +
            p("M48 30c-10-8-30-6-32 16-2 20 12 38 24 38 4 0 6-2 8-2s4 2 8 2c12 0 26-18 24-38-2-22-22-24-32-16z", P["rod"]) +
            linje("M48 30c0-8 2-14 6-18", w=3.2) + p("M54 20c6-8 16-8 20-4-6 6-14 8-20 4z", P["gron"], 'stroke-width="2.6"') +
            glans("M24 48q2-12 12-14", 3.2, .6))


@ikon("form", "pumpa")
def _():
    return (skugga(48, 86, 34, 4) +
            p("M48 30c-8-4-18-2-24 2-14 8-14 34 0 44 8 6 18 6 24 4 6 2 16 2 24-4 14-10 14-36 0-44-6-4-16-6-24-2z", P["orange"]) +
            linje("M48 30c-8 8-10 34 0 50M48 30c8 8 10 34 0 50M34 32c-8 10-8 30 0 42M62 32c8 10 8 30 0 42", w=2.4, farg=P["orange_m"]) +
            p("M44 32c0-8 2-14 8-18l4 3c-4 4-6 9-5 15z", P["gron_m"], 'stroke-width="2.6"') + glans("M22 50q2-10 8-14", 3, .5))


@ikon("form", "tårta")
def _():
    return (skugga(48, 86, 36, 4) +
            r(16, 52, 64, 30, 6, P["rosa_l"]) + r(22, 30, 52, 24, 6, P["vit"]) +
            linje("M22 42q5 6 10 0t10 0 10 0 10 0 10 0", w=6) + linje("M22 42q5 6 10 0t10 0 10 0 10 0 10 0", w=2.6, farg=P["rosa"]) +
            linje("M16 64q5 6 10 0t10 0 10 0 10 0 10 0 10 0 8 0", w=6) + linje("M16 64q5 6 10 0t10 0 10 0 10 0 10 0 10 0 8 0", w=2.6, farg=P["rosa"]) +
            r(45, 14, 6, 16, 2, P["bla_l"], 'stroke-width="2.6"') + p("M48 4c4 4 4 8 0 10-4-2-4-6 0-10z", P["gul"], 'stroke-width="2.4"') +
            c(30, 76, 2.4, P["rod"], 'stroke="none"') + c(48, 76, 2.4, P["gul"], 'stroke="none"') + c(66, 76, 2.4, P["gron"], 'stroke="none"'))


@ikon("form", "tekanna")
def _():
    return (skugga(46, 86, 30, 4) +
            p("M70 50c10 0 14 8 10 16-3 6-10 8-14 6", "none", 'stroke-width="9"') +
            p("M70 50c10 0 14 8 10 16-3 6-10 8-14 6", "none", f'stroke-width="3.5" stroke="{P["bla"]}"') +
            p("M26 54 8 40l4-4 20 12z", P["bla"]) +
            p("M48 36c-18 0-26 12-26 26 0 12 8 20 26 20s26-8 26-20c0-14-8-26-26-26z", P["bla"]) +
            p("M34 38c2-6 8-8 14-8s12 2 14 8z", P["bla_m"]) + c(48, 26, 4, P["gul"], 'stroke-width="2.6"') +
            c(40, 58, 3.5, P["vit"], 'stroke-width="2.2"') + c(54, 64, 3.5, P["vit"], 'stroke-width="2.2"') + c(46, 72, 2.5, P["vit"], 'stroke-width="2"') +
            glans("M30 56q2-8 8-12", 3, .5))


@ikon("form", "stövel")
def _():
    return (skugga(50, 86, 34, 4) +
            p("M30 12h28v42c10 4 22 8 24 18 1 6-2 10-8 10H26c-2 0-4-2-4-4V18c0-4 4-6 8-6z", P["gron"]) +
            r(26, 12, 36, 10, 3, P["gron_m"]) + r(22, 74, 62, 8, 3, MORK) +
            glans("M32 28v22", 3, .5) + c(44, 46, 3, P["gul"], 'stroke-width="2.2"') + c(38, 58, 2.4, P["vit"], 'stroke-width="2"'))


# ---------------------------------------------------------------- Tillbehör (Har, djur) som kitet saknar hela bilder för
@ikon("tillbehor", "ryggsäck")
def _():
    return (skugga(48, 86, 26, 4) +
            p("M30 28c0-8 8-14 18-14s18 6 18 14", "none", 'stroke-width="5"') +
            r(22, 26, 52, 56, 12, P["orange"]) + r(30, 52, 36, 24, 6, P["orange_m"]) +
            linje("M30 60h36", w=2.4) + r(44, 56, 8, 6, 2, P["guld"], 'stroke-width="2.2"') +
            p("M22 40c8-2 44-2 52 0v6c-8-2-44-2-52 0z", P["orange_m"], 'stroke-width="2.6"') + glans("M28 34v12", 3, .5))


@ikon("tillbehor", "mantel")
def _():
    return (skugga(48, 88, 32, 4) +
            p("M30 18c-4 22-12 46-20 66 12 4 24-2 38 0 14-2 26 4 38 0-8-20-16-44-20-66z", P["lila"]) +
            linje("M40 24c-2 20-6 42-10 58M56 24c2 20 6 42 10 58", w=2.4, farg=P["lila_m"]) +
            p("M26 16c6 6 16 8 22 8s16-2 22-8", "none", 'stroke-width="7"') +
            p("M26 16c6 6 16 8 22 8s16-2 22-8", "none", f'stroke-width="3" stroke="{P["rod"]}"') +
            c(48, 24, 6, P["guld"], 'stroke-width="2.8"') + gnista(48, 24, 2.6, P["vit"]) +
            gnista(30, 60, 4, P["guld"]) + gnista(64, 52, 3.5, P["guld"]))


@ikon("tillbehor", "halsduk")
def _():
    return (skugga(48, 86, 28, 4) +
            p("M14 36c10 8 58 8 68 0l2 12c-12 8-60 8-72 0z", P["rod"]) +
            p("M58 44l6 34-12 4-4-34z", P["rod"]) +
            linje("M26 41v10M38 43v10M50 43v10M62 42v10M72 40v10", w=3, farg=P["vit"]) +
            linje("M55 62l9-2M57 72l9-2", w=3, farg=P["vit"]) + linje("M52 82l-1 4M56 81v5M60 80l1 4", w=2.4))


@ikon("tillbehor", "trollkarlshatt")
def _():
    return (skugga(48, 86, 34, 4) +
            e(48, 76, 38, 9, P["pennlila"]) +
            p("M26 76c6-20 10-44 26-62 4-4 10-4 12 2-6 6-4 18-2 30 2 12 6 22 8 30z", P["pennlila"]) +
            stjarna5(48, 56, 7, 3.4, P["guld"], 2.2) + gnista(60, 36, 4, P["guld"]) + c(40, 40, 2, P["guld"], 'stroke="none"') +
            glans("M34 66q2-14 8-26", 3, .45))


@ikon("tillbehor", "solglasögon")
def _():
    return (linje("M10 40h76", w=4) +
            p("M12 38h28c0 14-4 22-14 22S12 52 12 38z", MORK) + p("M56 38h28c0 14-4 22-14 22S56 52 56 38z", MORK) +
            linje("M40 42q8-6 16 0", w=4) + glans("M18 44l6-3M62 44l6-3", 3, .8))
