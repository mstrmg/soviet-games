// The three departments behind the three doors. Edit freely: the hub reads
// everything (door order, posters, overlay text, medal names) from here.
export const DEPARTMENTS = [
  {
    id: 'nail-quota',
    number: 1,
    title: 'NAIL QUOTA',
    dept: 'Directorate of Fasteners',
    blurb: 'Meet the quota. The quota does not say what nails are for.',
    status: 'OPEN · TEN YEARS',
    medal: 'Order of the Unbent Nail',
    poster: {
      motif: 'nail',
      slogan: 'MORE NAILS!',
      sub: 'BY WEIGHT · BY COUNT · BY DECREE',
    },
  },
  {
    id: 'pravda-editor',
    number: 2,
    title: 'PRAVDA EDITOR',
    dept: 'Directorate of Correct Information',
    blurb: 'Bad news arrives at six. The presses roll at seven. Make it good news.',
    status: 'OPEN · THREE ACTS',
    medal: 'Medal for Correct Information',
    poster: {
      motif: 'megaphone',
      slogan: 'THE TRUTH',
      sub: 'IS WHAT WE PRINT',
    },
  },
  {
    id: 'potemkin-village',
    number: 3,
    title: 'POTEMKIN VILLAGE',
    dept: 'Directorate of Rural Appearances',
    blurb: 'The Inspector arrives tomorrow. He will see the village from his car. Only from his car.',
    status: 'OPEN · ONE VILLAGE',
    medal: 'Order of the Painted Fence',
    poster: {
      motif: 'village',
      slogan: 'PROSPERITY!',
      sub: 'NOW VISIBLE FROM THE ROAD',
    },
  },
];

// Things the lobby says while you stand in it.
export const LOBBY_NOTICES = [
  'The queue is moving at the planned rate of zero citizens per hour.',
  'The Minister is watching you enjoy yourself. Continue.',
  'Repairs to the ceiling are scheduled for the next Five-Year Plan.',
  'Leisure is labour. Labour is leisure. Both are mandatory.',
  'The clock is four minutes ahead of plan.',
  'Citizens are reminded that the Enquiries window has always been closed.',
];

// How this wing's lobby dresses itself. The other wings have their own (src/wings/*/departments.js).
export const LOBBY = {
  wing: 'ussr',
  masthead: { kicker: "People's Directorate of Approved Leisure", title: ['MINISTRY', 'OF GAMES'], sub: 'Est. 1922 · Rebuilt 1946 · Repairs scheduled' },
  admission: {
    no: '000001',
    from: 'Duty Officer, Main Lobby',
    subject: 'Admission to the Ministry of Games',
    body: [
      'You are expected. You have always been expected.',
      'Beyond this lobby are three Departments of Approved Leisure. Each is entirely voluntary. Attendance will be recorded.',
      'Please present your permit to the officer, who is on lunch.',
    ],
    button: 'PRESENT PERMIT',
  },
  banner: 'LEISURE IS LABOUR  ★  LABOUR IS LEISURE  ★  FULFIL THE PLAN FOR FUN',
  nameplate: ['THE MINISTER OF GAMES', 'UNDEFEATED SINCE 1953'],
  portrait: {},
  wallTint: 0xffffff,
};
