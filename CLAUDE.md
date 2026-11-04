# CLAUDE.md

Riktlinjer för AI-agenter (och människor) som arbetar i det här repot.

## Om projektet

**AI AI Captain** är ett webbaserat 2D-plattformsspel i stil med klassiska Super Mario, men utspelat i rymden. Spelaren hoppar mellan plattformar på asteroider, rymdstationer och främmande planeter, samlar stjärnor/energiceller och undviker eller besegrar utomjordiska fiender.

Problemet projektet löser:
- Ett plattformsspel som spelas direkt i webbläsaren utan installation, både på dator och mobil.
- En kodbas där det är **enkelt att lägga till nya figurer (spelare, fiender) och nya banor** utan att röra motorkoden.
- Ett läroprojekt som visar god praxis för spelarkitektur, testning och automatisk deploy.

Spelet är en *hyllning* till genren, inte en kopia: inga namn, figurer, grafik, musik eller ljud från Nintendo eller andra upphovsrättsskyddade verk.

## Teknikstack

| Del | Val | Varför |
|---|---|---|
| Språk | **TypeScript** (strict) | Körs nativt i webbläsaren, typer fångar fel tidigt och gör arkitekturen självdokumenterande. Python fungerar dåligt för webbspel (kräver WebAssembly-lösningar som Pygbag, sämre prestanda och mobilstöd). |
| Spelmotor | **Phaser 3** | Det mest beprövade ramverket för 2D-plattformsspel på webben: inbyggd Arcade-fysik, tilemaps (Tiled-format), animationer, kameror, skalning för olika skärmar och touch-/gamepad-stöd. |
| Byggverktyg | **Vite** | Snabb dev-server, enkel produktionsbuild till statiska filer, perfekt för GitHub Pages. |
| Tester | **Vitest** | Samma konfiguration som Vite, snabbt, bra TypeScript-stöd. |
| Kodkvalitet | **ESLint + Prettier** | Konsekvent stil och tidig felupptäckt. |
| Deploy | **GitHub Pages via GitHub Actions** | Gratis statisk hosting; workflow bygger och publicerar vid push till `main`. |
| Grafik | **Egengenererade sprites i kod** | Pixel art definieras som data (teckenmatriser + palett) och görs om till texturer vid uppstart. Inga externa bildfiler eller licensproblem. |

## Kommandon

```bash
npm install        # installera beroenden
npm run dev        # starta dev-server
npm run build      # typkontroll + produktionsbuild till dist/
npm run preview    # förhandsgranska produktionsbuilden
npm run test       # kör enhetstester
npm run lint       # ESLint
npm run format     # Prettier
```

Innan en uppgift räknas som klar ska `npm run lint`, `npm run test` och `npm run build` gå igenom utan fel.

## Mappstruktur

```
src/
  main.ts              # startpunkt: skapar Phaser.Game med config
  config/              # spelkonfiguration (upplösning, fysik, konstanter)
  scenes/              # Boot, Preload, Menu, Game, Hud, GameOver
  entities/            # Player, Enemy, Collectible ... (bygger på komposition)
  components/          # återanvändbart beteende: Health, Patrol, Jumper ...
  systems/             # tvärgående logik: input, kollisioner, poäng, ljud
  content/
    characters/        # en fil per figur: data-definition + sprite-data
    levels/            # en fil per bana (ASCII-layout, görs om till Tiled-JSON vid laddning)
    registry.ts        # registrerar alla figurer och banor
  graphics/            # sprite-generator: pixeldata -> Phaser-texturer
  input/               # abstraktion över tangentbord, touch och gamepad
  events/              # typad event-bus mellan scener/system
  utils/               # rena hjälpfunktioner utan Phaser-beroende
tests/                 # Vitest-tester, speglar src/-strukturen
public/                # statiska filer (favicon, manifest)
.github/workflows/     # deploy till GitHub Pages
```

## Arkitekturprinciper

### Datadrivet innehåll
- **Figurer och banor är data, inte kod.** En ny fiende eller bana ska kunna läggas till genom att skapa en ny fil i `src/content/` och registrera den i `registry.ts` – utan ändringar i scener eller motorkod.
- Varje figur beskrivs av en typad `CharacterDefinition` (hastighet, hopphöjd, hälsa, beteendekomponenter, sprite-data, animationer). Typen är en union per `kind` (spelare, fiende, samlarobjekt, mål) så att varje sort bara har de fält som betyder något för den.
- Varje bana beskrivs av en typad `LevelDefinition` (ASCII-layout, gravitation, bakgrund, spawnpunkter, mål). Layouten konverteras till Tiled-kompatibel JSON vid laddning. Gravitationen är per bana – låg gravitation på månen, hög på gasjätten.

### Komposition före arv
- Entiteter byggs av små komponenter (`Health`, `Patrol`, `Jumper`, `Shooter` ...) i stället för djupa arvshierarkier.
- Max en nivå arv från Phaser-klasser (t.ex. `Player extends Phaser.Physics.Arcade.Sprite`).

### Separation av ansvar
- **Scener** orkestrerar, de innehåller inte spellogik i detalj.
- **Ren logik** (poängräkning, skadeberäkning, banvalidering, sprite-parsning) ligger i rena funktioner utan Phaser-beroende så att den kan enhetstestas.
- **All input** går via `src/input/` som översätter tangentbord, touch och gamepad till abstrakta handlingar (`left`, `right`, `jump`, `action`, `pause`). Spellogik läser aldrig tangenter direkt.
- **Kommunikation** mellan scener och system sker via den typade event-bussen eller Phaser-registret – aldrig via direkta referenser mellan scener.
- **Persistens** (highscore, inställningar) sker endast i ett lager (`systems/storage`) som kapslar in `localStorage` och tål att det saknas.

### Kodregler
- Inga globala variabler eller muterbara singletons utanför det som Phaser tillhandahåller.
- `strict: true` i TypeScript, ingen `any`. Använd `unknown` + typvakter vid behov.
- Funktioner gör en sak och är korta. Hellre fler små filer än få stora.
- Inga magiska tal: konstanter samlas i `src/config/`.
- Namn på engelska i kod; kommentarer får vara på svenska eller engelska men ska förklara *varför*, inte *vad*.
- Objekt som skapas ofta (skott, partiklar) poolas med Phaser-grupper.

### Mobil och prestanda
- Spelet ska fungera på mobil: Phaser `Scale.FIT` med centrering, stöd för både liggande och stående läge (visa uppmaning att vrida telefonen om det behövs).
- Touch-kontroller (virtuell styrspak/knappar) visas automatiskt på pekskärmar och ska vara stora nog för tummar.
- Mål: 60 FPS på en medelbra mobil. Använd fast tidssteg för fysiken och undvik allokeringar i `update()`.
- Pixel art renderas med `pixelArt: true` (ingen utsmetning).

### Grafik (egengenererade sprites)
- Sprites definieras som teckenmatriser där varje tecken pekar på en färg i en palett, t.ex.:
  ```ts
  const palette = { '.': null, 'w': '#ffffff', 'b': '#3a7bd5' };
  const frame = ['..ww..', '.wbbw.', ...];
  ```
- `src/graphics/` omvandlar dessa till texturer och spritesheets i Boot-scenen.
- Håll en sammanhållen färgpalett och en fast tile-storlek (16×16 eller 32×32, bestäms i `config/`).

### Deploy
- Vite `base` ska sättas till repots namn (`/<repo-namn>/`) så att sökvägar fungerar på GitHub Pages.
- Deploy sker endast via GitHub Actions-workflow; bygg aldrig in `dist/` i git.

### Tester
- Ny ren logik ska ha enhetstester.
- Varje bana i registret valideras automatiskt i ett test (har spawnpunkt, mål, giltiga tile-id:n, kända figurer).

## Det här ska agenten INTE göra

- **Byt inte spelmotor, språk eller byggverktyg** (Phaser, TypeScript, Vite) utan att fråga först.
- **Lägg inte till nya npm-beroenden utan att fråga.** Motivera alltid varför befintliga verktyg inte räcker.
- **Använd inte upphovsrättsskyddat material**: inga Nintendo-namn (Mario, Luigi, Bowser, Goomba ...), inga nedladdade sprites, ljud, musik eller typsnitt från internet.
- **Hämta inte externa resurser vid körning** (CDN-bilder, API:er, analysverktyg). Spelet ska fungera helt statiskt och offline efter laddning.
- **Inför ingen backend, databas eller inloggning.**
- **Hårdkoda inte banor eller figurer i scenkod** – de hör hemma i `src/content/`.
- **Ändra inte formatet för `CharacterDefinition` eller `LevelDefinition`** utan att uppdatera alla befintliga figurer/banor och tester i samma ändring.
- **Stäng inte av lint-regler, TypeScript-kontroller eller tester** för att få något att gå igenom. Åtgärda grundorsaken.
- **Committa eller pusha inte** utan att användaren ber om det, och ändra aldrig deploy-workflowen utan att fråga.
- **Skriv inte om fungerande kod i stora sjok** när en riktad ändring räcker.
