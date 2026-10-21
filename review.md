# Code review – AI AI Captain

Reviewed on 2026-10-21 against the code currently in the working tree (nothing is committed yet).
The same agent that wrote the code also did this review. It names its own shortcuts openly.
Line numbers refer to the files as formatted by Prettier **at review time**. The fixes below have moved code, so the original line references are now approximate.

## Resolution (2026-10-21)

All findings were addressed in one follow-up change, except where noted.
Checks run after the fixes:

- `npm run lint` passes, `npm run test` passes (75 tests, up from 62), and `npm run build` passes.
- The game was driven in headless Chrome, in dev mode and as the production build with the new CSP. Menu, stomping, pickup popups, pause/resume and spike damage all work, and no CSP violations were logged.
- A deliberately thrown error now shows the error overlay.

| Finding                        | Status          | What changed                                                                                                                                                                                                                                                                                                 |
| ------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1, A2 magic numbers           | Fixed           | New [config/ui.ts](src/config/ui.ts) (font sizes, layouts, prompt pulse). Entity effects, fall margins, popups and touch label scale moved to [constants.ts](src/config/constants.ts).                                                                                                                       |
| A3 direct pointer input        | Fixed           | New [TapSource.ts](src/input/TapSource.ts) (`tapAnywhereAs` option); [ContinuePrompt.ts](src/scenes/ContinuePrompt.ts) only uses `InputController` and registers no listeners.                                                                                                                               |
| A4 per-frame allocation        | Fixed           | `Player` resolves its animation keys once (`findAnimation`) and reuses them.                                                                                                                                                                                                                                 |
| A5 unpooled popups             | Fixed           | New [ScorePopups.ts](src/systems/ScorePopups.ts) reuses `Text` objects from a Phaser group (max 12) and listens to a new `points:awarded` event.                                                                                                                                                             |
| A6 CLAUDE.md out of date       | Fixed           | Updated the `levels/` and `CharacterDefinition`/`LevelDefinition` lines in [CLAUDE.md](CLAUDE.md).                                                                                                                                                                                                           |
| A7 no rotate prompt            | Fixed           | CSS overlay in [index.html](index.html) for touch devices held upright; [GameScene](src/scenes/GameScene.ts) also pauses automatically in portrait.                                                                                                                                                          |
| A8 missing tests               | Fixed           | Tests for `playerCharacterOf`, `ScoreSystem`, `EventBus`, `ComboCounter`, `createBehavior`, scene-data parsing and score sanitizing.                                                                                                                                                                         |
| A9 menu content in scene       | Fixed           | Moved to [content/menu.ts](src/content/menu.ts).                                                                                                                                                                                                                                                             |
| A10 player not composed        | **Not changed** | Making player movement a data-driven component would mean rewriting `Player` in one large change, which CLAUDE.md advises against while the current design works. Suggested as its own task.                                                                                                                 |
| A11 dead event                 | Fixed           | `level:started` removed.                                                                                                                                                                                                                                                                                     |
| S1 no CSP                      | Fixed           | `<meta http-equiv="Content-Security-Policy">` in [index.html](index.html), allowing same-origin only (plus `data:`/`blob:` for Phaser textures). Verified in dev and in the production build.                                                                                                                |
| S2 unvalidated highscore       | Fixed           | `sanitizeScore` in [storage.ts](src/systems/storage.ts) accepts only non-negative safe integers, on read and on write.                                                                                                                                                                                       |
| S3 shared origin               | Mitigated       | Documented in `storage.ts`; S2 means tampered values are ignored. Values on a shared origin can never be fully trusted.                                                                                                                                                                                      |
| S4 unvalidated scene data      | Fixed           | `parseGameSceneData` / `parseHudSceneData` / `parseGameOverSceneData` in [sceneData.ts](src/scenes/sceneData.ts), with safe fallbacks.                                                                                                                                                                       |
| S5 no runtime level validation | Fixed           | `buildLevel` runs `validateLevel` before building; the validation context is shared with the tests (`levelValidationContext`).                                                                                                                                                                               |
| S6 `^` ranges                  | Partly          | Added [.npmrc](.npmrc) `save-exact=true` for future installs. Using `npm ci` in CI will be part of the deploy workflow, which still needs your approval.                                                                                                                                                     |
| S7 `.env` not ignored          | Fixed           | `.env` and `.env.*` added to [.gitignore](.gitignore).                                                                                                                                                                                                                                                       |
| S8 Phaser banner               | Fixed           | `banner: false` in [main.ts](src/main.ts).                                                                                                                                                                                                                                                                   |
| Q1 CollisionSystem             | Fixed           | Split into `checkHazardTiles`, `checkFellOutOfLevel`, `isStompOn` and `stomp`. The callbacks are now `onPlayerDamaged` and `onPlayerFell`, popups moved out, and **the spike knockback bug is fixed** (it now pushes away from the tile centre).                                                             |
| Q2 no error handling           | Fixed           | [errorOverlay.ts](src/systems/errorOverlay.ts) catches uncaught errors and rejections and shows a reload screen. `LevelBuilder` now checks that the tilemap parsed and that its layers exist.                                                                                                                |
| Q3 Player does too much        | Fixed           | Combo moved to [ComboCounter](src/components/ComboCounter.ts), owned by `CollisionSystem`. `Player.updateFrame` now calls `applyControls` and `updateAppearance`, and `hurt` delegates to `knockBack`.                                                                                                       |
| Q4 naming                      | Fixed           | `world` → `levelWorld`, the two `ui.ts` files became `textHelpers.ts` and `hudIcons.ts`, `K`/`r`/`m` were renamed, `'cut'` became `'shortenJump'`, and `gidsWhere` became `tileIdsWhere`. `CharacterDefinition` is now a union per `kind`, so pickups, the goal and the player no longer carry dummy fields. |
| Q5 unexplained code            | Fixed           | Added comments on the one-way collision helper, the mulberry32 source and its constants, the origin/offset rule, the Flyer derivative, and the jump state machine.                                                                                                                                           |

---

## 1. Architecture: compliance with CLAUDE.md

> _Granska kodbasen mot de arkitekturprinciper jag definierat i CLAUDE.md. Var bryter koden mot principerna? Var är den i linje med dem? Ge konkreta filreferenser._

### Violations

| #   | Principle (CLAUDE.md)                                                                                               | Where                                                                                                                                                                                                                                                                                                                                                                                              | Problem                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | _Inga magiska tal: konstanter samlas i `src/config/`_                                                               | [CollisionSystem.ts:16-19](src/systems/CollisionSystem.ts#L16-L19), [Enemy.ts:9](src/entities/Enemy.ts#L9), [Collectible.ts:6-7](src/entities/Collectible.ts#L6-L7), [Player.ts:10](src/entities/Player.ts#L10), [PauseScene.ts:7](src/scenes/PauseScene.ts#L7), [MenuScene.ts:12-14](src/scenes/MenuScene.ts#L12-L14)                                                                             | Tuning values are module-level constants spread across files instead of living in `config/`. They are named, but you can't tune the game from one place.                                                  |
| A2  | Same                                                                                                                | [MenuScene.ts:29-46](src/scenes/MenuScene.ts#L29-L46), [GameOverScene.ts:23-29](src/scenes/GameOverScene.ts#L23-L29), [PauseScene.ts:20-22](src/scenes/PauseScene.ts#L20-L22), [HudScene.ts:72-74](src/scenes/HudScene.ts#L72-L74), [scenes/ui.ts:26-27](src/scenes/ui.ts#L26-L27), [CollisionSystem.ts:89](src/systems/CollisionSystem.ts#L89), [TouchSource.ts:70](src/input/TouchSource.ts#L70) | Raw magic numbers: font sizes (40, 36, 32, 24, 20, 12, 10), layout fractions (`height * 0.2`, `0.75` …), tween timings (700 ms, alpha 0.35). This is the clearest breach of the rule.                     |
| A3  | _Spellogik läser aldrig tangenter direkt – all input går via `src/input/`_                                          | [ContinuePrompt.ts:22](src/scenes/ContinuePrompt.ts#L22)                                                                                                                                                                                                                                                                                                                                           | Listens to `scene.input.on('pointerdown')` directly, bypassing `InputController`. "Tap to continue" should be an input source or action.                                                                  |
| A4  | _Undvik allokeringar i `update()`_                                                                                  | [Player.ts:116-120](src/entities/Player.ts#L116-L120) → [physicsSprite.ts:24](src/entities/physicsSprite.ts#L24) → [textureFactory.ts:32](src/graphics/textureFactory.ts#L32)                                                                                                                                                                                                                      | `updateAnimation` runs every frame and builds a new animation-key string through a template literal each time. The keys should be computed once in the constructor.                                       |
| A5  | _Objekt som skapas ofta poolas med Phaser-grupper_                                                                  | [CollisionSystem.ts:86-97](src/systems/CollisionSystem.ts#L86-L97)                                                                                                                                                                                                                                                                                                                                 | A new `Text` object is created and destroyed for every "+points" popup. These are created often (every pickup) and should come from a pool.                                                               |
| A6  | _Figurer och banor … `LevelDefinition` (tilemap …)_; folder description _"en fil per bana (Tiled-kompatibel JSON)"_ | [content/types.ts](src/content/types.ts), [content/levels/](src/content/levels/)                                                                                                                                                                                                                                                                                                                   | Levels are TypeScript files with ASCII layouts that are turned into Tiled JSON at runtime. You approved this deviation, but CLAUDE.md hasn't been updated, so the documentation now contradicts the code. |
| A7  | _Stöd för både liggande och stående läge (visa uppmaning att vrida telefonen)_                                      | [main.ts:18-21](src/main.ts#L18-L21)                                                                                                                                                                                                                                                                                                                                                               | There is no rotate-device prompt yet. In portrait mode the game is just letterboxed very small.                                                                                                           |
| A8  | _Ny ren logik ska ha enhetstester_                                                                                  | [registry.ts `playerCharacterOf`](src/content/registry.ts), [ScoreSystem.ts](src/systems/ScoreSystem.ts), [createBehavior.ts](src/components/createBehavior.ts), [EventBus.ts](src/events/EventBus.ts)                                                                                                                                                                                             | No test references these. `playerCharacterOf` and `ScoreSystem` are pure enough to test without Phaser.                                                                                                   |
| A9  | _Hårdkoda inte banor eller figurer i scenkod_ (minor)                                                               | [MenuScene.ts:12](src/scenes/MenuScene.ts#L12)                                                                                                                                                                                                                                                                                                                                                     | The menu's star background (seed and density) is content data defined inside a scene.                                                                                                                     |
| A10 | _Komposition före arv / små komponenter_ (minor)                                                                    | [Player.ts:45-52](src/entities/Player.ts#L45-L52), [captain.ts:75](src/content/characters/captain.ts#L75)                                                                                                                                                                                                                                                                                          | The player's movement, jump and blink logic is hard-coded in `Player`, and the captain's `components: []` is empty. The player can't be reconfigured through data the way enemies can.                    |
| A11 | Typed event bus (dead code)                                                                                         | [EventBus.ts:6](src/events/EventBus.ts#L6)                                                                                                                                                                                                                                                                                                                                                         | `'level:started'` is declared but never emitted or listened to.                                                                                                                                           |

### Compliant

| Principle                                                            | Evidence                                                                                                                                                                                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Content is data, kept in `content/` and registered in `registry.ts`  | [registry.ts](src/content/registry.ts). Scenes never name a character; the player and goal are chosen by the level legend ([legend.ts](src/content/levels/legend.ts), [LevelBuilder.ts:76-91](src/systems/LevelBuilder.ts#L76-L91)). |
| Typed `CharacterDefinition` and `LevelDefinition`, gravity per level | [types.ts](src/content/types.ts); gravity is applied in [GameScene.ts:36](src/scenes/GameScene.ts#L36).                                                                                                                              |
| Composition for enemies                                              | Data-only `ComponentSpec` union, mapped by [createBehavior.ts](src/components/createBehavior.ts) to [Patrol](src/components/Patrol.ts), [Jumper](src/components/Jumper.ts) and [Flyer](src/components/Flyer.ts).                     |
| At most one level of inheritance                                     | [Player.ts:12](src/entities/Player.ts#L12), [Enemy.ts:11](src/entities/Enemy.ts#L11), [Collectible.ts:9](src/entities/Collectible.ts#L9) and [Goal.ts:6](src/entities/Goal.ts#L6) each extend `Arcade.Sprite` directly.              |
| Pure logic without Phaser                                            | Everything in [utils/](src/utils/), plus [parseSprite.ts](src/graphics/parseSprite.ts), [actions.ts](src/input/actions.ts), [Health.ts](src/components/Health.ts) and [storage.ts](src/systems/storage.ts).                          |
| Input abstraction (except A3)                                        | [InputController.ts](src/input/InputController.ts) merges keyboard, gamepad and touch into the five abstract actions.                                                                                                                |
| Event bus, no globals                                                | [EventBus.ts](src/events/EventBus.ts) wraps the per-game emitter; the HUD only listens ([HudScene.ts](src/scenes/HudScene.ts)).                                                                                                      |
| Persistence in one layer that tolerates missing storage              | [storage.ts:36-46](src/systems/storage.ts#L36-L46)                                                                                                                                                                                   |
| Strict TypeScript, no `any`                                          | [tsconfig.json](tsconfig.json) (`strict` and `noUncheckedIndexedAccess`), [eslint.config.js](eslint.config.js) (`no-explicit-any: error`). A grep finds no `any`.                                                                    |
| Pixel art, `Scale.FIT`, fixed timestep                               | [main.ts:16-25](src/main.ts#L16-L25)                                                                                                                                                                                                 |
| Sprites as character matrices with a shared palette                  | [palette.ts](src/graphics/palette.ts), [textureFactory.ts](src/graphics/textureFactory.ts)                                                                                                                                           |
| Every level validated in a test                                      | [registry.test.ts:22](tests/content/registry.test.ts#L22) runs `validateLevel` on every level; line 37 checks every sprite.                                                                                                          |
| Deploy prerequisites                                                 | `base: '/aiaicaptain/'` in [vite.config.ts:5](vite.config.ts#L5); `dist/` in [.gitignore](.gitignore).                                                                                                                               |

---

## 2. Security

> _Gå igenom kodbasen och leta efter: hårdkodade hemligheter eller uppgifter, saknad inputvalidering, injection-risker (SQL, kommando, path traversal), känsliga data i loggar, och osäkra standardvärden. Lista varje fynd med filnamn och radnummer._

**Context:** this is a static, client-only game with no backend, no network calls, no user accounts and no free-text input, so the attack surface is very small. I searched for the following:

- **Secret-like words:** `secret`, `token`, `password`, `api key`, `bearer`, and URLs.
- **Network calls:** `fetch`, `XMLHttpRequest`, `WebSocket`, dynamic `import()`.
- **Code and HTML injection sinks:** `innerHTML`, `document.write`, `eval`, `new Function`.
- **Shell and process calls:** `child_process` / `exec`.
- **Logging:** `console.*`.

### Findings

| #   | Category                         | File:line                                                                                                                                                   | Severity | Finding                                                                                                                                                                                                                                                                |
| --- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Insecure default                 | [index.html:3-7](index.html#L3-L7)                                                                                                                          | Low      | No Content-Security-Policy. GitHub Pages can't send headers, but a `<meta http-equiv="Content-Security-Policy">` with `default-src 'self'` would also _enforce_ the CLAUDE.md rule against loading external resources at runtime.                                      |
| S2  | Missing input validation         | [storage.ts:49-53](src/systems/storage.ts#L49-L53)                                                                                                          | Low      | `readNumber` accepts any finite number from `localStorage`, including negative, fractional and huge values such as `1e308`. Someone who edits storage can show a fake highscore. The impact is cosmetic and local, but it should be clamped to a non-negative integer. |
| S3  | Insecure default (shared origin) | [storage.ts:13](src/systems/storage.ts#L13)                                                                                                                 | Info     | On GitHub Pages the origin is `stallind.github.io`, which every Pages repo of that account shares. Any other project there can read or overwrite `aiaicaptain.highscore`, so stored values should be treated as untrusted (see S2).                                    |
| S4  | Missing input validation         | [GameScene.ts:33-34](src/scenes/GameScene.ts#L33-L34), [HudScene.ts:20](src/scenes/HudScene.ts#L20), [GameOverScene.ts:16](src/scenes/GameOverScene.ts#L16) | Low      | Scene `data` is trusted as-is. If a scene is ever started without data, `getLevel(undefined)` throws and the game freezes. This is a robustness issue, not an exploitable one.                                                                                         |
| S5  | Missing input validation         | [LevelBuilder.ts:76](src/systems/LevelBuilder.ts#L76), [LevelBuilder.ts:94](src/systems/LevelBuilder.ts#L94)                                                | Low      | `validateLevel` only runs in tests, never at runtime. Content is bundled at build time, so this is acceptable now. It would matter if levels are later loaded from files or Tiled exports.                                                                             |
| S6  | Insecure default (supply chain)  | [package.json:15-26](package.json#L15-L26)                                                                                                                  | Low      | Every dependency uses a `^` range. `package-lock.json` pins the actual versions, so CI must use `npm ci`, not `npm install`. `npm audit` reported 0 vulnerabilities at install time.                                                                                   |
| S7  | Insecure default                 | [.gitignore:1-4](.gitignore#L1-L4)                                                                                                                          | Info     | `.env*` isn't ignored. Nothing uses environment files today, but adding the pattern now guards against committing one later.                                                                                                                                           |
| S8  | Logging / information disclosure | [main.ts:10](src/main.ts#L10)                                                                                                                               | Info     | The Phaser banner logs the engine version to the console. That's harmless, but `banner: false` hides it. No game code logs anything.                                                                                                                                   |

### Checked, nothing found

| Category                          | Result                                                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Hard-coded secrets or credentials | None. The only URL is the SVG namespace in [favicon.svg](public/favicon.svg).                                   |
| SQL injection                     | Not applicable: no database.                                                                                    |
| Command injection                 | Not applicable: no `child_process`, `exec` or shell calls in the shipped code.                                  |
| Path traversal                    | Not applicable: no file-system access, no dynamic paths, no runtime loading of assets.                          |
| XSS / HTML injection              | None. All text is drawn on the canvas with `Phaser.Text`, and there is no `innerHTML` or `eval`.                |
| Sensitive data in logs            | None. There are no `console.*` calls in `src/`, and the game handles no personal data.                          |
| Debug flags                       | Arcade `debug: false` ([main.ts:25](src/main.ts#L25)); Vite's production build emits no source maps by default. |

---

## 3. Code quality: the five most serious problems

> _Identifiera: funktioner som gör mer än en sak, otydlig namngivning (variabler, funktioner, klasser), saknad felhantering för externa anrop, och kod som är svår att läsa utan kommentarer. Lista de fem allvarligaste problemen._

### 1. `CollisionSystem` mixes rules, scoring and presentation, and its callback name misleads

**Category:** functions that do more than one thing, plus unclear naming.

**Where:** [CollisionSystem.ts:43-53](src/systems/CollisionSystem.ts#L43-L53), [CollisionSystem.ts:55-79](src/systems/CollisionSystem.ts#L55-L79), [CollisionSystem.ts:86-97](src/systems/CollisionSystem.ts#L86-L97)

**Problems:**

- `update()` checks hazard tiles and also handles falling out of the level.
- `onEnemyContact` decides between stomp and hurt, updates the combo, defeats the enemy, bounces the player and awards points.
- `award()` changes the score _and_ builds and animates a UI text object.
- Falling to your death goes through the callback `onPlayerHurt` (line 51), so a reader of [GameScene.ts:100](src/scenes/GameScene.ts#L100) can't tell that it also handles death.
- The hazard hit passes `player.x` as the damage source (line 46), so `knockbackDirection(x, x)` always pushes the player right. That is a hidden bug caused by the mixed responsibilities.

**Fix:**

- Split the hazard and fall checks into separate methods.
- Move the popup into a pooled `ScorePopups` system that listens to `score:changed`.
- Rename the callback to `onPlayerHealthChanged`, or add a separate `onPlayerFell`.

### 2. No error handling around runtime failures; every throw leaves a frozen black canvas

**Category:** missing error handling for external calls.

**Where:** [LevelBuilder.ts:36-49](src/systems/LevelBuilder.ts#L36-L49), [LevelBuilder.ts:76](src/systems/LevelBuilder.ts#L76), [BootScene.ts:14-27](src/scenes/BootScene.ts#L14-L27), [GameScene.ts:33-34](src/scenes/GameScene.ts#L33-L34), [textureFactory.ts:16-23](src/graphics/textureFactory.ts#L16-L23)

**Problems:**

- The calls into Phaser and the browser (`cache.tilemap.add`, `make.tilemap`, `createCanvas`, `getContext`, `putImageData`) are assumed to succeed. Only `createCanvas` and `createLayer` are null-checked.
- The code throws on purpose for unknown ids or a missing spawn, but nothing catches those errors. The player sees a frozen screen, with the error only in the console.
- `localStorage` is the one external API that is handled well ([storage.ts:36-63](src/systems/storage.ts#L36-L63)).

**Fix:**

- Add one top-level error path, for example a `window.onerror` / `unhandledrejection` handler that shows an "Something went wrong – reload" overlay.
- Validate scene data at the start of each `create()`.
- Check that `make.tilemap` returned the expected layers.

### 3. `Player` mixes several jobs and exposes mutable state to other systems

**Category:** functions that do more than one thing.

**Where:** [Player.ts:15](src/entities/Player.ts#L15), [Player.ts:45-52](src/entities/Player.ts#L45-L52), [CollisionSystem.ts:67](src/systems/CollisionSystem.ts#L67)

**Problems:**

- `updateControl` does five things: it resets the combo chain as a side effect, moves, jumps, blinks and animates.
- `stompChain` is a public mutable field. It is reset inside `Player` but incremented from `CollisionSystem`, so the combo rule is split across two classes, and you can only find the reset by reading the movement code.
- `hurt()` applies damage, knockback and the control lock in one call.

**Fix:**

- Move the combo into a small `ComboCounter` that `CollisionSystem` owns. It resets on landing, using the same `onGround` signal.
- Keep `updateControl` to "read input → move/jump" and run blink and animation as separate steps.

### 4. Unclear or overloaded names

**Category:** unclear naming.

| Where                                                                                                              | Problem                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [GameScene.ts:21](src/scenes/GameScene.ts#L21) `world`                                                             | Sits right next to `this.physics.world` (lines 36, 68), which is a different thing. `levelWorld` or `level` would be clearer.                                                                                                                                                                                                                                           |
| [scenes/ui.ts](src/scenes/ui.ts) and [content/ui.ts](src/content/ui.ts)                                            | Two files with the same name and unrelated content (text helpers versus heart sprites).                                                                                                                                                                                                                                                                                 |
| [types.ts](src/content/types.ts) `CharacterDefinition`                                                             | Also used for stars, energy cells and the warp gate. These need dummy fields: `NO_STATS` with `health: 1` ([pickups.ts:5](src/content/characters/pickups.ts#L5)), and `stompable: false` / `scoreValue: 0` on the player ([captain.ts:73-74](src/content/characters/captain.ts#L73-L74)). `EntityDefinition`, with per-kind variants, would describe the data honestly. |
| [config/input.ts:4](src/config/input.ts#L4) `K`, [TouchSource.ts:22-23](src/input/TouchSource.ts#L22-L23) `r`, `m` | Single-letter aliases.                                                                                                                                                                                                                                                                                                                                                  |
| [jumpController.ts](src/utils/jumpController.ts) `'cut'`, `rising`                                                 | The meaning ("the jump button was released early, so shorten the jump") is only clear from the tests.                                                                                                                                                                                                                                                                   |
| [LevelBuilder.ts](src/systems/LevelBuilder.ts) `gidsWhere`                                                         | Uses the Tiled term "gid" without explaining it.                                                                                                                                                                                                                                                                                                                        |

### 5. Code that is hard to read without comments

**Category:** code that is hard to read without comments.

| Where                                                                                                | What's unclear                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [LevelBuilder.ts:60](src/systems/LevelBuilder.ts#L60) `tile.setCollision(false, false, true, false)` | Four positional booleans. Nothing at the call site says this means "collide from above only" (one-way platforms).                                                                               |
| [random.ts:7-11](src/utils/random.ts#L7-L11)                                                         | Bit-twiddling with magic constants (`0x6d2b79f5`, `>>> 15`, `\| 61`). The comment names the algorithm (mulberry32) but not the source, and doesn't say these constants must not be "tidied up". |
| [physicsSprite.ts:13-15](src/entities/physicsSprite.ts#L13-L15)                                      | Origin is set to `(0.5, 1)` while body offsets are measured from the frame's top-left corner. This Phaser quirk is what keeps hitboxes aligned and is not obvious.                              |
| [Flyer.ts:18](src/components/Flyer.ts#L18), [Flyer.ts:24-25](src/components/Flyer.ts#L24-L25)        | The velocity is the derivative of `A·sin(ωt)`. Without saying so, `amplitude * angularSpeed * cos(...)` looks arbitrary.                                                                        |
| [jumpController.ts](src/utils/jumpController.ts) `Number.POSITIVE_INFINITY` timers                   | Infinity is used as the value for "never happened / consumed". There is one comment, but the state machine (grounded → rising → cut) is never described in one place.                           |

### Smaller items noted, not in the top five

- **Listener cleanup:** [ContinuePrompt.ts:22](src/scenes/ContinuePrompt.ts#L22) never removes its `pointerdown` listener. This is not a leak, because Phaser's `InputPlugin.shutdown` calls `removeAllListeners()`, but it depends on that implicit behaviour.
- **Code inside create():** `GameScene.create` ([GameScene.ts:33-48](src/scenes/GameScene.ts#L33-L48)) is long, but it is pure orchestration, which is the scene's job.
