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
//                  'both'    two directorates, two indicators: parts: [{ type, target, by }]; averaged
//                  'need'    no indicator; recorded as fulfilled
//                quota extras: inspect (one random nail must be usable), ratchet (target = last
//                year's delivery × ratchet), sameAsLast (copy last year's final quota)
//   change       { quota, memo }: the Plan is revised when the Director first presses START
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
      subject: 'Logistics indicator for the final year of the Plan',
      body: [
        'Railway Freight Directorate requires five hundred (500) crates of nails for the final year of the Plan.',
        'Crates measure 30 × 20 × 10 cm. Each crate shipped will be counted at the railhead. Crates will not be opened, as opening crates is not a railway function.',
        'You may pack the crates as you see fit.',
      ],
    },
  },
  {
    id: 'inspector',
    title: 'BY WEIGHT, INSPECTED',
    steelKg: 3000,
    strikes: 300,
    quota: { type: 'weight', target: 2000, inspect: true },
    start: { lengthCm: 8, diameterMm: 3, count: 20000 },
    memo: {
      no: 'NQ-2/01',
      subject: 'Second Five-Year Plan: quality control',
      body: [
        'The first Five-Year Plan has been completed ahead of schedule. The second begins now.',
        'Following complaints from the construction sector, a State Inspector will attend. He will select one (1) nail at random and confirm that it is a nail: between 2 and 15 cm long, of sensible thickness.',
        'If it is not a nail, the output will be reclassified as scrap. The Plan is two (2) tonnes, by weight. Press time has been increased, so that there is no excuse.',
      ],
    },
  },
  {
    id: 'ratchet',
    title: 'LAST YEAR PLUS 10%',
    steelKg: 3000,
    strikes: 300,
    quota: { type: 'weight', target: 2200, ratchet: 1.1 },
    start: { lengthCm: 8, diameterMm: 3, count: 20000 },
    memo: {
      no: 'NQ-2/02',
      subject: 'The principle of continuous growth',
      body: [
        'Last year the factory delivered {last}. The Ministry congratulates the factory and has made this the new baseline.',
        'This year the Plan is last year plus ten per cent: {target}. Next year will be this year plus ten per cent, and so on, forever. This is called progress.',
        'The Inspector has been reassigned. Steel allocation is unchanged at three tonnes.',
      ],
    },
  },
  {
    id: 'both',
    title: 'TWO PLANS AT ONCE',
    steelKg: 3000,
    strikes: 60,
    quota: {
      type: 'both',
      target: 100,
      label: '2 T OF NAILS · 1.5 T SAVED',
      parts: [
        { type: 'weight', target: 2000, by: 'Directorate of Fasteners' },
        { type: 'saving', target: 1500, by: 'Committee for the Economy of Metal' },
      ],
    },
    start: { lengthCm: 8, diameterMm: 3, count: 20000 },
    memo: {
      no: 'NQ-2/03',
      subject: 'Two indicators (from two offices)',
      body: [
        'The Directorate of Fasteners sets the Plan at two (2) tonnes of nails, by weight.',
        'Separately, the Committee for the Economy of Metal instructs all factories to return at least one and a half (1.5) tonnes of their steel allocation unused, as a contribution to the Economy of Metal.',
        'You are allocated three tonnes of steel. Both indicators are binding. The two offices are on different floors and have not been introduced.',
      ],
    },
  },
  {
    id: 'revised',
    title: 'REVISED DURING THE YEAR',
    steelKg: 1000,
    strikes: 60,
    quota: { type: 'count', target: 1000000 },
    change: {
      quota: { type: 'length', target: 50000 },
      memo: {
        no: 'NQ-2/04-A',
        subject: 'URGENT: correction to the Plan',
        body: [
          'Please disregard the previous memorandum, which was issued in error by a department that has since been reorganised.',
          'The Plan for this year is fifty (50) kilometres of nails, laid end to end. The Ministry apologises for the inconvenience, which is yours.',
        ],
        stamp: 'SUPERSEDES',
      },
    },
    start: { lengthCm: 8, diameterMm: 3, count: 20000 },
    memo: {
      no: 'NQ-2/04',
      subject: 'Annual plan: count',
      body: [
        'The Plan for this year is one million (1,000,000) nails, by count.',
        'The Ministry has every confidence in this figure, which was arrived at after careful study.',
        'You are allocated one tonne of steel.',
      ],
    },
  },
  {
    id: 'cut',
    title: 'STEEL CUT, PLAN UNCHANGED',
    steelKg: 10,
    strikes: 60,
    quota: { type: 'length', target: 50000, sameAsLast: true },
    start: { lengthCm: 8, diameterMm: 0.2, count: 20000 },
    memo: {
      no: 'NQ-2/05',
      subject: 'Economy measures',
      body: [
        'Owing to the success of the Economy of Metal, the steel allocation for Nail Factory No. 4 has been reduced to ten (10) kilograms.',
        'The Plan is unchanged: {target}. The Ministry sees no connection between these two facts.',
        'Ten kilograms is a great deal of steel if it is used patriotically.',
      ],
    },
  },
  {
    id: 'need',
    title: 'NAILS THE PEOPLE NEED',
    steelKg: 1500,
    strikes: 60,
    quota: { type: 'need', target: 1, label: 'NAILS THE PEOPLE NEED' },
    start: { lengthCm: 8, diameterMm: 3, count: 20000 },
    memo: {
      no: 'NQ-2/06',
      subject: 'Final year: a new indicator',
      body: [
        'Following a letter to the newspaper, the Plan for the final year is to produce the nails the people need.',
        'The Ministry has convened three committees to decide how this should be measured. None of them could. The year will therefore be recorded as fulfilled, whatever is produced.',
        'You may make whatever you like. Nobody is checking. This has never happened before and the Ministry would prefer it was not discussed.',
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
  title: 'TWO FIVE-YEAR PLANS · NAIL FACTORY No. 4',
  subtitle: 'Both completed ahead of schedule, in {years} years.',
  newspaper: {
    // official high, citizens low — the classic
    triumph: {
      headline: 'NAIL PLAN OVERFULFILLED: {official}%',
      deck: 'Factory No. 4 honoured; citizens urged to stop asking what nails are for',
      columns: [
        'Nail Factory No. 4 has completed two Five-Year Plans at {official}% of target, a figure the Ministry describes as "a figure."',
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
        'Nail Factory No. 4 has completed two Five-Year Plans, in the sense that the ten years are over.',
        'A Ministry spokesman noted that the factory is still standing, which is more than can be said for several sheds in the region.',
      ],
    },
  },
};
