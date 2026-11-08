# MINISTRY OF GAMES

Three satirical browser games about central planning, behind three doors of one crumbling Ministry lobby.
Vite + vanilla JS + Three.js. No external models, images or audio: everything is primitives, canvas and Web Audio.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

Deep links: `#hub`, `#nail-quota`, `#pravda-editor`, `#potemkin-village`.

## Structure

```
src/
  main.js                 entry: renderer, scene registry, hash routing
  style.css               overlay UI, memo, newspaper, grain
  hub/                    the Ministry lobby
    index.js              scene: input, hover, door dolly, overlay
    lobby.js              builds the room, doors, portrait, clock, queue, leak
    citizens.js           low-poly queue
    textures.js           canvas-drawn posters, plaster, floor, signs
    departments.js        DATA: door order, poster slogans, blurbs, medal names
  games/
    nail-quota/           (placeholder until step 2)
    pravda-editor/        (placeholder until step 4)
    potemkin-village/     (placeholder until step 3)
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
