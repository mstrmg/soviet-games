// The lobby's standing features: the queue that advances while you do nothing,
// the clock that is adjusted when you fail, and the board that remembers both.
import * as THREE from 'three';
import { el, toast, memo } from '../shared/ui.js';
import { departmentById } from '../wings.js';
import { QUEUE, CLOCK, BOARD } from './lobbyText.js';

const HOUR = 3600 * 1000;
const AHEAD = 4 * 60 * 1000; // the clock has always been four minutes ahead of plan
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerp = THREE.MathUtils.lerp;
const fmt = (n) => n.toLocaleString('en-GB');
const freshPosition = () => QUEUE.startMin + Math.floor(Math.random() * (QUEUE.startMax - QUEUE.startMin));
const medalOf = (gameId) => departmentById(gameId)?.medal;

export function createLobbyFeatures(ctx, refs) {
  const { save, audio, layer, scope } = ctx;
  const sleep = (ms) => new Promise((res) => scope.timeout(res, ms));
  const SHUFFLE_MS = QUEUE.shuffleSeconds * 1000;

  // ---------------------------------------------------------------- save state
  save.update((d) => {
    if (d.hub.queuePos == null) d.hub.queuePos = freshPosition();
    if (d.hub.lastShuffleAt == null) d.hub.lastShuffleAt = Date.now();
    if (d.hub.citizenNo == null) d.hub.citizenNo = 100 + Math.floor(Math.random() * 899900);
    if (d.hub.failuresSeen > d.failures.length) d.hub.failuresSeen = d.failures.length; // after a reset
  });
  const hub = () => save.data.hub;

  // ---------------------------------------------------------------- the queue
  // Time away from the lobby counts as waiting: settle it now, before any click can reset the idle timer.
  const awayShifts = Math.max(0, Math.floor((Date.now() - hub().lastShuffleAt) / SHUFFLE_MS));
  if (awayShifts) save.update((d) => (d.hub.lastShuffleAt += awayShifts * SHUFFLE_MS));
  const q = {
    started: false,
    idleSince: Date.now(),
    checkT: 0,
    pending: 0, // shuffles waiting to be animated
    anim: null,
    shownPos: hub().queuePos,
  };
  const people = refs.queue.people;
  const base = new Map(people.map((p) => [p, { ry: p.rotation.y, rz: p.rotation.z }]));
  const drawCard = (n) => refs.queueCard.set({ title: QUEUE.standTitle, number: fmt(n), foot: QUEUE.standFoot });
  drawCard(q.shownPos);

  function onInput() {
    q.idleSince = Date.now();
  }
  // A hidden tab is idle by definition; settle up the moment it is visible again, before the mouse moves.
  scope.on(document, 'visibilitychange', () => {
    if (document.visibilityState === 'visible' && q.started) checkIdle();
  });

  /** Advance n places. Animates at most a few; the rest happen on paper. */
  function advance(n, { animate = true } = {}) {
    if (n <= 0) return;
    const before = hub().queuePos;
    let pos = before - n;
    let lunch = false;
    if (pos <= 1) {
      lunch = true;
      pos = freshPosition();
    }
    save.update((d) => (d.hub.queuePos = pos));
    if (n > QUEUE.awayToastOver) toast(layer, QUEUE.away(n), 4200);
    const shown = animate ? Math.min(n, QUEUE.maxAnimated) : 0;
    if (lunch) q.lunchAfter = { pos }; // reach the window, then lose your place
    q.shownPos = (lunch ? 1 : pos) + shown;
    q.pending += shown;
    if (!shown) settleCard();
  }

  function settleCard() {
    if (q.lunchAfter) {
      const { pos } = q.lunchAfter;
      q.lunchAfter = null;
      drawCard(1);
      audio.shutter();
      toast(layer, QUEUE.lunch, 4600);
      scope.timeout(() => {
        q.shownPos = pos;
        drawCard(pos);
      }, 3500);
      return;
    }
    q.shownPos = hub().queuePos;
    drawCard(q.shownPos);
  }

  function checkIdle() {
    const now = Date.now();
    const from = Math.max(q.idleSince, hub().lastShuffleAt);
    const n = Math.floor((now - from) / SHUFFLE_MS);
    if (n < 1) return;
    save.update((d) => (d.hub.lastShuffleAt = from + n * SHUFFLE_MS));
    advance(n);
  }

  function startShuffle() {
    const slots = refs.queue.slots;
    q.anim = { t: 0, front: people[0], steps: 0, bumped: false };
    q.anim.from = people.map((p) => p.position.clone());
    q.anim.dest = slots;
  }

  function tickShuffle(dt) {
    const a = q.anim;
    a.t += dt;
    const slots = refs.queue.slots;
    const N = people.length;
    // the front citizen: up to the shutter, a bump, about turn, all the way to the back
    const f = a.front;
    const s0 = slots[0];
    const back = slots[N - 1];
    const fb = base.get(f);
    const T = a.t;
    if (T < 0.35) {
      f.position.z = lerp(s0.z, refs.queue.shutterZ, ease(T / 0.35));
    } else if (T < 0.55) {
      if (!a.bumped) {
        a.bumped = true;
        audio.shutter();
      }
      f.position.z = lerp(refs.queue.shutterZ, s0.z, ease((T - 0.35) / 0.2) * 0.4);
      f.rotation.z = fb.rz + Math.sin(((T - 0.35) / 0.2) * Math.PI) * 0.08;
    } else if (T < 0.95) {
      f.rotation.y = fb.ry + Math.PI * ease((T - 0.55) / 0.4);
    } else if (T < 3.0) {
      const k = (T - 0.95) / 2.05;
      const sideX = s0.x - 0.8;
      const z0 = lerp(refs.queue.shutterZ, s0.z, 0.4);
      if (k < 0.12) {
        f.position.x = lerp(s0.x, sideX, ease(k / 0.12));
        f.position.z = z0;
      } else {
        f.position.x = sideX;
        f.position.z = lerp(z0, back.z, (k - 0.12) / 0.88);
      }
      f.position.y = Math.abs(Math.sin(T * 9)) * 0.04;
    } else {
      const k = Math.min(1, (T - 3.0) / 0.4);
      f.position.x = lerp(s0.x - 0.8, back.x, ease(k));
      f.position.z = back.z;
      f.position.y = 0;
      f.rotation.y = fb.ry + Math.PI * (1 - ease(k));
    }
    // everyone else steps up one place
    const k = THREE.MathUtils.clamp((T - 0.6) / 1.0, 0, 1);
    for (let i = 1; i < N; i++) {
      const p = people[i];
      p.position.x = lerp(a.from[i].x, slots[i - 1].x, ease(k));
      p.position.z = lerp(a.from[i].z, slots[i - 1].z, ease(k));
      p.position.y = k > 0 && k < 1 ? Math.abs(Math.sin(k * Math.PI * 2)) * 0.05 : 0;
    }
    if (k > 0 && a.steps === 0) {
      a.steps = 1;
      audio.step();
      q.shownPos = Math.max(1, q.shownPos - 1);
      drawCard(q.shownPos);
    }
    if (k > 0.5 && a.steps === 1) {
      a.steps = 2;
      audio.step();
    }
    if (T >= 3.4) {
      people.push(people.shift());
      q.anim = null;
      q.pending -= 1;
      if (q.pending === 0) settleCard();
    }
  }

  // ---------------------------------------------------------------- the clock
  const failures = () => save.data.failures.length;
  const c = {
    sweep: Math.max(0, failures() - hub().failuresSeen), // hours not yet shown
    anchor: Date.now(),
    backwards: failures() > save.medalCount(),
    lastSec: -1,
    lastRatchet: 0,
  };
  const setPlate = (h) => refs.clock.setPlate(h > 0 ? CLOCK.plate(h) : null);
  setPlate(failures() - c.sweep);

  function tickClock(dt, ticking) {
    const now = Date.now();
    const real = c.backwards ? c.anchor - (now - c.anchor) : now;
    const shown = new Date(real + AHEAD - (failures() - c.sweep) * HOUR);
    const secs = new Date(real + AHEAD);
    const sec = secs.getSeconds();
    const min = shown.getMinutes() + shown.getSeconds() / 60;
    const hr = (shown.getHours() % 12) + min / 60;
    refs.clock.secondHand.rotation.z = -(sec / 60) * Math.PI * 2;
    refs.clock.minuteHand.rotation.z = -(min / 60) * Math.PI * 2;
    refs.clock.hourHand.rotation.z = -(hr / 12) * Math.PI * 2;
    if (sec !== c.lastSec) {
      if (c.lastSec !== -1 && ticking) audio.tick();
      c.lastSec = sec;
    }
  }

  async function sweepClock() {
    const n = c.sweep;
    if (!n) return;
    for (let i = 0; i < n; i++) {
      const from = c.sweep;
      const t0 = performance.now();
      await new Promise((res) => {
        const step = () => {
          if (scope.disposed) return;
          const k = Math.min(1, (performance.now() - t0) / 2000);
          c.sweep = from - ease(k);
          if (performance.now() - c.lastRatchet > 70 && k < 1) {
            c.lastRatchet = performance.now();
            audio.ratchet();
          }
          if (k < 1) requestAnimationFrame(step);
          else res();
        };
        step();
      });
      c.sweep = from - 1;
      setPlate(failures() - c.sweep);
      await sleep(250);
    }
    if (scope.disposed) return;
    save.update((d) => (d.hub.failuresSeen = d.failures.length));
    toast(layer, CLOCK.adjusted, 3800);
    await sleep(1200);
  }

  // ---------------------------------------------------------------- the board
  const latest = () =>
    save.data.honours
      .slice()
      .reverse()
      .map((h) => ({ ...h, medal: medalOf(h.gameId) }));
  refs.board.draw(latest().slice(0, 12), BOARD, hub().citizenNo);

  async function spotlightNewest() {
    const newest = save.data.honours[save.data.honours.length - 1];
    if (!newest || (hub().honoursSeenAt && newest.at <= hub().honoursSeenAt)) return;
    save.update((d) => (d.hub.honoursSeenAt = newest.at));
    const { spot } = refs.board;
    const p = refs.board.cellPos(0);
    spot.target.position.copy(p);
    spot.position.set(p.x, p.y + 2.2, 3.2);
    if (newest.kind === 'hero') audio.fanfare();
    else audio.stamp();
    const t0 = performance.now();
    await new Promise((res) => {
      const step = () => {
        if (scope.disposed) return;
        const k = (performance.now() - t0) / 4200;
        spot.intensity = k < 0.15 ? (k / 0.15) * 60 : k < 0.7 ? 60 : Math.max(0, (1 - (k - 0.7) / 0.3) * 60);
        if (k < 1) requestAnimationFrame(step);
        else res();
      };
      step();
    });
  }

  function openRegister() {
    const all = latest();
    const date = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const m = memo(layer, {
      no: BOARD.register.no,
      to: BOARD.citizen(hub().citizenNo),
      from: 'District Honours Committee',
      subject: BOARD.register.subject,
      body: [all.length ? BOARD.register.foot : BOARD.register.empty],
      buttons: [{ label: 'CLOSE THE REGISTER', value: true }],
    });
    if (all.length) {
      const list = el(
        'ol.register-list',
        {},
        all.map((h) =>
          el(`li${h.kind === 'removed' ? '.withdrawn' : ''}`, {}, [
            el('span.reg-date', {}, date(h.at)),
            h.kind === 'hero'
              ? el('span.reg-text', {}, [el('b', {}, `★ ${h.medal || 'Hero of Labour'}`), ` · ${h.label}`])
              : el('span.reg-text', {}, BOARD.register.withdrawn),
          ]),
        ),
      );
      m.node.querySelector('.memo-body').prepend(list);
    }
    m.node.querySelector('.memo').classList.add('register');
  }

  // ---------------------------------------------------------------- tooltips
  function tipFor(feature) {
    if (feature === 'clock') {
      return [el('div.tip-kicker', {}, 'LOBBY CLOCK'), el('div.tip-body', {}, CLOCK.tip)];
    }
    return [
      el('div.tip-kicker', {}, 'NOTICE OF MERIT'),
      el('div.tip-title', {}, BOARD.tipTitle),
      el('div.tip-body', {}, BOARD.tipBody),
      el('div.tip-hint', {}, BOARD.tipHint),
    ];
  }

  return {
    onInput,
    tipFor,
    openRegister,
    /** Arrival: wind the clock, light the board, then let the queue notice you. */
    async start() {
      await sweepClock();
      if (scope.disposed) return;
      await spotlightNewest();
      if (scope.disposed) return;
      q.started = true;
      advance(awayShifts);
    },
    update(dt, ticking) {
      tickClock(dt, ticking);
      if (!q.started) return;
      q.checkT -= dt;
      if (q.checkT <= 0) {
        q.checkT = 0.5;
        checkIdle();
      }
      if (q.anim) tickShuffle(dt);
      else if (q.pending > 0) startShuffle();
    },
    dev: {
      shuffle(n = 1) {
        advance(n);
      },
    },
  };
}
