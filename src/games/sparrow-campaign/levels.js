// SPARROW CAMPAIGN · data. Edit freely: the scene reads every number and line from here.
//
// A level:
//   seconds      length of the campaign day
//   quota        the opening quota; announcements raise it at the given times
//   raises       [{ at: seconds, quota, text }]  loudspeaker announcements
//   flocks       how sparrows arrive: every `every` seconds, `min`–`max` birds
//   rifle        clip size, seconds between shots (bolt), seconds to reload
//   harvest      forecast at the start, and where it drifts to by the end (0–100)
//   locusts      true: the sky fills with insects the rifle cannot help with

export const LEVELS = [
  {
    id: 'sparrows',
    title: 'DAY ONE · SPARROWS',
    memo: {
      no: 'SC-1958/04',
      subject: 'Elimination of the sparrow as a class',
      body: [
        'The sparrow eats grain. Grain belongs to the people. The sparrow is therefore an enemy of the people.',
        'You have been issued one rifle and a rooftop. Your neighbours will bang pots and wave flags so that no sparrow may land, rest, or reconsider.',
        'Aim with the mouse. Click to fire. The rifle holds five rounds; press R to reload. Do not shoot the flags.',
      ],
      button: 'BEGIN THE CAMPAIGN',
    },
    seconds: 90,
    quota: 25,
    raises: [
      { at: 25, quota: 35, text: 'ATTENTION. THE COMMUNE HAS PLEDGED TO EXCEED THE QUOTA. THE QUOTA IS NOW 35.' },
      { at: 55, quota: 45, text: 'ATTENTION. THE NEIGHBOURING COMMUNE HAS PLEDGED 40. OUR QUOTA IS NOW 45.' },
    ],
    flocks: { every: 3.2, min: 4, max: 9, first: 1.5 },
    rifle: { clip: 5, bolt: 0.55, reload: 2.1 },
    harvest: { start: 82, end: 88 },
    locusts: false,
  },
  {
    id: 'locusts',
    title: 'DAY TWO · LOCUSTS',
    memo: {
      no: 'SC-1959/07',
      subject: 'Continuation of the campaign',
      body: ['The sparrow has been defeated. The sky is clear. The fields are unguarded and doing very well.', 'Please return to your rooftop and continue to stand by.'],
      button: 'RETURN TO THE ROOF',
    },
    seconds: 40,
    quota: 0,
    raises: [],
    flocks: null,
    rifle: { clip: 5, bolt: 0.55, reload: 2.1 },
    harvest: { start: 88, end: 3 },
    locusts: true,
  },
];

export const TEXT = {
  dept: 'Bureau of Pest Elimination',
  title: 'SPARROW CAMPAIGN',
  tally: 'SPARROWS ELIMINATED',
  quota: 'QUOTA',
  time: 'CAMPAIGN DAY',
  harvest: 'HARVEST FORECAST',
  reload: 'R · RELOAD',
  reloading: 'RELOADING…',
  locustTally: 'LOCUSTS',
  locustQuota: 'NOT IN THE PLAN',
  flagMemo: {
    no: 'SC-REPRIMAND',
    subject: 'Discharge of a weapon at the flag of the commune',
    body: ['A round has been fired into the flag of the commune. The flag has been patched. The round has been deducted from your allocation.', 'The flag is not a sparrow. Please familiarise yourself with the difference.'],
    button: 'UNDERSTOOD',
  },
  report: {
    no: 'SC-1958/04-R',
    subject: 'Results of Day One',
    met: (n, q) => [`Sparrows eliminated: ${n}. Quota: ${q}.`, 'The quota has been met. The sky over the commune is officially empty.', 'You are commended. The commune is commended. The sparrow is not.'],
    missed: (n, q) => [`Sparrows eliminated: ${n}. Quota: ${q}.`, 'The quota has not been met. The remaining sparrows have been recorded as eliminated in advance.', 'You will be given another opportunity to agree with the figures.'],
    button: 'END THE DAY',
  },
};

export const NEWSPAPER = {
  headline: 'SPARROW MENACE ELIMINATED',
  deck: 'Communes report record tallies; skies declared "completely clear"',
  columns: [
    'Following a heroic campaign of rifles, pots and flags, the sparrow has been eliminated from the province. Your commune alone accounted for {n} birds.',
    'Agricultural experts confirm that, with the sparrow gone, nothing now stands between the grain and the people.',
  ],
  sidebar: (n, harvest) => ({ title: 'THE CAMPAIGN IN FIGURES', items: [`Sparrows eliminated: ${n}`, 'Flags waved: all of them', `Harvest: ${harvest}%`] }),
  missedHeadline: 'SPARROW MENACE ELIMINATED (ADDITIONAL FIGURES TO FOLLOW)',
};
