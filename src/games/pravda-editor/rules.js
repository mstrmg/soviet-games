// PRAVDA EDITOR — how the Party, the readers and your conscience react. Pure functions.
import { STANCE_EFFECTS, EUPHEMISM_WEAR } from './stories.js';

export const SLOTS = ['headline', 'lead', 'fold', 'page6', 'bin'];
export const SLOT_LABELS = { headline: 'HEADLINE', lead: 'LEAD STORY', fold: 'BELOW THE FOLD', page6: 'PAGE 6', bin: 'THE BIN' };
const FRONT = new Set(['headline', 'lead', 'fold']);

/** Decide what kind of headline the player built. */
export function stanceOf(tiles, story) {
  const has = (k) => tiles.some((t) => t.k === k);
  const topicMatch = tiles.some((t) => t.topic === story.topic);
  if (!tiles.length) return 'evasion';
  if (has('blame')) return 'blame';
  if (!topicMatch) return 'evasion';
  if (has('truth') && !has('praise') && !has('euph')) return 'truth';
  if (has('euph') || (has('truth') && has('praise'))) return 'euphemism';
  if (has('praise')) return story.truth === 'bad' ? 'denial' : 'praise';
  return story.truth === 'bad' ? 'evasion' : 'praise';
}

/** good / bad / null: what the headline asserts about its topic, for the continuity notebook. */
export function claimOf(stance, story) {
  if (stance === 'blame' && story?.blameClaim) return story.blameClaim;
  if (stance === 'praise' || stance === 'denial' || stance === 'blame') return 'good';
  if (stance === 'truth') return 'bad';
  return null;
}

export function headlineText(tiles) {
  return tiles.map((t) => t.w).join(' ').replace(/ !/g, '!');
}

export function euphemismPhrase(tiles) {
  return tiles.filter((t) => t.k === 'euph').map((t) => t.w).join(' ');
}

/** Does a claim contradict the notebook? Returns the conflicting entry or null. */
export function contradiction(notebook, topic, claim) {
  if (!claim) return null;
  for (let i = notebook.length - 1; i >= 0; i--) {
    const e = notebook[i];
    if (e.topic === topic) return e.claim !== claim ? e : null;
  }
  return null;
}

function partyDelta(want, slot) {
  const table = {
    headline: { headline: 6, lead: -4, fold: -5, page6: -12, bin: -14 },
    front: { headline: 3, lead: 3, fold: 2, page6: -2, bin: -4 },
    bury: { headline: -8, lead: -6, fold: -3, page6: 2, bin: 1 },
    bin: { headline: -10, lead: -8, fold: -6, page6: -2, bin: 3 },
  };
  return table[want]?.[slot] ?? 0;
}

/** Do readers act on a warning? Only if they still believe the paper. */
export const BELIEF_THRESHOLD = 45;

/**
 * Evaluate a finished front page.
 * state = { notebook: [{topic, claim, text, day}], euphUses: {phrase: n}, meters, crossword: { id, caught } | null }
 * crisis (Act Three): { heard, ignored, hidden } — warnings readers acted on, warnings dismissed,
 * and accident stories kept off the front page; weighted by importance.
 * Returns { delta: {approval, credibility, conscience}, notes: [{kind, text}], notebookAdds, euphUses, stance }
 */
export function evaluateDay(day, dayIndex, placements, headlineTiles, state) {
  const delta = { approval: 0, credibility: 0, conscience: 0 };
  const notes = [];
  const notebookAdds = [];
  const euphUses = { ...state.euphUses };
  const add = (d, scale = 1) => {
    delta.approval += (d.approval || 0) * scale;
    delta.credibility += (d.credibility || 0) * scale;
    delta.conscience += (d.conscience || 0) * scale;
  };
  let stance = null;
  const crisis = { heard: 0, ignored: 0, hidden: 0 };
  const believed = (state.meters?.credibility ?? 100) >= BELIEF_THRESHOLD;
  const warn = (story, strength) => {
    if (!story.crisis) return;
    if (believed) crisis.heard += strength * story.importance;
    else crisis.ignored += strength * story.importance;
  };

  for (const story of day.wires) {
    const slot = placements[story.id] || 'bin';
    add({ approval: partyDelta(story.party.want, slot) });

    if (slot === 'headline') {
      stance = stanceOf(headlineTiles, story);
      let eff = STANCE_EFFECTS[stance][story.truth];
      const scale = 0.6 + story.importance * 0.2;
      add(eff, scale);
      if (story.visible && story.truth === 'bad' && (stance === 'denial' || stance === 'praise')) {
        add({ credibility: -6 });
        notes.push({ kind: 'readersDoubt', text: 'Readers could see the opposite of your headline from their windows.' });
      }
      if (stance === 'euphemism') {
        const phrase = euphemismPhrase(headlineTiles);
        if (phrase) {
          euphUses[phrase] = (euphUses[phrase] || 0) + 1;
          if (euphUses[phrase] > EUPHEMISM_WEAR) {
            add({ approval: -4, credibility: -8 });
            notes.push({ kind: 'worn', phrase });
          }
        }
      }
      if (stance === 'truth') warn(story, 1);
      else if (story.crisis && story.truth === 'bad') crisis.hidden += story.importance;
      const claim = claimOf(stance, story);
      const clash = contradiction(state.notebook, story.topic, claim);
      if (clash) {
        add({ approval: -8, credibility: -8 });
        notes.push({ kind: 'contradiction', text: `Your headline contradicts Official Reality: "${clash.text}" (${clash.date}).` });
      }
      if (claim) notebookAdds.push({ topic: story.topic, claim, text: headlineText(headlineTiles), date: day.date, revised: Boolean(clash) });
    } else if (FRONT.has(slot)) {
      // printed as reported
      if (story.truth === 'bad') {
        add({ credibility: story.visible ? 4 : 2, conscience: story.importance * 2 });
        warn(story, slot === 'fold' ? 0.4 : 0.6);
        const clash = contradiction(state.notebook, story.topic, 'bad');
        if (clash) {
          add({ approval: -6, credibility: -4 });
          notes.push({ kind: 'contradiction', text: `"${story.slug}" contradicts Official Reality: "${clash.text}" (${clash.date}).` });
        }
        notebookAdds.push({ topic: story.topic, claim: 'bad', text: story.slug, date: day.date, revised: Boolean(clash) });
      } else if (story.truth === 'good') {
        add({ credibility: 1 });
      }
    } else if (story.truth === 'bad') {
      // buried or binned
      const hidden = slot === 'bin' ? 1 : 0.4;
      if (story.visible) add({ credibility: -6 * hidden });
      add({ conscience: -3 * story.importance * hidden });
      if (story.crisis) crisis.hidden += story.importance * hidden;
    }
  }

  // the crossword on page 6: the truth, for readers who know how to look
  if (state.crossword) {
    const story = day.wires.find((w) => w.id === state.crossword.id);
    if (story) {
      if (state.crossword.caught) {
        add({ approval: -14 });
        notes.push({ kind: 'crosswordCaught', story });
      } else {
        add({ credibility: 2, conscience: 2 + story.importance * 2 });
        notes.push({ kind: 'crosswordSafe', story });
        if (story.crisis) {
          crisis.hidden = Math.max(0, crisis.hidden - story.importance * 0.3);
          crisis.heard += 0.3 * story.importance;
        }
      }
    }
  }

  for (const k of Object.keys(delta)) delta[k] = Math.round(delta[k]);
  return { delta, notes, notebookAdds, euphUses, stance, crisis };
}

export function clampMeters(m) {
  return {
    approval: Math.max(0, Math.min(100, m.approval)),
    credibility: Math.max(0, Math.min(100, m.credibility)),
    conscience: Math.max(0, Math.min(100, m.conscience)),
  };
}

/** How likely the Censor is to solve tonight's crossword. */
export function crosswordRisk(approval, previous) {
  return Math.max(0.1, Math.min(0.85, 0.15 + (55 - approval) / 100 + previous * 0.1));
}

export function endingFor(m, { finalDay = false } = {}) {
  if (m.approval <= 0) return 'unperson';
  if (m.credibility <= 0) return 'collapse';
  if (!finalDay) return null;
  if (m.conscience >= 55 && m.credibility >= 55) return 'truth';
  if (m.approval >= 55 && m.conscience < 45) return 'loyal';
  return 'survivor';
}
