// RATION BOOK · Cuba wing, game 2. Plan a household's month from the libreta.
// Each weekday: stand in one queue, take one neighbour's swap, or sit on the step. On Saturday
// the family cooks the official menu from the pantry. The book is stamped ENTREGADO regardless.
import * as THREE from 'three';
import './ration.css';
import { fontsReady } from '../../shared/fonts.js';
import { el, button, memo, toast } from '../../shared/ui.js';
import { showNewspaper } from '../../shared/newspaper.js';
import { ITEMS, SHELF, ENTITLED, SUBS, DAYS, DAYS_EN, NEIGHBOURS, WEEKS, START_PANTRY, POINTS_NEEDED, oddsWord, ODDS_EN, TEXT, NEWSPAPER } from './book.js';
import { buildShop } from './shop.js';

const GAME_ID = 'ration-book';
const WAIT_MS = 1500;

/** Cook the menu from a pantry: dishes that can be made as written first, then with substitutes. */
export function cook(pantry, menu) {
  const p = { ...pantry };
  const out = menu.map((dish) => ({ dish, kind: 'none', as: '', missing: '' }));
  const has = (id) => (p[id] || 0) > 0;
  out.forEach((o) => {
    if (o.dish.needs.every(has)) {
      o.dish.needs.forEach((id) => p[id]--);
      o.kind = 'full';
    }
  });
  out.forEach((o) => {
    if (o.kind !== 'none') return;
    const plan = [];
    const take = { ...p };
    for (const id of o.dish.needs) {
      if ((take[id] || 0) > 0) {
        take[id]--;
        plan.push(id);
      } else if (SUBS[id] && (take[SUBS[id].item] || 0) > 0) {
        take[SUBS[id].item]--;
        plan.push(SUBS[id].item);
        o.as = SUBS[id].as;
      } else {
        o.missing = ITEMS[id].en;
        return;
      }
    }
    Object.assign(p, take);
    o.kind = 'sub';
  });
  const points = out.reduce((a, o) => a + (o.kind === 'full' ? 2 : o.kind === 'sub' ? 1 : 0), 0);
  return { out, points, pantry: p };
}

export default function createRationBook() {
  const s = {
    ctx: null,
    shop: null,
    week: 0,
    day: 0,
    pantry: { ...START_PANTRY },
    gone: new Set(), // items the clerk has written SE ACABÓ under this week
    ahead: {}, // today's queue lengths
    gotWeek: new Set(), // entitlements actually received from the bodega this week
    arrived: 0,
    points: 0,
    tally: { full: 0, sub: 0, none: 0 },
    hours: 0,
    swaps: 0,
    ranOut: 0,
    busy: true,
    phase: 'idle',
    ui: {},
  };

  const self = {
    scene: null,
    camera: null,

    async init(ctx) {
      s.ctx = ctx;
      const { scope, layer } = ctx;
      await fontsReady();
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x2a2622);
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      camera.position.set(0.3, 3.3, 7.4);
      camera.lookAt(0.3, 1.65, -1.5);
      self.scene = scene;
      self.camera = camera;
      scene.add(new THREE.HemisphereLight(0xfff4e0, 0x4a3a2a, 1.2));
      const sun = new THREE.DirectionalLight(0xffe2b0, 2.2);
      sun.position.set(-5, 8, 6);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 });
      scene.add(sun);
      const lamp = new THREE.PointLight(0xffd9a0, 10, 12, 1.4);
      lamp.position.set(0.5, 3.8, 0);
      scene.add(lamp);

      s.shop = buildShop(scene);
      s.shop.setStock({});
      s.shop.setQueue(30);
      s.shop.setDay('CERRADO', 'HOY');
      buildHud(layer);

      scope.on(window, 'keydown', (e) => {
        if (e.key === 'Escape' && !document.querySelector('.memo-wrap')) ctx.goTo('hub');
      });
    },

    async start() {
      const { layer, scope, audio } = s.ctx;
      const m = memo(layer, { no: TEXT.memo.no, to: 'The household', from: TEXT.dept, subject: TEXT.memo.subject, body: TEXT.memo.body, stamp: 'COMPLETE', buttons: [{ label: TEXT.memo.button, value: true, variant: 'red' }] });
      await m.done;
      if (scope.disposed) return;
      audio.unlock();
      runWeek(0);
    },

    update(dt, time) {
      s.shop?.tick(dt, time);
    },

    dispose() {
      s.shop = null;
      s.ctx = null;
      s.ui = {};
    },
  };

  // ------------------------------------------------------------------ the month
  async function runWeek(w) {
    const { layer, scope, audio } = s.ctx;
    s.week = w;
    s.day = 0;
    s.gone = new Set();
    s.gotWeek = new Set();
    s.phase = 'week';
    const W = WEEKS[w];
    renderHud();
    audio.stamp();
    const m = memo(layer, {
      no: `TS-2/${String(w + 2).padStart(2, '0')}`,
      to: 'The household',
      from: TEXT.dept,
      subject: `Week ${w + 1}: ${W.title}`,
      body: [W.note, `Official menu: ${W.menu.map((d) => `${d.name} (${d.needs.map((id) => ITEMS[id].en).join(' and ')})`).join('; ')}.`],
      buttons: [{ label: 'TO THE BODEGA', value: true, variant: 'red' }],
    });
    m.node.classList.add('rb-side');
    await m.done;
    if (scope.disposed) return;
    beginDay();
  }

  function status(id) {
    const sh = WEEKS[s.week].shop[id];
    if (!sh) return { kind: 'nohay', text: 'NO HAY' };
    if (s.gone.has(id)) return { kind: 'gone', text: 'SE ACABÓ' };
    if (s.day < sh.from) return { kind: 'later', text: `LLEGA EL ${DAYS[sh.from]}` };
    if (s.day > sh.to) return { kind: 'gone', text: 'SE ACABÓ' };
    return { kind: 'hay', text: 'HAY', p: sh.p, units: sh.units };
  }

  function beginDay() {
    s.phase = 'day';
    const open = {};
    s.ahead = {};
    for (const id of SHELF) {
      const st = status(id);
      if (st.kind === 'hay') {
        open[id] = true;
        // a shorter queue for the things that last, a long one for the things that might not
        s.ahead[id] = Math.round(8 + (1 - st.p) * 50 + Math.random() * 14);
      }
    }
    s.shop.setStock(open);
    const longest = Math.max(10, ...Object.values(s.ahead));
    s.shop.setQueue(longest);
    s.shop.setDay(DAYS[s.day], `SEMANA ${s.week + 1}`);
    s.busy = false;
    renderHud();
  }

  async function act(a) {
    if (s.busy || s.phase !== 'day') return;
    const { layer, audio, scope } = s.ctx;
    s.busy = true;
    renderHud();
    if (a.type === 'queue') {
      const st = status(a.id);
      const ahead = s.ahead[a.id] || 20;
      s.hours += Math.round(ahead / 12) + 1;
      s.shop.setQueue(ahead);
      s.shop.shuffle();
      audio.step();
      await wait(600);
      if (scope.disposed) return;
      s.shop.shuffle();
      audio.step();
      await wait(600);
      if (scope.disposed) return;
      s.shop.stamp();
      audio.stamp();
      if (Math.random() < st.p) {
        s.pantry[a.id] = (s.pantry[a.id] || 0) + st.units;
        if (ENTITLED.includes(a.id) && !s.gotWeek.has(a.id)) {
          s.gotWeek.add(a.id);
          s.arrived++;
        }
        s.shop.handOver(a.id);
        audio.ding();
        say(TEXT.queueOk(ITEMS[a.id].en, st.units, ahead), 3200);
      } else {
        s.gone.add(a.id);
        s.ranOut++;
        audio.clack();
        say(TEXT.queueNo(ITEMS[a.id].en, ahead), 3200);
      }
    } else if (a.type === 'swap') {
      const sw = WEEKS[s.week].swaps[s.day];
      s.pantry[sw.give]--;
      s.pantry[sw.get] = (s.pantry[sw.get] || 0) + 1;
      s.swaps++;
      audio.click();
      say(sw.line ? `${TEXT.swapOk(NEIGHBOURS[sw.who], ITEMS[sw.give].en, ITEMS[sw.get].en)} ${sw.line}` : TEXT.swapOk(NEIGHBOURS[sw.who], ITEMS[sw.give].en, ITEMS[sw.get].en), 3200);
    } else {
      audio.tick();
      say(TEXT.sit[(s.week + s.day) % TEXT.sit.length], 2800);
    }
    renderHud();
    await wait(WAIT_MS);
    if (scope.disposed) return;
    s.day++;
    if (s.day < DAYS.length) beginDay();
    else saturday();
  }

  async function saturday() {
    const { layer, audio, scope } = s.ctx;
    s.phase = 'saturday';
    s.shop.setStock({});
    s.shop.setQueue(6);
    s.shop.setDay('SÁBADO', 'CERRADO');
    const W = WEEKS[s.week];
    const res = cook(s.pantry, W.menu);
    s.lastCook = res;
    s.pantry = res.pantry;
    s.points += res.points;
    for (const o of res.out) s.tally[o.kind]++;
    renderHud();
    audio.pot();
    const lines = res.out.map((o) => `${o.dish.name}: ${o.kind === 'full' ? TEXT.saturday.full : o.kind === 'sub' ? TEXT.saturday.sub(o.as) : TEXT.saturday.none(o.missing)}.`);
    const last = s.week + 1 >= WEEKS.length;
    const m = memo(layer, {
      no: `TS-2/${String(s.week + 2).padStart(2, '0')}-S`,
      to: 'The household',
      from: 'The kitchen',
      subject: TEXT.saturday.subject(s.week + 1),
      body: [...lines, TEXT.stampNote],
      stamp: 'ENTREGADO',
      buttons: [{ label: last ? 'THE END OF THE MONTH' : 'NEXT WEEK', value: true, variant: 'red' }],
    });
    m.node.classList.add('rb-side');
    // the clerk stamps the book: every line, delivered
    s.ui.book.classList.add('stamped');
    for (let i = 0; i < ENTITLED.length; i++) {
      setTimeout(() => {
        if (scope.disposed || !s.ui.rows) return;
        s.ui.rows[ENTITLED[i]]?.classList.add('ent');
        audio.stamp();
      }, 500 + i * 160);
    }
    await m.done;
    if (scope.disposed) return;
    s.ui.book.classList.remove('stamped');
    if (!last) runWeek(s.week + 1);
    else finish();
  }

  async function finish() {
    const { layer, save, audio, scope, manager } = s.ctx;
    s.phase = 'end';
    renderHud();
    const good = s.points >= POINTS_NEEDED;
    const label = `${s.points} of 24 meal points, 100% on paper`;
    if (good) {
      save.awardMedal(GAME_ID, { points: s.points, swaps: s.swaps });
      save.recordSuccess(GAME_ID, label);
    } else save.recordFailure(GAME_ID, label);
    audio.fanfare();
    s.shop.setDay('FIN DE MES', 'HOY');
    const photo = manager.snapshot();
    const r = {
      dishes: WEEKS.length * 3,
      ...s.tally,
      good,
      arrivedPct: Math.round((s.arrived / (ENTITLED.length * WEEKS.length)) * 100),
      hours: s.hours,
      swaps: s.swaps,
      ranOut: s.ranOut,
    };
    const np = showNewspaper(layer, {
      masthead: NEWSPAPER.masthead,
      motto: NEWSPAPER.motto,
      date: NEWSPAPER.date,
      price: NEWSPAPER.price,
      headline: NEWSPAPER.headline,
      deck: NEWSPAPER.deck,
      photo,
      caption: NEWSPAPER.caption,
      columns: NEWSPAPER.columns(r),
      sidebar: NEWSPAPER.sidebar(r),
      closeLabel: 'RETURN TO THE MINISTRY',
    });
    await np.done;
    if (!scope.disposed) s.ctx.goTo('hub');
  }

  // ------------------------------------------------------------------ HUD
  function buildHud(layer) {
    const week = el('div.rb-num', {}, '1');
    const day = el('div.rb-num', {}, '—');
    const pts = el('div.rb-num', {}, '0');
    const board = el('div.rb-top', {}, [
      el('div.rb-cell', {}, [el('div.rb-lab', {}, 'Week'), week, el('div.rb-info', {}, `of ${WEEKS.length}`)]),
      el('div.rb-cell', {}, [el('div.rb-lab', {}, 'Day'), day, el('div.rb-info', {}, 'Saturday: cooking')]),
      el('div.rb-cell', {}, [el('div.rb-lab', {}, 'Menu points'), pts, el('div.rb-info', {}, `needed: ${POINTS_NEEDED} of 24`)]),
    ]);
    const chalk = el('div.rb-chalk-rows', {}, []);
    const chalkboard = el('aside.rb-chalk', {}, [el('div.rb-chalk-head', {}, [el('b', {}, 'BODEGA Nº 14'), el('span', {}, 'lo que hay hoy')]), chalk]);
    const menu = el('div.rb-menu', {}, []);
    const pantry = el('div.rb-pantry', {}, []);
    const rows = {};
    const bookList = el('ul', {}, ENTITLED.map((id) => (rows[id] = el('li', {}, [el('span', {}, ITEMS[id].es), el('em', {}, '1 ración'), el('i', {}, '')]))));
    const book = el('div.rb-book', {}, [el('div.rb-lab', {}, 'Libreta · this week'), bookList, el('div.rb-stamp', {}, TEXT.stamped)]);
    const side = el('aside.rb-sidepanel', {}, [(s.uiMenuLab = el('div.rb-lab', {}, 'The official menu · if cooked now')), menu, el('div.rb-lab', {}, 'The pantry'), pantry, book]);
    const swap = el('div.rb-swap', {}, []);
    const sit = button('SIT ON THE STEP', () => act({ type: 'sit' }), { variant: 'dark' });
    const actions = el('div.rb-actions', {}, [swap, sit]);
    const back = el('div.corner-actions', {}, [button('← RETURN TO LOBBY', () => s.ctx.goTo('hub'), { variant: 'dark' })]);
    const root = el('div.rb-hud', {}, [board, chalkboard, side, actions, back]);
    layer.append(root);
    s.ui = { root, week, day, pts, chalk, menu, pantry, rows, book, swap, sit, actions };
  }

  function renderHud() {
    const u = s.ui;
    if (!u.root) return;
    const W = WEEKS[s.week];
    u.week.textContent = String(s.week + 1);
    u.day.textContent = s.phase === 'day' ? DAYS_EN[s.day] : s.phase === 'saturday' ? 'Saturday' : '—';
    u.pts.textContent = String(s.points);
    if (s.uiMenuLab) s.uiMenuLab.textContent = s.phase === 'saturday' ? 'The official menu · as cooked' : 'The official menu · if cooked now';
    const live = s.phase === 'day' && !s.busy;
    u.root.classList.toggle('busy', !live);

    // the chalkboard
    u.chalk.replaceChildren(
      ...SHELF.map((id) => {
        const st = s.phase === 'day' ? status(id) : { kind: 'nohay', text: s.phase === 'saturday' ? 'CERRADO' : '—' };
        const it = ITEMS[id];
        const right = [el('span.rb-st', {}, st.text)];
        if (st.kind === 'hay') {
          const w = oddsWord(st.p);
          right.push(el('span.rb-odds', { title: `Odds of the shelf lasting: ${ODDS_EN[w]}` }, `${s.ahead[id]} delante · ${w}`));
          right.push(button('QUEUE', () => act({ type: 'queue', id }), { variant: 'red' }));
        }
        return el(`div.rb-row.${st.kind}`, {}, [el('div.rb-name', {}, [el('b', {}, it.es), el('small', {}, it.en)]), el('div.rb-right', {}, right)]);
      }),
    );

    // the menu, as it would be cooked right now
    const pre = s.phase === 'saturday' && s.lastCook ? s.lastCook : cook(s.pantry, W.menu);
    u.menu.replaceChildren(
      ...pre.out.map((o) =>
        el(`div.rb-dish.${o.kind}`, {}, [
          el('b', {}, o.dish.name),
          el('div.rb-needs', {}, o.dish.needs.map((id) => el(`span.${s.phase === 'saturday' ? (o.kind === 'none' ? 'miss' : 'have') : (s.pantry[id] || 0) > 0 ? 'have' : SUBS[id] && (s.pantry[SUBS[id].item] || 0) > 0 ? 'sub' : 'miss'}`, {}, ITEMS[id].en))),
          el('em', {}, o.kind === 'full' ? 'as on the menu' : o.kind === 'sub' ? 'resembles the menu' : 'described at the table'),
        ]),
      ),
    );

    // the pantry
    const have = SHELF.filter((id) => (s.pantry[id] || 0) > 0);
    u.pantry.replaceChildren(...(have.length ? have.map((id) => el('span.rb-chip', {}, `${ITEMS[id].en}${s.pantry[id] > 1 ? ` ×${s.pantry[id]}` : ''}`)) : [el('span.rb-empty', {}, 'Empty, but clean')]));

    // the book: a tick where something actually arrived; the stamp comes on Saturday
    for (const id of ENTITLED) {
      const row = u.rows[id];
      row.classList.toggle('got', s.gotWeek.has(id));
      row.querySelector('i').textContent = s.gotWeek.has(id) ? '✓' : '';
      if (s.phase !== 'saturday') row.classList.remove('ent');
    }

    // today's neighbour
    const sw = s.phase === 'day' ? W.swaps[s.day] : null;
    if (sw) {
      const can = (s.pantry[sw.give] || 0) > 0;
      const b = button(`SWAP: ${ITEMS[sw.give].en.toUpperCase()} FOR ${ITEMS[sw.get].en.toUpperCase()}`, () => act({ type: 'swap' }), { variant: can ? '' : 'dark' });
      b.disabled = !can;
      u.swap.replaceChildren(el('div.rb-who', {}, [el('b', {}, NEIGHBOURS[sw.who]), el('span', {}, can ? `will give you ${ITEMS[sw.get].en} for your ${ITEMS[sw.give].en}.` : `has ${ITEMS[sw.get].en}, and wants ${ITEMS[sw.give].en}. You have none.`)]), b);
    } else u.swap.replaceChildren();
    u.actions.style.visibility = s.phase === 'day' ? 'visible' : 'hidden';
  }

  function say(text, ms) {
    s.toast?.remove();
    s.toast = toast(s.ctx.layer, text, ms);
  }

  function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  if (import.meta.env.DEV) {
    self.__dev = {
      s,
      cook,
      /** The day's best move by expected points, for testing. */
      best() {
        const W = WEEKS[s.week];
        const opts = [{ type: 'sit', v: cook(s.pantry, W.menu).points }];
        for (const id of SHELF) {
          const st = status(id);
          if (st.kind !== 'hay') continue;
          const p2 = { ...s.pantry, [id]: (s.pantry[id] || 0) + st.units };
          opts.push({ type: 'queue', id, v: st.p * cook(p2, W.menu).points + (1 - st.p) * opts[0].v + st.p * 0.01 });
        }
        const sw = W.swaps[s.day];
        if (sw && (s.pantry[sw.give] || 0) > 0) {
          const p2 = { ...s.pantry, [sw.give]: s.pantry[sw.give] - 1, [sw.get]: (s.pantry[sw.get] || 0) + 1 };
          opts.push({ type: 'swap', v: cook(p2, W.menu).points + 0.005 });
        }
        opts.sort((a, b) => b.v - a.v);
        return opts[0];
      },
      play() {
        act(this.best());
      },
    };
  }

  return self;
}
