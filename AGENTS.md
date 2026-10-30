# Trollpennan – instruktioner för AI-agenter (Codex, Claude Code m.fl.)

Trollpennan är ett svenskt lärspel för barn 7–10 år där det barnet skriver blir levande på skärmen.
Stack: React 19, React Three Fiber, three.js, zustand, Vite. Publiceras på Cloudflare
(https://trollpennan.christofferhedman87.workers.dev/) när `main` uppdateras.

## Läs först, i den här ordningen
1. **`projektregler.md`**: lagen. Grundtanken och reglerna gäller alltid och går före allt annat.
2. `docs/skapa/SPEC-skapa.md` och `docs/skapa/STATUS.md`: Skapa-menyn (Pennans bok).
3. `docs/en-varld/STATUS.md`, `docs/plan-en-varld-2026-10-29.md` och `PROJECT.md`.
4. `docs/codex/` (om den finns): pågående granskning, plan och beslut.

## Inaktuellt, följ inte
- `docs/historik/AGENTS-grok-build.md` (den tidigare AGENTS.md, en mall för verktyget Grok Build) och `.grok/`.
- De gamla `RUNDA*`-, `PLAN-*`-, `HANDOFF.md`- och `STARTPROMPT.md`-filerna i roten är historik.
- Rör inte `recovery/`.

## Arbetssätt i korthet
- Svenska namn i koden och korrekt svenska i allt barnet ser. Texter som barnet ser ligger i `data/*.json`, inte i koden.
- Ändra aldrig sparformatet utan migrering och test, så att barnens sparade spel inte går förlorade.
- Committa aldrig API-nycklar eller hemligheter.
- Grindar före merge: `npm run typecheck`, `typecheck:pages`, `check:struktur` (`--skriv` bara vid avsiktlig ändring av testid-baslinjen), `lint`, `test:product` (tidstestet i p3a är ett känt fel), `build:pages` och `check:pages-output`.
- Skärmbilder (Playwright, 375×812 och liggande läge) är för agentens egen kontroll. Skicka dem inte till Christoffer och lägg dem inte i PR:er.
- Lokal förhandsvisning: `npm ci`, `npm run build:pages` och `npx vite preview --config vite.pages.config.ts --port 4173 --strictPort`.
