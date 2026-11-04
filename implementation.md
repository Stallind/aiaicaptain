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
                          scenes.ts (keys), input.ts (key + gamepad bindings), strings.ts (shared UI texts),
                          audio.ts (default volumes, synthesis settings, which sound plays for what)
  content/
    types.ts              CharacterDefinition (union per kind), LevelDefinition, TileDefinition, SpriteData, ComponentSpec
    registry.ts           CHARACTERS, PLAYER_CHARACTERS, LEVELS, SOUNDS, lookups, levelValidationContext, soundErrors
    audio/                theme.ts (the soundtrack), effects.ts ("Ouch!", level-complete fanfare)
    tiles.ts              tileset: char, solid/oneWay/hazard flags, pixel frame
    hudIcons.ts           heart icons
    menu.ts               title-screen background
    characters/           aiCaptain, ohScarrr, spaiceman (players), blobAlien, hopper, spaceJelly, pickups, warpGate
    levels/               legend.ts + one file per level
  graphics/               palette, parseSprite + binaryGlyphs (pure), textureFactory, starfield
  audio/                  pure synthesis: notes, track (square/triangle/drums), voice (formants), validateSound, render
  input/                  actions (pure ActionState), Keyboard/Gamepad/Touch/Tap sources, InputController,
                          keyNames (hint texts from bindings)
  components/             Health, ComboCounter (pure), Patrol, Jumper, Flyer, createBehavior factory
  entities/               Player, Enemy, Collectible, Goal (each extends Arcade.Sprite – one level)
  systems/                LevelBuilder, CollisionSystem, ScoreSystem, ScorePopups (pooled), ParallaxBackground, CameraRig, RenderInterpolation,
                          audio (sound cache, music, effects), SoundEffects, storage + sharedStorage, errorOverlay, pageChrome (theme colours, rotate prompt)
  events/                 EventBus (typed)
  scenes/                 Boot, Menu, Settings (+ VolumeSlider), CharacterSelect (+ CharacterCard), Game, Hud, Pause,
                          GameOver, sceneData (parsing), textHelpers, ContinuePrompt
  utils/                  pure: asciiMap, tiled types, validateLevel, jumpController, patrol, combat, score,
                          stats, touchLayout, validateCharacter, random, interpolation, audioSettings
tests/                    mirrors src/
tools/portrait/           dev-only scripts that made the Oh Scarrr portrait (not shipped)
```

### Flow between scenes

```
Boot ──> Menu ──> CharacterSelect ──> Game ⇄ Pause ── R ──> CharacterSelect
           ⇅
        Settings (sound)
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

**Camera.** `CameraRig` ([CameraRig.ts](src/systems/CameraRig.ts)) follows the player with smoothing, but moves the camera only on physics steps. Phaser's built-in lerped follow moves the camera every rendered frame, while sprites only move on the fixed 60 Hz physics step. On a 120 Hz screen the player stood still every other frame while the camera kept gliding, so the player shook on screen and looked blurry. With physics at half the render rate, the player's on-screen position reversed direction 11 times in 2.5 s of running with the built-in follow, and 2 times with the rig, the same as when the two rates match.

**Smooth motion on fast screens.** Even with the camera in step, a 120 Hz screen showed each 60 Hz physics position twice, which smeared at full running speed. `RenderInterpolation` ([RenderInterpolation.ts](src/systems/RenderInterpolation.ts), pure parts in [interpolation.ts](src/utils/interpolation.ts)) draws the player, enemies and camera focus between their last two physics positions, by how far time has run into the next step. Physics stays a fixed 60 Hz step, so gameplay is the same on every screen.

- **Game logic never sees the drawn position.** It is set in `POST_UPDATE`, after physics and game logic, and the true position is put back in `PRE_UPDATE`, before Arcade reads sprite positions into the bodies.
- **Drawing lags physics by up to one step** (16 ms).
- **Direct moves are respected.** If code moves a tracked sprite itself (`setPosition`, `body.reset`), the new position is taken as a jump and drawn as is, not smoothed or undone.
- **It reads Arcade's internal `_elapsed`.** If a Phaser upgrade removes that field, objects are drawn at their physics position, the same as without interpolation.
- **Measured:** with physics at 30 Hz and rendering at 60 Hz, the player moved on every rendered frame with an even step (0.11 px spread). Without interpolation it stood still on about 40 % of frames.

### Sound

All sound is synthesized from data at boot, like the sprites: there are no audio files. [src/audio/](src/audio/) turns note data into samples, and [systems/audio.ts](src/systems/audio.ts) puts them into Phaser's audio cache as Web Audio buffers.

- **Music** ([theme.ts](src/content/audio/theme.ts)): an original 16-bar loop in A minor at 132 bpm, about 29 s, built as a build-up and a drop. Bars 1–8 start sparse and add voices one by one, the arpeggio doubles its speed, the lead climbs a scale and the snare rolls faster, then half a beat of silence. Bars 9–16 are the drop: a growling low square-wave bass jumping octaves, a triangle sub-bass, a four-on-the-floor kick and the melody as the hook. Measured loudness rises from 0.04 to about 0.13 through the build, then doubles to about 0.25 in the drop. The voices are square waves (lead, arpeggio, bass), triangles (bass) and noise drums, all on a sixteenth-note grid. Each voice is a string of tokens: `A4` starts a note, `.` holds it, `-` rests, and drums use `k s h`. It starts in the menu and keeps playing across scenes.
- **"Ouch!"** ([effects.ts](src/content/audio/effects.ts)) uses formant synthesis. A sawtooth at a falling, shout-like pitch goes through three band-pass filters that glide from the formants of "ah" to "oo", which makes the "ow". After a short stop comes a hiss of filtered noise for the "ch". It plays whenever the player loses health or falls out of the level.
- **Level complete** is a short rising fanfare in C.
- **Stomp** is a quick downward "bop" with a kick-drum thump.
- **Pickup** is a soft rising chime, mostly triangle wave and kept below C6 so it doesn't get shrill. Stars and energy cells share it.
- **Jumps:** each captain names its own sound with `jumpSound` in its character definition. AI Captain has two digital blips (`jump-bits`), Oh Scarrr a voiced "hup!" (`jump-hup`), and Spaiceman a rocket "bwoop" with jet hiss (`jump-jet`). Player emits `jumped`, and GameScene forwards it as `player:jumped`. BootScene refuses to start if a `jumpSound` isn't registered.
- **Death** is a slow chromatic slide down. It starts after a short rest so the final "Ouch!" is heard first. The music stops for it, and the menu starts the music again.
- **Wiring:** GameScene and CollisionSystem emit `player:hurt`, `player:died`, `enemy:stomped`, `item:collected` and `level:completed` on the event bus, and [SoundEffects](src/systems/SoundEffects.ts) plays the matching sound. [SOUND_IDS](src/config/audio.ts) says which sound plays for what, and BootScene refuses to start if one of them is missing or a sound has a typo in its notes, or a character names a jump sound that doesn't exist.
- **Rendering is fast:** about 0.15 s at boot in total, at 22 050 Hz mono.
- **Every sound has the same loudness:** its loudest 0.1 s is scaled to the same RMS, capped so no sample goes above 0.9. A sound's optional `level` (0..1) makes it quieter than the rest: jumps sit at 0.45–0.5 and the pickup at 0.6, because they play often, and the long death tune at 0.5. The volume sliders then apply on top. The earlier version scaled every sound by its peak, which made short square-wave beeps much louder than the music: at the default volumes the pickup was 13 dB above it. Now the effects sit about 6 dB above the music, and the jumps at the same level as the music.
- **Without Web Audio** the game runs silent instead of failing.

**Sound settings** (_SOUND_ in the menu, or P; [SettingsScene.ts](src/scenes/SettingsScene.ts)) has sliders for music (default 15 %) and effects (default 30 %), and "Sound: OFF" for no sound at all.

- **Controls:** ↑/↓ choose a row, ←/→ change it, and Enter selects it (Enter is bound to the `action` input, so it also confirms the other menus). With a mouse or touch, drag the slider or tap the row.
- **Saving:** every change is saved at once through `storage.getAudioSettings` / `setAudioSettings` as JSON, and read back with field-by-field fallbacks ([audioSettings.ts](src/utils/audioSettings.ts)).

**Leaving a level:** on the pause screen, R (Back/Select on a gamepad, or the "Change captain" button) stops the level and goes to character select. The level's score is dropped.

**New input actions:** `up`, `down`, `quit` and `settings`. Up shares its key with jump, so screens with rows check `up` first.

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

The three built-in characters show three ways to make art:

- **Oh Scarrr** ([ohScarrr.ts](src/content/characters/ohScarrr.ts)): the portrait was made from a photo with the scripts in [tools/portrait/](tools/portrait/), then cleaned up by hand. The game sprite is hand-drawn in the same palette.
- **AI Captain** ([aiCaptain.ts](src/content/characters/aiCaptain.ts)): built only from 0 and 1 digits with `renderGlyphGrid` ([binaryGlyphs.ts](src/graphics/binaryGlyphs.ts)). The digits change between frames, so he flickers like a data stream. His portrait is a head-and-shoulders bust on a 12×9 digit grid: a cap with a badge, a face with ears, two 0s for eyes, a 0000 smile, and uniform shoulders.
- **Spaiceman** ([spaiceman.ts](src/content/characters/spaiceman.ts)): a hand-drawn astronaut with a spiral galaxy and two star eyes inside his helmet, an orange scarf, and rocket-boot flames in the jump frame. He is the fastest and highest jumper, but has only 2 health. The round helmet in the portrait was laid out with a small throwaway script, and the result is stored as plain pixel data like every other sprite.

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

There are 160 tests in 18 files. All run without Phaser:

| File                                      | Covers                                                                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `tests/content/registry.test.ts`          | Every level validates; the boot-time content check passes; levels chain without loops; walking enemies stay on platforms; sounds are valid |
| `tests/graphics/parseSprite.test.ts`      | Colour parsing, frame/sprite validation, RGBA output                                                                                       |
| `tests/utils/asciiMap.test.ts`            | Tiled output: gids, object positions, tileset                                                                                              |
| `tests/utils/validateLevel.test.ts`       | Each validation rule                                                                                                                       |
| `tests/utils/gameplayLogic.test.ts`       | Jump controller, Health, stomp detection, combo score, seeded RNG                                                                          |
| `tests/systems/storage.test.ts`           | Highscore, remembered character and sound settings; missing, full or read-only localStorage, tampered values                               |
| `tests/systems/scoring.test.ts`           | EventBus delivery, ScoreSystem, ComboCounter                                                                                               |
| `tests/scenes/sceneData.test.ts`          | Scene-data parsing and fallbacks                                                                                                           |
| `tests/components/createBehavior.test.ts` | Every ComponentSpec maps to its behaviour                                                                                                  |
| `tests/input/actions.test.ts`             | `justPressed` versus `isDown`                                                                                                              |
| `tests/utils/patrol.test.ts`              | Turning at walls and ledges, no sideways drift in the air                                                                                  |
| `tests/utils/stats.test.ts`               | Stat bars, portrait scaling, card row layout, paging, wrap-around selection                                                                |
| `tests/graphics/binaryGlyphs.test.ts`     | Rendering a 0/1 digit grid into a sprite frame, rejecting ragged grids                                                                     |
| `tests/utils/validateCharacter.test.ts`   | Stats that would make a character unkillable or unable to move, hitboxes, texture size, select-screen texts                                |
| `tests/utils/touchLayout.test.ts`         | Positions of the on-screen buttons                                                                                                         |
| `tests/utils/interpolation.test.ts`       | Step fraction and drawing between physics positions                                                                                        |
| `tests/audio/synth.test.ts`               | Note frequencies, held notes and rests, loop length, envelopes, voice timing, band-pass filter, normalising, sound validation messages     |
| `tests/utils/audioSettings.test.ts`       | Volume steps, slider position to volume, parsing saved settings with fallbacks                                                             |

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
