// PRAVDA EDITOR — scene module. Directives arrive, wires arrive, the presses roll at seven.
import * as THREE from 'three';
import './pravda-editor.css';
import { fontsReady } from '../../shared/fonts.js';
import { el, button, memo, toast } from '../../shared/ui.js';
import { showNewspaper } from '../../shared/newspaper.js';
import { ACTS, COMMON_TILES, START_METERS, DAY_SECONDS, STANCE_LABELS, REACTIONS, ENDINGS, CROSSWORD_WORD, REVISION_EFFECTS } from './stories.js';
import { SLOTS, SLOT_LABELS, stanceOf, claimOf, contradiction, headlineText, evaluateDay, clampMeters, endingFor, crosswordRisk, BELIEF_THRESHOLD } from './rules.js';
import { buildDesk, updateSmoke } from './desk.js';

const GAME_ID = 'pravda-editor';
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export default function createPravdaEditor() {
  const s = {
    ctx: null,
    refs: null,
    act: 0,
    day: 0,
    meters: { ...START_METERS },
    notebook: [],
    euphUses: {},
    pages: [],
    placements: {},
    selected: null,
    tiles: [],
    timeLeft: DAY_SECONDS,
    phase: 'idle',
    ui: {},
    look: { x: 0, y: 0, tx: 0, ty: 0 },
    ring: 0,
    manTarget: null,
    lastWarn: false,
    crossword: null, // id of a buried story hidden in tonight's crossword
    crosswords: 0,
    crisis: { heard: 0, ignored: 0, hidden: 0 },
  };

  const self = {
    scene: null,
    camera: null,

    async init(ctx) {
      s.ctx = ctx;
      const { scope, layer, save } = ctx;
      await fontsReady();
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0e0d0c);
      const camera = new THREE.PerspectiveCamera(55, 1, 0.02, 40);
      camera.position.set(0, 1.3, 0.45);
      self.scene = scene;
      self.camera = camera;
      s.refs = buildDesk(scene);

      scope.on(ctx.renderer.domElement, 'pointermove', (e) => {
        s.look.tx = (e.clientX / window.innerWidth - 0.5) * 2;
        s.look.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      });

      buildHud();
    },

    async start() {
      const { scope, layer, save } = s.ctx;
      const saved = save.game(GAME_ID);
      if (saved.inProgress && (saved.day > 0 || saved.act > 0)) {
        const m = memo(layer, {
          no: 'P-0/00',
          to: 'Comrade Editor',
          from: 'Personnel Department',
          subject: 'You are still employed',
          body: [`Our records show you have edited ${saved.pages?.length || saved.day} issue(s) of the current run.`, 'You may continue, or begin again with a clean record. A clean record is always available.'],
          buttons: [
            { label: 'BEGIN AGAIN', value: 'new' },
            { label: 'CONTINUE', value: 'continue', variant: 'red' },
          ],
        });
        const choice = await m.done;
        if (scope.disposed) return;
        if (choice === 'continue') Object.assign(s, { act: saved.act, day: saved.day, meters: saved.meters, notebook: saved.notebook, euphUses: saved.euphUses, pages: saved.pages, crosswords: saved.crosswords || 0, crisis: saved.crisis || s.crisis });
      }
      s.pages.forEach(() => s.refs.addPage());
      startDay();
    },

    update(dt, time) {
      if (!s.refs) return;
      const cam = self.camera;
      s.look.x += (s.look.tx - s.look.x) * Math.min(1, dt * 3);
      s.look.y += (s.look.ty - s.look.y) * Math.min(1, dt * 3);
      const target = new THREE.Vector3(s.look.x * 0.55, 0.92 - s.look.y * 0.25, -1.6);
      cam.position.set(s.look.x * 0.04, 1.42 + Math.sin(time * 0.8) * 0.004, 0.6);
      cam.lookAt(target);

      updateSmoke(s.refs.smoke, dt);

      // phone ringing: the handset rattles
      if (s.ring > 0) {
        s.ring -= dt;
        s.refs.phone.handset.position.y = 0.12 + (Math.sin(time * 60) > 0 ? 0.008 : 0);
        s.refs.phone.handset.rotation.z = Math.sin(time * 47) * 0.05;
      } else {
        s.refs.phone.handset.position.y = 0.12;
        s.refs.phone.handset.rotation.z = 0;
      }

      // the man in the grey coat drifts to wherever he has decided to stand
      if (s.manTarget) {
        const man = s.refs.man;
        man.visible = true;
        man.position.lerp(s.manTarget, Math.min(1, dt * 0.8));
      }

      // deadline
      if (s.phase === 'desk') {
        s.timeLeft -= dt;
        if (s.timeLeft <= 30 && !s.lastWarn) {
          s.lastWarn = true;
          ringPhone(1.5);
          toast(s.ctx.layer, 'The print room is waiting. Thirty seconds.', 2600);
        }
        if (s.timeLeft <= 0) {
          s.timeLeft = 0;
          toast(s.ctx.layer, 'THE PRESSES ROLL. Whatever is on the page is the truth.', 3000);
          sendToPress();
        }
      }
      const t = Math.max(0, s.timeLeft);
      const minutes = 60 * (1 - t / DAY_SECONDS);
      s.refs.clock.minute.rotation.z = -(minutes / 60) * Math.PI * 2;
      s.refs.clock.hour.rotation.z = -((6 + minutes / 60) / 12) * Math.PI * 2;
      if (s.ui.clock) {
        const mm = Math.floor(t / 60);
        const ss = Math.floor(t % 60);
        s.ui.clock.textContent = `${mm}:${String(ss).padStart(2, '0')}`;
        s.ui.clockWrap.classList.toggle('urgent', t <= 30 && s.phase === 'desk');
      }
    },

    dispose() {
      s.refs = null;
      s.ctx = null;
      s.ui = {};
      s.phase = 'disposed';
    },
  };

  // ---- data helpers ----------------------------------------------------------
  const act = () => ACTS[s.act];
  const day = () => act().days[s.day];
  const wire = (id) => day().wires.find((w) => w.id === id);
  const inSlot = (slot) => Object.keys(s.placements).filter((id) => s.placements[id] === slot);
  const headlineStory = () => wire(inSlot('headline')[0]);

  function persist(extra = {}) {
    s.ctx.save.setGame(GAME_ID, {
      inProgress: true,
      act: s.act,
      day: s.day,
      meters: s.meters,
      notebook: s.notebook,
      euphUses: s.euphUses,
      pages: s.pages,
      crosswords: s.crosswords,
      crisis: s.crisis,
      ...extra,
    });
  }

  function ringPhone(seconds = 2) {
    s.ring = seconds;
    const { audio } = s.ctx;
    for (let i = 0; i < Math.ceil(seconds / 0.7); i++) setTimeout(() => s.ctx && audio.ding(), i * 700);
  }

  // ---- HUD ---------------------------------------------------------------------
  function meter(label, key) {
    const fill = el('div.pe-meter-fill');
    const node = el(`div.pe-meter.pe-${key}`, { title: label }, [el('div.pe-meter-l', {}, label), el('div.pe-meter-bar', {}, fill)]);
    s.ui[`m_${key}`] = fill;
    return node;
  }

  function buildHud() {
    const { layer } = s.ctx;
    s.ui.dayLabel = el('div.pe-day');
    s.ui.clock = el('span.pe-clock-t', {}, '3:00');
    s.ui.clockWrap = el('div.pe-clock', {}, [el('span.pe-clock-l', {}, 'PRESSES ROLL IN'), s.ui.clock]);
    s.ui.top = el('header.pe-top', {}, [
      el('div.pe-mast', {}, [el('div.pe-mast-k', {}, 'EDITOR-IN-CHIEF'), el('div.pe-mast-t', {}, 'PRAVDA'), s.ui.dayLabel]),
      meter('PARTY APPROVAL', 'approval'),
      meter('CREDIBILITY', 'credibility'),
      s.ui.clockWrap,
      el('div.pe-top-btns', {}, [
        button('NOTEBOOK', openNotebook, { variant: 'small' }),
        button('FRONT PAGES', openStack, { variant: 'small' }),
        button('LOBBY', () => s.ctx.goTo('hub'), { variant: 'small' }),
      ]),
    ]);
    s.ui.wires = el('section.pe-wires', { 'aria-label': 'Wire reports' });
    s.ui.dummy = el('section.pe-dummy', { 'aria-label': 'Front page' });
    s.ui.builder = el('section.pe-builder', { 'aria-label': 'Headline builder' });
    layer.append(s.ui.top, s.ui.wires, s.ui.dummy, s.ui.builder);
    renderMeters();
  }

  function renderMeters(delta) {
    for (const k of ['approval', 'credibility']) {
      const f = s.ui[`m_${k}`];
      f.style.width = `${s.meters[k]}%`;
      f.classList.toggle('low', s.meters[k] < 30);
      if (delta && delta[k]) {
        const n = el(`span.pe-delta.${delta[k] > 0 ? 'up' : 'down'}`, {}, `${delta[k] > 0 ? '+' : ''}${delta[k]}`);
        f.parentElement.parentElement.append(n);
        setTimeout(() => n.remove(), 2600);
      }
    }
    // the man in the grey coat
    const a = s.meters.approval;
    if (a < 25) s.manTarget = new THREE.Vector3(1.0, 0, -1.75);
    else if (a < 40) s.manTarget = new THREE.Vector3(1.15, 0, -2.45);
    else {
      s.manTarget = null;
      s.refs.man.visible = false;
      s.refs.man.position.set(1.15, 0, -2.9);
    }
  }

  // ---- a day at the desk ---------------------------------------------------------
  function startDay() {
    const { layer, scope } = s.ctx;
    const d = day();
    s.placements = {};
    s.selected = null;
    s.tiles = [];
    s.timeLeft = DAY_SECONDS;
    s.lastWarn = false;
    s.crossword = null;
    s.phase = 'directives';
    if (d.reverse && !s.notebook.some((e) => e.official && e.date === d.date && e.text === d.reverse.text)) {
      // Official Reality changes, and has always been this way
      for (const e of s.notebook) if (e.topic === d.reverse.topic && e.claim !== d.reverse.claim) e.superseded = true;
      s.notebook.push({ topic: d.reverse.topic, claim: d.reverse.claim, text: d.reverse.text, date: d.date, official: true });
    }
    s.refs.calendar.draw(d.date);
    s.refs.setSeason(d.season);
    s.ui.dayLabel.textContent = `${act().title.split('·')[0].trim()} · ${d.date}`;
    renderDesk();

    const ai = act().intro;
    const intro =
      s.day === 0 && ai && s.act > 0
        ? [
            memo(layer, { no: ai.no, to: 'Comrade Editor-in-Chief', from: ai.from, subject: ai.subject, body: ai.body, stamp: ai.stamp, buttons: [{ label: ai.button, value: true, variant: 'red' }] }).done,
          ]
        : s.act === 0 && s.day === 0
        ? [
            memo(layer, {
              no: 'P-1/001',
              to: 'Comrade Editor-in-Chief',
              from: 'Department of Agitation and Propaganda',
              subject: 'Your appointment',
              body: [
                'Congratulations on your appointment. Your predecessor has been reassigned to a position that does not exist.',
                'Each evening, wire reports arrive. Choose what goes on the front page, what is buried on page 6, and what is not news. Build each headline from the approved words.',
                'The newspaper remembers. Whatever you print becomes Official Reality, and Official Reality must not contradict itself.',
              ],
              stamp: 'APPOINTED',
              buttons: [{ label: 'TAKE YOUR SEAT', value: true, variant: 'red' }],
            }).done,
          ]
        : [];
    Promise.all(intro)
      .then(() => (d.revise && !scope.disposed ? reviseArchive(d.revise) : null))
      .then(() => {
      if (scope.disposed) return;
      ringPhone(2.1);
      const m = memo(layer, {
        no: `CC-${s.day + 1}`,
        to: 'Editor, Pravda',
        from: 'Central Committee (by telephone)',
        subject: `Directives for the edition of ${d.date}`,
        body: d.directives,
        stamp: 'DIRECTIVE',
        buttons: [{ label: 'UNDERSTOOD', value: true, variant: 'red' }],
      });
      m.done.then(() => {
        if (scope.disposed) return;
        s.phase = 'desk';
        s.ctx.audio.clack();
      });
    });
  }

  function renderDesk() {
    const d = day();
    // wires + directives
    const cards = d.wires
      .filter((w) => !s.placements[w.id])
      .map((w) =>
        el(
          `button.pe-wire${s.selected === w.id ? '.selected' : ''}`,
          { type: 'button', onclick: () => selectWire(w.id), 'aria-pressed': String(s.selected === w.id) },
          [
            el('div.pe-wire-src', {}, [w.source, w.visible ? el('span.pe-eye', { title: 'Readers can see this for themselves' }, '◉ PUBLIC KNOWLEDGE') : null]),
            el('div.pe-wire-slug', {}, w.slug),
            el('div.pe-wire-text', {}, w.text),
          ],
        ),
      );
    s.ui.wires.replaceChildren(
      el('div.pe-directives', {}, [el('div.pe-dir-h', {}, 'DIRECTIVES'), ...d.directives.map((t) => el('div.pe-dir', {}, t))]),
      el('div.pe-wires-h', {}, cards.length ? `WIRE REPORTS · ${cards.length}` : 'ALL WIRES PLACED'),
      ...cards,
    );

    // the front-page dummy
    const slotNode = (slot) => {
      const ids = inSlot(slot);
      const multi = slot === 'page6' || slot === 'bin';
      const chips = ids.map((id) =>
        el('button.pe-chip', { type: 'button', onclick: (e) => { e.stopPropagation(); unplace(id); }, title: 'Return to the wire tray' }, [wire(id).slug, el('span.pe-x', {}, ' ✕')]),
      );
      let content = chips;
      if (slot === 'headline' && ids.length) {
        content = [
          el('div.pe-hl-text', {}, s.tiles.length ? headlineText(s.tiles) : '[ BUILD THE HEADLINE BELOW ]'),
          el('div.pe-hl-about', {}, ['About: ', ...chips]),
        ];
      }
      return el(
        `div.pe-slot.pe-slot-${slot}${s.selected ? '.armed' : ''}`,
        { role: 'button', tabindex: '0', onclick: () => place(slot), onkeydown: (e) => (e.key === 'Enter' || e.key === ' ') && place(slot), 'aria-label': `Place in ${SLOT_LABELS[slot]}` },
        [el('div.pe-slot-l', {}, SLOT_LABELS[slot]), ...(content.length ? content : [el('div.pe-slot-empty', {}, multi ? 'Any number of stories' : 'Empty')])],
      );
    };
    const pressBtn = button('SEND TO PRESS', () => sendToPress(), { variant: 'red' });
    pressBtn.disabled = !(headlineStory() && s.tiles.length >= 2) || s.phase !== 'desk';
    s.ui.dummy.replaceChildren(
      el('div.pe-dummy-mast', {}, 'PRAVDA'),
      el('div.pe-dummy-date', {}, `${d.date} ${act().year || 1978} · EVENING EDITION`),
      slotNode('headline'),
      slotNode('lead'),
      slotNode('fold'),
      el('div.pe-dummy-row', {}, [slotNode('page6'), slotNode('bin')]),
      crosswordNode(),
      pressBtn,
    );
    renderBuilder();
  }

  // ---- the crossword: a buried story, hidden for readers who know how to look ----------
  function crosswordCandidates() {
    return day().wires.filter((w) => w.truth === 'bad' && (s.placements[w.id] === 'page6' || s.placements[w.id] === 'bin'));
  }

  function crosswordNode() {
    if (!act().crossword) return null;
    const cands = crosswordCandidates();
    if (s.crossword && !cands.some((w) => w.id === s.crossword)) s.crossword = null;
    const cur = cands.find((w) => w.id === s.crossword);
    const risk = Math.round(crosswordRisk(s.meters.approval, s.crosswords) * 100);
    const b = el(
      `button.pe-cross${cur ? '.on' : ''}`,
      {
        type: 'button',
        disabled: !cands.length || s.phase !== 'desk',
        title: 'Hide the truth of a buried story in the page 6 crossword',
        onclick: () => {
          const i = cands.findIndex((w) => w.id === s.crossword);
          s.crossword = i + 1 < cands.length ? cands[i + 1].id : null;
          s.ctx.audio.clack();
          renderDesk();
        },
      },
      [
        el('span.pe-cross-k', {}, 'CROSSWORD · P. 6'),
        el('span.pe-cross-v', {}, cur ? `14 ACROSS: "${CROSSWORD_WORD(cur)}" (from ${cur.slug})` : cands.length ? 'Ordinary clues. Click to hide a buried story in it.' : 'Bury or bin a bad story to hide it here.'),
        cur ? el('span.pe-cross-risk', {}, `Chance the Censor solves it: ${risk}%`) : null,
      ],
    );
    return b;
  }

  // ---- revising the archive: unpersons, and allies who were always enemies --------------
  function reviseArchive(rv) {
    const { layer, scope } = s.ctx;
    const term = rv.term.toLowerCase();
    const mentions = (p) => [p.headline, p.deck, ...(p.columns || [])].join(' ').toLowerCase().includes(term);
    const hits = s.pages.filter((p) => mentions(p) && !p.revised);
    if (!hits.length) {
      s.meters = clampMeters({ ...s.meters, approval: s.meters.approval + 3 });
      renderMeters({ approval: 3 });
      return memo(layer, { no: `ARC-${s.day + 1}`, to: 'Comrade Editor', from: 'The Archive', subject: `Editions mentioning ${rv.term}`, body: [rv.why, rv.clean], stamp: 'CLEAN', buttons: [{ label: 'PROCEED', value: true, variant: 'red' }] }).done;
    }
    return new Promise((resolve) => {
      const choice = new Map();
      const rows = hits.map((p) => {
        const btns = Object.keys(REVISION_EFFECTS).map((k) =>
          el(`button.pe-rev-b`, {
            type: 'button',
            'data-k': k,
            onclick: () => {
              choice.set(p, k);
              s.ctx.audio.clack();
              btns.forEach((b) => b.classList.toggle('on', b.dataset.k === k));
              done.disabled = choice.size < hits.length;
            },
          }, { rewrite: 'REWRITE THE ARCHIVE', correct: 'PRINT A CORRECTION', leave: 'LEAVE IT' }[k]),
        );
        return el('div.pe-rev-row', {}, [el('div.pe-rev-date', {}, p.date), el('div.pe-rev-h', {}, p.headline), el('div.pe-rev-btns', {}, btns)]);
      });
      const done = button('FILE THE REVISIONS', () => {
        const delta = { approval: 0, credibility: 0, conscience: 0 };
        for (const [p, k] of choice) {
          const e = REVISION_EFFECTS[k];
          for (const m of Object.keys(delta)) delta[m] += e[m];
          if (k === 'rewrite') {
            const fix = (t) => {
              let out = t;
              for (const [from, to] of rv.replace || []) out = out.replace(new RegExp(`\\b${from}('S)?\\b`, 'gi'), to);
              return out.replace(/\s{2,}/g, ' ').replace(/\s([.,!])/g, '$1').trim();
            };
            p.headline = rv.rewriteTo || fix(p.headline) || '[HEADLINE WITHDRAWN]';
            p.deck = fix(p.deck);
            p.columns = (p.columns || []).map(fix);
          }
          if (k === 'correct') p.columns = [...(p.columns || []), `CORRECTION: this edition referred to ${rv.term.charAt(0) + rv.term.slice(1).toLowerCase()} in terms that were, at the time, correct.`];
          if (k !== 'leave') p.revised = true;
        }
        for (const e of s.notebook) {
          if (!e.text.toLowerCase().includes(term) && !(rv.topic && e.topic === rv.topic)) continue;
          if (rv.claim && e.claim !== rv.claim) e.superseded = true;
          for (const [from, to] of rv.replace || []) e.text = e.text.replace(new RegExp(`\\b${from}('S)?\\b`, 'gi'), to).trim();
        }
        if (rv.claim) s.notebook.push({ topic: rv.topic, claim: rv.claim, text: rv.rewriteTo || rv.term, date: day().date, official: true });
        const before = { ...s.meters };
        s.meters = clampMeters({ approval: s.meters.approval + delta.approval, credibility: s.meters.credibility + delta.credibility, conscience: s.meters.conscience + delta.conscience });
        renderMeters({ approval: s.meters.approval - before.approval, credibility: s.meters.credibility - before.credibility });
        s.ctx.audio.stamp();
        wrap.remove();
        resolve();
      }, { variant: 'red' });
      done.disabled = true;
      const wrap = el('div.memo-wrap', {}, [
        el('div.pe-modal.pe-rev.paper', { role: 'dialog', 'aria-label': 'Revise the archive' }, [
          el('div.pe-modal-h', {}, `THE ARCHIVE · EDITIONS MENTIONING ${rv.term}`),
          el('p.pe-nb-intro', {}, rv.why),
          el('p.pe-rev-key', {}, 'Rewrite: the edition is quietly reprinted, and always said this. Correction: a notice admits the edition existed. Leave it: the edition stands, and so do you, for now.'),
          ...rows,
          el('div.memo-actions', {}, done),
        ]),
      ]);
      layer.append(wrap);
      if (scope.disposed) resolve();
    });
  }

  function selectWire(id) {
    if (s.phase !== 'desk') return;
    s.selected = s.selected === id ? null : id;
    s.ctx.audio.click();
    renderDesk();
  }

  function place(slot) {
    if (s.phase !== 'desk' || !s.selected) return;
    if (slot === 'headline' || slot === 'lead' || slot === 'fold') {
      for (const id of inSlot(slot)) delete s.placements[id];
      if (slot === 'headline') s.tiles = [];
    }
    s.placements[s.selected] = slot;
    s.selected = null;
    s.ctx.audio.stamp();
    renderDesk();
  }

  function unplace(id) {
    if (s.phase !== 'desk') return;
    if (s.placements[id] === 'headline') s.tiles = [];
    delete s.placements[id];
    s.ctx.audio.click();
    renderDesk();
  }

  function renderBuilder() {
    const story = headlineStory();
    if (!story || s.phase !== 'desk') {
      s.ui.builder.classList.remove('open');
      s.ui.builder.replaceChildren();
      return;
    }
    s.ui.builder.classList.add('open');
    const palette = [...story.tiles, ...COMMON_TILES];
    const stance = s.tiles.length ? stanceOf(s.tiles, story) : null;
    const clash = stance ? contradiction(s.notebook, story.topic, claimOf(stance, story)) : null;
    const worn = s.tiles.some((t) => t.k === 'euph') ? Object.entries(s.euphUses).find(([p, n]) => n >= 2 && p === s.tiles.filter((t) => t.k === 'euph').map((t) => t.w).join(' ')) : null;

    s.ui.builder.replaceChildren(
      el('div.pe-b-head', {}, [el('span', {}, `HEADLINE · ${story.slug}`), el('span.pe-b-hint', {}, 'Click words to set them in type. Click a set word to remove it.')]),
      el(
        'div.pe-strip',
        { 'aria-label': 'Headline' },
        s.tiles.length
          ? s.tiles.map((t, i) => el(`button.pe-tile.set.k-${t.k}`, { type: 'button', onclick: () => removeTile(i) }, t.w))
          : [el('span.pe-strip-empty', {}, 'Set at least two words.')],
      ),
      el('div.pe-reads', {}, [
        stance ? el('span.pe-stance', {}, `READS AS: ${STANCE_LABELS[stance]}`) : null,
        clash ? el('span.pe-warn', {}, `⚠ CONTRADICTS OFFICIAL REALITY: "${clash.text}" (${clash.date})`) : null,
        worn ? el('span.pe-warn', {}, `⚠ READERS HAVE DECODED "${worn[0]}"`) : null,
      ]),
      el(
        'div.pe-palette',
        {},
        palette.map((t) => el(`button.pe-tile.k-${t.k}`, { type: 'button', onclick: () => addTile(t), disabled: s.tiles.length >= 7 || (s.tiles.includes(t) && t.k !== 'link') }, t.w)),
      ),
    );
  }

  function addTile(t) {
    if (s.tiles.length >= 7) return;
    s.tiles.push(t);
    s.ctx.audio.clack();
    const k = s.refs.typewriter.keys[Math.floor(Math.random() * s.refs.typewriter.keys.length)];
    k.position.y -= 0.006;
    setTimeout(() => (k.position.y += 0.006), 90);
    renderDesk();
  }

  function removeTile(i) {
    s.tiles.splice(i, 1);
    s.ctx.audio.click();
    renderDesk();
  }

  // ---- presses roll ------------------------------------------------------------------
  async function sendToPress() {
    if (s.phase !== 'desk') return;
    s.phase = 'press';
    const { layer, audio, scope } = s.ctx;
    const d = day();
    const story = headlineStory();
    audio.ding();
    renderDesk();

    let result;
    if (!story) {
      result = { delta: { approval: -15, credibility: -5, conscience: 0 }, notes: [{ kind: 'partyAngry', text: 'The front page went out without a headline.' }], notebookAdds: [], euphUses: s.euphUses, stance: null };
      for (const w of d.wires) if (!s.placements[w.id]) s.placements[w.id] = 'bin';
    } else {
      const cw = s.crossword && act().crossword ? { id: s.crossword, caught: Math.random() < crosswordRisk(s.meters.approval, s.crosswords) } : null;
      if (cw) s.crosswords++;
      result = evaluateDay(d, s.day, s.placements, s.tiles, { notebook: s.notebook, euphUses: s.euphUses, meters: s.meters, crossword: cw });
    }
    if (result.crisis) for (const k of Object.keys(s.crisis)) s.crisis[k] += result.crisis[k];

    // the front page as printed
    const leadStory = wire(inSlot('lead')[0]);
    const foldStory = wire(inSlot('fold')[0]);
    const page = {
      date: `${d.date} ${act().year || 1978}`,
      headline: story ? headlineText(s.tiles) || story.slug : 'NO HEADLINE TODAY',
      deck: leadStory ? leadStory.slug : 'All is well',
      columns: [leadStory?.print, foldStory ? `${foldStory.slug}. ${foldStory.print}` : null].filter(Boolean),
      sidebar: { title: 'ALSO IN THIS ISSUE', items: inSlot('page6').map((id) => `p. 6 — ${wire(id).slug}`).concat(['p. 4 — Letters of gratitude'], s.crossword && act().crossword ? [`p. 6 — Crossword (14 across: ${CROSSWORD_WORD(wire(s.crossword)).replace(/ /g, '').length} letters)`] : []) },
    };
    if (!page.columns.length) page.columns = ['The editors are pleased to report that there is nothing further to report.'];
    s.pages.push(page);
    s.refs.addPage();

    const np = showNewspaper(layer, { masthead: 'PRAVDA', motto: 'Organ of the Central Committee', ...page, closeLabel: 'THE MORNING AFTER →' });
    await np.done;
    if (scope.disposed) return;

    // meters and the morning after
    const before = { ...s.meters };
    s.meters = clampMeters({
      approval: s.meters.approval + result.delta.approval,
      credibility: s.meters.credibility + result.delta.credibility,
      conscience: s.meters.conscience + result.delta.conscience,
    });
    s.euphUses = result.euphUses;
    for (const add of result.notebookAdds) s.notebook.push(add);
    renderMeters({ approval: s.meters.approval - before.approval, credibility: s.meters.credibility - before.credibility });

    const lines = [];
    lines.push(pick(result.delta.approval >= 0 ? REACTIONS.partyPleased : REACTIONS.partyAngry));
    lines.push(pick(result.delta.credibility >= 0 ? REACTIONS.readersBelieve : REACTIONS.readersDoubt));
    for (const n of result.notes) {
      if (n.kind === 'worn') lines.push(pick(REACTIONS.worn).replace('{phrase}', n.phrase));
      else if (n.kind === 'contradiction') lines.push(`${n.text} ${pick(REACTIONS.contradiction)}`);
      else if (n.kind === 'crosswordSafe' || n.kind === 'crosswordCaught') lines.push(pick(REACTIONS[n.kind]).replace('{word}', CROSSWORD_WORD(n.story)));
      else if (n.text) lines.push(n.text);
    }
    if (result.crisis?.heard) lines.push(pick(REACTIONS.crisisHeard));
    if (result.crisis?.ignored) lines.push(pick(REACTIONS.crisisIgnored));
    if (s.meters.approval < 40) lines.push('A man in a grey coat was seen in the corridor outside your office. He did not appear to be waiting for anyone else.');

    const lastDay = s.day >= act().days.length - 1;
    const lastAct = s.act >= ACTS.length - 1;
    const ending = endingFor(s.meters, { finalDay: lastDay && lastAct });
    const m = memo(layer, {
      no: `AM-${s.day + 1}`,
      to: 'Comrade Editor',
      from: 'Your secretary',
      subject: `The morning after ${d.date}`,
      body: lines,
      buttons: [{ label: ending ? 'CONTINUE' : 'NEXT EDITION', value: true, variant: 'red' }],
    });
    await m.done;
    if (scope.disposed) return;

    if (ending) return finish(ending);
    if (lastDay) {
      s.act += 1;
      s.day = 0;
    } else s.day += 1;
    persist();
    startDay();
  }

  function crisisLines() {
    if (s.act < ACTS.length - 1) return [];
    const { heard, ignored, hidden } = s.crisis;
    const r = (n) => Math.round(n * 10) / 10;
    const lines = [`Severny: warnings readers acted on, ${r(heard)}; warnings readers dismissed, ${r(ignored)}; accident stories kept from them, ${r(hidden)}. (Weighted by importance. These figures were also never recorded.)`];
    if (ignored > heard) lines.push(`When the paper finally told the truth, readers no longer believed it. Credibility below ${BELIEF_THRESHOLD} means a warning is read as more of the same.`);
    else if (heard > 0) lines.push('When the paper told the truth, readers believed it, because it had not used up their belief on anything else.');
    return lines;
  }

  async function finish(key) {
    const { layer, save, audio, scope } = s.ctx;
    s.phase = 'end';
    const e = ENDINGS[key];
    persist({ inProgress: false });
    save.setGame(GAME_ID, { inProgress: false, day: 0, lastEnding: key, pages: s.pages });
    if (key !== 'unperson') audio.fanfare();
    const m = memo(layer, {
      no: 'END',
      to: key === 'unperson' ? '[NAME REMOVED]' : 'Comrade Editor',
      from: 'The Archive',
      subject: `${act().title} — ${e.title}`,
      body: [
        e.text,
        `Party approval ${Math.round(s.meters.approval)} · Credibility ${Math.round(s.meters.credibility)} · Conscience ${Math.round(s.meters.conscience)} (this figure was never shown to you, and was never recorded).`,
        ...crisisLines(),
      ],
      stamp: e.title,
      buttons: [
        { label: 'LEAF THROUGH YOUR FRONT PAGES', value: 'stack' },
        { label: 'RETURN TO THE MINISTRY', value: 'hub', variant: 'red' },
      ],
    });
    save.awardMedal(GAME_ID, { ending: key, act: s.act + 1 });
    // dismissed, erased or disbelieved counts as failure; anything else is still at the desk
    const runLabel = `Edition of ${day().date.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())}`;
    if (key === 'unperson' || key === 'collapse') save.recordFailure(GAME_ID, runLabel);
    else save.recordSuccess(GAME_ID, runLabel);
    const choice = await m.done;
    if (scope.disposed) return;
    if (choice === 'stack') {
      await openStack();
      if (scope.disposed) return;
    }
    s.ctx.goTo('hub');
  }

  // ---- notebook & front page stack -------------------------------------------------------
  function modal(title, children) {
    let resolve;
    const done = new Promise((r) => (resolve = r));
    const close = () => {
      node.remove();
      resolve();
    };
    const node = el('div.memo-wrap', { onclick: (e) => e.target === node && close() }, [
      el('div.pe-modal.paper', { role: 'dialog', 'aria-label': title }, [el('div.pe-modal-h', {}, title), ...children, el('div.memo-actions', {}, button('CLOSE', close))]),
    ]);
    s.ctx.layer.append(node);
    node.querySelector('button')?.focus();
    return done;
  }

  function openNotebook() {
    s.ctx.audio.click();
    const entries = s.notebook.length
      ? s.notebook.map((n) =>
          el(`div.pe-nb.${n.claim}${n.superseded ? '.superseded' : ''}`, {}, [el('span.pe-nb-date', {}, n.date), el('span.pe-nb-topic', {}, n.topic.toUpperCase()), el('span.pe-nb-text', {}, `"${n.text}"`), n.official ? el('span.pe-nb-rev.pe-nb-off', {}, 'OFFICIAL') : n.superseded ? el('span.pe-nb-rev.pe-nb-sup', {}, 'SUPERSEDED') : n.revised ? el('span.pe-nb-rev', {}, 'REVISED') : null]),
        )
      : [el('p.pe-nb-empty', {}, 'Nothing has been printed yet. Reality is still open.')];
    const worn = Object.entries(s.euphUses).filter(([, n]) => n >= 2);
    return modal('CONTINUITY NOTEBOOK · OFFICIAL REALITY', [
      el('p.pe-nb-intro', {}, 'Everything the paper has asserted. Future editions must agree with it, or explain why they never disagreed.'),
      ...entries,
      worn.length ? el('div.pe-nb-worn', {}, ['Phrases readers have learned to decode: ', worn.map(([p]) => `"${p}"`).join(', ')]) : null,
    ]);
  }

  function openStack() {
    s.ctx.audio.click();
    const items = s.pages.length
      ? s.pages.map((p, i) =>
          el('button.pe-mini', { type: 'button', onclick: () => showNewspaper(s.ctx.layer, { masthead: 'PRAVDA', motto: 'Organ of the Central Committee', ...p, issue: 1000 + i, closeLabel: 'BACK TO THE PILE' }) }, [
            el('span.pe-mini-m', {}, 'PRAVDA'),
            el('span.pe-mini-d', {}, p.date),
            el('span.pe-mini-h', {}, p.headline),
          ]),
        )
      : [el('p', {}, 'No editions yet.')];
    return modal('FRONT PAGES · YOUR EDITIONS', [el('div.pe-minis', {}, items)]);
  }

  return self;
}
