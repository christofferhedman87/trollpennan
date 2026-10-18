> **EXEMPEL med påhittade ord ur ett test, inte spelardata.** Så ser filen ut när `lagg` har körts på en export.

# Beställning till Modellspanaren – ord som saknar modell

Genererad 2026-10-18 av `node scripts/saknade-ord.mjs bestall` ur `data/saknade-ord.json`. Orden kommer från vuxna som exporterat sin lista ur spelet för hand; inget skickas automatiskt.

När ett ord saknar modell visas ett ägg med ordet på. Varje rad nedan är ett ord som barn har skrivit och fått ett ägg på. Hitta en modell så blir ägget ett riktigt djur eller föremål i nästa uppdatering.

## Regler (samma som för batch 1)
- Bara **CC0-1.0**. Inget med CC-BY eller annan kredit-licens. Skriv källa, licens-URL och författare i manifestet som förut.
- GLB, självbärande (inga externa texturer), stil nära Quaternius/Kenney/KayKit (rund, tydlig, få trianglar). Högst 6 000 trianglar. Avvikande stil går bra men märk den.
- **Bredd före varianter:** en modell per ord räcker. Hellre ett nytt ord än en ny stil på ett som finns.
- Ange tydlig framsida (ja/nej/osäker) och föreslaget svenskt ord/kategori i manifestet (samma kolumner som `manifest-utkast.tsv`).
- Ord som ser ut som ett namn eller är olämpliga: hoppa över och skriv det under *Hoppade över*.

## Ord att hitta modell till (3)

| # | ord (grundord) | böjda former sedda | typ (gissad) | gånger sett | först | senast | status |
|---|---|---|---|---|---|---|---|
| 1 | **elefant** | – | okänt (avgör efter ordet) | 2 | 2026-10-18 | 2026-10-18 | ny |
| 2 | **dansa** | dansade | handling (kräver ett föremål som hör till, t.ex. boll, cykel) | 1 | 2026-10-18 | 2026-10-18 | ny |
| 3 | **pizza** | pizzor | mat | 1 | 2026-10-18 | 2026-10-18 | ny |

*Typ* är spelets gissning ur ordet (kategori i `data/reserv.json`); den kan vara fel. Böjda former räknas ihop under grundordet när spelet kunde avgöra det.

## Redan täckta (1, behöver inget)

kanin

## Hoppade över

*(Modellspanaren fyller i: ord, skäl.)*
