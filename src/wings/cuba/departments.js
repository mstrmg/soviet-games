// CUBA WING · Ministry of Permanent Revolution. Same pattern as hub/departments.js.
// The delegation is still arriving: the wing is locked in the Hall until its lobby is built.
export const DEPARTMENTS = [
  {
    id: 'spare-parts',
    number: 1,
    title: 'SPARE PARTS',
    dept: 'Office of Automotive Continuity',
    blurb: 'Keep a 1957 car running until 2017. The parts were never imported. The inspection only checks the colour.',
    status: 'UNDER CONSTRUCTION',
    medal: 'Order of the Improvised Carburettor',
    poster: { motif: 'car', slogan: 'IT STILL RUNS!', sub: 'MOSTLY' },
  },
  {
    id: 'ration-book',
    number: 2,
    title: 'RATION BOOK',
    dept: 'Office of Theoretical Supply',
    blurb: 'The book lists what the family is entitled to. The shop lists what it has. Plan the month.',
    status: 'UNDER CONSTRUCTION',
    medal: 'Medal of Full Nutrition (On Paper)',
    poster: { motif: 'book', slogan: 'EVERYONE FED!', sub: 'ACCORDING TO THE BOOK' },
  },
  {
    id: 'the-speech',
    number: 3,
    title: 'THE SPEECH',
    dept: 'Office of the Stenographer',
    blurb: 'Seven hours. Every word recorded. Every applause line applauded. Stay awake.',
    status: 'UNDER CONSTRUCTION',
    medal: 'Order of the Open Eyes',
    poster: { motif: 'mic', slogan: 'HE WILL CONTINUE!', sub: 'HOUR SIX OF SEVEN' },
  },
];

export const LOBBY_NOTICES = [
  'NO HAY: soap, cooking oil, light bulbs, notices.',
  'The mural will be finished as soon as the paint arrives. The paint will arrive as soon as the mural is finished.',
  'The ceiling fan is running at revolutionary speed.',
  'The car in the lobby is not for sale. It is also not for driving. It is for keeping.',
];

export const LOBBY = {
  wing: 'cuba',
  masthead: { kicker: 'Fraternal Wing · Republic of Cuba', title: ['MINISTRY OF', 'PERMANENT REVOLUTION'], sub: 'Supplies arriving shortly since 1961' },
  admission: {
    no: 'PR-0001',
    from: 'Committee for the Defence of the Lobby',
    subject: 'Admission to the Ministry of Permanent Revolution',
    body: [
      'Welcome, compañero. The Ministry has been expecting you, and also expecting a delivery of paper, so this memo is written on the back of an older one.',
      'Three offices await you. Each is open, in principle.',
    ],
    button: 'ENTER, IN PRINCIPLE',
  },
  banner: 'THE REVOLUTION CONTINUES  ★  THE PAINT IS COMING',
  nameplate: ['THE COMANDANTE', 'SPEAKING SHORTLY'],
  portrait: { bg: ['#2a6a4a', '#123020'], suit: '#5a6a3a', collar: 'tunic', hair: '#2a2522', moustache: true, medalRows: 0, mouth: 'flat' },
  wallTint: 0xbfe0d8,
};
