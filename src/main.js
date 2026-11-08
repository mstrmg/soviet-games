// MINISTRY OF GAMES — entry point.
import './style.css';
import { createRenderer } from './shared/renderer.js';
import { SceneManager } from './shared/sceneManager.js';
import { audio } from './shared/audio.js';
import { save } from './shared/save.js';
import { ALL_DEPARTMENTS, wingOf } from './wings.js';

const stage = document.getElementById('stage');
const renderer = createRenderer(stage);
const manager = new SceneManager({ renderer, container: stage, fadeEl: document.getElementById('fade') });

// Each scene is loaded on demand, so a game's code only downloads when its door opens.
// The Hall leads to three wings; each wing has three games. Games built so far are listed here;
// the rest open a placeholder until they are.
manager
  .register('hall', () => import('./hall/index.js'))
  .register('ussr', () => import('./hub/index.js'))
  .register('china', () => import('./wings/china/index.js'))
  .register('gdr', () => import('./wings/gdr/index.js'))
  .register('dprk', () => import('./wings/dprk/index.js'))
  .register('cuba', () => import('./wings/cuba/index.js'))
  .register('nail-quota', () => import('./games/nail-quota/index.js'))
  .register('pravda-editor', () => import('./games/pravda-editor/index.js'))
  .register('potemkin-village', () => import('./games/potemkin-village/index.js'))
  .register('sparrow-campaign', () => import('./games/sparrow-campaign/index.js'))
  .register('hole-in-eleven', () => import('./games/hole-in-eleven/index.js'))
  .register('mass-games', () => import('./games/mass-games/index.js'))
  .register('lights-of-the-capital', () => import('./games/lights-of-the-capital/index.js'))
  .register('spare-parts', () => import('./games/spare-parts/index.js'))
  .register('backyard-furnace', () => import('./games/backyard-furnace/index.js'))
  .register('launch-a-satellite', () => import('./games/launch-a-satellite/index.js'))
  .register('press-conference', () => import('./games/press-conference/index.js'))
  .register('trabant-list', () => import('./games/trabant-list/index.js'))
  .register('listening-post', () => import('./games/listening-post/index.js'));
for (const d of ALL_DEPARTMENTS) {
  if (!manager.has(d.id)) manager.register(d.id, () => import('./wings/placeholders.js').then((m) => ({ default: m.placeholderFor(d.id) })));
}
manager.resolveHub = (from) => wingOf(from)?.id || 'hall';
manager.fallback = 'hall';

// Any first gesture unlocks Web Audio.
const unlock = () => audio.unlock();
window.addEventListener('pointerdown', unlock, { once: true });
window.addEventListener('keydown', unlock, { once: true });

save.update((d) => {
  d.visits = (d.visits || 0) + 1;
});

// Deep links: #nail-quota opens that department directly; #hub (old links) means the Soviet wing.
const fromHash = () => {
  const id = location.hash.replace(/^#\/?/, '') || 'hall';
  return id === 'hub' ? 'ussr' : id;
};
// A hash change during a scene transition waits for the transition to finish, rather than being lost.
const followHash = () => {
  const id = fromHash();
  if (id === manager.currentId) return;
  if (manager.busy) setTimeout(followHash, 200);
  else manager.switchTo(id);
};
window.addEventListener('hashchange', followHash);

manager.start();
manager.switchTo(fromHash());

if (import.meta.env.DEV) {
  // Handy in the console: __MOG.manager.switchTo('nail-quota'), __MOG.renderer.info.memory
  window.__MOG = { manager, renderer, save, audio };
}
