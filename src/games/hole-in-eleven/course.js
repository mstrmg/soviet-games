// HOLE IN ELEVEN — the course, the eighteen shots, and everything said about them.
// Coordinates in metres on the green's own plan: x across, z toward the tee (+z).
// The tee is off the bottom of the screen; every shot arrives from there.

/** The ground: what a ball does when it lands on it. friction in m/s² while rolling. */
export const SURFACES = {
  green: { friction: 2.6, bounce: 0.35 },
  rough: { friction: 7.5, bounce: 0.2 },
  bunker: { friction: 60, bounce: 0 },
  pond: { friction: Infinity, bounce: 0 }, // it sinks where it lands
};

export const COURSE = {
  green: { x: 0, z: -1, rx: 9.5, rz: 7 },
  bunkers: [
    { x: -9.5, z: 4.5, r: 2.4 },
    { x: 7.5, z: -9.5, r: 2 },
  ],
  pond: { x: 12.5, z: 3.5, r: 3.4 },
  tee: { x: 0, z: 46 }, // off screen
  bounds: { x: 24, zMin: -16, zMax: 13 }, // where the groundskeeper is allowed to run
};

// One entry per hole. aim: where the Leader means to hit it. spread: how far from the aim it lands
// (metres, roughly). roll: speed off the bounce. hook: how far the flight curves sideways.
// special: a scripted misfortune, announced by loudspeaker.
export const HOLES = [
  { yards: 142, par: 3, aim: [0, -1], spread: 1.5, roll: 2.5, hook: 0 },
  { yards: 365, par: 4, aim: [2, -3], spread: 2.2, roll: 3, hook: 0 },
  { yards: 178, par: 3, aim: [-3, 0], spread: 2.6, roll: 3, hook: 0 },
  { yards: 402, par: 4, aim: [0, -2], spread: 3.2, roll: 3.5, hook: 0.5 },
  { yards: 511, par: 5, aim: [4, 1], spread: 3.6, roll: 4, hook: -1 },
  { yards: 196, par: 3, aim: [-2, -4], spread: 4, roll: 3.5, hook: 1 },
  { yards: 433, par: 4, aim: [0, 0], spread: 4.5, roll: 4.5, hook: -2, special: 'bunker' },
  { yards: 388, par: 4, aim: [3, -3], spread: 4.8, roll: 4, hook: 2 },
  { yards: 545, par: 5, aim: [0, -3], spread: 5, roll: 5, hook: 0, special: 'long' },
  { yards: 171, par: 3, aim: [-4, -1], spread: 5.2, roll: 4, hook: 2.5 },
  { yards: 420, par: 4, aim: [2, 0], spread: 5.5, roll: 5, hook: -3 },
  { yards: 398, par: 4, aim: [0, -2], spread: 5.8, roll: 5, hook: 3 },
  { yards: 220, par: 3, aim: [0, 0], spread: 6, roll: 4.5, hook: 0, special: 'backwards' },
  { yards: 455, par: 4, aim: [-3, -3], spread: 6.2, roll: 5.5, hook: -3.5 },
  { yards: 530, par: 5, aim: [3, 0], spread: 6.5, roll: 5.5, hook: 3.5 },
  { yards: 189, par: 3, aim: [0, -1], spread: 6.5, roll: 5, hook: 0, special: 'pond' },
  { yards: 444, par: 4, aim: [0, -2], spread: 7, roll: 6, hook: -4 },
  { yards: 580, par: 5, aim: [0, -1], spread: 7.5, roll: 6.5, hook: 4.5, special: 'wind' },
];

/** What the loudspeakers say, and what the generals write down. */
export const TEXT = {
  dept: 'Office of Sporting Records',
  memo: {
    no: 'SR-11/01',
    subject: 'The Leader\'s first round of golf',
    body: [
      'This morning the Leader will play golf for the first time. The result has already been announced: a round of eighteen strokes, with at least eleven holes-in-one.',
      'You are the groundskeeper. The hole is on a portable plate. Move it so that every shot goes in. Point where the hole should be; it follows as fast as you can run.',
      'Watch the ball\'s shadow. A ball that stops near the hole is in the hole. A ball that stops anywhere else will be putted until it is.',
    ],
    button: 'TAKE UP THE FLAG',
  },
  address: (h) => `HOLE ${h.n} · ${h.yards} YARDS · PAR ${h.par}`,
  specials: {
    bunker: 'The Leader has selected a more challenging line.',
    long: 'The Leader has hit the ball further than the course.',
    backwards: 'The ball has gone backwards. It has struck a commemorative plaque and is returning.',
    pond: 'The Leader has noticed the pond.',
    wind: 'There is a wind. It has not been authorised.',
  },
  ace: [
    'A HOLE-IN-ONE.',
    'ANOTHER HOLE-IN-ONE.',
    'A HOLE-IN-ONE. THE GENERALS WRITE IT DOWN.',
    'A HOLE-IN-ONE. THE PHOTOGRAPHER IS PROMOTED.',
    'A HOLE-IN-ONE. THE BALL WAS NEVER IN DOUBT.',
  ],
  straightIn: 'IT DID NOT EVEN BOUNCE.',
  pondAce: 'THE BALL ENTERED THE HOLE, WHICH WAS IN THE POND.',
  putt: (n) => (n === 1 ? 'The Leader putts. It is a formality.' : 'The Leader putts again. This putt is also a formality.'),
  carried: 'A general has carried the ball to the hole. It counts.',
  missed: 'The ball has stopped. The hole was elsewhere.',
  sunk: 'The ball has entered the pond. The hole was not in the pond.',
  holeDone: (strokes) => (strokes === 1 ? 'Recorded: 1.' : `Recorded: ${strokes}. The scorecard will be corrected.`),
};

export const NEWSPAPER = {
  masthead: 'THE GLORIOUS DAILY',
  motto: 'ORGAN OF THE OFFICE OF SPORTING RECORDS',
  date: 'THE DAY AFTER THE FIRST ROUND',
  price: 'FREE.',
  headline: (aces) => (aces >= 18 ? 'EIGHTEEN HOLES-IN-ONE IN FIRST ROUND' : 'ELEVEN HOLES-IN-ONE IN FIRST ROUND'),
  deck: 'Leader completes course in 18 strokes; golf "not difficult," observers note',
  columns: (r) => [
    `The Leader played golf for the first time yesterday and completed eighteen holes in eighteen strokes, ${r.aces >= 18 ? 'every one of them a hole-in-one' : 'eleven of them holes-in-one, and the other seven also'}.`,
    'Seventeen generals witnessed the round and wrote it down. The game of golf, which had previously been considered difficult, has been revised.',
    r.good
      ? 'The groundskeeper was not mentioned, and has been awarded a medal for it.'
      : 'The groundskeeper has been thanked for the contribution and transferred to a course with no holes.',
  ],
  sidebar: (r) => ({
    title: 'THE ROUND IN FIGURES',
    items: [`Strokes (official): 18`, `Strokes (counted): ${r.strokes}`, `Holes-in-one (observed): ${r.aces}`, `Holes moved: 18`, `Distance run by the hole: ${Math.round(r.run)} m`],
  }),
  caption: 'The eighteenth green, moments after the eighteenth hole-in-one.',
};

export const ACES_NEEDED = 11;
