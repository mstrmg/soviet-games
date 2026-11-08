// LIGHTS OF THE CAPITAL — the grid, the nights, and what is said about them.
// The map is seen from above: x east, z south. Each district draws megawatts when lit.
// Cameras (a foreign satellite, a fraternal delegation) photograph whatever is in their frame;
// a photograph is as bright as the share of its districts that are lit. Only photographs count.

export const DISTRICTS = [
  // the capital: five districts, twice as bright, twice as hungry
  { id: 'cap-1', name: 'Capital · Victory Avenue', x: -2.6, z: 1.2, mw: 8, capital: true },
  { id: 'cap-2', name: 'Capital · Monument Square', x: -1.2, z: 0.4, mw: 8, capital: true },
  { id: 'cap-3', name: 'Capital · Tower District', x: -1.4, z: 2.0, mw: 8, capital: true },
  { id: 'cap-4', name: 'Capital · Riverside', x: -0.1, z: 1.4, mw: 8, capital: true },
  { id: 'cap-5', name: 'Capital · Stadium', x: -2.3, z: 2.9, mw: 8, capital: true },
  // the residence is always on. It has its own line. It is not on the meter.
  { id: 'res', name: 'The Residence', x: -0.6, z: 3.2, mw: 0, capital: true, locked: true },
  // the rest of the country
  { id: 't-1', name: 'Model Town No. 1', x: -5.5, z: -9.5, mw: 5 },
  { id: 't-2', name: 'Model Town No. 2', x: 1.5, z: -10.5, mw: 5 },
  { id: 't-3', name: 'Model Town No. 3', x: 5.8, z: -7, mw: 5 },
  { id: 't-4', name: 'Steelworks', x: -4.2, z: -5, mw: 5 },
  { id: 't-5', name: 'Port Town', x: -6.2, z: -1.5, mw: 5 },
  { id: 't-6', name: 'Model Town No. 4', x: 3.5, z: -3.2, mw: 5 },
  { id: 't-7', name: 'Collective Farm "Dawn"', x: 6.6, z: 0.5, mw: 5 },
  { id: 't-8', name: 'Fishing Town', x: 5.2, z: 4.8, mw: 5 },
  { id: 't-9', name: 'Model Town No. 5', x: 2.2, z: 7.6, mw: 5 },
  { id: 't-10', name: 'Cement Works', x: -3.6, z: 7.8, mw: 5 },
  { id: 't-11', name: 'Border Town', x: -0.4, z: 11.2, mw: 5 },
];

// Events: a satellite band sweeps the map (axis 'z' = north to south, 'x' = west to east;
// width in map units), or a delegation photographs one place (district ids) from a bus.
export const NIGHTS = [
  {
    title: 'NIGHT ONE',
    budget: 40,
    length: 82,
    memo: [
      'Foreign satellites photograph the country at night. In their photographs the capital must blaze.',
      'You have forty megawatts. That is enough, provided nobody uses it. Click a district to switch it on or off; lights take a moment to warm up.',
      'Watch the schedule. When a camera is overhead, light what is in its frame. What is not in the frame does not need to exist.',
    ],
    events: [
      { at: 6, type: 'sat', axis: 'z', width: 6, dur: 12, from: -14, to: 14 },
      { at: 28, type: 'deleg', ids: ['t-6'], dur: 8, name: 'A fraternal delegation photographs Model Town No. 4' },
      { at: 44, type: 'sat', axis: 'z', width: 6, dur: 12, from: 14, to: -14 },
      { at: 64, type: 'deleg', ids: ['cap-1', 'cap-2', 'cap-3', 'cap-4', 'cap-5'], dur: 10, name: 'The delegation photographs the capital from the tower' },
    ],
  },
  {
    title: 'NIGHT TWO',
    budget: 35,
    length: 90,
    memo: [
      'Last night\'s photographs were very bright. The power budget has been reduced to thirty-five megawatts in celebration.',
      'Two cameras may be overhead at once. The delegation is touring the model towns by bus. The satellite has not been informed of the tour.',
    ],
    events: [
      { at: 6, type: 'deleg', ids: ['t-1'], dur: 7, name: 'The delegation photographs Model Town No. 1' },
      { at: 12, type: 'sat', axis: 'x', width: 5, dur: 14, from: -11, to: 11 },
      { at: 34, type: 'deleg', ids: ['t-3', 't-6'], dur: 8, name: 'The delegation photographs two model towns from a hill' },
      { at: 40, type: 'sat', axis: 'z', width: 7, dur: 12, from: -14, to: 14 },
      { at: 64, type: 'deleg', ids: ['t-9', 'cap-4'], dur: 8, name: 'The delegation photographs the river, both banks' },
      { at: 74, type: 'sat', axis: 'x', width: 6, dur: 12, from: 11, to: -11 },
    ],
  },
  {
    title: 'NIGHT THREE',
    budget: 28,
    length: 96,
    memo: [
      'The budget is now twenty-eight megawatts. A new satellite has been launched by an unfriendly country. It is faster and it does not blink.',
      'This is the last night of the visit. The final photograph will be on the front page of every foreign newspaper, and ours.',
    ],
    events: [
      { at: 5, type: 'sat', axis: 'z', width: 5, dur: 9, from: 14, to: -14 },
      { at: 18, type: 'deleg', ids: ['t-4', 't-5'], dur: 8, name: 'The delegation photographs the Steelworks and the Port' },
      { at: 26, type: 'sat', axis: 'x', width: 5, dur: 10, from: -11, to: 11 },
      { at: 44, type: 'deleg', ids: ['t-8', 't-7'], dur: 7, name: 'The delegation photographs the coast' },
      { at: 52, type: 'sat', axis: 'z', width: 6, dur: 9, from: -14, to: 14 },
      { at: 70, type: 'sat', axis: 'x', width: 5, dur: 10, from: 11, to: -11 },
      { at: 82, type: 'deleg', ids: ['cap-1', 'cap-2', 'cap-3', 'cap-4', 'cap-5'], dur: 10, name: 'The final photograph: the capital, from the tower' },
    ],
  },
];

export const WARM_UP = 1.2; // seconds for a district to come fully on
export const PASS_MARK = 60; // average photograph brightness for the medal

export const TEXT = {
  dept: 'Office of Visible Prosperity',
  memoNo: (i) => `VP-3/0${i + 1}`,
  noPower: 'Insufficient megawatts. Switch something off first. Something else.',
  locked: 'The Residence is always on. It is not on the meter.',
  photo: (pct) => (pct >= 90 ? 'A dazzling photograph.' : pct >= 70 ? 'A bright photograph.' : pct >= 40 ? 'A dim photograph. It will be retouched.' : 'A dark photograph. It has been lost.'),
  satIncoming: 'A foreign satellite is passing over.',
  nightEnd: (pct) => `The night is over. Photographs taken: average brightness ${pct}%. The rest of the country was not photographed and is therefore fine.`,
};

export const NEWSPAPER = {
  masthead: 'THE GLORIOUS DAILY',
  motto: 'ORGAN OF THE OFFICE OF VISIBLE PROSPERITY',
  date: 'THE MORNING AFTER THREE BRIGHT NIGHTS',
  price: 'FREE.',
  headline: (good) => (good ? 'CAPITAL VISIBLE FROM SPACE' : 'CAPITAL VISIBLE FROM SPACE, WITH RETOUCHING'),
  deck: 'Foreign satellites confirm brilliance of the capital; rest of country not photographed',
  columns: (r) => [
    `Satellite photographs taken over three nights show the capital blazing with light, at an average brightness of ${r.avg}%. Foreign experts described the images as "the brightest thing in the region," which is accurate.`,
    'Visiting delegates toured several model towns by night and reported that every town they saw was lit.',
    'Asked about the dark areas between the lights, the Ministry explained that there are no dark areas between the lights, as the photographs show.',
  ],
  sidebar: (r) => ({
    title: 'THE GRID IN FIGURES',
    items: [`Photographs taken: ${r.photos}`, `Average brightness: ${r.avg}%`, `Switches thrown: ${r.switches}`, 'The Residence: on', 'Everything else: as required'],
  }),
  caption: 'The country at night, as photographed. Lights not shown are not shown.',
};
