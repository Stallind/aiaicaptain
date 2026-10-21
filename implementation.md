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
| 6     | Menu, HUD, pause, game over, highscore                            | Done                                               |
| 7     | More content                                                      | 3 levels, 3 enemy types; moving platforms not done |
| 8     | Sound, rotate-device overlay, particles, mobile performance pass  | Rotate overlay done; the rest not started          |
| 9     | GitHub Pages deploy workflow                                      | Not started (needs approval, see below)            |

The game can be played from the menu through all three levels to a "Mission complete" screen. It was verified in headless Chrome: menu, level 1, running, jumping, stomping an enemy, losing health, falling into a pit, game over with highscore, pause/resume, and moving on from level 1 to level 2.

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
| Player, goal and spawns | Part of the level legend, not hard-coded      | The level decides which character is the player and which is the goal; scene code names no characters.                                                |
| Physics                 | Arcade, fixed 60 Hz step, gravity per level   | Asteroid Belt 900, Lunar Outpost 450, Gas Giant Rig 1300 px/s².                                                                                       |
| Event bus               | Typed wrapper around `game.events`            | Each `Phaser.Game` has its own emitter, so there are no global singletons.                                                                            |
| Fonts                   | System `monospace`                            | No downloaded fonts (licence and offline rules).                                                                                                      |

## Architecture

```
src/
  main.ts                 Phaser.Game config, scene list
  config/                 game.ts (resolution), constants.ts (tuning), ui.ts (fonts, screen layouts), scenes.ts (keys), input.ts (bindings)
  content/
    types.ts              CharacterDefinition (union per kind), LevelDefinition, TileDefinition, SpriteData, ComponentSpec
    registry.ts           CHARACTERS, LEVELS, getCharacter/getLevel/playerCharacterOf, levelValidationContext
    tiles.ts              tileset: char, solid/oneWay/hazard flags, pixel frame
    hudIcons.ts           heart icons
    menu.ts               title-screen background
    characters/           captain, blobAlien, hopper, spaceJelly, pickups (star, energy-cell), warpGate
    levels/               legend.ts + one file per level
  graphics/               palette, parseSprite (pure), textureFactory, starfield
  input/                  actions (pure ActionState), Keyboard/Gamepad/Touch/Tap sources, InputController
  components/             Health, ComboCounter (pure), Patrol, Jumper, Flyer, createBehavior factory
  entities/               Player, Enemy, Collectible, Goal (each extends Arcade.Sprite – one level)
  systems/                LevelBuilder, CollisionSystem, ScoreSystem, ScorePopups (pooled), ParallaxBackground,
                          storage, errorOverlay
  events/                 EventBus (typed)
  scenes/                 Boot, Menu, Game, Hud, Pause, GameOver + sceneData (parsing), textHelpers, ContinuePrompt
  utils/                  pure: asciiMap, tiled types, validateLevel, jumpController, combat, score, random
tests/                    mirrors src/
```

### Flow between scenes

```
Boot ──> Menu ──> Game ⇄ Pause
                   │ └─ launches Hud (runs in parallel, listens on EventBus)
                   ├─ goal reached ─> Game (restart with next level, score carried over)
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

### Behaviour components

An enemy's behaviour is its `components` list in data:

```ts
components: [
  { type: 'flyer', amplitude: 24, periodMs: 2400 },
  { type: 'patrol', turnAtLedges: false },
],
```

`createBehavior` maps each spec to a class (`Patrol`, `Jumper`, `Flyer`). Every class only touches the host's body through the small `BehaviorHost` interface. `ComponentSpec` is a discriminated union, so the switch is checked for exhaustiveness at compile time.

### Platformer feel

[jumpController.ts](src/utils/jumpController.ts) implements three features and is unit-tested without Phaser:

- **Coyote time (100 ms):** you can still jump just after running off a ledge.
- **Jump buffering (120 ms):** a jump pressed just before landing still happens.
- **Variable jump height:** releasing the button early cuts upward velocity to 45 %.

Every tuning value lives in `PLAYER_TUNING` in [constants.ts](src/config/constants.ts).

## How to extend

### Add an enemy

1. Create `src/content/characters/myEnemy.ts` exporting a `CharacterDefinition` with `kind: 'enemy'`, the pixel frames, a palette that uses `COLORS`, animations (`walk` is played automatically), body and stats, and `components`.
2. Add it to `CHARACTERS` in [registry.ts](src/content/registry.ts).
3. Give it a character in a level legend (`STANDARD_ENTITIES` or the level's own `entities`) and place it in a layout.

The registry tests then check that every frame has the same size, every character is in the palette, the hitbox fits, and the animations point at real frames.

### Add a level

1. Create `src/content/levels/04-myLevel.ts` with a `LevelDefinition`:
   - layout rows of equal length;
   - `.` for empty space, tile characters from [tiles.ts](src/content/tiles.ts) (`#` asteroid surface, `%` rock, `=` metal block, `-` one-way girder, `^` spikes);
   - entity characters from the legend (`P` player, `G` goal, `b` blob, `h` hopper, `j` jelly, `*` star, `c` energy cell).
2. Add it to `LEVELS` and point the previous level's `nextLevel` at it.

`validateLevel` runs on every registered level in the tests. It checks for exactly one player, at least one goal, no unknown characters, equal row lengths, known character ids, positive gravity and a valid `nextLevel`.

Keep rows 23 tiles high (368 px) or more so the 360 px view is filled. To judge jump distances, use jump height = v²/2g. With the captain's 370 px/s that gives about 4.7 tiles at gravity 900, 9.5 tiles at 450 and 3.3 tiles at 1300.

### Add a behaviour component

1. Add a variant to `ComponentSpec` in [types.ts](src/content/types.ts).
2. Create a class in `src/components/` implementing `Behavior`.
3. Add a case to [createBehavior.ts](src/components/createBehavior.ts). The compiler flags the missing case until you do.

### Add a tile

Append a `TileDefinition` to `TILES`. Order matters, because the index sets both the Tiled gid and the texture frame.

## Tests

There are 75 tests in 10 files. All run without Phaser:

| File                                      | Covers                                                                                    |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| `tests/content/registry.test.ts`          | Every level validates, every sprite and tile is well-formed, hitboxes fit, ids are unique |
| `tests/graphics/parseSprite.test.ts`      | Colour parsing, frame/sprite validation, RGBA output                                      |
| `tests/utils/asciiMap.test.ts`            | Tiled output: gids, object positions, tileset                                             |
| `tests/utils/validateLevel.test.ts`       | Each validation rule                                                                      |
| `tests/utils/gameplayLogic.test.ts`       | Jump controller, Health, stomp detection, combo score, seeded RNG                         |
| `tests/systems/storage.test.ts`           | Highscore, broken or missing localStorage, rejecting tampered scores                      |
| `tests/systems/scoring.test.ts`           | EventBus delivery, ScoreSystem, ComboCounter                                              |
| `tests/scenes/sceneData.test.ts`          | Scene-data parsing and fallbacks                                                          |
| `tests/components/createBehavior.test.ts` | Every ComponentSpec maps to its behaviour                                                 |
| `tests/input/actions.test.ts`             | `justPressed` versus `isDown`                                                             |

## Notes and known limitations

- **Bundle size:** about 1.2 MB, roughly 330 kB gzipped, almost all of it Phaser. Vite's chunk warning limit is raised for this. Code-splitting Phaser isn't worth it for a single-page game.
- **Menu input delay:** menus ignore input for 350 ms after opening (`TIMING.inputGraceMs`), so a key still held from the previous screen doesn't skip them.
- **Flying enemies:** the space jelly patrols until it hits a wall or the world edge. A patrol range would keep it near its spawn point.
- **Phase 9 needs approval:** CLAUDE.md requires asking before creating or changing the deploy workflow, so `.github/workflows/deploy.yml` hasn't been added yet. Vite `base` is already set to `/aiaicaptain/`.
- **Robustness:**
  - Uncaught errors show a reload screen ([errorOverlay.ts](src/systems/errorOverlay.ts)) instead of a frozen canvas.
  - Levels are validated before they are built.
  - Scene data and stored highscores are parsed defensively.
- **Content-Security-Policy:** [index.html](index.html) sets one that allows same-origin resources only. A new feature that needs anything else, such as a web worker, must update it.
- **Portrait mode:** on touch devices held upright, a "turn your device" overlay covers the page and the game pauses itself.
- **Code review:** findings and their fixes are in [review.md](review.md). One item is still open: making player movement a data-driven component.
- **Not done yet:**
  - sound (planned as WebAudio synth, no files)
  - `Shooter` component with pooled projectiles
  - moving platforms
  - particles
  - a tuning pass on a real phone
