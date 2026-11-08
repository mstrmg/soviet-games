// Progress is stored in localStorage. If storage is unavailable (private mode,
// quota, sandboxed iframe) the Ministry simply forgets you, as is customary.
const KEY = 'ministry-of-games.v1';

const DEFAULTS = () => ({
  version: 1,
  medals: {}, // { [gameId]: { awardedAt: ISO string, headline?: string } }
  games: {}, // free-form per-game progress: { [gameId]: {...} }
  settings: { muted: false, volume: 0.8 },
  visits: 0,
});

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
