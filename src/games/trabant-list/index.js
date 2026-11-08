// THE TRABANT LIST · GDR wing, game 1.
// You ordered a car. It will come in twelve years. Trade what you are given to move up
// the list; every year you save is taken out of the car. It arrives, eventually, as a car.
import * as THREE from 'three';
import './trabant.css';
import { fontsReady } from '../../shared/fonts.js';
import { el, button, memo, toast } from '../../shared/ui.js';
import { showNewspaper } from '../../shared/newspaper.js';
import { START, ALLOCATION, ITEMS, OFFERS, EVENTS, DOWNGRADES, TEXT, NEWSPAPER } from './list.js';
import { makeMaterials, buildWorld, applyDowngrade, drawCalendar, drawBoard } from './world.js';

const GAME_ID = 'trabant-list';
const CAM_POS = new THREE.Vector3(3.0, 3.1, 8.6);
const CAM_LOOK = new THREE.Vector3(0, 1.3, 0);

export default function createTrabantList() {
  const s = {
    ctx: null,
    m: null,
    refs: null,
    phase: 'idle',
    year: START.year,
    yearN: 0,
    wait: START.wait,
    lost: 0,
    inventory: [],
    market: [],
    eventsLeft: [],
    spin: 0,
    dust: [],
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
      scene.background = new THREE.Color(0xd8ccb0);
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.copy(CAM_POS);
      camera.lookAt(CAM_LOOK);
      self.scene = scene;
      self.camera = camera;
      s.m = makeMaterials();
      s.refs = buildWorld(scene, s.m);
      s.eventsLeft = shuffle([...EVENTS]);
      drawWalls();
      buildHud(layer);
      renderHud();
      scope.on(window, 'keydown', (e) => {
        if (e.key === 'Escape' && !document.querySelector('.memo-wrap')) ctx.goTo('hub');
      });
    },

    async start() {
      const { layer, scope } = s.ctx;
      const m = memo(layer, { no: TEXT.intro.no, to: 'Comrade Applicant', from: TEXT.intro.from, subject: TEXT.intro.subject, body: TEXT.intro.body, buttons: [{ label: TEXT.intro.button, value: true, variant: 'red' }] });
      await m.done;
      if (scope.disposed) return;
      s.ctx.audio.unlock();
      startYear(true);
    },

    update(dt) {
      if (!s.refs) return;
      if (s.phase !== 'paper') {
        s.spin += dt * (s.phase === 'arrived' ? 0.05 : 0.22);
        s.refs.car.group.rotation.y = s.spin;
        s.refs.turntable.rotation.y = s.spin;
        self.camera.position.copy(CAM_POS);
        self.camera.lookAt(CAM_LOOK);
      }
      for (let i = s.dust.length - 1; i >= 0; i--) {
        const d = s.dust[i];
        d.t += dt;
        d.mesh.position.addScaledVector(d.v, dt);
        d.v.y -= 2 * dt;
        d.mesh.material.opacity = Math.max(0, 0.6 - d.t * 0.5);
        d.mesh.scale.setScalar(1 + d.t * 2);
        if (d.t > 1.2) {
          self.scene.remove(d.mesh);
          s.dust.splice(i, 1);
        }
      }
    },

    dispose() {
      s.refs = null;
      s.ctx = null;
      s.ui = {};
    },
  };

  // ------------------------------------------------------------------ years
  function startYear(first = false) {
    s.phase = 'year';
    const item = ALLOCATION[s.yearN % ALLOCATION.length];
    s.inventory.push(item);
    s.ui.news.replaceChildren(el('div.tl-news-year', {}, String(s.year)), el('div', {}, [TEXT.allocation(ITEMS[item])]));
    if (!first) {
      const ev = s.eventsLeft.pop() || EVENTS[0];
      if (s.eventsLeft.length === 0) s.eventsLeft = shuffle([...EVENTS]);
      s.wait += ev.years;
      s.ui.news.append(el('div.tl-news-ev', {}, ev.text + (ev.years ? ` (+${ev.years} year${ev.years === 1 ? '' : 's'})` : '')));
    }
    s.ui.news.classList.remove('show');
    void s.ui.news.offsetWidth;
    s.ui.news.classList.add('show');
    s.market = makeMarket();
    drawWalls();
    renderHud();
  }

  async function endYear() {
    if (s.phase !== 'year') return;
    const { audio } = s.ctx;
    audio.ratchet?.();
    s.year++;
    s.yearN++;
    s.wait--;
    if (s.wait <= 0) return arrive();
    startYear();
  }

  function makeMarket() {
    const pool = shuffle([...OFFERS]);
    const pick = [];
    const affordable = pool.find(canAfford);
    if (affordable) pick.push(affordable);
    for (const o of pool) {
      if (pick.length >= 3) break;
      if (!pick.includes(o)) pick.push(o);
    }
    return shuffle(pick).map((o) => ({ ...o, used: false }));
  }

  function count(id) {
    return s.inventory.filter((x) => x === id).length;
  }

  function canAfford(o) {
    const need = {};
    o.wants.forEach((w) => (need[w] = (need[w] || 0) + 1));
    return Object.entries(need).every(([k, n]) => count(k) >= n);
  }

  async function trade(o) {
    if (s.phase !== 'year' || o.used || !canAfford(o)) return;
    const { audio, layer, scope } = s.ctx;
    o.used = true;
    for (const w of o.wants) s.inventory.splice(s.inventory.indexOf(w), 1);
    audio.stamp();
    if (typeof o.gives === 'string') {
      s.inventory.push(o.gives);
      toast(layer, `+ ${ITEMS[o.gives].name}`);
      renderHud();
      return;
    }
    // years off the list: the car pays for them
    const years = o.gives.years;
    s.wait -= years;
    const lost = [];
    for (let k = 0; k < years && s.lost < DOWNGRADES.length; k++) lost.push(DOWNGRADES[s.lost++]);
    renderHud();
    s.phase = 'revising';
    for (const d of lost) {
      applyDowngrade(s.refs.car, s.m, d.part);
      puff();
      audio.clang?.();
      await wait(350);
      if (scope.disposed) return;
    }
    renderHud();
    if (lost.length) {
      const m = memo(layer, { no: TEXT.revision.no(s.lost), to: 'Comrade Applicant', from: TEXT.dept, subject: TEXT.revision.subject, body: TEXT.revision.body(lost, years), stamp: 'REVISED', buttons: [{ label: TEXT.revision.button, value: true }] });
      await m.done;
      if (scope.disposed) return;
    }
    s.phase = 'year';
    if (s.wait <= 0) return arrive();
    drawWalls();
    renderHud();
  }

  async function arrive() {
    const { layer, scope, audio } = s.ctx;
    s.phase = 'arrived';
    s.wait = 0;
    s.ui.bottom.classList.add('gone');
    s.ui.news.classList.remove('show');
    drawWalls();
    renderHud();
    audio.fanfare();
    const total = DOWNGRADES.length;
    const kept = total - s.lost;
    const m = memo(layer, { no: TEXT.arrival.no, to: 'Comrade Motorist', from: TEXT.dept, subject: TEXT.arrival.subject, body: TEXT.arrival.body(s.year, kept, total), stamp: TEXT.arrival.stamp, buttons: [{ label: TEXT.arrival.button, value: true, variant: 'red' }] });
    await m.done;
    if (!scope.disposed) finish();
  }

  async function finish() {
    const { layer, save, scope, manager } = s.ctx;
    const total = DOWNGRADES.length;
    const kept = total - s.lost;
    const pct = Math.round((kept / total) * 100);
    const waited = s.year - START.year;
    save.awardMedal(GAME_ID, { year: s.year, kept, total });
    save.recordSuccess(GAME_ID, `Car delivered ${s.year}: ${pct}% car`);
    s.phase = 'paper';
    s.refs.car.group.rotation.y = 0.5;
    self.camera.position.set(4.2, 1.6, 5.2);
    self.camera.lookAt(0, 0.9, 0);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const photo = manager.snapshot();
    const lostParts = DOWNGRADES.slice(0, s.lost).map((d) => d.part);
    const doors = 2 - (lostParts.includes('door') ? 1 : 0);
    const np = showNewspaper(layer, {
      headline: kept === total && s.year >= 1989 ? NEWSPAPER.fullHeadline : NEWSPAPER.headline(s.year),
      deck: NEWSPAPER.deck(pct),
      date: `${s.year}`,
      photo,
      caption: NEWSPAPER.caption,
      columns: NEWSPAPER.columns.map((c) => c.replace('{w}', String(waited))),
      sidebar: NEWSPAPER.sidebar({ waited, kept, total, doors: lostParts.includes('driverDoor') ? `${doors} (one cardboard)` : String(doors), wheels: lostParts.includes('wheel') ? 3 : 4 }),
      closeLabel: 'RETURN TO THE MINISTRY',
    });
    np.node.classList.add('tl-paper');
    await np.done;
    if (!scope.disposed) s.ctx.goTo('hub');
  }

  const wait = (ms) => new Promise((r) => s.ctx.scope.timeout(r, ms));

  function puff() {
    for (let i = 0; i < 6; i++) {
      const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 0), new THREE.MeshStandardMaterial({ color: 0xc8bca0, transparent: true, opacity: 0.6, depthWrite: false }));
      mesh.position.set((Math.random() - 0.5) * 2.4, 0.8 + Math.random() * 0.8, (Math.random() - 0.5) * 1.4);
      self.scene.add(mesh);
      s.dust.push({ mesh, t: 0, v: new THREE.Vector3((Math.random() - 0.5) * 2, 1 + Math.random(), (Math.random() - 0.5) * 2) });
    }
  }

  function drawWalls() {
    drawCalendar(s.refs.calCanvas, s.year);
    s.refs.calTex.needsUpdate = true;
    drawBoard(s.refs.boardCanvas, s.year - START.wait);
    s.refs.boardTex.needsUpdate = true;
  }

  // ------------------------------------------------------------------ HUD
  function buildHud(layer) {
    s.ui.title = el('div.dept-title', {}, TEXT.title);
    s.ui.delivery = el('div.tl-big', {}, '');
    s.ui.waitN = el('div.tl-mid', {}, '');
    s.ui.place = el('div.tl-mid', {}, '');
    s.ui.left = el('div.tl-panel.tl-left', {}, [el('div.tl-lab', {}, TEXT.delivery), s.ui.delivery, el('div.tl-lab', {}, TEXT.wait), s.ui.waitN, el('div.tl-lab', {}, TEXT.position), s.ui.place]);
    s.ui.spec = el('ul.tl-spec');
    s.ui.right = el('div.tl-panel.tl-right', {}, [el('div.tl-lab', {}, TEXT.spec), s.ui.spec]);
    s.ui.news = el('div.tl-news');
    s.ui.inv = el('div.tl-inv');
    s.ui.offers = el('div.tl-offers');
    s.ui.endBtn = button(TEXT.endYear, () => endYear(), { variant: 'red' });
    s.ui.bottom = el('div.tl-bottom', {}, [
      el('div.tl-col', {}, [el('div.tl-lab', {}, TEXT.inventory), s.ui.inv]),
      el('div.tl-col.tl-col-wide', {}, [el('div.tl-lab', {}, TEXT.market), s.ui.offers]),
      el('div.tl-col.tl-col-end', {}, [s.ui.endBtn]),
    ]);
    layer.append(
      el('div.dept-banner', {}, [el('div.dept-kicker', {}, TEXT.dept), s.ui.title]),
      el('div.corner-actions', {}, [button('← RETURN TO MINISTRY', () => s.ctx.goTo('hub'), { variant: 'dark' })]),
      s.ui.left,
      s.ui.right,
      s.ui.news,
      s.ui.bottom,
    );
  }

  function renderHud() {
    const wait = Math.max(0, s.wait);
    s.ui.delivery.textContent = String(s.year + wait);
    s.ui.waitN.textContent = wait ? `${wait}` : 'NONE';
    s.ui.place.textContent = Math.max(1, Math.round(wait * START.perYear + (s.yearN * 7919) % START.perYear * (wait ? 1 : 0))).toLocaleString('en-US');
    s.ui.spec.replaceChildren(
      ...DOWNGRADES.map((d, i) => el(`li${i < s.lost ? '.lost' : ''}`, {}, d.text.replace(/ \(.*\)$/, '').replace('Colour options: beige', 'Colour options: several').replace('Headlamps (one)', 'Headlamps (two)').replace('Fourth wheel', 'Four wheels'))),
    );
    // inventory, grouped
    const groups = {};
    s.inventory.forEach((id) => (groups[id] = (groups[id] || 0) + 1));
    const ids = Object.keys(groups);
    s.ui.inv.replaceChildren(...(ids.length ? ids.map((id) => el('div.tl-item', { title: ITEMS[id].note }, [ITEMS[id].name, groups[id] > 1 ? el('span.tl-count', {}, `×${groups[id]}`) : null])) : [el('div.tl-empty', {}, TEXT.empty)]));
    s.ui.offers.replaceChildren(
      ...s.market.map((o) => {
        const ok = canAfford(o) && !o.used && s.phase === 'year';
        const gives = typeof o.gives === 'string' ? ITEMS[o.gives].name : TEXT.years(o.gives.years);
        const btn = button(o.used ? 'DONE' : TEXT.trade, () => trade(o), { variant: ok ? 'red' : '' });
        btn.disabled = !ok;
        return el(`div.tl-offer${o.used ? '.used' : ''}${typeof o.gives === 'string' ? '' : '.years'}`, {}, [
          el('div.tl-who', {}, o.who),
          el('div.tl-deal', {}, [el('span.tl-k', {}, TEXT.wants), ' ', o.wants.map((w) => ITEMS[w].name).join(' + ')]),
          el('div.tl-deal', {}, [el('span.tl-k', {}, TEXT.gives), ' ', gives]),
          btn,
        ]);
      }),
    );
  }

  if (import.meta.env.DEV) {
    self.__dev = {
      state: () => ({ phase: s.phase, year: s.year, wait: s.wait, lost: s.lost, inv: [...s.inventory], market: s.market.map((o) => o.who) }),
      downgrade: (n = 1) => {
        for (let i = 0; i < n && s.lost < DOWNGRADES.length; i++) applyDowngrade(s.refs.car, s.m, DOWNGRADES[s.lost++].part);
        renderHud();
      },
      give: (id, n = 1) => {
        for (let i = 0; i < n; i++) s.inventory.push(id);
        renderHud();
      },
    };
  }

  return self;
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
