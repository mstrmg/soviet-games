// SPARE PARTS — six decades of failures, a junkyard, and the words.
// Each decade one or two parts fail. A failure lists what the replacement must do (needs);
// each piece of junk lists what it can do (tags). A piece fits if it has every need.
// A piece used once is part of the car for ever. Wrong guesses cost months off the road.

export const TAGS = {
  pumps: 'pumps liquid',
  small: 'fits under the bonnet',
  grips: 'grips',
  round: 'round',
  light: 'makes light',
  waterproof: 'waterproof',
  water: 'holds water',
  metal: 'metal',
  soft: 'soft',
  sits: 'takes a person',
  rubber: 'rubber',
  air: 'holds air',
  flat: 'flat',
  opens: 'opens and closes',
  teeth: 'has teeth',
  turns: 'turns',
  strong: 'strong',
  big: 'big',
  air2: 'pumps air',
  heavy: 'very heavy',
  cold: 'keeps things cold',
  ideology: 'ideologically sound',
};

// Failures: slot decides where on the car it is. needs: tags required.
export const DECADES = [
  {
    year: 1962,
    title: 'THE FUEL PUMP',
    memo: 'The embargo has begun. The fuel pump has heard about it and stopped. Parts will not be arriving, from anywhere, for some time.',
    fails: [{ slot: 'pump', name: 'Fuel pump', needs: ['pumps', 'small'] }],
    junk: ['tractor-pump', 'aquarium-pump', 'bicycle-pump', 'kettle', 'shoelace', 'portrait'],
  },
  {
    year: 1971,
    title: 'THE BRAKES AND A HEADLIGHT',
    memo: 'The brakes have worn through to the idea of brakes. A headlight has also gone, in sympathy.',
    fails: [
      { slot: 'brakes', name: 'Front brakes', needs: ['grips', 'round'] },
      { slot: 'headlight', name: 'Headlight', needs: ['light', 'waterproof'] },
    ],
    junk: ['sandal-soles', 'jar-lid', 'torch-in-jar', 'desk-lamp', 'record', 'portrait'],
  },
  {
    year: 1983,
    title: 'THE RADIATOR AND THE DRIVER\'S SEAT',
    memo: 'The radiator is leaking and the driver\'s seat has gone through to the road. A fraternal shipment has arrived: it is entirely Soviet.',
    fails: [
      { slot: 'radiator', name: 'Radiator', needs: ['water', 'metal'] },
      { slot: 'seat', name: 'Driver\'s seat', needs: ['soft', 'sits'] },
    ],
    junk: ['fridge-coil', 'fish-tank', 'armchair', 'tractor-seat', 'pillow', 'samovar'],
  },
  {
    year: 1994,
    title: 'A TYRE AND A DOOR',
    memo: 'This is the Special Period. Everything is special. A tyre has burst and the passenger door has left the car to look for food.',
    fails: [
      { slot: 'tyre', name: 'Rear tyre', needs: ['rubber', 'round', 'air'] },
      { slot: 'door', name: 'Passenger door', needs: ['flat', 'opens', 'metal'] },
    ],
    junk: ['inner-tube', 'garden-hose', 'fridge-door', 'oven-door', 'bicycle-pump', 'football'],
  },
  {
    year: 2005,
    title: 'THE GEARBOX',
    memo: 'The gearbox has stopped choosing gears and now accepts whichever one it is given. This is considered progress, but the car will not move.',
    fails: [{ slot: 'gearbox', name: 'Gearbox', needs: ['teeth', 'turns', 'strong'] }],
    junk: ['washing-motor', 'bike-gears', 'lada-gearbox', 'clock-works', 'cement-mixer', 'portrait'],
  },
  {
    year: 2014,
    title: 'THE ENGINE',
    memo: 'The engine, which has been the engine since 1957, has died of natural causes. It will be remembered. The car must go on without it.',
    fails: [{ slot: 'engine', name: 'Engine', needs: ['turns', 'strong', 'big'] }],
    junk: ['washing-motor', 'tractor-engine', 'boat-engine', 'generator', 'cement-mixer', 'fan'],
  },
];

// The junkyard. model: shape mounted on the car; colour hex; line: said when fitted.
export const JUNK = {
  'tractor-pump': { name: 'Soviet tractor pump', tags: ['pumps', 'metal', 'heavy', 'big'], model: 'cyl', colour: 0x4a6a3a, line: '' },
  'aquarium-pump': { name: 'Aquarium pump', tags: ['pumps', 'small', 'waterproof'], model: 'box', colour: 0x3a7a9a, line: 'The fish have been informed.' },
  'bicycle-pump': { name: 'Bicycle pump', tags: ['air2', 'small', 'metal'], model: 'cyl', colour: 0x9a9a9a, line: '' },
  kettle: { name: 'Kettle', tags: ['water', 'metal', 'small'], model: 'cyl', colour: 0xb8b8b0, line: '' },
  shoelace: { name: 'A shoelace', tags: ['soft', 'small'], model: 'box', colour: 0x2a2a2a, line: '' },
  portrait: { name: 'Framed portrait (spare)', tags: ['flat', 'ideology'], model: 'panel', colour: 0xd4a72c, line: '' },
  'sandal-soles': { name: 'Two sandal soles', tags: ['grips', 'rubber', 'flat'], model: 'disc', colour: 0x6a4a2a, line: '' },
  'jar-lid': { name: 'Jam-jar lids, glued', tags: ['round', 'metal'], model: 'disc', colour: 0xc0c0c0, line: '' },
  'torch-in-jar': { name: 'Torch in a pickle jar', tags: ['light', 'waterproof', 'round'], model: 'cyl', colour: 0xe8e0a0, line: 'The pickles are in the glovebox.' },
  'desk-lamp': { name: 'Desk lamp', tags: ['light', 'metal'], model: 'cyl', colour: 0x2a6a4a, line: '' },
  record: { name: 'A vinyl record', tags: ['round', 'flat', 'grips'], model: 'disc', colour: 0x111111, line: 'Side B now stops the car.' },
  'fridge-coil': { name: 'Back of a Soviet fridge', tags: ['water', 'metal', 'cold', 'flat'], model: 'panel', colour: 0x8a8a80, line: 'The engine is now kept at 4°C.' },
  'fish-tank': { name: 'Fish tank', tags: ['water', 'waterproof'], model: 'box', colour: 0x7fb8c8, line: '' },
  armchair: { name: 'Armchair from the Party office', tags: ['soft', 'sits', 'big', 'ideology'], model: 'box', colour: 0x7a2a2a, line: 'It still reports to the Party office on Thursdays.' },
  'tractor-seat': { name: 'Tractor seat', tags: ['sits', 'metal'], model: 'disc', colour: 0x4a6a3a, line: '' },
  pillow: { name: 'A pillow', tags: ['soft'], model: 'box', colour: 0xf2ede0, line: '' },
  samovar: { name: 'Samovar', tags: ['water', 'metal', 'ideology'], model: 'cyl', colour: 0xd4a72c, line: 'The radiator now makes tea. The tea is the radiator.' },
  'inner-tube': { name: 'Tractor inner tube', tags: ['rubber', 'round', 'air'], model: 'disc', colour: 0x1a1a1a, line: '' },
  'garden-hose': { name: 'Garden hose, coiled', tags: ['rubber', 'round', 'water'], model: 'disc', colour: 0x2f8a3a, line: '' },
  'fridge-door': { name: 'Fridge door', tags: ['flat', 'opens', 'metal', 'cold'], model: 'panel', colour: 0xe8e6dc, line: 'The passenger now rides with a light on.' },
  'oven-door': { name: 'Oven door', tags: ['flat', 'opens', 'heavy'], model: 'panel', colour: 0x2a2a2a, line: '' },
  football: { name: 'A football', tags: ['round', 'air', 'rubber', 'small'], model: 'sphere', colour: 0xf2ede0, line: '' },
  'washing-motor': { name: 'Washing-machine motor', tags: ['turns', 'small', 'metal'], model: 'cyl', colour: 0xd8d8d0, line: '' },
  'bike-gears': { name: 'Bicycle gears', tags: ['teeth', 'turns', 'small'], model: 'disc', colour: 0x9a9a9a, line: '' },
  'lada-gearbox': { name: 'Gearbox from a Lada', tags: ['teeth', 'turns', 'strong', 'ideology'], model: 'box', colour: 0x6a6a5a, line: 'Fourth gear is now reverse. Reverse is a rumour.' },
  'clock-works': { name: 'Church clock mechanism', tags: ['teeth', 'turns'], model: 'disc', colour: 0xb08d3c, line: '' },
  'cement-mixer': { name: 'Cement mixer', tags: ['turns', 'strong', 'big', 'heavy'], model: 'cyl', colour: 0xc8742a, line: '' },
  'tractor-engine': { name: 'Soviet tractor engine', tags: ['turns', 'strong', 'big', 'heavy', 'metal'], model: 'box', colour: 0x4a6a3a, line: 'The car is now registered as agricultural.' },
  'boat-engine': { name: 'Outboard boat motor', tags: ['turns', 'waterproof', 'small'], model: 'cyl', colour: 0x2a4a8a, line: '' },
  generator: { name: 'Hospital generator', tags: ['turns', 'big', 'heavy'], model: 'box', colour: 0x8a8a3a, line: '' },
  fan: { name: 'Ceiling fan', tags: ['turns', 'flat'], model: 'disc', colour: 0x8a6a44, line: '' },
};

// Paint for the inspection, which only checks the colour.
export const PAINTS = [
  { name: 'Hospital green', hex: 0x6fae8a },
  { name: 'Ministry cream', hex: 0xf1e6c8 },
  { name: 'Revolutionary red (one tin)', hex: 0xc1272d },
  { name: 'Turquoise (pool)', hex: 0x3fb8b0 },
  { name: 'Ship grey', hex: 0x8a9298 },
  { name: 'School-bus yellow', hex: 0xe9b949 },
  { name: 'Pink (nobody knows)', hex: 0xe28aa8 },
  { name: 'Sky blue (left over)', hex: 0x7fb8e0 },
];

export const MONTHS_ALLOWED = 6; // wrong fits allowed for the medal

export const TEXT = {
  dept: 'Office of Automotive Continuity',
  memo: {
    no: 'AC-1/01',
    subject: 'A 1957 automobile, in perpetuity',
    body: [
      'This automobile was built in 1957 and must be kept running until further notice. Further notice is not expected.',
      'Each decade something will fail. The original parts were never imported and never will be. The junkyard is open.',
      'Drag a piece of junk onto the broken part. It fits if it does everything the work order asks. Every wrong attempt costs a month off the road.',
    ],
    button: 'OPEN THE GARAGE',
  },
  wrong: (item, missing) => `${item}: tried. The work order also requires: ${missing}. A month passes while this is established.`,
  fitted: (item) => `${item}: fitted. It is now original.`,
  inspection: {
    subject: (y) => `Annual state inspection, ${y}`,
    body: ['The inspection checks the colour only. Brakes, lights and the engine are matters of personal conviction.', 'Choose a tin of paint for one panel. Any colour will do, provided there is one.'],
    passed: 'COLOUR: PRESENT · PASSED',
  },
};

export const NEWSPAPER = {
  masthead: 'LA VERDAD REVOLUCIONARIA',
  motto: 'ORGAN OF THE OFFICE OF AUTOMOTIVE CONTINUITY',
  date: 'SIXTY YEARS AFTER 1957',
  price: '20 CENTAVOS',
  headline: 'A 1957 CAR IS STILL RUNNING, AS PLANNED',
  deck: 'Vehicle now consists of a tractor, a fridge and conviction; valued above the Ministry',
  columns: (r) => [
    `The automobile entrusted to the Office of Automotive Continuity in 1957 has completed its sixtieth year of service, having been repaired ${r.repairs} times using parts that were not available.`,
    `It now contains ${r.parts}. Inspectors confirmed that it is still ${r.colours} colour${r.colours === 1 ? '' : 's'}.`,
    r.good
      ? 'The car spent almost no time off the road. Its mechanic has been awarded the Order of the Improvised Carburettor, which is made from one.'
      : `The car spent ${r.months} months off the road awaiting improvisation. This is a national record, and has been announced as one.`,
  ],
  sidebar: (r) => ({
    title: 'THE CAR IN FIGURES',
    items: ['Original parts remaining: the horn', `Repairs: ${r.repairs}`, `Months off the road: ${r.months}`, `Colours: ${r.colours}`, 'Value: more than the Ministry'],
  }),
  caption: 'The automobile on its sixtieth birthday. Front, as far as is known, to the right.',
};
