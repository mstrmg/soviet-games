// LAUNCH A SATELLITE · China wing, game 2.
// Report your county's yield at the provincial conference. The biggest report launches
// a satellite; the smallest earns a white flag. The state then collects a share of what
// you reported. An auction where winning is the worst outcome.
import * as THREE from 'three';
import './satellite.css';
import { fontsReady } from '../../shared/fonts.js';
import { el, button, memo } from '../../shared/ui.js';
import { showNewspaper } from '../../shared/newspaper.js';
import { SEASONS, RULES, COUNTIES, TEXT, NEWSPAPER, fmt, months } from './levels.js';
import { makeMaterials, buildWorld, drawBoard, boardY, makeSack, BOARD, FIELD, TRUCK_STOP } from './world.js';

const GAME_ID = 'launch-a-satellite';
const CAM_POS = new THREE.Vector3(0, 6.8, 15);
const CAM_LOOK = new THREE.Vector3(0, 3.6, -3);
const SACK = 50; // jin per mu that one sack stands for

export default function createLaunchASatellite() {
  const s = {
    ctx: null,
    m: null,
    refs: null,
    seasonIndex: 0,
    season: null,
    phase: 'idle',
    granary: RULES.granaryStart,
    strikes: 0,
    satellites: 0,
    maxReport: 0,
    lastYou: 0,
    reports: [0, 0, 0, 0],
    flags: [false, false, false, false],
    leader: -1,
    launches: [],
    sacks: [],
    flying: [],
    truck: null,
    removed: false,
    camShake: 0,
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
      scene.background = new THREE.Color(0xd8c49a);
      scene.fog = new THREE.Fog(0xd8c49a, 60, 190);
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
      camera.position.copy(CAM_POS);
      camera.lookAt(CAM_LOOK);
      self.scene = scene;
      self.camera = camera;

      s.m = makeMaterials();
      s.refs = buildWorld(scene, s.m);
      redrawBoard();
      setSacks(Math.ceil(s.granary / SACK), false);

      buildHud(layer);
      scope.on(window, 'keydown', (e) => {
        if (e.key === 'Escape' && !document.querySelector('.memo-wrap')) ctx.goTo('hub');
        if (e.key === 'Enter' && s.phase === 'yourTurn') submit();
      });
    },

    async start() {
      await runSeason(0);
    },

    update(dt, time) {
      if (!s.refs) return;
      updateRockets(dt, time);
      updateSacks(dt);
      updateTruck(dt);
      updatePeople(dt, time);
      if (s.phase !== 'paper') {
        self.camera.position.copy(CAM_POS);
        if (s.camShake > 0) {
          s.camShake = Math.max(0, s.camShake - dt);
          self.camera.position.x += (Math.random() - 0.5) * s.camShake * 0.2;
          self.camera.position.y += (Math.random() - 0.5) * s.camShake * 0.2;
        }
        self.camera.lookAt(CAM_LOOK);
      }
    },

    dispose() {
      s.refs = null;
      s.ctx = null;
      s.ui = {};
    },
  };

  const wait = (ms) => new Promise((r) => s.ctx.scope.timeout(r, ms));

  // ------------------------------------------------------------------ seasons
  async function runSeason(i) {
    const { layer, scope } = s.ctx;
    s.seasonIndex = i;
    s.season = SEASONS[i];
    const S = s.season;
    s.ui.title.textContent = S.title;
    const m = memo(layer, { no: S.memo.no, to: 'Comrade County Chief', from: TEXT.dept, subject: S.memo.subject, body: S.memo.body, buttons: [{ label: S.memo.button, value: true, variant: 'red' }] });
    await m.done;
    if (scope.disposed) return;
    s.ctx.audio.unlock();
    s.phase = 'rivals';
    // the board is wiped for the new season; the rockets come home
    s.reports = [0, 0, 0, 0];
    s.flags = [false, false, false, false];
    s.leader = -1;
    s.refs.rockets.forEach((rk, k) => {
      launch(k, 100, 0.8, false);
      rk.userData.star.visible = false;
      rk.userData.flag.visible = false;
    });
    hidePhoto();
    redrawBoard();
    // the harvest comes in, quietly
    s.ui.actual.textContent = `${fmt(S.actual)} ${TEXT.unit.toLowerCase()}`;
    s.ui.actualNote.textContent = S.actualNote;
    s.ui.side.classList.add('fresh');
    setSacks(Math.ceil((s.granary + S.actual) / SACK), true);
    renderHud();
    await wait(1400);
    // rivals report, smallest first
    const rivals = S.rivals.map((rv) => ({ ...rv, n: Math.max(rv.report, niceRound(s.lastYou * rv.chase)) })).sort((a, b) => a.n - b.n);
    for (const rv of rivals) {
      if (scope.disposed) return;
      s.reports[rv.county] = rv.n;
      launch(rv.county, rv.n);
      announce(TEXT.rivalAnnounce(COUNTIES.names[rv.county], rv.n));
      s.leader = indexOfMax(s.reports);
      redrawBoard();
      await wait(1900);
    }
    if (scope.disposed) return;
    s.phase = 'yourTurn';
    openPanel();
  }

  function rivalFigures() {
    return s.reports.slice(0, 3);
  }

  async function submit() {
    if (s.phase !== 'yourTurn') return;
    const { scope, audio } = s.ctx;
    const n = s.ui.value;
    s.phase = 'reported';
    closePanel();
    audio.stamp();
    s.reports[3] = n;
    s.lastYou = n;
    s.maxReport = Math.max(s.maxReport, n);
    launch(3, n);
    announce(TEXT.youAnnounce(n));
    redrawBoard();
    await wait(1900);
    if (scope.disposed) return;
    const rv = rivalFigures();
    const lead = n > Math.max(...rv);
    const lowest = n < Math.min(...rv);
    s.leader = indexOfMax(s.reports);
    if (lead) {
      s.satellites++;
      s.refs.rockets[3].userData.star.visible = true;
      audio.fanfare();
      announce(TEXT.launched);
      s.camShake = 0.6;
      s.crowdCheer = 3;
      await takePhoto();
    } else if (lowest) {
      s.strikes++;
      s.flags[3] = true;
      s.refs.rockets[3].userData.flag.visible = true;
      audio.shutter();
      announce(TEXT.lowest);
      redrawBoard();
      renderHud();
      await wait(1200);
      if (scope.disposed) return;
      if (s.strikes >= RULES.strikes) {
        s.removed = true;
        const rm = memo(s.ctx.layer, { no: TEXT.removed.no, to: 'Former County Chief', from: TEXT.removed.from, subject: TEXT.removed.subject, body: TEXT.removed.body(n), stamp: 'RELIEVED', buttons: [{ label: TEXT.removed.button, value: true, variant: 'red' }] });
        await rm.done;
        if (!scope.disposed) finish();
        return;
      }
      const cm = memo(s.ctx.layer, { no: TEXT.criticism.no, to: 'Comrade County Chief', from: TEXT.criticism.from, subject: TEXT.criticism.subject, body: TEXT.criticism.body(n, Math.max(...rv)), stamp: 'WHITE FLAG', buttons: [{ label: TEXT.criticism.button, value: true }] });
      await cm.done;
    } else {
      announce(TEXT.middle);
      await wait(1200);
    }
    redrawBoard();
    if (scope.disposed) return;
    await procure(n);
  }

  async function procure(report) {
    const { scope, layer, audio } = s.ctx;
    s.phase = 'procure';
    const S = s.season;
    const due = report * RULES.procurement;
    const available = s.granary + S.actual;
    const collected = Math.min(due, available);
    const shortfall = Math.max(0, due - collected);
    const after = Math.max(0, available - collected - RULES.food);
    // the truck arrives, and takes the sacks
    audio.creak();
    await driveTruck('in');
    if (scope.disposed) return;
    const take = Math.min(s.sacks.length, Math.max(collected > 0 ? 1 : 0, Math.round(collected / SACK)));
    for (let k = 0; k < take; k++) {
      loadSack();
      await wait(140);
      if (scope.disposed) return;
    }
    await wait(700);
    await driveTruck('out');
    if (scope.disposed) return;
    s.granary = after;
    renderHud();
    const o = { report, collected: Math.round(collected), shortfall: Math.round(shortfall), granary: after };
    const pm = memo(layer, { no: TEXT.procure.no(s.seasonIndex), to: 'Comrade County Chief', from: TEXT.procure.from, subject: TEXT.procure.subject, body: TEXT.procure.body(o), stamp: TEXT.procure.stamp(o), buttons: [{ label: TEXT.procure.button, value: true, variant: 'red' }] });
    await pm.done;
    if (scope.disposed) return;
    // the county eats
    setSacks(Math.ceil(s.granary / SACK), false);
    if (s.seasonIndex < SEASONS.length - 1) return runSeason(s.seasonIndex + 1);
    finish();
  }

  async function finish() {
    const { layer, save, audio, scope, manager } = s.ctx;
    s.phase = 'end';
    const medal = s.satellites > 0 && !s.removed;
    const label = `Reported ${fmt(s.maxReport)} jin/mu · granary: ${months(s.granary)}`;
    if (medal) {
      save.awardMedal(GAME_ID, { report: s.maxReport, granary: Math.round(s.granary), satellites: s.satellites });
      save.recordSuccess(GAME_ID, label);
    } else save.recordFailure(GAME_ID, label);
    audio.fanfare();
    // the photograph: the children on the wheat if there was a satellite, otherwise the board
    s.phase = 'paper';
    if (s.satellites > 0 && !s.removed) {
      showPhoto(true);
      s.refs.photographer.visible = false; // the photographer is not in the photograph
      const kids = new THREE.Vector3();
      s.refs.children.forEach((c) => kids.add(c.position));
      kids.multiplyScalar(1 / s.refs.children.length);
      self.camera.position.set(kids.x + 0.6, 2.0, kids.z + 4.6);
      self.camera.lookAt(kids.x, 1.55, kids.z);
    } else {
      self.camera.position.set(0, 5, 6);
      self.camera.lookAt(0, BOARD.y + BOARD.h / 2, BOARD.z);
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const photo = manager.snapshot();
    const headline = s.removed ? NEWSPAPER.removedHeadline : s.satellites > 0 ? NEWSPAPER.headline(s.maxReport) : NEWSPAPER.plainHeadline;
    const np = showNewspaper(layer, {
      headline,
      deck: NEWSPAPER.deck,
      photo,
      caption: s.satellites > 0 && !s.removed ? NEWSPAPER.photoCaption : NEWSPAPER.boardCaption,
      columns: NEWSPAPER.columns.map((c) => c.replace('{n}', fmt(s.maxReport))),
      sidebar: NEWSPAPER.sidebar(s.maxReport, s.granary),
      closeLabel: 'RETURN TO THE BUREAU',
    });
    np.node.classList.add('ls-paper');
    await np.done;
    if (!scope.disposed) s.ctx.goTo('hub');
  }

  // ------------------------------------------------------------------ the board and its rockets
  function launch(k, n, dur = 1.7, loud = true) {
    const rk = s.refs.rockets[k];
    const to = boardY(n) - 0.4;
    s.launches[k] = { from: rk.position.y, to, t: 0, dur, loud };
    if (loud) s.ctx.audio.roar?.();
  }

  function updateRockets(dt, time) {
    s.refs.rockets.forEach((rk, k) => {
      const L = s.launches[k];
      const flame = rk.userData.flame;
      if (L && L.t < 1) {
        L.t = Math.min(1, L.t + dt / L.dur);
        const e = 1 - Math.pow(1 - L.t, 3);
        rk.position.y = THREE.MathUtils.lerp(L.from, L.to, e);
        flame.material.opacity = L.loud && L.to > L.from ? (1 - L.t) * 0.9 : 0;
        flame.scale.y = 0.8 + Math.random() * 0.5;
        rk.rotation.z = Math.sin(time * 40) * 0.03 * (1 - L.t);
      } else {
        flame.material.opacity = 0;
        rk.rotation.z = 0;
      }
      const star = rk.userData.star;
      if (star.visible) {
        star.position.set(Math.cos(time * 2.4) * 0.75, 1.0 + Math.sin(time * 2.4) * 0.25, Math.sin(time * 2.4) * 0.4);
        star.rotation.y = time * 3;
      }
      if (rk.userData.flag.visible) {
        const p = rk.userData.cloth.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(time * 5 + p.getX(i) * 6) * 0.06 * p.getX(i));
        p.needsUpdate = true;
      }
    });
  }

  function redrawBoard() {
    const names = [...COUNTIES.names.map((n) => n), COUNTIES.you];
    drawBoard(s.refs.boardCanvas, { title: TEXT.boardTitle, names, reports: s.reports, leader: s.leader, flags: s.flags });
    s.refs.boardTex.needsUpdate = true;
  }

  // ------------------------------------------------------------------ the photograph
  async function takePhoto() {
    showPhoto(true);
    await wait(1500);
    if (!s.refs) return;
    s.refs.flash.intensity = 120;
    s.ctx.audio.click();
    await wait(140);
    if (s.refs) s.refs.flash.intensity = 0;
    await wait(900);
  }

  function showPhoto(on) {
    s.refs.photographer.visible = on;
    s.refs.children.forEach((c) => (c.visible = on));
  }

  function hidePhoto() {
    showPhoto(false);
  }

  // ------------------------------------------------------------------ the granary, the sacks and the truck
  function setSacks(n, drop) {
    n = Math.min(n, s.refs.sackSpots.length);
    while (s.sacks.length > n) {
      const sk = s.sacks.pop();
      self.scene.remove(sk.mesh);
    }
    let d = 0;
    while (s.sacks.length < n) {
      const spot = s.refs.sackSpots[s.sacks.length];
      const mesh = makeSack(s.m);
      mesh.position.copy(spot);
      mesh.rotation.y = Math.random() * 3;
      if (drop) mesh.position.y += 4 + d * 0.3;
      self.scene.add(mesh);
      s.sacks.push({ mesh, rest: spot.clone(), vy: 0 });
      d++;
    }
  }

  function updateSacks(dt) {
    for (const sk of s.sacks) {
      if (sk.mesh.position.y > sk.rest.y) {
        sk.vy -= 20 * dt;
        sk.mesh.position.y = Math.max(sk.rest.y, sk.mesh.position.y + sk.vy * dt);
        if (sk.mesh.position.y === sk.rest.y) sk.vy = 0;
      }
    }
    for (let i = s.flying.length - 1; i >= 0; i--) {
      const f = s.flying[i];
      f.t = Math.min(1, f.t + dt * 2.2);
      f.mesh.position.lerpVectors(f.from, f.to, f.t);
      f.mesh.position.y += Math.sin(f.t * Math.PI) * 1.6;
      if (f.t >= 1) {
        s.flying.splice(i, 1);
        s.refs.truck.attach(f.mesh);
      }
    }
  }

  function loadSack() {
    const sk = s.sacks.pop();
    if (!sk) return;
    const truck = s.refs.truck;
    const k = truck.userData.loaded = (truck.userData.loaded || 0) + 1;
    const local = new THREE.Vector3(-1.6 + ((k - 1) % 5) * 0.5, 0.95 + Math.floor((k - 1) / 10) * 0.4, ((k - 1) % 10 < 5 ? -0.4 : 0.4));
    const to = truck.localToWorld(local);
    s.flying.push({ mesh: sk.mesh, from: sk.mesh.position.clone(), to, t: 0 });
    s.ctx.audio.step();
  }

  function driveTruck(dir) {
    return new Promise((resolve) => {
      const truck = s.refs.truck;
      const from = truck.position.x;
      const to = dir === 'in' ? TRUCK_STOP.x : 26;
      s.truck = { from, to, t: 0, resolve, dir };
    });
  }

  function updateTruck(dt) {
    const T = s.truck;
    if (!T) return;
    T.t = Math.min(1, T.t + dt / 2.0);
    const e = T.dir === 'in' ? 1 - Math.pow(1 - T.t, 2) : T.t * T.t;
    s.refs.truck.position.x = THREE.MathUtils.lerp(T.from, T.to, e);
    s.refs.truck.position.y = Math.abs(Math.sin(T.t * 40)) * 0.03;
    if (T.t >= 1) {
      s.truck = null;
      if (T.dir === 'out') {
        // the truck goes round the back and returns empty for next season
        const truck = s.refs.truck;
        [...truck.children].filter((c) => c.geometry?.type === 'CylinderGeometry' && c.material === s.m.sack).forEach((c) => truck.remove(c));
        truck.userData.loaded = 0;
        truck.position.x = -26;
      }
      T.resolve();
    }
  }

  function raise(p, up, wave = 0) {
    const [la, ra] = p.userData.arms;
    la.position.y = ra.position.y = up ? 0.22 : -0.25;
    la.rotation.z = up ? 0.4 + wave : 0;
    ra.rotation.z = up ? -0.4 - wave : 0;
  }

  function updatePeople(dt, time) {
    const cheer = (s.crowdCheer = Math.max(0, (s.crowdCheer || 0) - dt));
    s.refs.crowd.forEach((p, i) => {
      raise(p, cheer > 0, Math.sin(time * 14 + i) * 0.2);
      p.position.y = cheer > 0 ? Math.abs(Math.sin(time * 10 + i)) * 0.12 : 0;
    });
    s.refs.officials.forEach((o, i) => (o.rotation.y = Math.sin(time * 0.6 + i) * 0.15));
    s.refs.children.forEach((c, i) => c.visible && raise(c, true, Math.sin(time * 6 + i) * 0.15));
  }

  // ------------------------------------------------------------------ the report panel
  function toValue(k) {
    const lo = Math.log10(RULES.sliderMin);
    const hi = Math.log10(RULES.sliderMax);
    return niceRound(Math.pow(10, lo + (hi - lo) * k));
  }

  function toSlider(v) {
    const lo = Math.log10(RULES.sliderMin);
    const hi = Math.log10(RULES.sliderMax);
    return (Math.log10(Math.max(RULES.sliderMin, v)) - lo) / (hi - lo);
  }

  function setValue(v) {
    s.ui.value = Math.round(THREE.MathUtils.clamp(v, RULES.sliderMin, RULES.sliderMax));
    s.ui.num.textContent = fmt(s.ui.value);
    s.ui.slider.value = String(Math.round(toSlider(s.ui.value) * 1000));
    s.ui.small.textContent = TEXT.small(s.ui.value);
    const rv = rivalFigures();
    s.ui.panel.classList.toggle('lead', s.ui.value > Math.max(...rv));
    s.ui.panel.classList.toggle('low', s.ui.value < Math.min(...rv));
  }

  function openPanel() {
    const rv = rivalFigures();
    s.ui.quick.replaceChildren(
      button(TEXT.quick.truth, () => setValue(s.season.actual), { variant: 'dark' }),
      button(TEXT.quick.lowest, () => setValue(niceRound(Math.min(...rv) * 1.05 + 10)), { variant: 'dark' }),
      button(TEXT.quick.top, () => setValue(niceRound(Math.max(...rv) * 1.1 + 10)), { variant: 'dark' }),
    );
    setValue(s.lastYou || s.season.actual);
    s.ui.panel.classList.add('open');
  }

  function closePanel() {
    s.ui.panel.classList.remove('open');
  }

  // ------------------------------------------------------------------ HUD
  function buildHud(layer) {
    s.ui.title = el('div.dept-title', {}, TEXT.title);
    s.ui.actual = el('div.ls-big', {}, '—');
    s.ui.actualNote = el('div.ls-note', {}, '');
    s.ui.granary = el('div.ls-mid', {}, '');
    s.ui.strikes = el('div.ls-flags', {}, '');
    s.ui.side = el('div.ls-side', {}, [
      el('div.ls-lab', {}, TEXT.actual),
      s.ui.actual,
      s.ui.actualNote,
      el('div.ls-lab', {}, TEXT.granary),
      s.ui.granary,
      el('div.ls-lab', {}, TEXT.strikes),
      s.ui.strikes,
    ]);
    s.ui.announce = el('div.ls-announce', { role: 'status' });
    s.ui.num = el('div.ls-num', {}, '0');
    s.ui.slider = el('input.ls-slider', { type: 'range', min: '0', max: '1000', step: '1', 'aria-label': 'Reported yield' });
    s.ui.slider.addEventListener('input', () => setValue(toValue(Number(s.ui.slider.value) / 1000)));
    s.ui.small = el('div.ls-small', {}, '');
    s.ui.quick = el('div.ls-quick');
    s.ui.panel = el('div.ls-panel', {}, [
      el('div.ls-lab', {}, TEXT.reportLabel),
      el('div.ls-readout', {}, [s.ui.num, el('span.ls-unit', {}, TEXT.unit)]),
      s.ui.slider,
      s.ui.quick,
      button(TEXT.submit, () => submit(), { variant: 'red' }),
      s.ui.small,
    ]);
    layer.append(
      el('div.dept-banner', {}, [el('div.dept-kicker', {}, TEXT.dept), s.ui.title]),
      el('div.corner-actions', {}, [button('← RETURN TO BUREAU', () => s.ctx.goTo('hub'), { variant: 'dark' })]),
      s.ui.side,
      s.ui.announce,
      s.ui.panel,
    );
  }

  function renderHud() {
    s.ui.granary.textContent = TEXT.granaryUnit(s.granary);
    s.ui.granary.classList.toggle('empty', s.granary <= 0);
    s.ui.strikes.replaceChildren(...Array.from({ length: RULES.strikes }, (_, i) => el(`span.ls-flag${i < s.strikes ? '.on' : ''}`)));
  }

  function announce(text) {
    const a = s.ui.announce;
    s.ctx.audio.ding();
    a.textContent = text;
    a.classList.remove('show');
    void a.offsetWidth;
    a.classList.add('show');
  }

  // Dev only.
  if (import.meta.env.DEV) {
    self.__dev = {
      state: () => ({ phase: s.phase, season: s.seasonIndex, reports: s.reports, granary: s.granary, strikes: s.strikes, satellites: s.satellites }),
      report: (n) => {
        setValue(n);
        submit();
      },
    };
  }

  return self;
}

function indexOfMax(a) {
  let k = -1;
  let best = 0;
  a.forEach((v, i) => {
    if (v > best) {
      best = v;
      k = i;
    }
  });
  return k;
}

/** Round to two significant figures, as estimates should be. */
function niceRound(v) {
  if (!v) return 0;
  const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(v)) - 1));
  return Math.round(v / p) * p;
}
