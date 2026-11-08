// NORTH KOREA WING · Ministry of Glorious Firsts. Same pattern as hub/departments.js.
// The delegation is still arriving: the wing is locked in the Hall until its lobby is built.
export const DEPARTMENTS = [
  {
    id: 'hole-in-eleven',
    number: 1,
    title: 'HOLE IN ELEVEN',
    dept: 'Office of Sporting Records',
    blurb: 'The Leader plays his first round of golf. Every shot is a hole in one. You are the groundskeeper, and you have a flag.',
    status: 'UNDER CONSTRUCTION',
    medal: 'Order of the Obliging Green',
    poster: { motif: 'flag', slogan: '18 HOLES · 18 STROKES', sub: 'A NEW WORLD RECORD, AGAIN' },
  },
  {
    id: 'mass-games',
    number: 2,
    title: 'MASS GAMES',
    dept: 'Office of Spontaneous Celebration',
    blurb: 'Thirty thousand cards, one image. One wrong card and the whole image is reviewed.',
    status: 'UNDER CONSTRUCTION',
    medal: 'Medal of the Correct Card',
    poster: { motif: 'cards', slogan: 'ALL TOGETHER!', sub: 'EXACTLY TOGETHER' },
  },
  {
    id: 'lights-of-the-capital',
    number: 3,
    title: 'LIGHTS OF THE CAPITAL',
    dept: 'Office of Visible Prosperity',
    blurb: 'A small power budget, a large capital, and a satellite overhead every few minutes.',
    status: 'UNDER CONSTRUCTION',
    medal: 'Order of the Bright Photograph',
    poster: { motif: 'bulb', slogan: 'A BRIGHT FUTURE!', sub: 'WHEN PHOTOGRAPHED' },
  },
];

export const LOBBY_NOTICES = [
  'The march on the loudspeakers has been extended by popular demand. The demand has been extended by the march.',
  'Visitors are asked not to approach the window. The view has been arranged elsewhere.',
  'The plastic flowers are watered daily, as a precaution.',
  'Your guide will accompany you to the bathroom, and is proud to do so.',
];

export const LOBBY = {
  wing: 'dprk',
  masthead: { kicker: 'Fraternal Wing · Democratic People\'s Republic of Korea', title: ['MINISTRY OF', 'GLORIOUS FIRSTS'], sub: 'Every achievement a world first' },
  admission: {
    no: 'GF-0001',
    from: 'Your Guide (assigned)',
    subject: 'Welcome to the Ministry of Glorious Firsts',
    body: [
      'Welcome. You are the first visitor ever to enter this hall, as were all the previous ones.',
      'Your guide will remain beside you at all times, for your convenience. Please do not look out of the window. There is nothing there, and it is very impressive.',
    ],
    button: 'FOLLOW THE GUIDE',
  },
  banner: 'EVERYTHING HERE IS THE FIRST OF ITS KIND',
  nameplate: ['THE LEADER', 'FIRST IN EVERYTHING'],
  portrait: { bg: ['#1f4ea0', '#0e2350'], suit: '#2e3a34', collar: 'tunic', hair: '#1a1816', moustache: false, medalRows: 0, mouth: 'smile' },
  wallTint: 0xf4efe6,
};
