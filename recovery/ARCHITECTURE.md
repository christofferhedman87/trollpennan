# Faktisk arkitektur, kodinspektion

Route / -> Home -> klientmount -> Spel.
Spel -> Angen3D (villkor: varld === ang, inget område, karta stängd).
Spel effect -> import starta.ts -> Phaser.Game -> AngScen/GardScen/AvScen.
Spel, renderers och sparning kommunicerar genom brygga/avbro och Zustand-minnet.

Koden är bevarad utan flytt. Phaser är inte klassificerad som oanvänd legacy eftersom den faktiskt startas och innehåller gård/äventyr. Visuell runtime-aktivering har inte browserverifierats.

Vite använder tanstackStart, viteReact, Tailwind, plattformsplugins och Nitro/Vercel. package.json och package-lock.json är kanoniska. scripts/with-app-env.mjs läser .grok/app-env.json. startup.sh är en historisk /workspace-launcher. Använd npm-skripten från projektroot i stället för att anta att den absoluta sökvägen finns.
