# AI AI Captain

Ett 2D-plattformsspel i rymden som spelas direkt i webbläsaren, på dator och mobil, utan installation.

**Live:** https://stallind.github.io/aiaicaptain/

## Vad det gör

Du väljer kapten, AI Captain, Oh Scarrr eller Spaiceman, och tar dig igenom tre banor: ett asteroidbälte, en månbas och en gasjätte, var och en med sin egen gravitation. Du hoppar mellan plattformar, samlar stjärnor och energiceller, besegrar utomjordingar genom att landa på dem och når warpporten i slutet av varje bana. Till det spelas ett eget 8-bitarssoundtrack, ljud när du landar på en fiende och plockar stjärnor, ett eget hoppljud för varje kapten, ett "Ouch!" när du skadas, en sorglig slinga när du dör och en fanfar när du klarar en bana. Spelet styrs med tangentbord, handkontroll eller knappar på skärmen, och sparar ditt highscore, senast valda kapten och dina ljudinställningar i webbläsaren.

| Handling                    | Tangentbord    | Handkontroll            | Pekskärm                 |
| --------------------------- | -------------- | ----------------------- | ------------------------ |
| Gå                          | ← → eller A D  | Styrkors / vänster spak | ◀ ▶                      |
| Hoppa                       | Space, ↑, W, Z | A                       | A                        |
| Välj i menyer               | Enter          | A                       | Tryck på valet           |
| Paus / tillbaka             | Esc eller P    | Start                   | II                       |
| Byt kapten (i pausen)       | R              | Back / Select           | Knappen "Change captain" |
| Ljudinställningar (i menyn) | P              | Y                       | Knappen "SOUND"          |

## Kom igång

### Krav

- **Node.js 24**, som anges i [.nvmrc](.nvmrc). Lägsta version som fungerar är 22.12, eftersom Vite och Vitest kräver det.
- **npm**, som följer med Node.js.
- **Git**, för att klona repot.
- **En modern webbläsare** (Chrome, Edge, Firefox eller Safari) för att spela.

**Externa tjänster:** inga. Spelet behöver inga API-nycklar, konton, databaser eller backend, och laddar ingenting från internet när det körs. All grafik är pixeldata i koden.

**Bara för att publicera** behövs ett GitHub-repo med GitHub Pages påslaget och källan satt till "GitHub Actions" (_Settings → Pages_).

**Bara för porträttverktyget** i [tools/portrait/](tools/portrait/) behövs Windows, eftersom `downscale.ps1` använder System.Drawing. Verktyget behövs inte för att bygga eller spela.

### Installation

```bash
git clone https://github.com/Stallind/aiaicaptain
cd aiaicaptain
npm install
```

I CI, eller om du vill ha exakt de versioner som låsfilen anger, använd `npm ci` i stället för `npm install`.

### Konfiguration

Ingen konfiguration behövs för att köra spelet. Det finns ingen `.env`-fil och inga hemligheter, och därför heller ingen `.env.example`.

| Variabel            | Krävs | Används till                                                                                                                                                                         |
| ------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GITHUB_REPOSITORY` | Nej   | Sätts automatiskt av GitHub Actions (`ägare/repo`). Bygget använder repots namn som sökväg, `/<repo>/`, så att forkar publiceras rätt. Lokalt används `/aiaicaptain/` om den saknas. |

Spelets inställningar är vanlig kod i [src/config/](src/config/), och ändras där:

| Fil                                     | Innehåll                                                                |
| --------------------------------------- | ----------------------------------------------------------------------- |
| [game.ts](src/config/game.ts)           | Upplösning (640×360) och fysikens bildfrekvens                          |
| [constants.ts](src/config/constants.ts) | Hoppkänsla, skadeimmunitet, kamera, poäng, pekskärmsknapparnas layout   |
| [input.ts](src/config/input.ts)         | Tangent- och handkontrollsbindningar                                    |
| [ui.ts](src/config/ui.ts)               | Typsnittsstorlekar och skärmlayouter                                    |
| [audio.ts](src/config/audio.ts)         | Standardvolymer (musik 15 %, effekter 30 %), samplingsfrekvens, trummor |
| [strings.ts](src/config/strings.ts)     | Gemensamma texter, till exempel felskärmen och "vrid enheten"           |

**Ljud** ställs in i spelet under _SOUND_ i menyn: reglage för musik och effekter, och "Sound: OFF" för helt ljudlöst. Valet sparas i webbläsaren.

Nya figurer och banor läggs till som filer i [src/content/](src/content/) och registreras i [registry.ts](src/content/registry.ts). Hur det går till står i [implementation.md](implementation.md#how-to-extend).

### Kör projektet

```bash
npm run dev        # utvecklingsserver: http://localhost:5173/aiaicaptain/
```

| Kommando                 | Gör                                           |
| ------------------------ | --------------------------------------------- |
| `npm run build`          | Typkontroll och produktionsbygge till `dist/` |
| `npm run preview`        | Kör det byggda spelet lokalt                  |
| `npm run test`           | Enhetstester (Vitest)                         |
| `npm run lint`           | ESLint                                        |
| `npm run format`         | Formaterar koden med Prettier                 |
| `npx prettier --check .` | Kontrollerar formateringen, precis som CI gör |

**Publicering sker automatiskt.** [.github/workflows/deploy.yml](.github/workflows/deploy.yml) kör lint, formateringskontroll, tester och bygge på varje pull request. Vid push till `main` publiceras bygget dessutom till GitHub Pages.

## Arkitektur

Spelet bygger på Phaser 3. Scenerna (meny, karaktärsval, spel, HUD, paus, game over) styr flödet men innehåller ingen detaljerad spellogik. Figurer och banor är data i `src/content/`. Banor skrivs som ASCII-rader som görs om till Tiled-kompatibel JSON när de laddas, och allt innehåll kontrolleras när spelet startar. Fiendernas beteende byggs av små komponenter (patrullera, hoppa, flyga). Regler som poäng, hopp, banvalidering och sprite-tolkning ligger i rena funktioner utan Phaser, så att de kan enhetstestas. All input går genom ett lager som översätter tangentbord, handkontroll och pekskärm till handlingar som "jump" och "pause". Scener och system kommunicerar via en typad händelsebuss.

```
aiaicaptain/
├── src/
│   ├── main.ts          # startpunkt: skapar Phaser.Game, felskärm, "vrid enheten"
│   ├── config/          # inställningar och konstanter (se Konfiguration)
│   ├── content/         # figurer, banor, tiles och registret som listar dem
│   ├── scenes/          # Boot, Menu, CharacterSelect, Game, Hud, Pause, GameOver
│   ├── entities/        # Player, Enemy, Collectible, Goal
│   ├── components/      # beteenden: Patrol, Jumper, Flyer, Health, ComboCounter
│   ├── systems/         # banbygge, kollisioner, poäng, lagring, felhantering
│   ├── input/           # tangentbord, handkontroll, pekskärm -> handlingar
│   ├── graphics/        # färgpalett, pixeldata -> texturer, stjärnhimmel
│   ├── audio/           # notdata -> ljud: syntes av melodi, trummor och röst
│   ├── events/          # typad händelsebuss
│   └── utils/           # rena hjälpfunktioner (testas utan Phaser)
├── tests/               # Vitest-tester, speglar src/
├── tools/portrait/      # utvecklingsverktyg: foto -> pixelporträtt (följer inte med spelet)
├── public/              # favicon
├── index.html           # sidan, Content-Security-Policy, "vrid enheten"-rutan
└── .github/workflows/   # bygge, test och publicering till GitHub Pages
```

Mer detaljer finns i [implementation.md](implementation.md), och projektets regler i [CLAUDE.md](CLAUDE.md).

## Teknisk stack

| Komponent   | Val                             | Anledning                                                                                      |
| ----------- | ------------------------------- | ---------------------------------------------------------------------------------------------- |
| Språk       | TypeScript (strict)             | Körs i webbläsaren; typerna fångar fel tidigt och dokumenterar strukturen                      |
| Spelmotor   | Phaser 3                        | Beprövat för 2D-plattformsspel: fysik, tilemaps, animationer, skalning, touch och handkontroll |
| Byggverktyg | Vite                            | Snabb utvecklingsserver och statiskt bygge som passar GitHub Pages                             |
| Tester      | Vitest                          | Samma konfiguration som Vite, snabbt, bra TypeScript-stöd                                      |
| Kodkvalitet | ESLint + Prettier               | Konsekvent stil och tidig felupptäckt                                                          |
| Grafik      | Pixel art som data i koden      | Inga bildfiler och inga licensfrågor; texturerna skapas när spelet startar                     |
| Ljud        | Web Audio, syntes från notdata  | Inga ljudfiler och inga licensfrågor; musik och effekter räknas fram när spelet startar        |
| Lagring     | `localStorage`                  | Highscore och vald kapten utan backend; tål att lagringen saknas eller är full                 |
| Publicering | GitHub Pages via GitHub Actions | Gratis statisk hosting som publiceras automatiskt från `main`                                  |

## Begränsningar

- **Bara tre banor och tre spelbara figurer.** Det finns inga skjutande fiender, inga rörliga plattformar och inga partikeleffekter.
- **Inte provat på riktiga mobiler.** Spelet är testat i Chrome, både på dator och med emulerad mobil och pekskärm. Prestanda och knappstorlekar på riktiga telefoner är inte verifierade.
- **Inga inställningar i spelet.** Kontroller och texter ändras bara i koden. Gränssnittet finns bara på engelska.
- **Highscore sparas bara lokalt** i den webbläsare du spelar i. På GitHub Pages delar alla projekt från samma konto lagringsutrymme, så värdena kan inte litas på, och spelet ignorerar ogiltiga värden.
- **Inga mellanlägen sparas.** Ett nytt spel börjar alltid på första banan.
- **Bygget är cirka 1,2 MB** (cirka 330 kB komprimerat), nästan allt Phaser. Första laddningen kan ta en stund på en långsam uppkoppling.
- **Den flygande fienden** patrullerar tills den når en vägg eller kanten av banan, så den kan driva långt från där den startade.

## Utvecklat med

Claude Code (agentdriven utveckling) som del av kursen Next-Generation Software Development with AI.
