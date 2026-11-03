# Implementation – AI AI Captain

This document describes what has been built, how the code is organised, and how to extend it.
The project rules live in [CLAUDE.md](CLAUDE.md); this file describes the current state of the code.

## Status

| Phase | Content                                                           | Status                                             |
| ----- | ----------------------------------------------------------------- | -------------------------------------------------- |
| 0     | Project setup (Vite, TypeScript strict, ESLint, Prettier, Vitest) | Done                                               |
| 1     | Content types and pure logic with tests                           | Done                                               |
| 2     | Sprite generation from pixel data, Boot scene                     | Done                                               |
| 3     | Input abstraction (keyboard, gamepad, touch)                      | Done                                               |
| 4     | Player, tilemap, first playable level                             | Done                                               |
| 5     | Enemies, behaviour components, collectibles, collisions           | Done (no `Shooter` yet)                            |
| 6     | Menu, character select, HUD, pause, game over, highscore          | Done                                               |
| 7     | More content                                                      | 3 levels, 3 enemy types; moving platforms not done |
| 8     | Sound, rotate-device overlay, particles, mobile performance pass  | Rotate overlay done; the rest not started          |
| 9     | GitHub Pages deploy workflow                                      | Done; first deploy happens when main is updated    |

The game can be played from the menu, through the character select screen, through all three levels to a "Mission complete" screen. It was verified in headless Chrome: menu, level 1, running, jumping, stomping an enemy, losing health, falling into a pit, game over with highscore, pause/resume, and moving on from level 1 to level 2.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173/aiaicaptain/
npm run lint && npm run test && npm run build
```

**Controls:**

- **Keyboard:** arrows or A/D to move, Space/W/Up/Z to jump, Esc/P to pause.
- **Gamepad:** d-pad or left stick to move, A to jump, Start to pause.
- **Touch:** on-screen buttons appear automatically on touch devices.

## Key decisions

| Decision                | Choice                                        | Why                                                                                                                                                   |
| ----------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolution              | 640×360, `Scale.FIT`                          | Scales by whole numbers to 720p/1080p/1440p, so pixel art stays crisp.                                                                                |
| Tile size               | 16×16                                         | Keeps hand-drawn sprites quick to make.                                                                                                               |
| Level format            | ASCII rows converted to Tiled JSON at runtime | Easy to write and diff by hand, and still Tiled-compatible: `asciiToTiledMap` emits standard Tiled JSON that Phaser parses with its own Tiled loader. |
| Player, goal and spawns | Part of the level legend, not hard-coded      | The level marks the spawn point and goal. The player picks who spawns there on the select screen; scene code names no characters.                     |
| Physics                 | Arcade, fixed 60 Hz step, gravity per level   | Asteroid Belt 900, Lunar Outpost 450, Gas Giant Rig 1300 px/s².                                                                                       |
| Event bus               | Typed wrapper around `game.events`            | Each `Phaser.Game` has its own emitter, so there are no global singletons.                                                                            |
| Fonts                   | System `monospace`                            | No downloaded fonts (licence and offline rules).                                                                                                      |

## Architecture

```
src/
  main.ts                 Phaser.Game config, scene list
  config/                 game.ts (resolution), constants.ts (tuning, touch buttons), ui.ts (fonts, layouts),
                          scenes.ts (keys), input.ts (key + gamepad bindings), strings.ts (shared UI texts)
  content/
    types.ts              CharacterDefinition (union per kind), LevelDefinition, TileDefinition, SpriteData, ComponentSpec
    registry.ts           CHARACTERS, PLAYER_CHARACTERS, LEVELS, lookups, levelValidationContext
    tiles.ts              tileset: char, solid/oneWay/hazard flags, pixel frame
    hudIcons.ts           heart icons
    menu.ts               title-screen background
    characters/           aiCaptain, ohScarrr (players), blobAlien, hopper, spaceJelly, pickups, warpGate
    levels/               legend.ts + one file per level
  graphics/               palette, parseSprite + binaryGlyphs (pure), textureFactory, starfield
  input/                  actions (pure ActionState), Keyboard/Gamepad/Touch/Tap sources, InputController,
                          keyNames (hint texts from bindings)
  components/             Health, ComboCounter (pure), Patrol, Jumper, Flyer, createBehavior factory
  entities/               Player, Enemy, Collectible, Goal (each extends Arcade.Sprite – one level)
  systems/                LevelBuilder, CollisionSystem, ScoreSystem, ScorePopups (pooled), ParallaxBackground,
                          storage + sharedStorage, errorOverlay, pageChrome (theme colours, rotate prompt)
  events/                 EventBus (typed)
  scenes/                 Boot, Menu, CharacterSelect (+ CharacterCard), Game, Hud, Pause, GameOver,
                          sceneData (parsing), textHelpers, ContinuePrompt
  utils/                  pure: asciiMap, tiled types, validateLevel, jumpController, patrol, combat, score,
                          stats, touchLayout, validateCharacter, random
tests/                    mirrors src/
tools/portrait/           dev-only scripts that made the Oh Scarrr portrait (not shipped)
```

### Flow between scenes

```
Boot ──> Menu ──> CharacterSelect ──> Game ⇄ Pause
                                       │ └─ launches Hud (runs in parallel, listens on EventBus)
                                       ├─ goal reached ─> Game (next level; score and character carried over)
                                       └─ died / last level done ─> GameOver ──> Menu
```

Data between scenes is passed as typed objects ([sceneData.ts](src/scenes/sceneData.ts)), not as direct references.

### How a level is built

1. `GameScene.create` looks up the `LevelDefinition` and sets the world gravity.
2. `buildLevel` ([LevelBuilder.ts](src/systems/LevelBuilder.ts)):
   - converts the ASCII layout to a Tiled map (`asciiToTiledMap`) and puts it in Phaser's tilemap cache;
   - creates the ground layer and sets collision from the tile flags (one-way tiles collide from above only);
   - reads the entity object layer and spawns `Player` / `Enemy` / `Collectible` / `Goal` based on each character's `kind`.
3. `CollisionSystem` registers colliders and overlaps, and applies the rules: stomp versus hurt, pickups, goal, hazard tiles, and falling out of the level.

**Stomp or hit?** A contact is a stomp when the player came from above: at the start of the physics step, before it moved, the player's feet were at most 6 px below the enemy's top, and the player wasn't moving away from it ([combat.ts](src/utils/combat.ts)). The position from before the step comes from Arcade's `body.prev`.

The earlier version looked at the position _after_ the move. A fast fall moves about 9 px per step, so the feet were often already deep inside a short enemy, and a clean landing counted as a hit from the side. Spawning above a blob at nine different heights, the old check turned 4 of 9 landings into damage; the new one stomps all 9. Walking into an enemy from the side still hurts.

### Behaviour components

An enemy's behaviour is its `components` list in data:

```ts
components: [
  { type: 'flyer', amplitude: 24, periodMs: 2400 },
  { type: 'patrol', turnAtLedges: false },
],
```

**Enemies never fall into holes.** With `turnAtLedges: true`, `Patrol` turns before an edge and stops moving sideways while airborne, so a `jumper` lands where it took off. The registry tests require `turnAtLedges: true` for every enemy that patrols and doesn't fly.

`createBehavior` maps each spec to a class (`Patrol`, `Jumper`, `Flyer`). Every class only touches the host's body through the small `BehaviorHost` interface. `ComponentSpec` is a discriminated union, so the switch is checked for exhaustiveness at compile time.

### Platformer feel

[jumpController.ts](src/utils/jumpController.ts) implements three features and is unit-tested without Phaser:

- **Coyote time (100 ms):** you can still jump just after running off a ledge.
- **Jump buffering (120 ms):** a jump pressed just before landing still happens.
- **Variable jump height:** releasing the button early cuts upward velocity to 45 %.

Every tuning value lives in `PLAYER_TUNING` in [constants.ts](src/config/constants.ts).

## How to extend

### Add a playable character

1. Create `src/content/characters/myHero.ts` exporting a `PlayerDefinition` (`kind: 'player'`):
   - a sprite with `idle`, `run` and `jump` animations;
   - body, stats, `displayName`, `tagline`;
   - a `portrait` (palette + one frame) for the select screen. It is scaled by a whole number to fit 108×108, so 32×32 or 36×36 works well.
2. Add it to `CHARACTERS` in [registry.ts](src/content/registry.ts). The select screen lists player characters in registry order. Up to three share the screen; the cards shrink to fit. With more than three, ◀ ▶ also pages between groups of three. Taglines may wrap onto two lines (60 characters at most).

The two built-in characters show two ways to make art:

- **Oh Scarrr** ([ohScarrr.ts](src/content/characters/ohScarrr.ts)): the portrait was made from a photo with the scripts in [tools/portrait/](tools/portrait/), then cleaned up by hand. The game sprite is hand-drawn in the same palette.
- **AI Captain** ([aiCaptain.ts](src/content/characters/aiCaptain.ts)): built only from 0 and 1 digits with `renderGlyphGrid` ([binaryGlyphs.ts](src/graphics/binaryGlyphs.ts)). The digits change between frames, so he flickers like a data stream.

### Add an enemy

1. Create `src/content/characters/myEnemy.ts` exporting an `EnemyDefinition` (`kind: 'enemy'`), the pixel frames, a palette that uses `COLORS`, animations (`walk` is played automatically), body and stats, and `components`.
2. Add it to `CHARACTERS` in [registry.ts](src/content/registry.ts).
3. Give it a character in a level legend (`STANDARD_ENTITIES` or the level's own `entities`) and place it in a layout.

The registry tests then check that every frame has the same size, every character is in the palette, the hitbox fits, and the animations point at real frames.

### Add a level

1. Create `src/content/levels/04-myLevel.ts` with a `LevelDefinition`:
   - layout rows of equal length;
   - `.` for empty space, tile characters from [tiles.ts](src/content/tiles.ts) (`#` asteroid surface, `%` rock, `=` metal block, `-` one-way girder, `^` spikes);
   - entity characters from the legend (`P` player spawn, `G` goal, `b` blob, `h` hopper, `j` jelly, `*` star, `c` energy cell).
2. Add it to `LEVELS` and point the previous level's `nextLevel` at it.

`validateLevel` runs on every registered level in the tests. It checks for exactly one player, at least one goal, no unknown characters, equal row lengths, known character ids, positive gravity and a valid `nextLevel`.

Keep rows 23 tiles high (368 px) or more so the 360 px view is filled. To judge jump distances, use jump height = v²/2g. With the AI Captain's 370 px/s that gives about 4.7 tiles at gravity 900, 9.5 tiles at 450 and 3.3 tiles at 1300.

### Add a behaviour component

1. Add a variant to `ComponentSpec` in [types.ts](src/content/types.ts).
2. Create a class in `src/components/` implementing `Behavior`.
3. Add a case to [createBehavior.ts](src/components/createBehavior.ts). The compiler flags the missing case until you do.

### Add a tile

Append a `TileDefinition` to `TILES`. Order matters, because the index sets both the Tiled gid and the texture frame.

## Tests

There are 125 tests in 15 files. All run without Phaser:

| File                                      | Covers                                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `tests/content/registry.test.ts`          | Every level validates; the boot-time content check passes; levels chain without loops; walking enemies stay on platforms |
| `tests/graphics/parseSprite.test.ts`      | Colour parsing, frame/sprite validation, RGBA output                                                                     |
| `tests/utils/asciiMap.test.ts`            | Tiled output: gids, object positions, tileset                                                                            |
| `tests/utils/validateLevel.test.ts`       | Each validation rule                                                                                                     |
| `tests/utils/gameplayLogic.test.ts`       | Jump controller, Health, stomp detection, combo score, seeded RNG                                                        |
| `tests/systems/storage.test.ts`           | Highscore and remembered character, missing, full or read-only localStorage, tampered values                             |
| `tests/systems/scoring.test.ts`           | EventBus delivery, ScoreSystem, ComboCounter                                                                             |
| `tests/scenes/sceneData.test.ts`          | Scene-data parsing and fallbacks                                                                                         |
| `tests/components/createBehavior.test.ts` | Every ComponentSpec maps to its behaviour                                                                                |
| `tests/input/actions.test.ts`             | `justPressed` versus `isDown`                                                                                            |
| `tests/utils/patrol.test.ts`              | Turning at walls and ledges, no sideways drift in the air                                                                |
| `tests/utils/stats.test.ts`               | Stat bars, portrait scaling, card row layout, paging, wrap-around selection                                              |
| `tests/graphics/binaryGlyphs.test.ts`     | Rendering a 0/1 digit grid into a sprite frame, rejecting ragged grids                                                   |
| `tests/utils/validateCharacter.test.ts`   | Stats that would make a character unkillable or unable to move, hitboxes, texture size, select-screen texts              |
| `tests/utils/touchLayout.test.ts`         | Positions of the on-screen buttons                                                                                       |

## Notes and known limitations

- **Bundle size:** about 1.2 MB, roughly 330 kB gzipped, almost all of it Phaser. Vite's chunk warning limit is raised for this. Code-splitting Phaser isn't worth it for a single-page game.
- **Menu input delay:** menus ignore input for 350 ms after opening (`TIMING.inputGraceMs`), so a key still held from the previous screen doesn't skip them.
- **Flying enemies:** the space jelly patrols until it hits a wall or the world edge. A patrol range would keep it near its spawn point.
- **Deploy:** [.github/workflows/deploy.yml](.github/workflows/deploy.yml) runs lint, the Prettier check, tests and the build on pull requests and on `main`, and deploys `main` to https://stallind.github.io/aiaicaptain/. GitHub Pages is set to use GitHub Actions as its source. Actions are pinned to commit SHAs, and CI uses Node from [.nvmrc](.nvmrc).
- **Storage:** one shared instance per game ([sharedStorage.ts](src/systems/sharedStorage.ts)) holds the highscore and the last chosen character.
  - If `localStorage` is missing, values live in memory for the session.
  - If it is full or read-only, saved values stay readable.
  - Game over only says "NEW HIGHSCORE!" when the score was actually saved.
- **Robustness:**
  - Uncaught errors stop the game loop and show a reload screen with the error details ([errorOverlay.ts](src/systems/errorOverlay.ts)).
  - All characters are validated at boot (`contentErrors` in the registry), and each level before it is built. Errors name the character or level and say how to fix it.
  - Scene data and stored highscores are parsed defensively.
- **Content-Security-Policy:** [index.html](index.html) sets one that allows same-origin resources only. A new feature that needs anything else, such as a web worker, must update it.
- **Portrait mode:** on phones and tablets held upright, a "turn your device" overlay covers the page and the game pauses itself. Both use `ROTATE_PROMPT_QUERY` in [strings.ts](src/config/strings.ts), so touch-screen laptops are not affected.
- **Controls are data:** keyboard and gamepad bindings live in [config/input.ts](src/config/input.ts), and the touch buttons in `TOUCH_CONTROLS`. On-screen hints are generated from the keyboard bindings.
- **Base path:** [vite.config.ts](vite.config.ts) takes the repo name from `GITHUB_REPOSITORY` in CI, so forks deploy correctly.
- **Code review:** findings and their fixes are in [review.md](review.md). One item is still open: making player movement a data-driven component.
- **Not done yet:**
  - sound (planned as WebAudio synth, no files)
  - `Shooter` component with pooled projectiles
  - moving platforms
  - particles
  - a tuning pass on a real phone
