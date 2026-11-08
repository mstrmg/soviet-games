# MINISTRY OF GAMES

Satirical browser games about central planning. An International Hall of Fraternal Nations (a border
checkpoint with a passport) leads to three wings: the Soviet Ministry of Games, China's Bureau of the
Great Leap and East Germany's Ministry for Things Being Fine. Each wing has three games behind three doors.
Vite + vanilla JS + Three.js. No external models, images or audio: everything is primitives, canvas and Web Audio.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

Deep links: `#hall`, the wings `#ussr`, `#china`, `#gdr`, and any game id (`#nail-quota`, `#sparrow-campaign`, ...).
Games call `goTo('hub')` and land in their own wing. Games not yet built open a placeholder.

## Structure

```
src/
  main.js                 entry: renderer, scene registry, hash routing
  wings.js                DATA: the three wings, their games, and which wing a game belongs to
  style.css               overlay UI, memo, newspaper, grain
  hall/                   the International Hall: checkpoint, three national doors, passport
    text.js               DATA: every line the Hall and the passport say
  wings/china/, wings/gdr/  departments.js (DATA) + index.js (the lobby, re-dressed)
  wings/placeholders.js   stand-ins for games not built yet
  hub/                    the Soviet Ministry lobby, reused by every wing (createWingLobby)
    index.js              scene: input, hover, door dolly, overlay
    lobby.js              builds the room, doors, portrait, clock, queue, leak
    citizens.js           low-poly queue
    textures.js           canvas-drawn posters, plaster, floor, signs
    departments.js        DATA: door order, poster slogans, blurbs, medal names, lobby dressing
    features.js           the idle queue, the adjusted clock, the Heroes of Labour board
    lobbyText.js          DATA: their words
  games/
    nail-quota/           Soviet wing, game 1
    pravda-editor/        Soviet wing, game 2
    potemkin-village/     Soviet wing, game 3
    backyard-furnace/     China wing, game 1 (levels.js holds the weeks, items and words)
    launch-a-satellite/   China wing, game 2 (levels.js holds the seasons, rivals and words)
    sparrow-campaign/     China wing, game 3 (levels.js holds the days, quotas and words)
    hole-in-eleven/       North Korea wing, game 1 (course.js holds the 18 shots and every word)
    mass-games/           North Korea wing, game 2 (images.js holds the card art, page orders and words)
    lights-of-the-capital/ North Korea wing, game 3 (grid.js holds the districts, nights, cameras and words)
    spare-parts/           Cuba wing, game 1 (parts.js holds the decades, junk, tags and words)
    trabant-list/         GDR wing, game 1 (list.js holds the goods, offers, events and downgrades)
    listening-post/       GDR wing, game 2 (file.js holds the routine, observations and words)
  wings/dprk/, wings/cuba/  North Korea and Cuba wings: departments.js, index.js, dress.js (lobby props via LOBBY.dress)
    press-conference/     GDR wing, game 3 (script.js holds the questions, phrases and endings)
  shared/
    sceneManager.js       one scene at a time; fade, dispose, load
    scope.js              tracks listeners/timers/resources for auto-cleanup
    dispose.js            frees geometries, materials, textures in a scene graph
    renderer.js           the single WebGLRenderer + flat() material helper
    palette.js            colours and font stacks
    ui.js                 el(), button(), memo(), toast()
    newspaper.js          end-of-game state newspaper front page
    audio.js              synthesised stamp, clack, ding, creak, hum, fanfare
    save.js               localStorage progress (try/catch wrapped)
    placeholderScene.js   temporary "under construction" department
```

## Writing a scene

A scene module's default export is a factory returning `{ scene, camera, init(ctx), update(dt, time), dispose() }`.
`ctx` gives you `renderer`, `scope`, `layer` (your HTML overlay), `audio`, `save`, `params`, and `goTo(id)`.
Register listeners with `ctx.scope.on(target, type, fn)` and timers with `ctx.scope.timeout()` and they are removed
when you leave. Everything in `scene` is disposed automatically after your `dispose()` runs.

In dev, `__MOG.renderer.info.memory` in the console shows GPU geometry/texture counts, and each scene switch logs them.
