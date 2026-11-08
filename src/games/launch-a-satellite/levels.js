// LAUNCH A SATELLITE · data. Edit freely: the scene reads every number and line from here.
//
// You are a county chief at the provincial yield conference. Counties report their
// grain yield per mu (a mu is about a fifteenth of a hectare). The biggest report
// "launches a satellite". The state then collects a share of what you REPORTED.
//
// A season:
//   actual    what your fields really produced, in jin per mu
//   rivals    [{ county, report, chase }]  report = their opening figure; chase = they will
//             report at least your last figure times this (they respond to your enthusiasm)

export const RULES = {
  procurement: 0.25, // the state collects this share of the reported yield
  food: 200, // jin per mu the county eats in a season
  granaryStart: 300, // jin per mu in the granary when you take office
  strikes: 2, // criticisms before you are relieved of your post
  sliderMin: 100,
  sliderMax: 200000,
};

export const COUNTIES = {
  you: 'YOUR COUNTY',
  names: ['EAST WIND', 'BRIGHT FUTURE', 'RED STAR'],
};

export const SEASONS = [
  {
    id: 'wheat-58',
    title: 'SUMMER 1958 · WHEAT',
    memo: {
      no: 'AE-1958/06',
      subject: 'Provincial yield conference',
      body: [
        'Congratulations on your appointment as county chief. Please attend the provincial yield conference and report your county\'s wheat yield in jin per mu.',
        'The county reporting the highest yield will be said to have launched a satellite. The county reporting the lowest will be helped to improve its attitude.',
        'For planning purposes the state will collect one quarter of the yield you report.',
      ],
      button: 'ATTEND THE CONFERENCE',
    },
    actual: 410,
    actualNote: 'Your fields have produced 410 jin per mu. This figure is for your information only.',
    rivals: [
      { county: 0, report: 620, chase: 0.8 },
      { county: 1, report: 880, chase: 1.1 },
      { county: 2, report: 1250, chase: 1.4 },
    ],
  },
  {
    id: 'rice-58',
    title: 'AUTUMN 1958 · RICE',
    memo: {
      no: 'AE-1958/10',
      subject: 'Second yield conference',
      body: [
        'The summer conference was a great success. Every county exceeded its harvest, on paper.',
        'The autumn rice yields will now be reported. Several counties have adopted close planting, in which the crops of five fields are moved into one field for the photograph.',
        'The state\'s share remains one quarter of the reported figure.',
      ],
      button: 'RETURN TO THE CONFERENCE',
    },
    actual: 430,
    actualNote: 'Your fields have produced 430 jin per mu. Please keep this to yourself.',
    rivals: [
      { county: 0, report: 2400, chase: 0.9 },
      { county: 1, report: 5100, chase: 1.3 },
      { county: 2, report: 10600, chase: 2.0 },
    ],
  },
  {
    id: 'wheat-59',
    title: 'SUMMER 1959 · WHEAT',
    memo: {
      no: 'AE-1959/06',
      subject: 'Third yield conference',
      body: [
        'The spring planting was carried out with great enthusiasm and, owing to the steel campaign, without hoes.',
        'Yields are expected to be lower this year for reasons that are not to be discussed at the conference.',
        'The state\'s share remains one quarter of the reported figure. The state has not been told about the hoes.',
      ],
      button: 'ATTEND THE CONFERENCE',
    },
    actual: 290,
    actualNote: 'Your fields have produced 290 jin per mu. This figure does not exist.',
    rivals: [
      { county: 0, report: 8500, chase: 1.0 },
      { county: 1, report: 36900, chase: 1.5 },
      { county: 2, report: 130434, chase: 2.5 },
    ],
  },
];

export const TEXT = {
  dept: 'Bureau of Agricultural Estimates',
  title: 'LAUNCH A SATELLITE',
  boardTitle: 'PROVINCIAL YIELD CONFERENCE · JIN PER MU',
  actual: 'YOUR FIELDS (UNOFFICIAL)',
  granary: 'COUNTY GRANARY',
  granaryUnit: (g) => `${Math.round(g)} jin per mu · ${months(g)} of food`,
  strikes: 'ATTITUDE',
  reportLabel: 'YOUR REPORT',
  unit: 'JIN PER MU',
  submit: 'REPORT TO THE CONFERENCE',
  small: (r) => `State procurement on this figure: ${fmt(Math.round(r * RULES.procurement))} jin per mu`,
  quick: { truth: 'THE TRUTH', lowest: 'BEAT THE LOWEST', top: 'BEAT THE LEADER' },
  rivalAnnounce: (name, n) => `${name} COUNTY REPORTS ${fmt(n)} JIN PER MU!`,
  youAnnounce: (n) => `YOUR COUNTY REPORTS ${fmt(n)} JIN PER MU!`,
  launched: 'SATELLITE LAUNCHED! YOUR COUNTY LEADS THE PROVINCE!',
  middle: 'THE CONFERENCE NOTES YOUR FIGURE.',
  lowest: 'YOUR COUNTY HAS BEEN AWARDED A WHITE FLAG.',
  criticism: {
    no: 'AE-CRIT',
    from: 'Provincial Party Committee',
    subject: 'Right-deviationist conservatism',
    body: (n, low) => [
      `Your county has reported ${fmt(n)} jin per mu, the lowest figure at the conference. Neighbouring counties, with identical soil, have reported up to ${fmt(low)}.`,
      'It has been suggested that your figure reflects a lack of faith in the masses. A white flag has been placed on your county so that it may be helped.',
      'A second white flag will not be necessary.',
    ],
    button: 'ACCEPT CRITICISM',
  },
  removed: {
    no: 'AE-DISM',
    from: 'Provincial Party Committee',
    subject: 'Change of county leadership',
    body: (n) => [
      `Following a second report of ${fmt(n)} jin per mu, you have been relieved of your post for the good of the county.`,
      'Your successor has reported a yield of 50,000 jin per mu and has begun collecting it.',
    ],
    button: 'HAND OVER THE SEAL',
  },
  procure: {
    no: (i) => `AE-PROC-${i + 1}`,
    from: 'State Grain Procurement Office',
    subject: 'Collection of the state\'s share',
    body: (o) => [
      `Reported yield: ${fmt(o.report)} jin per mu. Actual yield: not requested.`,
      `State share collected: ${fmt(o.collected)} jin per mu.${o.shortfall > 0 ? ` A further ${fmt(o.shortfall)} jin per mu could not be found and has been taken from the seed grain, the commune kitchen and the future.` : ''}`,
      `Remaining in the county granary: ${fmt(Math.round(o.granary))} jin per mu, or ${months(o.granary)} of food.`,
    ],
    stamp: (o) => (o.granary <= 0 ? 'COLLECTED IN FULL' : 'COLLECTED'),
    button: 'THANK THE STATE',
  },
};

export const NEWSPAPER = {
  headline: (n) => `COUNTY LAUNCHES SATELLITE: ${fmt(n)} JIN PER MU`,
  plainHeadline: 'PROVINCE REPORTS RECORD HARVEST ACROSS ALL COUNTIES',
  removedHeadline: 'COUNTY UNDER NEW LEADERSHIP REPORTS 50,000 JIN PER MU',
  deck: 'Children stand on wheat "as thick as a carpet"; experts revise the laws of agronomy',
  columns: [
    'Delegates to the provincial yield conference cheered as county after county reported harvests once thought impossible. Your county\'s highest figure was {n} jin per mu.',
    'The state has gratefully collected its share. Grain stores across the province are reported to be full, and the reports are reported to be accurate.',
  ],
  sidebar: (n, g) => ({ title: 'THE HARVEST IN FIGURES', items: [`Highest report: ${fmt(n)} jin/mu`, 'Satellites launched: many', 'White flags: few', `Granary: ${months(g)} of food`] }),
  photoCaption: 'Children stand on the record wheat, which supports them.',
  boardCaption: 'The provincial yield board, as reported.',
};

export function fmt(n) {
  return Math.round(n).toLocaleString('en-US');
}

export function months(g) {
  const m = Math.max(0, g) / (RULES.food / 6);
  if (m <= 0) return 'no months';
  if (m < 1) return 'less than a month';
  const r = Math.round(m);
  return `${r} month${r === 1 ? '' : 's'}`;
}
