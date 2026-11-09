// RATION BOOK — the data. Everything the family is entitled to, everything the bodega has,
// the neighbours' offers, the official menu, and the words. The joke is on the distribution
// system and the report it writes about itself, never on the people standing in line.

// One unit of each is one week's ration for the household. Spanish for the chalkboard.
export const ITEMS = {
  rice: { es: 'ARROZ', en: 'rice', model: 'sack', colour: 0xf1e6c8 },
  beans: { es: 'FRIJOLES', en: 'black beans', model: 'sack', colour: 0x2a2420 },
  sugar: { es: 'AZÚCAR', en: 'sugar', model: 'sack', colour: 0xe8e2d8 },
  oil: { es: 'ACEITE', en: 'cooking oil', model: 'bottle', colour: 0xd8b03a },
  eggs: { es: 'HUEVOS', en: 'eggs', model: 'tray', colour: 0xf2e6cc },
  coffee: { es: 'CAFÉ', en: 'coffee', model: 'tin', colour: 0x6a3a22 },
  chicken: { es: 'POLLO', en: 'chicken', model: 'box', colour: 0xd8c0a0 },
  bread: { es: 'PAN', en: 'bread', model: 'loaf', colour: 0xc8904a },
  soap: { es: 'JABÓN', en: 'soap', model: 'bar', colour: 0x8ac0d8 },
  peas: { es: 'CHÍCHAROS', en: 'split peas', model: 'sack', colour: 0x9ab04a },
  soy: { es: 'PICADILLO DE SOYA', en: 'soy mince', model: 'box', colour: 0xb88a5a },
};

// The order on the shelves and on the chalkboard.
export const SHELF = ['rice', 'beans', 'sugar', 'oil', 'eggs', 'coffee', 'chicken', 'bread', 'soap', 'peas', 'soy'];

// What the book says the household is entitled to, every week, regardless.
export const ENTITLED = ['rice', 'beans', 'sugar', 'oil', 'eggs', 'coffee', 'chicken', 'bread', 'soap'];

// The state's own substitutes. A dish made with one "resembles the menu".
export const SUBS = {
  chicken: { item: 'soy', as: 'with picadillo de soya' },
  coffee: { item: 'peas', as: 'as café mezclado (mostly peas)' },
  beans: { item: 'peas', as: 'with peas, introduced as beans' },
};

export const DAYS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'];
export const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const NEIGHBOURS = {
  rosa: 'Rosa, next door',
  pedro: 'Pedro, across the street',
  carmen: 'Carmen, upstairs',
};

// Each week: the official menu, what the bodega gets (from day, to day, odds of the shelf
// lasting until you reach the counter, units handed over), and one neighbour's offer a day.
// Anything not listed is NO HAY all week.
export const WEEKS = [
  {
    title: 'The first week of the month',
    note: 'The book has been stamped for the new month. The bodega has also been informed.',
    menu: [
      { name: 'Congrí', needs: ['rice', 'beans'] },
      { name: 'Huevo frito', needs: ['eggs', 'oil'] },
      { name: 'Café con azúcar', needs: ['coffee', 'sugar'] },
    ],
    shop: {
      rice: { from: 0, to: 4, p: 0.9, units: 2 },
      sugar: { from: 0, to: 4, p: 1, units: 1 },
      eggs: { from: 0, to: 0, p: 0.5, units: 1 },
      beans: { from: 2, to: 3, p: 0.6, units: 1 },
      coffee: { from: 3, to: 4, p: 0.6, units: 1 },
      bread: { from: 0, to: 4, p: 0.9, units: 1 },
      peas: { from: 0, to: 4, p: 0.95, units: 1 },
    },
    swaps: [
      { who: 'rosa', give: 'soap', get: 'oil' },
      { who: 'pedro', give: 'sugar', get: 'eggs' },
      { who: 'rosa', give: 'bread', get: 'coffee' },
      { who: 'pedro', give: 'rice', get: 'oil' },
      { who: 'carmen', give: 'peas', get: 'eggs' },
    ],
  },
  {
    title: 'The second week',
    note: 'Chicken has been announced. The announcement has arrived; the chicken is following.',
    menu: [
      { name: 'Arroz con pollo', needs: ['rice', 'chicken'] },
      { name: 'Pan con aceite', needs: ['bread', 'oil'] },
      { name: 'Café con azúcar', needs: ['coffee', 'sugar'] },
    ],
    shop: {
      rice: { from: 0, to: 4, p: 0.9, units: 2 },
      sugar: { from: 0, to: 4, p: 1, units: 1 },
      soy: { from: 0, to: 4, p: 0.95, units: 1 },
      bread: { from: 0, to: 4, p: 0.9, units: 1 },
      oil: { from: 1, to: 2, p: 0.5, units: 1 },
      eggs: { from: 2, to: 2, p: 0.5, units: 1 },
      chicken: { from: 4, to: 4, p: 0.35, units: 1 },
      peas: { from: 0, to: 4, p: 0.95, units: 1 },
    },
    swaps: [
      { who: 'rosa', give: 'rice', get: 'coffee' },
      { who: 'pedro', give: 'sugar', get: 'oil' },
      { who: 'carmen', give: 'soy', get: 'eggs' },
      { who: 'rosa', give: 'bread', get: 'chicken', line: 'From her cousin in the country. Do not ask which country.' },
      { who: 'pedro', give: 'peas', get: 'coffee' },
    ],
  },
  {
    title: 'The third week',
    note: 'The beans are in transit. Transit is a province.',
    menu: [
      { name: 'Frijoles negros', needs: ['beans', 'oil'] },
      { name: 'Tortilla', needs: ['eggs', 'oil'] },
      { name: 'Arroz con azúcar', needs: ['rice', 'sugar'] },
    ],
    shop: {
      rice: { from: 0, to: 4, p: 0.9, units: 2 },
      sugar: { from: 0, to: 4, p: 1, units: 1 },
      eggs: { from: 0, to: 1, p: 0.6, units: 1 },
      soap: { from: 2, to: 2, p: 0.7, units: 1 },
      oil: { from: 3, to: 4, p: 0.45, units: 1 },
      bread: { from: 0, to: 4, p: 0.9, units: 1 },
      peas: { from: 0, to: 4, p: 0.95, units: 1 },
    },
    swaps: [
      { who: 'carmen', give: 'sugar', get: 'oil' },
      { who: 'rosa', give: 'bread', get: 'beans' },
      { who: 'rosa', give: 'rice', get: 'eggs' },
      { who: 'pedro', give: 'soap', get: 'oil' },
      { who: 'carmen', give: 'peas', get: 'eggs' },
    ],
  },
  {
    title: 'Anniversary week',
    note: 'To mark the anniversary, every household is entitled to a festive chicken. Entitlement is the festive part.',
    menu: [
      { name: 'Pollo asado', needs: ['chicken', 'oil'] },
      { name: 'Congrí', needs: ['rice', 'beans'] },
      { name: 'Dulce de fiesta', needs: ['sugar', 'eggs'] },
    ],
    shop: {
      chicken: { from: 0, to: 0, p: 0.25, units: 1 },
      coffee: { from: 0, to: 1, p: 0.6, units: 1 },
      rice: { from: 0, to: 4, p: 0.9, units: 2 },
      sugar: { from: 0, to: 4, p: 1, units: 1 },
      soy: { from: 0, to: 4, p: 0.95, units: 1 },
      beans: { from: 1, to: 3, p: 0.55, units: 1 },
      eggs: { from: 2, to: 3, p: 0.55, units: 1 },
      oil: { from: 4, to: 4, p: 0.5, units: 1 },
      peas: { from: 0, to: 4, p: 0.95, units: 1 },
    },
    swaps: [
      { who: 'rosa', give: 'coffee', get: 'oil' },
      { who: 'pedro', give: 'rice', get: 'chicken', line: 'He will not say where it came from. It will not say either.' },
      { who: 'carmen', give: 'sugar', get: 'eggs' },
      { who: 'rosa', give: 'peas', get: 'beans' },
      { who: 'pedro', give: 'bread', get: 'oil' },
    ],
  },
];

export const START_PANTRY = { soap: 1, sugar: 1 };

// A dish as on the menu scores 2, one that resembles it scores 1, one only described scores 0.
export const POINTS_NEEDED = 12; // of 24; perfect planning with average luck makes about 16

/** The odds, as written on the chalkboard by the queue. */
export function oddsWord(p) {
  if (p >= 0.99) return 'SEGURO';
  if (p >= 0.85) return 'PROBABLE';
  if (p >= 0.55) return 'QUIZÁS';
  if (p >= 0.4) return 'DIFÍCIL';
  return 'MILAGRO';
}

export const ODDS_EN = { SEGURO: 'certain', PROBABLE: 'likely', 'QUIZÁS': 'maybe', 'DIFÍCIL': 'hard', MILAGRO: 'a miracle' };

export const TEXT = {
  dept: 'Office of Theoretical Supply',
  memo: {
    no: 'TS-2/01',
    subject: 'The household ration book (libreta), this month',
    body: [
      'Your household of four is entitled to everything in the book. The book is complete. This has been verified by the book.',
      'The bodega lists what it has on the chalkboard. Each weekday you may stand in one queue, accept one neighbour\'s swap, or sit on the step and wait for the chalkboard to change.',
      'On Saturday the family cooks the official menu with whatever is in the pantry. A dish made with a state substitute resembles the menu. A dish with nothing in it will be described at the table.',
    ],
    button: 'TAKE THE BOOK',
  },
  queueOk: (item, units, ahead) => `${ahead} people ahead. The ${item} lasted. The clerk weighs it, stamps the book, and hands over ${units === 1 ? 'one ration' : `${units} rations`}.`,
  queueNo: (item, ahead) => `${ahead} people ahead. At the counter the clerk writes SE ACABÓ under ${item}. The book is stamped anyway.`,
  swapOk: (who, give, get) => `${who} takes the ${give} and hands over the ${get}. Nobody saw anything. Everybody saw everything.`,
  sit: [
    'You sit on the step. The chalkboard does not change. A rumour about eggs goes past.',
    'You sit on the step. A neighbour sits down next to you. You discuss the chalkboard as literature.',
    'You sit on the step. The truck is said to be at the corner. The corner is said to be far.',
  ],
  saturday: {
    subject: (w) => `Saturday: the official menu, week ${w}`,
    full: 'as on the menu',
    sub: (as) => `resembles the menu: ${as}`,
    none: (missing) => `described at the table (no ${missing})`,
  },
  stamped: 'ENTREGADO',
  stampNote: 'At closing time the clerk stamps every line of the book ENTREGADO (delivered). The book is now complete, as it always was.',
};

export const NEWSPAPER = {
  masthead: 'LA VERDAD REVOLUCIONARIA',
  motto: 'ORGAN OF THE OFFICE OF THEORETICAL SUPPLY',
  date: 'THE LAST DAY OF THE MONTH',
  price: '20 CENTAVOS',
  headline: 'EVERY HOUSEHOLD RECEIVED EVERYTHING',
  deck: 'Monthly audit of the ration book confirms full nutrition for the fourth consecutive decade',
  columns: (r) => [
    `The Office of Theoretical Supply reports that the household received 100% of its entitlements this month, as recorded in the ration book, which records entitlements.`,
    `Of the ${r.dishes} dishes on the official menu, ${r.full} were served as written and ${r.sub} were served in a form that resembled them. The remaining ${r.none} were described at the table in such detail that several family members reported feeling full.`,
    r.good
      ? 'The household has been awarded the Medal of Full Nutrition (On Paper), which will be delivered when it arrives.'
      : 'Analysts attribute any shortfall to the household\'s appetite, which exceeded the plan.',
  ],
  sidebar: (r) => ({
    title: 'THE MONTH IN FIGURES',
    items: [`Entitlements delivered: 100%`, `Entitlements that arrived: ${r.arrivedPct}%`, `Hours in queues: ${r.hours}`, `Swaps with neighbours: ${r.swaps}`, `Times the clerk wrote SE ACABÓ: ${r.ranOut}`],
  }),
  caption: 'The bodega on the last day of the month. The shelves are being restocked with the chalkboard.',
};
