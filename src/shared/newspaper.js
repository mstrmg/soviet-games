// The state newspaper front page shown at the end of every game.
// All news is good news. Some news is better news.
import { el, button } from './ui.js';
import { audio } from './audio.js';

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

export function officialDate(d = new Date(), year = 1978) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${year}`;
}

/**
 * Show a front page. Returns { node, done } — done resolves when dismissed.
 * @param {HTMLElement} parent
 * @param {object} o
 *   masthead, motto, date, issue, price,
 *   headline, deck (sub-headline), photo (data URL), caption,
 *   columns: string[] (body paragraphs), sidebar: { title, items: string[] },
 *   closeLabel
 */
export function showNewspaper(parent, o = {}) {
  let resolve;
  const done = new Promise((r) => (resolve = r));
  const issue = o.issue ?? 300 + Math.floor(Math.random() * 60);

  const close = () => {
    node.classList.add('paper-out');
    setTimeout(() => node.remove(), 300);
    resolve();
  };

  const photo = o.photo
    ? el('figure.np-photo', {}, [el('img', { src: o.photo, alt: o.caption || 'Photograph' }), o.caption ? el('figcaption', {}, o.caption) : null])
    : null;

  const sidebar = o.sidebar
    ? el('aside.np-sidebar', {}, [el('h3', {}, o.sidebar.title), el('ul', {}, o.sidebar.items.map((i) => el('li', {}, i)))])
    : null;

  const node = el('div.np-wrap', {}, [
    el('article.newspaper', { role: 'dialog', 'aria-label': o.headline || 'Newspaper' }, [
      el('header.np-top', {}, [
        el('div.np-ear', {}, ['WORKERS OF ALL', el('br'), 'DEPARTMENTS, UNITE!']),
        el('div.np-masthead', {}, o.masthead || 'THE DAILY TRUTH'),
        el('div.np-ear.np-ear-r', {}, ['PRICE ', o.price || '2 KOP.', el('br'), 'WEATHER: AS PLANNED']),
      ]),
      el('div.np-dateline', {}, [
        el('span', {}, o.motto || 'Organ of the Ministry of Games'),
        el('span', {}, o.date || officialDate()),
        el('span', {}, `№ ${issue}`),
      ]),
      el('h1.np-headline', {}, o.headline || 'GLORIOUS SUCCESS ACHIEVED'),
      o.deck ? el('h2.np-deck', {}, o.deck) : null,
      el('div.np-body', {}, [
        photo,
        el('div.np-cols', {}, (o.columns || []).map((p) => el('p', {}, p))),
        sidebar,
      ]),
      el('footer.np-foot', {}, [
        el('span', {}, 'Printed in an edition of 11,000,000 copies. Demand exceeded supply.'),
        button(o.closeLabel || 'FOLD NEWSPAPER', close, { variant: 'dark' }),
      ]),
    ]),
  ]);
  parent.append(node);
  audio.stamp();
  return { node, done, close };
}
