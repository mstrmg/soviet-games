// MASS GAMES — the images, the colours, and the words.
// Each participant holds a book of coloured cards. When their conductor signals, everyone in that
// row (or column) turns to the next page. The pages run through the image's colours in order.
// Images are drawn with one letter per card; `colours` is the page order.

export const COLOURS = {
  W: 0xf2ede0,
  R: 0xc1272d,
  K: 0x1b1a18,
  Y: 0xe9b949,
  B: 0x2a5ca8,
  G: 0x3f8a4a,
};

export const IMAGES = [
  {
    id: 'tractor',
    title: 'THE TRACTOR',
    colours: ['W', 'R', 'K'],
    signals: ['rows'],
    seconds: 100,
    memo: [
      'Image one: a tractor. Only the row conductors are on duty. Each signal turns a whole row to its next page: white, red, black, and round again.',
      'Click a row conductor\'s flag to signal. Right-click to signal the row back a page. The participants cannot see the image. You can.',
    ],
    art: [
      'WWWWWWWWWWWWWWWW',
      'WWWWRRRRWWWWWWWW',
      'WWWWRWWRWWWWKWWW',
      'WWWWRWWRWWWWKWWW',
      'WRRRRRRRRRRRRRWW',
      'WRRRRRRRRRRRRRRW',
      'WKKKKRRRRRRRKKKW',
      'KKWWKKWWWWWKKWKK',
      'WKKKKWWWWWWWKKKW',
    ],
  },
  {
    id: 'rocket',
    title: 'THE ROCKET',
    colours: ['B', 'W', 'R', 'Y'],
    signals: ['rows', 'cols'],
    seconds: 150,
    memo: [
      'Image two: a rocket, the first of its kind. Column conductors have joined the row conductors. A participant obeys both.',
      'Four pages now: blue, white, red, yellow. Settle one edge first and the rest follows. That is also the Ministry\'s approach to history.',
    ],
    art: [
      'BBBBBBBRRBBBBBBB',
      'BWBBBBRWWRBBBBBB',
      'BBBBBBWWWWBBBBWB',
      'BBBBBBWRRWBBBBBB',
      'BBBBBBWWWWBBBBBB',
      'BBBWBBWWWWBBBBBB',
      'BBBBBRWWWWRBBBBB',
      'BBBBRRWWWWRRBBBB',
      'BBBBBBYYYYBBBBWB',
      'BBBBBBBYYBBBBBBB',
    ],
  },
  {
    id: 'leader',
    title: 'THE LEADER, SMILING',
    colours: ['R', 'K', 'Y', 'W'],
    signals: ['rows', 'cols'],
    seconds: 200,
    memo: [
      'Image three: the Leader, smiling. The smile has been approved by a committee and must be exact to the card.',
      'The number of chins has also been approved. It is classified. Do not count them; form them.',
    ],
    art: [
      'RRRRRRRRRRRRRRRR',
      'RRRRRKKKKKKRRRRR',
      'RRRRKKKKKKKKRRRR',
      'RRRKKKKKKKKKKRRR',
      'RRRKYYYYYYYYKRRR',
      'RRRYYKKYYKKYYRRR',
      'RRRYYWKYYWKYYRRR',
      'RRRYYYYYKYYYYRRR',
      'RRRYYWWWWWWYYRRR',
      'RRRRYYWWWWYYRRRR',
      'RRRRRYYYYYYRRRRR',
      'RRRRKKKKKKKKRRRR',
    ],
  },
];

export const TEXT = {
  dept: 'Office of Spontaneous Celebration',
  memo: {
    no: 'SC-2/01',
    subject: 'Tonight\'s mass games',
    body: [
      'One hundred thousand participants will form three images for a visiting delegation. (Shown: the ones nearest the box.)',
      'Each participant holds a book of coloured cards and turns one page when their conductor signals. They do not look up. They do not need to.',
      'Every card must be correct when the time runs out. One wrong card and the whole image is reviewed, and rehearsed again until it is not.',
    ],
    button: 'TAKE THE CONDUCTOR\'S BOX',
  },
  correct: 'The image is correct. The delegation applauds. The participants do not see it; they are behind it.',
  reviewed: (n) => `${n === 1 ? 'One card was' : `${n} cards were`} wrong. The image has been reviewed. The participants will rehearse it again from the beginning.`,
  early: 'Present the image now? The delegation will look at it immediately.',
};

export const NEWSPAPER = {
  masthead: 'THE GLORIOUS DAILY',
  motto: 'ORGAN OF THE OFFICE OF SPONTANEOUS CELEBRATION',
  date: 'THE MORNING AFTER THE GAMES',
  price: 'FREE.',
  headline: (good) => (good ? '100,000 HEARTS, ONE IMAGE' : '100,000 HEARTS, ONE IMAGE, EVENTUALLY'),
  deck: 'Mass games astonish visiting delegation; not one card out of place',
  columns: (r) => [
    'Last night one hundred thousand participants formed images of a tractor, a rocket and the Leader, smiling, for a visiting delegation, who applauded for the length of time that had been agreed.',
    `The participants, who rehearsed for eleven months, report that they did not see the images but are told they were magnificent. ${r.reviews ? `${r.reviews === 1 ? 'One image was' : `${r.reviews} images were`} reviewed during the evening and found to be correct on the second viewing.` : 'No image required review.'}`,
    'The conductor has been commended. The conductor\'s whistle has been retired and will be displayed in the Museum of the Correct Card.',
  ],
  sidebar: (r) => ({
    title: 'THE EVENING IN FIGURES',
    items: ['Participants: 100,000', `Signals given: ${r.signals}`, `Images reviewed: ${r.reviews}`, 'Participants who looked up: 0', 'Chins: as approved'],
  }),
  caption: 'The east stand, forming the third image. Participants are behind it.',
};

export const REVIEWS_ALLOWED = 2; // more than this and the medal goes to someone else
