// The three wings of the International Hall of Fraternal Nations, and which games live in each.
// Scene ids: 'hall', each wing id, each game id. Games return to their own wing.
import * as USSR from './hub/departments.js';
import * as CHINA from './wings/china/departments.js';
import * as GDR from './wings/gdr/departments.js';

export const WINGS = [
  {
    id: 'ussr',
    country: 'UNION OF SOVIET SOCIALIST REPUBLICS',
    short: 'SOVIET UNION',
    ministry: 'Ministry of Games',
    stamp: ['CCCP', 'ENTRY RECORDED'],
    colors: { field: '#c1272d', mark: '#d4a72c' },
    ...USSR,
  },
  {
    id: 'china',
    country: "PEOPLE'S REPUBLIC OF CHINA",
    short: 'CHINA',
    ministry: 'Bureau of the Great Leap',
    stamp: ['PRC', 'QUOTA EXCEEDED'],
    colors: { field: '#c8102e', mark: '#ffde00' },
    ...CHINA,
  },
  {
    id: 'gdr',
    country: 'GERMAN DEMOCRATIC REPUBLIC',
    short: 'EAST GERMANY',
    ministry: 'Ministry for Things Being Fine',
    stamp: ['DDR', 'EVERYTHING FINE'],
    colors: { field: '#2a2a2a', mark: '#d4a72c' },
    ...GDR,
  },
];

const byId = new Map(WINGS.map((w) => [w.id, w]));
const gameWing = new Map(WINGS.flatMap((w) => w.DEPARTMENTS.map((d) => [d.id, w])));

export const wing = (id) => byId.get(id);
/** The wing a scene belongs to: a wing is its own wing; a game belongs to its wing. */
export const wingOf = (sceneId) => byId.get(sceneId) || gameWing.get(sceneId) || null;
export const departmentById = (gameId) => gameWing.get(gameId)?.DEPARTMENTS.find((d) => d.id === gameId) || null;
export const ALL_DEPARTMENTS = WINGS.flatMap((w) => w.DEPARTMENTS);
/** A wing is complete when every one of its games has a medal. */
export const wingComplete = (save, w) => w.DEPARTMENTS.every((d) => save.hasMedal(d.id));
