// MINISTRY OF GAMES — entry point.
import './style.css';
import { createRenderer } from './shared/renderer.js';
import { SceneManager } from './shared/sceneManager.js';
import { audio } from './shared/audio.js';
import { save } from './shared/save.js';

const stage = document.getElementById('stage');
const renderer = createRenderer(stage);
const manager = new SceneManager({ renderer, container: stage, fadeEl: document.getElementById('fade') });

// Each scene is loaded on demand, so a game's code only downloads when its door opens.
manager
  .register('hub', () => import('./hub/index.js'))
  .register('nail-quota', () => import('./games/nail-quota/index.js'))
  .register('pravda-editor', () => import('./games/pravda-editor/index.js'))
  .register('potemkin-village', () => import('./games/potemkin-village/index.js'));

// Any first gesture unlocks Web Audio.
const unlock = () => audio.unlock();
window.addEventListener('pointerdown', unlock, { once: true });
window.addEventListener('keydown', unlock, { once: true });

save.update((d) => {
  d.visits = (d.visits || 0) + 1;
});

// Deep links: #nail-quota opens that department directly.
const fromHash = () => location.hash.replace(/^#\/?/, '') || 'hub';
window.addEventListener('hashchange', () => {
  const id = fromHash();
  if (id !== manager.currentId) manager.switchTo(id);
});

manager.start();
manager.switchTo(fromHash());

if (import.meta.env.DEV) {
  // Handy in the console: __MOG.manager.switchTo('nail-quota'), __MOG.renderer.info.memory
  window.__MOG = { manager, renderer, save, audio };
}
