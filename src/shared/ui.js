// Small helpers for the HTML overlay that sits on top of the canvas.
// Each scene gets its own layer element, removed when the scene is disposed,
// so overlay UI can never leak from one game into the next.
import { audio } from './audio.js';

const uiRoot = () => document.getElementById('ui');

/** Tiny hyperscript: el('div.memo#id', { onclick }, [children]). */
export function el(spec, attrs = {}, children = []) {
  const [, tag = 'div', rest = ''] = spec.match(/^([a-z0-9-]+)?(.*)$/i);
  const node = document.createElement(tag || 'div');
  for (const part of rest.match(/[.#][^.#]+/g) || []) {
    if (part[0] === '.') node.classList.add(part.slice(1));
    else node.id = part.slice(1);
  }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

/** A per-scene overlay layer. Remove it with layer.remove(). */
export function createLayer(className = '') {
  const layer = el(`div.layer${className ? '.' + className : ''}`);
  uiRoot().append(layer);
  return layer;
}

/** A Ministry button. */
export function button(label, onClick, { variant = '', title } = {}) {
  return el(
    `button.btn${variant ? '.btn-' + variant : ''}`,
    {
      type: 'button',
      title,
      onclick: (e) => {
        audio.unlock();
        audio.click();
        onClick?.(e);
      },
    },
    label,
  );
}

/**
 * Typed memorandum on a sheet of paper, with an optional rubber stamp.
 * Returns { node, close, done } where done resolves with the chosen button value.
 */
export function memo(parent, { no, to, from, subject, body, stamp, buttons = [{ label: 'ACKNOWLEDGED', value: true }] }) {
  let resolve;
  const done = new Promise((r) => (resolve = r));
  const close = (value) => {
    node.classList.add('memo-out');
    setTimeout(() => node.remove(), 250);
    resolve(value);
  };
  const header = el('div.memo-head', {}, [
    el('div.memo-crest', {}, '☭'),
    el('div', {}, [
      el('div.memo-ministry', {}, 'MINISTRY OF GAMES'),
      el('div.memo-dept', {}, 'Directorate of Approved Leisure'),
    ]),
    no ? el('div.memo-no', {}, `MEMO № ${no}`) : null,
  ]);
  const meta = el('table.memo-meta', {}, [
    to ? el('tr', {}, [el('th', {}, 'TO:'), el('td', {}, to)]) : null,
    from ? el('tr', {}, [el('th', {}, 'FROM:'), el('td', {}, from)]) : null,
    subject ? el('tr', {}, [el('th', {}, 'RE:'), el('td', {}, subject)]) : null,
  ]);
  const paragraphs = [].concat(body || []).map((p) => el('p', {}, p));
  const actions = el(
    'div.memo-actions',
    {},
    buttons.map((b) => button(b.label, () => close(b.value), { variant: b.variant })),
  );
  const stampNode = stamp ? el('div.stamp', {}, stamp) : null;
  const node = el('div.memo-wrap', {}, [
    el('div.memo.paper', { role: 'dialog', 'aria-label': subject || 'Memorandum' }, [
      header,
      meta,
      el('div.memo-body', {}, paragraphs),
      stampNode,
      actions,
    ]),
  ]);
  parent.append(node);
  if (stampNode) {
    setTimeout(() => {
      stampNode.classList.add('stamped');
      audio.stamp();
    }, 450);
  }
  node.querySelector('button')?.focus({ preventScroll: true });
  return { node, close, done };
}

/** A brief notice that slides in and leaves on its own. */
export function toast(parent, text, ms = 2600) {
  const node = el('div.toast', { role: 'status' }, text);
  parent.append(node);
  setTimeout(() => node.classList.add('toast-out'), ms);
  setTimeout(() => node.remove(), ms + 400);
  return node;
}
