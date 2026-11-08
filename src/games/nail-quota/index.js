// NAIL QUOTA — scene module. Memo → plan → production → inspection, year after year.
import * as THREE from 'three';
import './nail-quota.css';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PALETTE } from '../../shared/palette.js';
import { fontsReady } from '../../shared/fonts.js';
import { el, button, memo } from '../../shared/ui.js';
import { showNewspaper } from '../../shared/newspaper.js';
import { LEVELS, FLOOR_REMARKS, ENDINGS } from './levels.js';
import { verdict, satisfaction, QUOTA_TEXT, planLabel, fmtInt, fmtNum, fmtMeasured } from './rules.js';
import { buildFactory, emitSparks, updateSparks, OUTPUT_CENTER, PRESS_POS } from './factory.js';
import { buildOutput } from './output.js';
import { createPanel } from './panel.js';
import { showReport, scores } from './report.js';

const GAME_ID = 'nail-quota';
const KG_PER_COIL = 125;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const fill = (str, vars) => str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));

export default function createNailQuota() {
  const s = {
    ctx: null,
    refs: null,
    levelIndex: 0,
    lv: null, // this year's level, with ratchets and revisions applied
    changed: false,
    results: [],
    phase: 'idle',
    panel: null,
    output: null,
    result: null,
    cam: null,
    look: new THREE.Vector3(),
    prod: null,
    hud: {},
    coilsStart: 0,
  };

  const self = {
    scene: null,
    camera: null,

    async init(ctx) {
      s.ctx = ctx;
      const { scope, layer, audio, save, renderer } = ctx;
      await fontsReady();

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1916);
      scene.fog = new THREE.Fog(0x1a1916, 40, 80);
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
      pmrem.dispose();
      scope.track(envRT);
      scene.environment = envRT.texture;
      scene.environmentIntensity = 0.45;

      const camera = new THREE.PerspectiveCamera(48, 1, 0.01, 150);
      self.scene = scene;
      self.camera = camera;
      s.refs = buildFactory(scene);
      setCamera(planView(), 0);

      // HUD
      s.hud.title = el('div.dept-title', {}, 'NAIL QUOTA');
      s.hud.record = el('div.nq-record', { 'aria-label': 'Official record' });
      layer.append(
        el('div.dept-banner.nq-banner', {}, [el('div.dept-kicker', {}, 'Directorate of Fasteners · Nail Factory No. 4'), s.hud.title, s.hud.record]),
        el('div.corner-actions', {}, [button('← RETURN TO LOBBY', () => ctx.goTo('hub'), { variant: 'dark' })]),
      );

      audio.loop('factory', 'hum', 0.045);
      scope.on(window, 'keydown', (e) => {
        if (e.key === 'Escape' && s.phase === 'plan') ctx.goTo('hub');
      });

    },

    async start() {
      const { scope, layer, save } = s.ctx;
      // Resume a plan in progress?
      const saved = save.game(GAME_ID);
      const inProgress = saved.levelIndex > 0 && saved.levelIndex < LEVELS.length && Array.isArray(saved.results);
      if (inProgress) {
        const m = memo(layer, {
          no: 'NQ-0/00',
          to: 'Comrade Director',
          from: 'Plan Records Office',
          subject: 'Your Five-Year Plans are in progress',
          body: [`Records show the factory has completed ${saved.levelIndex} year(s) of the current Plan.`, 'The Plan may be continued. The Plan may also be started again, in which case the previous Plan will never have existed.'],
          buttons: [
            { label: 'START A NEW PLAN', value: 'new' },
            { label: `CONTINUE (YEAR ${saved.levelIndex + 1})`, value: 'continue', variant: 'red' },
          ],
        });
        const choice = await m.done;
        if (scope.disposed) return;
        if (choice === 'continue') {
          s.results = saved.results;
          s.levelIndex = saved.levelIndex;
        }
      }
      startLevel(s.levelIndex);
    },

    update(dt, time) {
      if (!s.refs) return;
      const { press, sparks } = s.refs;
      updateSparks(sparks, dt);
      press.flywheel.rotation.x += dt * (s.phase === 'production' ? 9 : 0.6);

      // camera tween
      const cam = s.cam;
      if (cam) {
        cam.t = Math.min(1, cam.t + dt / cam.dur);
        const e = ease(cam.t);
        self.camera.position.lerpVectors(cam.fromPos, cam.toPos, e);
        s.look.lerpVectors(cam.fromLook, cam.toLook, e);
        if (s.phase === 'plan' || s.phase === 'evaluate') {
          // gentle idle drift
          self.camera.position.x += Math.sin(time * 0.25) * 0.15 * cam.toPos.distanceTo(cam.toLook) * 0.02;
        }
        self.camera.lookAt(s.look);
      }

      if (s.phase === 'production') tickProduction(dt);
      else if (s.phase === 'reveal' && cam && cam.t >= 1) {
        s.phase = 'evaluate';
        evaluate();
      }
    },

    dispose() {
      s.output?.dispose();
      s.panel?.destroy();
      s.output = s.panel = s.refs = null;
      s.ctx = null;
      s.phase = 'disposed';
    },
  };

  // ---- camera --------------------------------------------------------------
  function planView() {
    return { pos: new THREE.Vector3(6.5, 8.5, 19), look: new THREE.Vector3(1.5, 1.2, -2) };
  }
  function pressView() {
    return { pos: new THREE.Vector3(PRESS_POS.x + 5.5, 4.2, PRESS_POS.z + 8.5), look: new THREE.Vector3(PRESS_POS.x + 1.5, 2.2, PRESS_POS.z) };
  }
  function outputView(out) {
    const R = Math.max(out.radius, out.height, 0.02);
    const dist = Math.min(Math.max(R * 3.6, 0.32), 30);
    const dir = new THREE.Vector3(-0.3, 0.5, 1).normalize();
    const look = OUTPUT_CENTER.clone().add(new THREE.Vector3(-R * 0.15, out.height * 0.35, 0));
    return { pos: look.clone().addScaledVector(dir, dist), look };
  }
  function setCamera(view, dur = 1.6) {
    const camera = self.camera;
    if (dur <= 0) {
      camera.position.copy(view.pos);
      s.look.copy(view.look);
      camera.lookAt(s.look);
      s.cam = { t: 1, dur: 1, fromPos: view.pos.clone(), toPos: view.pos.clone(), fromLook: view.look.clone(), toLook: view.look.clone() };
      return;
    }
    s.cam = { t: 0, dur, fromPos: camera.position.clone(), toPos: view.pos, fromLook: s.look.clone(), toLook: view.look };
  }

  // ---- levels ----------------------------------------------------------------
  function level() {
    return s.lv || LEVELS[s.levelIndex];
  }

  /** This year's plan, worked out from last year's: ratchets, carried-over quotas, memo text. */
  function resolveLevel(i) {
    const base = LEVELS[i];
    const lv = { ...base, quota: { ...base.quota } };
    const prev = s.results[i - 1];
    const vars = {};
    if (lv.quota.sameAsLast && prev?.finalQuota) lv.quota = { ...prev.finalQuota };
    if (lv.quota.ratchet) {
      const same = prev && prev.quotaType === lv.quota.type && prev.measured > 0;
      if (same) lv.quota.target = +(prev.measured * lv.quota.ratchet).toPrecision(3);
      vars.last = fmtMeasured(lv.quota.type, same ? prev.measured : lv.quota.target / lv.quota.ratchet);
    }
    vars.target = fmtMeasured(lv.quota.type, lv.quota.target);
    lv.memo = { ...base.memo, body: base.memo.body.map((b) => fill(b, vars)) };
    return lv;
  }

  function openPanel(lv) {
    s.phase = 'plan';
    s.panel = createPanel(s.ctx.layer, lv, {
      onProduce: produce,
      onTick: () => s.ctx?.audio.clack(),
    });
  }

  function renderRecord() {
    s.hud.record.replaceChildren(
      ...LEVELS.map((_, i) => {
        const r = s.results[i];
        const cls = r ? `nq-rec-star g${r.grade}` : i === s.levelIndex ? 'nq-rec-star current' : 'nq-rec-star';
        return el(`span.${cls.split(' ').join('.')}`, { title: r ? `Year ${i + 1}: ${r.verdictLabel}` : `Year ${i + 1}` }, r ? (r.grade ? '★' : '✕') : String(i + 1));
      }),
    );
  }

  function startLevel(i) {
    const { layer, scope } = s.ctx;
    s.levelIndex = i;
    s.lv = resolveLevel(i);
    s.changed = false;
    const lv = level();
    s.output?.dispose();
    s.output = null;
    s.phase = 'memo';
    s.hud.title.textContent = `YEAR ${i + 1} · ${lv.title}`;
    renderRecord();
    s.refs.board.draw({ year: `YEAR ${i + 1}`, title: lv.title, plan: planLabel(lv.quota).toUpperCase() });
    s.coilsStart = Math.min(s.refs.coils.length, Math.ceil(lv.steelKg / KG_PER_COIL));
    s.refs.coils.forEach((c, k) => (c.visible = k < s.coilsStart));
    s.refs.worker.position.set(OUTPUT_CENTER.x - 2, 0, OUTPUT_CENTER.z + 2);
    s.refs.worker.rotation.y = 0.4;
    setCamera(planView(), i === 0 ? 0 : 1.8);

    const m = memo(layer, {
      no: lv.memo.no,
      to: 'Director, Nail Factory No. 4',
      from: 'Ministry of Light Industry, Directorate of Fasteners',
      subject: lv.memo.subject,
      body: lv.memo.body,
      stamp: 'BINDING',
      buttons: [{ label: 'BEGIN THE YEAR', value: true, variant: 'red' }],
    });
    m.done.then(() => {
      if (scope.disposed) return;
      openPanel(lv);
    });
  }

  /** The Plan is revised at the moment the Director commits to it. */
  function revise(lv, result) {
    const { layer, scope, audio } = s.ctx;
    const c = lv.change;
    s.changed = true;
    s.phase = 'memo';
    s.panel.destroy();
    s.panel = null;
    audio.ding();
    const m = memo(layer, {
      no: c.memo.no,
      to: 'Director, Nail Factory No. 4',
      from: 'Ministry of Light Industry, Directorate of Fasteners',
      subject: c.memo.subject,
      body: c.memo.body,
      stamp: c.memo.stamp,
      buttons: [{ label: 'REVISE THE PLAN', value: true, variant: 'red' }],
    });
    m.done.then(() => {
      if (scope.disposed) return;
      s.lv = { ...lv, quota: { ...c.quota } };
      s.refs.board.draw({ year: `YEAR ${s.levelIndex + 1}`, title: lv.title, plan: planLabel(s.lv.quota).toUpperCase() });
      openPanel({ ...s.lv, start: { lengthCm: result.lengthCm, diameterMm: result.diameterMm, count: result.count, perCrate: result.perCrate } });
    });
  }

  function produce(result) {
    if (s.phase !== 'plan') return;
    if (level().change && !s.changed) return revise(level(), result);
    const { audio } = s.ctx;
    audio.unlock();
    s.result = result;
    s.panel.destroy();
    s.panel = null;
    s.phase = 'production';
    s.output = buildOutput(result, OUTPUT_CENTER);
    s.output.setProgress(0);
    self.scene.add(s.output.group);
    const R = Math.max(s.output.radius, 0.02);
    s.refs.worker.position.set(OUTPUT_CENTER.x - R - 0.35, 0, OUTPUT_CENTER.z - R * 0.25);
    s.refs.worker.rotation.y = Math.PI / 2 - 0.25;
    const slams = Math.max(1, Math.min(result.strikes, 12));
    s.prod = { t: 0, slams, per: 0.46, done: 0, used: result.totalKg / level().steelKg };
    setCamera(pressView(), 1.0);
    audio.ding();
  }

  function tickProduction(dt) {
    const p = s.prod;
    const { press, sparks, coils } = s.refs;
    p.t += dt;
    const start = 1.0; // let the camera arrive
    const local = p.t - start;
    if (local < 0) return;
    const k = Math.floor(local / p.per);
    const u = (local % p.per) / p.per;
    if (k < p.slams) {
      // ram: slam down fast, rise slowly
      const y = u < 0.22 ? press.ramUp - (press.ramUp - press.ramDown) * (u / 0.22) ** 2 : press.ramDown + (press.ramUp - press.ramDown) * Math.min(1, (u - 0.22) / 0.7);
      press.ram.position.y = y;
      if (k >= p.done && u >= 0.22) {
        p.done = k + 1;
        s.ctx.audio.stamp();
        s.ctx.audio.clack();
        emitSparks(sparks, new THREE.Vector3(PRESS_POS.x, 1.4, PRESS_POS.z));
        const prog = p.done / p.slams;
        s.output.setProgress(prog);
        const remaining = Math.round(s.coilsStart * (1 - p.used * prog));
        coils.forEach((c, i) => (c.visible = i < remaining));
      }
    } else {
      press.ram.position.y = press.ramUp;
      s.output.setProgress(1);
      s.phase = 'reveal';
      setCamera(outputView(s.output), 2.4);
    }
  }

  function evaluate() {
    const { layer, audio, save, scope } = s.ctx;
    const lv = level();
    const r = s.result;
    const v = verdict(r.fulfilment);
    const record = {
      levelId: lv.id,
      title: lv.title,
      quotaType: lv.quota.type,
      target: lv.quota.target,
      measured: r.measured,
      fulfilment: r.fulfilment,
      grade: v.grade,
      verdictLabel: v.label,
      lengthCm: r.lengthCm,
      diameterMm: r.diameterMm,
      count: r.count,
      usable: r.usable,
      kind: r.kind,
      satisfaction: satisfaction(r),
      finalQuota: lv.quota,
    };
    s.results[s.levelIndex] = record;
    s.results.length = s.levelIndex + 1;
    const next = s.levelIndex + 1;
    save.setGame(GAME_ID, { levelIndex: next, results: s.results });
    renderRecord();
    s.refs.board.draw({
      year: `YEAR ${s.levelIndex + 1}`,
      title: lv.title,
      plan: planLabel(lv.quota).toUpperCase(),
      fact: lv.quota.type === 'need' ? 'NOT MEASURED' : fmtMeasured(lv.quota.type, r.measured).toUpperCase(),
      pct: r.fulfilment * 100,
    });

    const qt = QUOTA_TEXT[lv.quota.type];
    const last = next >= LEVELS.length;
    // let the player look at what they made before the paperwork arrives
    scope.timeout(() => {
      audio.ding();
      const m = memo(layer, {
        no: `${lv.memo.no}-R`,
        to: 'Director, Nail Factory No. 4',
        from: 'State Acceptance Commission',
        subject: `Acceptance of output, Year ${s.levelIndex + 1}`,
        body: [
          ...acceptance(lv, r, qt),
          el('span.nq-remark', {}, `Overheard on the factory floor: "${pick(FLOOR_REMARKS[r.kind] || FLOOR_REMARKS.thick)}"`),
        ],
        stamp: v.stamp,
        buttons: [{ label: last ? 'COMPILE THE TEN-YEAR REPORT' : `PROCEED TO YEAR ${next + 1}`, value: true, variant: 'red' }],
      });
      m.node.classList.add('nq-eval', `g${v.grade}`);
      m.done.then(() => {
        if (scope.disposed) return;
        if (last) finish();
        else startLevel(next);
      });
    }, 1400);
  }

  function acceptance(lv, r, qt) {
    const q = lv.quota;
    if (q.type === 'need') {
      return [
        'Indicator: none could be devised. Fulfilment: recorded as 100%, as a precaution.',
        `Output consisted of ${fmtInt(r.count)} nail(s). Nobody counted them. This figure was supplied by the factory and is therefore not an indicator.`,
      ];
    }
    if (r.parts) {
      return [
        ...r.parts.map((pt) => `${pt.by}: ${QUOTA_TEXT[pt.type].metric.toLowerCase()}, plan ${fmtMeasured(pt.type, pt.target)}, delivered ${fmtMeasured(pt.type, pt.measured)} (${fmtNum(pt.fulfilment * 100)}%).`),
        `Fulfilment, averaged between the two offices: ${fmtNum(r.fulfilment * 100)}%. The offices have been informed of the average, and not of each other.`,
      ];
    }
    const lines = [`Indicator: ${qt.metric}. Plan: ${fmtMeasured(q.type, q.target)}. Delivered: ${fmtMeasured(q.type, r.measured)}.`];
    if (r.inspection) {
      const no = fmtInt(1 + Math.floor(Math.random() * r.count));
      lines.push(r.inspection.pass ? `The Inspector selected nail No. ${no} at random. It was a nail.` : `The Inspector selected nail No. ${no} at random. It could not be identified as a nail. The output has been reclassified as scrap, by weight.`);
    }
    lines.push(`Fulfilment: ${fmtNum(r.fulfilment * 100)}%. Output consisted of ${fmtInt(r.count)} nail(s). Further characteristics of the output were not assessed, as they are not indicators.`);
    return lines;
  }

  async function finish() {
    const { layer, save, audio, scope, manager } = s.ctx;
    s.phase = 'report';
    const years = s.results.length;
    await showReport(layer, {
      title: ENDINGS.title,
      subtitle: fill(ENDINGS.subtitle, { years }),
      results: s.results,
    });
    if (scope.disposed) return;
    const { official, citizens } = scores(s.results);
    const key = official >= 100 && citizens >= 50 ? 'both' : official >= 100 ? 'triumph' : citizens >= 50 ? 'people' : 'neither';
    const ending = ENDINGS.newspaper[key];
    const vars = { official: fmtNum(official), citizens: fmtNum(citizens), years };
    save.awardMedal(GAME_ID, { official: Math.round(official), citizens: Math.round(citizens), ending: key });
    // the Plan is the pass mark; what the citizens got does not enter into it
    const runLabel = `Two Five-Year Plans: ${Math.round(official)}%`;
    if (official >= 100) save.recordSuccess(GAME_ID, runLabel);
    else save.recordFailure(GAME_ID, runLabel);
    save.setGame(GAME_ID, { levelIndex: 0, results: [], lastEnding: key });
    audio.fanfare();
    const photo = manager.snapshot();
    const np = showNewspaper(layer, {
      headline: fill(ending.headline, vars),
      deck: fill(ending.deck, vars),
      photo,
      caption: 'The final year\'s output, photographed by the Ministry for the record.',
      columns: ending.columns.map((c) => fill(c, vars)),
      sidebar: {
        title: 'THE PLAN IN FIGURES',
        items: [
          `Official success: ${fmtNum(official)}%`,
          `Years completed: ${years}`,
          `Nails a carpenter could use: ${fmtInt(s.results.reduce((a, r) => a + r.usable, 0))}`,
          'Questions asked: 0',
        ],
      },
      closeLabel: 'RETURN TO THE MINISTRY',
    });
    await np.done;
    if (!scope.disposed) s.ctx.goTo('hub');
  }

  return self;
}
