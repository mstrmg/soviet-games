// NAIL QUOTA — level data. Add, remove or reorder levels freely.
//
// Each level:
//   title        shown in the HUD ("YEAR 1 · BY WEIGHT")
//   memo         the Ministry memo that opens the level
//   steelKg      steel allocation for the year
//   strikes      press time, in press strikes (one strike stamps a full die plate)
//   quota        { type, target, ... } — see rules.js for the quota types:
//                  'weight'  target in kg
//                  'count'   target in nails
//                  'length'  target in metres (all nails laid end to end)
//                  'crates'  target in crates shipped; needs crate: { l, w, h } in cm
//   start        initial slider settings { lengthCm, diameterMm, count }
//
// Text uses {target} and friends; rules.js fills them in.

export const PEOPLES_NEED = 40000; // usable nails the population actually needs each year

export const LEVELS = [
  {
    id: 'weight',
    title: 'BY WEIGHT',
    steelKg: 3000,
    strikes: 60,
    quota: { type: 'weight', target: 2000 },
    start: { lengthCm: 8, diameterMm: 3, count: 20000 },
    memo: {
      no: 'NQ-1/01',
      subject: 'Annual plan for Nail Factory No. 4',
      body: [
        'Comrade Director. The Plan for this year is two (2) tonnes of nails.',
        'The Ministry will weigh the output. The Ministry has an excellent scale.',
        'You are allocated three tonnes of steel and sixty strikes of the press. Shortfalls will be noted. Surpluses will be celebrated and then become the new plan.',
      ],
    },
  },
  {
    id: 'count',
    title: 'BY COUNT',
    steelKg: 1000,
    strikes: 60,
    quota: { type: 'count', target: 1000000 },
    start: { lengthCm: 8, diameterMm: 3, count: 20000 },
    memo: {
      no: 'NQ-1/02',
      subject: 'Revision of the nail indicator',
      body: [
        'Following last year\'s results, the Ministry has determined that weight is a bourgeois measure of a nail.',
        'This year the Plan is one million (1,000,000) nails. The Ministry will count them. The Ministry has many counters.',
        'Steel allocation has been reduced to one tonne, as nails are now counted rather than weighed.',
      ],
    },
  },
  {
    id: 'length',
    title: 'BY TOTAL LENGTH',
    steelKg: 1000,
    strikes: 60,
    quota: { type: 'length', target: 50000 },
    start: { lengthCm: 8, diameterMm: 3, count: 20000 },
    memo: {
      no: 'NQ-1/03',
      subject: 'The nail as a unit of distance',
      body: [
        'The State Committee for Statistics wishes to report that this year\'s nails, laid end to end, would reach from the factory to the regional capital.',
        'The regional capital is fifty (50) kilometres away. Please make this true.',
        'The Ministry will measure every nail with a tape. The tape has been requisitioned.',
      ],
    },
  },
  {
    id: 'crates',
    title: 'BY CRATES SHIPPED',
    steelKg: 1500,
    strikes: 60,
    quota: { type: 'crates', target: 500, crate: { l: 30, w: 20, h: 10 } },
    start: { lengthCm: 8, diameterMm: 3, count: 20000, perCrate: 40 },
    memo: {
      no: 'NQ-1/04',
      subject: 'Logistics indicator for the final year',
      body: [
        'Railway Freight Directorate requires five hundred (500) crates of nails for the final year of the Plan.',
        'Crates measure 30 × 20 × 10 cm. Each crate shipped will be counted at the railhead. Crates will not be opened, as opening crates is not a railway function.',
        'You may pack the crates as you see fit.',
      ],
    },
  },
];

// What the factory floor says after production, by type of output.
// The Ministry does not read these. They are recorded anyway.
export const FLOOR_REMARKS = {
  giant: [
    'A carpenter was seen walking the length of the nail twice, then sitting down.',
    'The nail has been assigned its own postal address.',
    'Workers have begun calling it "Comrade Nail."',
  ],
  thick: [
    'The nails are suitable for securing railway lines, or small mountains.',
    'A carpenter asked if the hammer was also included. It was not.',
  ],
  specks: [
    'A sneeze in the packing room cost the Plan 40,000 units.',
    'The nails are best inspected with the Ministry microscope, which is on loan to the Ministry.',
    'A carpenter attempted to pick one up and is still attempting.',
  ],
  wire: [
    'The output resembles a large quantity of very sad hair.',
    'A carpenter asked whether these were nails or the instructions for nails.',
  ],
  disc: [
    'The nails are wider than they are long. Workers have started using them as coins.',
  ],
  usable: [
    'A carpenter was seen smiling. The incident is under review.',
    'The nails are of an ordinary, useful size. Nobody knows what to say.',
  ],
};

// Five-Year Report & newspaper. Chosen by how the two scores came out.
export const ENDINGS = {
  title: 'FIVE-YEAR PLAN · NAIL FACTORY No. 4',
  subtitle: 'Completed ahead of schedule, in {years} years.',
  newspaper: {
    // official high, citizens low — the classic
    triumph: {
      headline: 'NAIL PLAN OVERFULFILLED: {official}%',
      deck: 'Factory No. 4 honoured; citizens urged to stop asking what nails are for',
      columns: [
        'Nail Factory No. 4 has completed the Five-Year Plan at {official}% of target, a figure the Ministry describes as "a figure."',
        'Reports of a nationwide shortage of usable nails were dismissed as a matter of interpretation. "Every nail we produced was counted, weighed and measured," said a spokesman. "Nobody said anything about hammering."',
        'Carpenters are reminded that furniture may be tied together with string, of which there is also a plan.',
      ],
    },
    // both high — suspicious
    both: {
      headline: 'NAILS PRODUCED; NAILS USED',
      deck: 'Ministry investigates factory where plan and reality coincided',
      columns: [
        'An inspection team has been dispatched to Nail Factory No. 4, where output met the Plan at {official}% while also, unusually, consisting of nails.',
        'Investigators are working to establish whether this was a clerical error. The Director has been asked to explain his methods in writing, and then again in a different room.',
      ],
    },
    // citizens high, official low — dangerous
    people: {
      headline: 'DIRECTOR THANKED FOR HIS SERVICE',
      deck: 'Nail Factory No. 4 to receive new leadership; plan fulfilment stood at {official}%',
      columns: [
        'The Ministry thanks the outgoing Director of Nail Factory No. 4 for his years of service, which are now complete.',
        'Under his leadership the factory fell short of the Plan while producing an unexplained quantity of ordinary nails, many of which are now holding up houses without authorisation.',
        'His successor has been briefed on the importance of indicators.',
      ],
    },
    // both low
    neither: {
      headline: 'NAIL FACTORY ENTERS PERIOD OF REFLECTION',
      deck: 'Results at {official}% of plan described as "a foundation for future successes"',
      columns: [
        'Nail Factory No. 4 has completed the Five-Year Plan, in the sense that the five years are over.',
        'A Ministry spokesman noted that the factory is still standing, which is more than can be said for several sheds in the region.',
      ],
    },
  },
};
