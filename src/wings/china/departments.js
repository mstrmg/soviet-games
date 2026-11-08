// CHINA WING · Bureau of the Great Leap. Three departments, same pattern as hub/departments.js.
export const DEPARTMENTS = [
  {
    id: 'backyard-furnace',
    number: 1,
    title: 'BACKYARD FURNACE',
    dept: 'Bureau of Domestic Steel',
    blurb: 'Every household a steelworks. Every wok a contribution. Every harvest somebody else\'s concern.',
    status: 'UNDER CONSTRUCTION',
    medal: 'Order of the Glowing Furnace',
    poster: { motif: 'furnace', slogan: 'MORE STEEL!', sub: 'FROM EVERY KITCHEN' },
  },
  {
    id: 'launch-a-satellite',
    number: 2,
    title: 'LAUNCH A SATELLITE',
    dept: 'Bureau of Agricultural Estimates',
    blurb: 'Report the biggest harvest in the province. The state will collect exactly what you report.',
    status: 'UNDER CONSTRUCTION',
    medal: 'Medal of the Record Harvest',
    poster: { motif: 'wheat', slogan: 'RECORD YIELD!', sub: 'AS REPORTED' },
  },
  {
    id: 'sparrow-campaign',
    number: 3,
    title: 'SPARROW CAMPAIGN',
    dept: 'Bureau of Pest Elimination',
    blurb: 'The sparrows eat the grain. The commune has a rifle. The quota has been announced.',
    status: 'OPEN · TWO DAYS',
    medal: 'Order of the Empty Sky',
    poster: { motif: 'sparrow', slogan: 'CLEAR SKIES!', sub: 'BY ORDER OF THE COMMUNE' },
  },
];

export const LOBBY_NOTICES = [
  'This year\'s targets have been doubled. Last year\'s targets have been doubled retroactively.',
  'The loudspeakers will now announce an announcement.',
  'Citizens who have not yet exceeded the quota are asked to begin exceeding it.',
  'The Great Leap is proceeding at a pace of one leap per leap.',
  'Lost property: one harvest. Please hand in at the furnace.',
];

export const LOBBY = {
  wing: 'china',
  masthead: { kicker: 'Fraternal Wing · People\'s Republic of China', title: ['BUREAU OF', 'THE GREAT LEAP'], sub: 'Targets revised upward daily' },
  admission: {
    no: 'GL-0001',
    from: 'Duty Cadre, Reception Hall',
    subject: 'Admission to the Bureau of the Great Leap',
    body: [
      'Welcome. You have arrived ahead of schedule, which has been noted as a target for everyone else.',
      'Three bureaux await you. Each has a quota. Each quota has a quota.',
      'Please register your enthusiasm at the desk.',
    ],
    button: 'REGISTER ENTHUSIASM',
  },
  banner: 'MORE  ★  FASTER  ★  BETTER  ★  MORE AGAIN',
  nameplate: ['THE CHAIRMAN OF THE BUREAU', 'TARGETS SET PERSONALLY'],
  portrait: { bg: ['#a8322d', '#4a1210'], suit: '#5d6152', collar: 'tunic', hair: '#2a2522', moustache: false, medalRows: 0, mouth: 'smile' },
  wallTint: 0xf2c8b0,
};
