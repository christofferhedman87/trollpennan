# Trollpennan, checkpoint B01R

Statisk produktionsbuild har skapats och smoke-testats. Inte slutversion enligt beställningen.

Läs HANDOFF.md, BLOCK-STATUS.md och RELEASE-REPORT.md.

Bygg: npm ci → npm run typecheck:pages → npm run test:product → npm run build:pages → npm run check:pages-output.
Preview: npm run preview:pages.
Pages-klienten kräver ingen server, databas eller ursprunglig plattform. Historisk plattformskod bevaras men ingår inte i kliententryn. Lokal lagring, inga nya externa tjänster eller spårning.
