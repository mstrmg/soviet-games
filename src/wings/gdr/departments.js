// EAST GERMANY WING · Ministry for Things Being Fine. Same pattern as hub/departments.js.
export const DEPARTMENTS = [
  {
    id: 'trabant-list',
    number: 1,
    title: 'THE TRABANT LIST',
    dept: 'Office of Personal Motoring',
    blurb: 'Your car will be delivered in twelve years. It could be sooner. It could be less of a car.',
    status: 'OPEN · TWELVE YEARS',
    medal: 'Medal for Patient Motoring',
    poster: { motif: 'car', slogan: 'YOUR CAR!', sub: 'DELIVERY ANTICIPATED' },
  },
  {
    id: 'listening-post',
    number: 2,
    title: 'LISTENING POST',
    dept: 'Office of Attentive Listening',
    blurb: 'Apartment 4B makes soup. Report it in a way that justifies the microphones.',
    status: 'OPEN · FOUR DAYS',
    medal: 'Order of the Diligent Ear',
    poster: { motif: 'ear', slogan: 'WE LISTEN!', sub: 'SO YOU DON\'T HAVE TO' },
  },
  {
    id: 'press-conference',
    number: 3,
    title: 'THE PRESS CONFERENCE',
    dept: 'Office of Official Statements',
    blurb: 'You have been handed a note. You have not read the note. The cameras are on.',
    status: 'OPEN · ONE EVENING',
    medal: 'Medal for Immediate Effect (posthumous)',
    poster: { motif: 'microphone', slogan: 'NO COMMENT!', sub: 'EFFECTIVE IMMEDIATELY' },
  },
];

export const LOBBY_NOTICES = [
  'Everything is fine. This notice is part of everything.',
  'The rubber plant is not listening. The rubber plant has been asked to stop listening.',
  'Waiting times for waiting-list registration: 4 years.',
  'Visitors are reminded to be pleased.',
  'The tape recorders are for your convenience.',
];

export const LOBBY = {
  wing: 'gdr',
  masthead: { kicker: 'Fraternal Wing · German Democratic Republic', title: ['MINISTRY FOR', 'THINGS BEING FINE'], sub: 'Opening hours: as announced' },
  admission: {
    no: 'MF-0001/a',
    from: 'Reception, Floor 1 (of 1)',
    subject: 'Admission to the Ministry for Things Being Fine',
    body: [
      'Good afternoon. Your visit was expected and has been entered in the file of expected visits.',
      'Three offices are open to you. Please do not be surprised by anything. Surprise is processed on Thursdays.',
      'Kindly sign the visitors\' book. The visitors\' book will be read.',
    ],
    button: 'SIGN THE BOOK',
  },
  banner: 'EVERYTHING IS FINE  ★  WE ARE PLEASED  ★  YOU ARE PLEASED',
  nameplate: ['THE GENERAL SECRETARY FOR THINGS', 'IN OFFICE SINCE BEFORE OFFICES'],
  portrait: { bg: ['#9a958b', '#45433f'], suit: '#6b665c', collar: 'tie', hair: '#b9b4aa', moustache: false, glasses: true, medalRows: 1 },
  wallTint: 0xe9dcc0,
};
