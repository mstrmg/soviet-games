// Progress is stored in localStorage. If storage is unavailable (private mode,
// quota, sandboxed iframe) the Ministry simply forgets you, as is customary.
const KEY = 'ministry-of-games.v1';

const DEFAULTS = () => ({
  version: 1,
  medals: {}, // { [gameId]: { awardedAt: ISO string, headline?: string } }
  games: {}, // free-form per-game progress: { [gameId]: {...} }
  settings: { muted: false, volume: 0.8 },
  visits: 0,
  failures: [], // [{ gameId, at: ISO, label }] every failed run, newest last. The clock remembers.
  honours: [], // [{ gameId, kind: 'hero' | 'removed', at: ISO, label }] newest last, capped
  hub: { failuresSeen: 0, honoursSeenAt: null, queuePos: null, lastShuffleAt: null, citizenNo: null },
});

const HONOURS_CAP = 40;
const FAILURES_CAP = 500;

let state = null;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS();
    const parsed = JSON.parse(raw);
    const base = DEFAULTS();
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings || {}) },
      hub: { ...base.hub, ...(parsed.hub || {}) },
      failures: Array.isArray(parsed.failures) ? parsed.failures : [],
      honours: Array.isArray(parsed.honours) ? parsed.honours : [],
    };
  } catch (err) {
    console.warn('[save] could not read progress', err);
    return DEFAULTS();
  }
}

function write() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[save] could not write progress', err);
  }
}

function pushHonour(d, entry) {
  d.honours.push(entry);
  if (d.honours.length > HONOURS_CAP) d.honours.splice(0, d.honours.length - HONOURS_CAP);
}

export const save = {
  get data() {
    if (!state) state = read();
    return state;
  },
  /** Mutate the save with a function, then persist. */
  update(fn) {
    fn(this.data);
    write();
    return this.data;
  },
  hasMedal(gameId) {
    return Boolean(this.data.medals[gameId]);
  },
  awardMedal(gameId, extra = {}) {
    return this.update((d) => {
      d.medals[gameId] = { awardedAt: new Date().toISOString(), ...extra };
    });
  },
  /** A run that went badly. The lobby clock and the honours board will be informed. */
  recordFailure(gameId, label) {
    const at = new Date().toISOString();
    return this.update((d) => {
      d.failures.push({ gameId, at, label });
      if (d.failures.length > FAILURES_CAP) d.failures.splice(0, d.failures.length - FAILURES_CAP);
      pushHonour(d, { gameId, kind: 'removed', at, label });
    });
  },
  /** A run that went well, every time, not only the first (awardMedal handles the first). */
  recordSuccess(gameId, label) {
    return this.update((d) => pushHonour(d, { gameId, kind: 'hero', at: new Date().toISOString(), label }));
  },
  medalCount() {
    return Object.keys(this.data.medals).length;
  },
  game(gameId) {
    const d = this.data;
    if (!d.games[gameId]) d.games[gameId] = {};
    return d.games[gameId];
  },
  setGame(gameId, patch) {
    return this.update((d) => {
      d.games[gameId] = { ...(d.games[gameId] || {}), ...patch };
    });
  },
  reset() {
    state = DEFAULTS();
    write();
  },
};
