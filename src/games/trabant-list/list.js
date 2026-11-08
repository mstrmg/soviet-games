// THE TRABANT LIST · data. Edit freely: the scene reads every line and number from here.
//
// You ordered a car in 1977. It will be delivered in 1989. Each year you receive
// something (your allocation), the market offers a few trades, and something happens.
// Trades that move you up the list cost the car a feature, one per year saved.

export const START = { year: 1977, wait: 12, position: 2481377, perYear: 206781 };

// What you are given each year, in order. Your job is at the tile works; your aunt is in the West.
export const ALLOCATION = ['tiles', 'coffee', 'tiles', 'jeans', 'tiles', 'coffee', 'tiles', 'bananas', 'tiles', 'jeans', 'tiles', 'coffee'];

export const ITEMS = {
  tiles: { name: 'Bathroom tiles', note: 'from your job at the tile works' },
  coffee: { name: 'Western coffee', note: 'from a parcel from your aunt' },
  jeans: { name: 'Western jeans', note: 'from a parcel, slightly too small' },
  bananas: { name: 'Bananas', note: 'a rumour that turned out to be true' },
  phone: { name: 'A telephone line', note: 'you were not expecting to have one' },
  parts: { name: 'An exhaust pipe', note: 'for a car you do not have' },
  favour: { name: 'A favour', note: 'owed by somebody who matters' },
  tickets: { name: 'Concert tickets', note: 'for a choir' },
  plumber: { name: 'A plumber', note: 'available Thursdays' },
};

// Offers that might appear in the market. `gives` is an item id or { years: n }.
export const OFFERS = [
  { who: 'Frau Becker, Block C', wants: ['coffee'], gives: 'tiles' },
  { who: 'The plant manager\'s wife', wants: ['tiles', 'tiles'], gives: { years: 2 } },
  { who: 'A man in the stairwell', wants: ['jeans'], gives: 'parts' },
  { who: 'Your cousin at the garage', wants: ['parts'], gives: { years: 1 } },
  { who: 'The post office', wants: ['coffee', 'tiles'], gives: 'phone' },
  { who: 'The housing office', wants: ['phone'], gives: 'favour' },
  { who: 'A deputy at the district council', wants: ['favour'], gives: { years: 3 } },
  { who: 'The greengrocer', wants: ['bananas'], gives: 'favour' },
  { who: 'The choir secretary', wants: ['tiles'], gives: 'tickets' },
  { who: 'The dealership clerk', wants: ['tickets', 'coffee'], gives: { years: 2 } },
  { who: 'Herr Schulz, plumber', wants: ['jeans'], gives: 'plumber' },
  { who: 'The dealership manager', wants: ['plumber'], gives: { years: 2 } },
  { who: 'A neighbour with a balcony', wants: ['bananas'], gives: 'jeans' },
  { who: 'The caretaker', wants: ['coffee'], gives: 'plumber' },
];

// Something happens every year. Some of it is about you.
export const EVENTS = [
  { text: 'The list has been reorganised. Your position is unchanged, but further away.', years: 0 },
  { text: 'A district official\'s nephew has joined the list ahead of you, by being a nephew.', years: 1 },
  { text: 'Your application has been found to be correct. This was unexpected and has been noted.', years: 0 },
  { text: 'The factory has exceeded its plan. Deliveries are delayed to celebrate.', years: 1 },
  { text: 'A neighbour has received his car. He is very quiet about it.', years: 0 },
  { text: 'A rumour says the list is shorter in Dresden. The rumour has been placed on a list.', years: 0 },
  { text: 'You have been visited by a man asking how much you want the car. You said: an ordinary amount.', years: 0 },
  { text: 'The plant has introduced a new model. It is the old model.', years: 0 },
];

// Each year saved costs the car one of these, in this order. `part` is the piece of the model it removes.
export const DOWNGRADES = [
  { text: 'Colour options: beige', part: 'colour' },
  { text: 'Heater', part: 'heater' },
  { text: 'Rear seat', part: 'seat' },
  { text: 'Hubcaps', part: 'hubcaps' },
  { text: 'Spare wheel', part: 'spare' },
  { text: 'Passenger door', part: 'door' },
  { text: 'Paint (primer only)', part: 'paint' },
  { text: 'Bonnet (cardboard substituted)', part: 'bonnet' },
  { text: 'Roof (cardboard substituted)', part: 'roof' },
  { text: 'Headlamps (one)', part: 'lamp' },
  { text: 'Driver\'s door (cardboard substituted)', part: 'driverDoor' },
  { text: 'Fourth wheel', part: 'wheel' },
];

export const TEXT = {
  dept: 'Office of Personal Motoring',
  title: 'THE TRABANT LIST',
  delivery: 'DELIVERY EXPECTED',
  wait: 'YEARS TO WAIT',
  position: 'YOUR PLACE ON THE LIST',
  spec: 'SPECIFICATION',
  inventory: 'YOUR GOODS',
  market: 'THIS YEAR\'S OFFERS',
  endYear: 'END THE YEAR',
  trade: 'TRADE',
  wants: 'WANTS',
  gives: 'GIVES',
  years: (n) => `${n} YEAR${n === 1 ? '' : 'S'} OFF THE LIST`,
  empty: 'Nothing. Something will turn up.',
  allocation: (it) => `This year you received: ${it.name.toLowerCase()} (${it.note}).`,
  intro: {
    no: 'PM-1977/03',
    from: 'Office of Personal Motoring',
    subject: 'Your order for one (1) motor car',
    body: [
      'Your order has been received and entered on the list. Your car will be delivered in 1989. Please do not telephone. You do not have a telephone.',
      'Citizens may improve their position through the usual channels. There are no usual channels. Everyone uses them.',
      'Trade what you are given. Each year you save will be taken from the car, which has been designed to accommodate this.',
    ],
    button: 'JOIN THE LIST',
  },
  revision: {
    no: (n) => `PM-REV-${String(n).padStart(2, '0')}`,
    subject: 'Revised specification',
    body: (lost, years) => [
      `In recognition of your accelerated delivery (${years} year${years === 1 ? '' : 's'}), your car has been revised. The following item${lost.length === 1 ? ' has' : 's have'} been removed for your convenience:`,
      lost.map((d) => `· ${d.text}`).join('  '),
      'The car remains a car, as defined.',
    ],
    button: 'ACCEPT THE CAR',
  },
  arrival: {
    no: 'PM-DELIVERY',
    subject: 'Your car has arrived',
    body: (year, kept, total) => [
      `Your car was delivered in ${year}. It retains ${kept} of its ${total} original features.`,
      kept === total ? 'It is complete in every respect, and you have been waiting for it for twelve years. Congratulations.' : 'The missing features have been recorded as delivered. The cardboard is of the highest quality and should not be rained on.',
      'You have been awarded the Medal for Patient Motoring.',
    ],
    stamp: 'DELIVERED',
    button: 'COLLECT THE CAR',
  },
};

export const NEWSPAPER = {
  headline: (year) => `CITIZEN TAKES DELIVERY OF CAR, ${year}`,
  fullHeadline: 'CITIZEN RECEIVES CAR ON 9 NOVEMBER 1989, DRIVES IT WEST THE SAME EVENING',
  deck: (pct) => `Vehicle described as "${pct}% car"; list shortened by one`,
  columns: [
    'A citizen has taken delivery of a motor car after {w} years on the list, demonstrating that the list works.',
    'The vehicle was presented in a ceremony at the dealership. Experts confirmed that it was at least partly a car, and that the parts which were not a car were folded correctly.',
  ],
  sidebar: (o) => ({ title: 'THE CAR IN FIGURES', items: [`Years waited: ${o.waited}`, `Features: ${o.kept} of ${o.total}`, `Doors: ${o.doors}`, `Wheels: ${o.wheels}`] }),
  caption: 'The new car, shortly after delivery.',
};
