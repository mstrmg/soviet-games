// LISTENING POST · data. Edit freely: the scene reads every line and number from here.
//
// Apartment 4B is bugged. Its tenant follows the same routine every day. Each action
// produces observations, more of them as more microphones are installed. You note three
// a day and write them up. Plain reports do not justify a budget. Exciting ones do, and
// a bigger budget buys more microphones, and more microphones raise expectations.

export const RULES = {
  days: 4,
  micsStart: 2,
  micsMax: 12,
  lines: 3, // observations per report
  weight: { plain: 1, suggestive: 2, alarming: 4 },
  expected: (mics) => Math.min(12, 3 + mics), // importance the department expects
  strikes: 2,
};

// Where microphones go, in the order they are installed. [x, y, z] in apartment space.
export const MIC_SPOTS = [
  { name: 'the kitchen lamp', at: [-2.6, 2.55, -1.2] },
  { name: 'the living-room lamp', at: [2.4, 2.55, -1.2] },
  { name: 'the radio', at: [3.9, 1.05, -2.55] },
  { name: 'the table', at: [-2.4, 0.7, -0.6] },
  { name: 'the plant pot', at: [1.0, 0.35, -2.5] },
  { name: 'the armchair', at: [2.7, 0.5, -1.7] },
  { name: 'the stove', at: [-4.1, 0.95, -2.4] },
  { name: 'the picture frame', at: [2.2, 1.7, -2.92] },
  { name: 'the bread bin', at: [-3.2, 1.0, -2.75] },
  { name: 'the window frame', at: [-1.4, 1.6, -2.92] },
  { name: 'the light switch', at: [0.15, 1.2, -0.4] },
  { name: 'the soup', at: [-4.1, 1.12, -2.25] },
];

// The tenant's day. `spot` is where she goes; `anim` is what she does there; `obs` lists
// observation ids with the number of microphones needed to hear them.
export const ROUTINE = [
  { clock: '07:30', spot: [-4.0, -1.6], face: Math.PI, anim: 'stir', secs: 6, obs: [['cook', 0], ['stir', 3], ['taste', 7], ['bubble', 12]] },
  { clock: '09:00', spot: [-2.4, -1.1], face: 0, anim: 'sit', secs: 5, obs: [['eat', 0], ['spoon', 4], ['slurp', 9]] },
  { clock: '10:30', spot: [-1.4, -2.3], face: Math.PI, anim: 'look', secs: 4, obs: [['window', 2], ['window2', 10]] },
  { clock: '12:00', spot: [3.5, -2.0], face: Math.PI, anim: 'radio', secs: 5, obs: [['radio', 0], ['radio2', 3], ['hum', 8]] },
  { clock: '14:00', spot: [1.0, -2.0], face: Math.PI, anim: 'water', secs: 4, obs: [['plant', 5], ['plant2', 11]] },
  { clock: '15:30', spot: [2.7, -1.2], face: 0, anim: 'sit', secs: 6, obs: [['sigh', 0], ['sigh2', 6], ['chair', 6]] },
  { clock: '18:00', spot: [-3.2, -2.2], face: Math.PI, anim: 'stir', secs: 4, obs: [['bread', 9], ['cook', 1]] },
  { clock: '21:00', spot: [2.7, -1.2], face: 0, anim: 'doze', secs: 5, obs: [['quiet', 0], ['snore', 4], ['switch', 11]] },
];

export const OBS = {
  cook: {
    log: 'Kitchen. Sounds of cooking.',
    plain: 'Subject cooked a meal.',
    suggestive: 'Subject prepared food in a quantity suggesting visitors.',
    alarming: 'Subject is provisioning an unknown number of persons for an unspecified purpose.',
  },
  stir: {
    log: 'Kitchen. A spoon, stirring. Clockwise.',
    plain: 'Subject stirred soup.',
    suggestive: 'Subject stirred soup in a deliberate, rhythmic pattern.',
    alarming: 'Subject transmitted a rhythmic signal by means of a spoon.',
  },
  taste: {
    log: 'Kitchen. Subject tastes soup. Adds salt.',
    plain: 'Subject added salt to soup.',
    suggestive: 'Subject was dissatisfied with the soup and acted on it.',
    alarming: 'Subject expressed dissatisfaction with the existing state of affairs and took steps to change it.',
  },
  bubble: {
    log: 'Soup. Bubbling. (Microphone in the soup.)',
    plain: 'The soup was at a simmer.',
    suggestive: 'Conditions in the soup were agitated.',
    alarming: 'Unrest was detected in the soup at close range.',
  },
  eat: {
    log: 'Kitchen. Subject eats. Alone.',
    plain: 'Subject ate soup alone.',
    suggestive: 'Subject ate alone, perhaps to avoid being observed.',
    alarming: 'Subject took deliberate precautions against being observed while eating.',
  },
  spoon: {
    log: 'Kitchen. Spoon against bowl, 31 times.',
    plain: 'Subject finished a bowl of soup.',
    suggestive: 'Subject tapped a bowl thirty-one times.',
    alarming: 'Subject tapped out a thirty-one-part message on a bowl.',
  },
  slurp: {
    log: 'Kitchen. A slurp.',
    plain: 'Subject slurped.',
    suggestive: 'Subject made an unguarded noise.',
    alarming: 'Subject made a noise of unmistakable contempt.',
  },
  window: {
    log: 'Kitchen. Subject at the window for four minutes.',
    plain: 'Subject looked out of the window.',
    suggestive: 'Subject watched the street for some time.',
    alarming: 'Subject conducted surveillance of the street.',
  },
  window2: {
    log: 'Kitchen. Subject waves at somebody outside.',
    plain: 'Subject waved to a neighbour.',
    suggestive: 'Subject signalled to a person in the street.',
    alarming: 'Subject made contact with an outside party by prearranged signal.',
  },
  radio: {
    log: 'Living room. Radio on. Music.',
    plain: 'Subject listened to the radio.',
    suggestive: 'Subject listened to music of unclear origin.',
    alarming: 'Subject received broadcasts from an unidentified source.',
  },
  radio2: {
    log: 'Living room. Radio retuned. Weather forecast.',
    plain: 'Subject listened to the weather.',
    suggestive: 'Subject took an interest in conditions elsewhere.',
    alarming: 'Subject sought information about conditions beyond the border.',
  },
  hum: {
    log: 'Living room. Subject hums along. Off key.',
    plain: 'Subject hummed.',
    suggestive: 'Subject hummed a tune that was not on the radio.',
    alarming: 'Subject performed unapproved music.',
  },
  plant: {
    log: 'Living room. Subject waters the plant.',
    plain: 'Subject watered a plant.',
    suggestive: 'Subject tended a plant with unusual care.',
    alarming: 'Subject is cultivating something.',
  },
  plant2: {
    log: 'Living room. Subject talks to the plant.',
    plain: 'Subject spoke to a plant.',
    suggestive: 'Subject confided in a plant.',
    alarming: 'Subject has recruited the plant.',
  },
  sigh: {
    log: 'Living room. A sigh.',
    plain: 'Subject sighed.',
    suggestive: 'Subject sighed meaningfully.',
    alarming: 'Subject expressed, by sighing, a negative attitude towards the state.',
  },
  sigh2: {
    log: 'Living room. Another sigh. Longer.',
    plain: 'Subject sighed again.',
    suggestive: 'Subject\'s sighing is increasing.',
    alarming: 'Subject\'s attitude is deteriorating at a measurable rate (see sighs, attached).',
  },
  chair: {
    log: 'Armchair. Creaking. Subject shifts position.',
    plain: 'Subject sat in an armchair.',
    suggestive: 'Subject was restless.',
    alarming: 'Subject could not settle, a sign of a guilty conscience.',
  },
  bread: {
    log: 'Kitchen. Bread bin opened. Closed.',
    plain: 'Subject checked the bread.',
    suggestive: 'Subject checked a hiding place.',
    alarming: 'Subject inspected a dead drop disguised as a bread bin.',
  },
  quiet: {
    log: 'Living room. Nothing.',
    plain: 'Nothing happened.',
    suggestive: 'An unusual silence was observed.',
    alarming: 'Subject maintained a suspicious silence for several hours.',
  },
  snore: {
    log: 'Armchair. Snoring.',
    plain: 'Subject fell asleep.',
    suggestive: 'Subject pretended to be asleep.',
    alarming: 'Subject feigned sleep in order to avoid being listened to.',
  },
  switch: {
    log: 'Light switch. Click. (Microphone in the light switch.)',
    plain: 'Subject turned off the light.',
    suggestive: 'Subject preferred darkness.',
    alarming: 'Subject took steps to conceal her activities from the light.',
  },
};

export const TEXT = {
  dept: 'Office of Attentive Listening',
  title: 'LISTENING POST',
  flat: 'APARTMENT 4B',
  mics: 'MICROPHONES',
  budget: 'DEPARTMENT BUDGET',
  log: 'TRANSCRIPT',
  noted: 'NOTED',
  hint: (n) => `Click lines in the transcript to note them for the report (${n} needed).`,
  write: 'WRITE THE REPORT',
  submit: 'FILE THE REPORT',
  levels: { plain: 'AS HEARD', suggestive: 'WITH CONTEXT', alarming: 'WITH VIGILANCE' },
  reportHead: (day) => `DAILY REPORT · APARTMENT 4B · DAY ${day}`,
  importance: 'IMPORTANCE',
  expected: 'EXPECTED',
  install: (name) => `Microphone installed: ${name}.`,
  removed: (name) => `Microphone removed: ${name}.`,
  day: (d, n) => `DAY ${d} OF ${n}`,
  time: 'TIME',
  budgetOk: 'SECURE',
  budgetBad: 'UNDER REVIEW',
  fast: 'FAST FORWARD',
  normal: 'NORMAL SPEED',
  listening: 'Listening…',
  dayOver: 'The tenant is asleep. Write the report.',
  tape: 'TAPE 4B',
  nothing: 'Nothing yet.',
  intro: {
    no: 'AL-1983/02',
    from: 'Office of Attentive Listening',
    subject: 'Assignment: Apartment 4B',
    body: [
      'You have been assigned to Apartment 4B. Put on the headphones. Listen. Note what you hear. At the end of the day, write a report.',
      'Reports must be important enough to justify the department\'s budget. A department whose reports are unimportant is unimportant.',
      'Important reports are rewarded with more equipment. This is how the department grows. Please help it grow.',
    ],
    button: 'PUT ON THE HEADPHONES',
  },
  review: {
    no: (d) => `AL-1983/02-${d}`,
    subject: (d) => `Review of report, day ${d}`,
    good: (imp, exp, added) => [
      `Your report has been assessed as important (${imp}; ${exp} expected). The department\'s budget has been increased.`,
      added ? `${added} further microphone${added === 1 ? ' has' : 's have'} been installed in Apartment 4B. More will be heard. More will be expected.` : 'The apartment cannot hold any more microphones. Expectations remain high.',
    ],
    bad: (imp, exp, last) => [
      `Your report has been assessed as unimportant (${imp}; ${exp} expected).`,
      last ? 'The department cannot justify its existence on this basis.' : 'One microphone has been removed and reassigned to an apartment where more is happening.',
    ],
    button: 'CONTINUE LISTENING',
  },
  end: {
    good: {
      no: 'AL-1983/02-F',
      subject: 'Assignment concluded',
      body: (mics, pages) => [
        `Apartment 4B now contains ${mics} microphones and ${pages} pages of reports. It contains more microphones than chairs.`,
        'The tenant has made soup every day. Her file has been upgraded to "hotbed". She has been commended for her consistency, without being told.',
        'You have been awarded the Order of the Diligent Ear.',
      ],
      stamp: 'VIGILANT',
      button: 'TAKE OFF THE HEADPHONES',
    },
    bad: {
      no: 'AL-1983/02-X',
      subject: 'Closure of the post',
      body: () => [
        'Your reports have repeatedly described what happened. The department cannot continue on this basis.',
        'The listening post is closed. You have been reassigned to an apartment, where you will be listened to.',
      ],
      stamp: 'CLOSED',
      button: 'TAKE OFF THE HEADPHONES',
    },
  },
};

export const NEWSPAPER = {
  headline: 'LISTENING POST REPORTS RECORD VIGILANCE',
  badHeadline: 'OFFICE OF ATTENTIVE LISTENING STREAMLINED',
  deck: 'Apartment 4B "a hotbed", according to its file; tenant unaware, makes soup',
  badDeck: 'Post closed after reports found to be accurate',
  columns: [
    'The Office of Attentive Listening has praised the work of its listening posts, which this year produced more reports than ever before about more apartments than ever before.',
    'Apartment 4B was singled out for its exceptional file. Its tenant could not be reached for comment, but was heard.',
  ],
  sidebar: (o) => ({ title: 'THE FILE IN FIGURES', items: [`Microphones: ${o.mics}`, `Pages: ${o.pages}`, `Conspiracies: ${o.alarming}`, `Soups: ${o.days}`] }),
  badColumns: [
    'The Office of Attentive Listening has streamlined its operations, closing a listening post whose reports were found to describe what had happened.',
    'The tenant of Apartment 4B continues to make soup. This is no longer being recorded.',
  ],
  caption: 'Apartment 4B, as heard.',
};
