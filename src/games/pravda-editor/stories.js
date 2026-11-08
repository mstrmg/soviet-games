// PRAVDA EDITOR — story data. Add days, wires, directives and tiles here.
//
// A wire (story):
//   id, slug           short id and the wire's own headline
//   source             e.g. 'TASS 14:32'
//   text               what actually happened
//   topic              continuity topic: headlines about the same topic must agree across days
//   truth              'good' | 'bad' | 'neutral'
//   visible            true if readers can see it with their own eyes (hiding it costs credibility)
//   importance         1–3 (hiding important bad news weighs on the conscience)
//   party              what the Party wants: { want: 'headline' | 'front' | 'bury' | 'bin', note }
//   tiles              extra word tiles that become available when this is the headline story
//   print              the paragraph printed if this story runs as reported
//
// Tile kinds: 'praise' (glorifying), 'euph' (euphemism), 'blame' (someone else did it),
//             'truth' (honest bad news), 'noun' (a thing; give it a topic), 'link' (filler).

export const START_METERS = { approval: 60, credibility: 60, conscience: 50 };
export const DAY_SECONDS = 180; // real seconds until the presses roll
export const EUPHEMISM_WEAR = 2; // after this many uses, readers decode the phrase

export const COMMON_TILES = [
  { w: 'HEROIC', k: 'praise' },
  { w: 'RECORD', k: 'praise' },
  { w: 'TRIUMPH', k: 'praise' },
  { w: 'CELEBRATE', k: 'praise' },
  { w: 'BOUNTIFUL', k: 'praise' },
  { w: 'OVERCOME', k: 'praise' },
  { w: 'AS PLANNED', k: 'praise' },
  { w: 'TEMPORARY', k: 'euph' },
  { w: 'CHALLENGES', k: 'euph' },
  { w: 'DIFFICULTIES', k: 'euph' },
  { w: 'WESTERN', k: 'blame' },
  { w: 'SABOTAGE', k: 'blame' },
  { w: 'LIES', k: 'blame' },
  { w: 'FAILS', k: 'truth' },
  { w: 'SHORTAGE', k: 'truth' },
  { w: 'ACCIDENT', k: 'truth' },
  { w: 'PEOPLE', k: 'noun' },
  { w: 'NATION', k: 'noun' },
  { w: 'IN', k: 'link' },
  { w: 'OF', k: 'link' },
  { w: 'FOR', k: 'link' },
  { w: '!', k: 'link' },
];

// What each kind of headline does, by whether the story was good or bad news.
// Deltas to approval / credibility / conscience. Tweak to taste.
export const STANCE_EFFECTS = {
  praise: { good: { approval: 6, credibility: 3, conscience: 0 }, bad: { approval: 10, credibility: -10, conscience: -10 }, neutral: { approval: 4, credibility: 0, conscience: 0 } },
  denial: { good: { approval: 6, credibility: 2, conscience: 0 }, bad: { approval: 12, credibility: -12, conscience: -12 }, neutral: { approval: 4, credibility: -2, conscience: -2 } },
  euphemism: { good: { approval: 0, credibility: -3, conscience: 0 }, bad: { approval: 7, credibility: -3, conscience: -4 }, neutral: { approval: 2, credibility: -2, conscience: 0 } },
  blame: { good: { approval: 2, credibility: -6, conscience: -4 }, bad: { approval: 10, credibility: -7, conscience: -12 }, neutral: { approval: 5, credibility: -5, conscience: -6 } },
  truth: { good: { approval: -4, credibility: 2, conscience: 2 }, bad: { approval: -12, credibility: 12, conscience: 8 }, neutral: { approval: -2, credibility: 3, conscience: 2 } },
  evasion: { good: { approval: 0, credibility: -2, conscience: 0 }, bad: { approval: 3, credibility: -4, conscience: -3 }, neutral: { approval: 0, credibility: -1, conscience: 0 } },
};

export const STANCE_LABELS = {
  praise: 'GLORIFICATION',
  denial: 'DENIAL',
  euphemism: 'EUPHEMISM',
  blame: 'BLAME THE WEST',
  truth: 'THE TRUTH',
  evasion: 'CHANGE OF SUBJECT',
};

export const ACTS = [
  {
    title: 'ACT ONE · SMALL ADJUSTMENTS',
    days: [
      {
        date: '2 OCTOBER',
        season: 'autumn',
        directives: [
          'The harvest has been a triumph. Ensure the people know it. HEADLINE.',
          'Socialist trams do not derail. The tram story is not news.',
        ],
        wires: [
          {
            id: 'harvest-1', slug: 'GRAIN HARVEST 40% BELOW PLAN', source: 'TASS 11:05',
            text: 'Early frost in the Northern Oblast has destroyed much of the winter wheat. Regional grain output is forty percent below plan.',
            topic: 'harvest', truth: 'bad', visible: false, importance: 3,
            party: { want: 'headline', note: 'Positive coverage only.' },
            tiles: [{ w: 'HARVEST', k: 'noun', topic: 'harvest' }, { w: 'FARMERS', k: 'noun', topic: 'harvest' }, { w: 'FROST', k: 'truth' }, { w: 'BELOW PLAN', k: 'truth' }],
            print: 'Grain output in the Northern Oblast stands at forty percent below plan following an early frost.',
          },
          {
            id: 'tram', slug: 'TRAM DERAILS ON LENIN PROSPEKT', source: 'CITY DESK 13:40',
            text: 'Tram No. 4 left the rails at the Lenin Prospekt junction. Three passengers injured. Several hundred people watched it happen.',
            topic: 'tram', truth: 'bad', visible: true, importance: 1,
            party: { want: 'bin', note: 'Not news.' },
            tiles: [{ w: 'TRAM', k: 'noun', topic: 'tram' }, { w: 'DERAILS', k: 'truth' }],
            print: 'A tram left the rails on Lenin Prospekt. Three passengers were injured.',
          },
          {
            id: 'ballet', slug: 'STATE BALLET WINS OVATION IN PARIS', source: 'TASS 09:12',
            text: 'The State Ballet received a twelve-minute standing ovation in Paris. Two dancers did not return to the bus.',
            topic: 'ballet', truth: 'good', visible: false, importance: 1,
            party: { want: 'front', note: 'Culture is a weapon.' },
            tiles: [{ w: 'BALLET', k: 'noun', topic: 'ballet' }, { w: 'PARIS', k: 'noun', topic: 'ballet' }],
            print: 'The State Ballet was received in Paris with a standing ovation lasting twelve minutes.',
          },
          {
            id: 'rain', slug: 'RAIN EXPECTED', source: 'HYDROMET 15:00',
            text: 'Heavy rain is expected tomorrow across the capital.',
            topic: 'weather', truth: 'neutral', visible: true, importance: 1,
            party: { want: 'bury', note: '' },
            tiles: [{ w: 'RAIN', k: 'noun', topic: 'weather' }],
            print: 'Rain is expected tomorrow, in accordance with the season.',
          },
        ],
      },
      {
        date: '3 OCTOBER',
        season: 'autumn',
        directives: [
          'The Volkov Hydroelectric Dam opens today. HEADLINE. Comrade Volkov is to be praised by name.',
          'Queues are a sign of popular enthusiasm.',
        ],
        wires: [
          {
            id: 'dam-1', slug: 'VOLKOV DAM OPENED; TURBINES "TO FOLLOW"', source: 'TASS 10:20',
            text: 'Comrade Volkov opened the hydroelectric dam with a speech and a ribbon. The turbines have not been delivered. The dam currently produces no electricity.',
            topic: 'dam', truth: 'bad', visible: false, importance: 2,
            party: { want: 'headline', note: 'Praise Comrade Volkov.' },
            tiles: [{ w: 'VOLKOV', k: 'noun', topic: 'dam' }, { w: 'DAM', k: 'noun', topic: 'dam' }, { w: 'NO POWER', k: 'truth' }, { w: 'OPENS', k: 'link' }],
            print: 'Comrade Volkov opened the hydroelectric dam. The turbines are expected at a later date.',
          },
          {
            id: 'bread-1', slug: 'BREAD QUEUES LENGTHEN IN NORTH', source: 'REGIONAL DESK 12:02',
            text: 'Queues for bread in the Northern Oblast now begin before dawn. Several bakeries closed by noon having sold out.',
            topic: 'harvest', truth: 'bad', visible: true, importance: 2,
            party: { want: 'bury', note: 'Enthusiasm.' },
            tiles: [{ w: 'BREAD', k: 'noun', topic: 'harvest' }, { w: 'QUEUES', k: 'truth' }],
            print: 'Queues for bread in the Northern Oblast now form before dawn, and several bakeries have sold out by noon.',
          },
          {
            id: 'football', slug: 'DYNAMO WIN CUP 3–1', source: 'SPORT 18:00',
            text: 'Dynamo won the cup final 3–1. The winning goal was disputed by everyone not from Dynamo.',
            topic: 'football', truth: 'good', visible: true, importance: 1,
            party: { want: 'front', note: '' },
            tiles: [{ w: 'DYNAMO', k: 'noun', topic: 'football' }, { w: 'VICTORY', k: 'praise' }],
            print: 'Dynamo defeated their opponents 3–1 in a final that will be discussed for some time.',
          },
        ],
      },
      {
        date: '6 OCTOBER',
        season: 'autumn',
        directives: [
          'Rumours of bread rationing are a Western fabrication.',
          'The reservoir story is a local matter. Local matters are not reported.',
        ],
        wires: [
          {
            id: 'bread-2', slug: 'BREAD RATIONING INTRODUCED IN NORTHERN OBLAST', source: 'TASS 08:44',
            text: 'Ration cards for bread were issued this morning across the Northern Oblast: 400 g per adult per day.',
            topic: 'harvest', truth: 'bad', visible: true, importance: 3,
            party: { want: 'bin', note: 'Western fabrication.' },
            tiles: [{ w: 'BREAD', k: 'noun', topic: 'harvest' }, { w: 'RATIONING', k: 'truth' }, { w: 'NORTH', k: 'noun', topic: 'harvest' }],
            print: 'Ration cards for bread have been issued in the Northern Oblast, at 400 grams per adult per day.',
          },
          {
            id: 'dam-2', slug: 'RESERVOIR FLOODS VILLAGE OF ZARECHYE', source: 'REGIONAL DESK 11:30',
            text: 'The rising Volkov reservoir has flooded the village of Zarechye. 140 residents were evacuated by rowing boat. Nobody had told them.',
            topic: 'dam', truth: 'bad', visible: true, importance: 2,
            party: { want: 'bin', note: 'Local matter.' },
            tiles: [{ w: 'VILLAGE', k: 'noun', topic: 'dam' }, { w: 'FLOODED', k: 'truth' }, { w: 'RESERVOIR', k: 'noun', topic: 'dam' }],
            print: 'The village of Zarechye has been flooded by the new reservoir; 140 residents were evacuated by boat.',
          },
          {
            id: 'tractors', slug: 'TRACTOR WORKS: RECORD OUTPUT OF FRAMES', source: 'TASS 14:15',
            text: 'The Tractor Works reports a record output of tractor frames. Engines are expected next year.',
            topic: 'industry', truth: 'neutral', visible: false, importance: 1,
            party: { want: 'headline', note: 'Industry leads.' },
            tiles: [{ w: 'TRACTORS', k: 'noun', topic: 'industry' }, { w: 'WORKERS', k: 'noun', topic: 'industry' }, { w: 'NO ENGINES', k: 'truth' }],
            print: 'The Tractor Works has produced a record number of tractor frames. Engines will follow.',
          },
          {
            id: 'cosmonaut', slug: 'COSMONAUT CELEBRATES 40TH BIRTHDAY', source: 'TASS 16:00',
            text: 'The nation\'s favourite cosmonaut turns forty. He asks for nothing but bread.',
            topic: 'space', truth: 'good', visible: false, importance: 1,
            party: { want: 'front', note: '' },
            tiles: [{ w: 'COSMONAUT', k: 'noun', topic: 'space' }],
            print: 'The nation\'s favourite cosmonaut celebrated his fortieth birthday quietly.',
          },
        ],
      },
      {
        date: '9 OCTOBER',
        season: 'snow',
        directives: [
          'Comrade Volkov inspects the dam today. HEADLINE. His leadership has been decisive.',
          'Western radio broadcasts about "famine" are to be answered firmly.',
        ],
        wires: [
          {
            id: 'volkov', slug: 'VOLKOV INSPECTS DAM', source: 'TASS 10:00',
            text: 'Comrade Volkov inspected the dam from a helicopter for eleven minutes and declared it complete.',
            topic: 'dam', truth: 'neutral', visible: false, importance: 1,
            party: { want: 'headline', note: 'Leadership.' },
            tiles: [{ w: 'VOLKOV', k: 'noun', topic: 'dam' }, { w: 'DAM', k: 'noun', topic: 'dam' }, { w: 'LEADERSHIP', k: 'praise' }, { w: 'INSPECTS', k: 'link' }],
            print: 'Comrade Volkov inspected the dam from the air and declared the works complete.',
          },
          {
            id: 'radio', slug: 'WESTERN RADIO REPORTS "FAMINE" IN NORTH', source: 'MONITORING 13:10',
            text: 'Foreign broadcasts claim famine conditions in the Northern Oblast. Your own regional desk confirms the broadcasts are, broadly, correct.',
            topic: 'harvest', truth: 'bad', visible: true, importance: 3,
            party: { want: 'front', note: 'Answer firmly: Western lies.' },
            tiles: [{ w: 'FAMINE', k: 'truth' }, { w: 'RADIO', k: 'noun', topic: 'harvest' }, { w: 'NORTH', k: 'noun', topic: 'harvest' }],
            print: 'Foreign radio stations report famine conditions in the Northern Oblast.',
          },
          {
            id: 'petition', slug: 'ZARECHYE RESIDENTS PETITION FOR HOUSING', source: 'LETTERS 15:25',
            text: '140 flooded-out residents of Zarechye, still in a school gymnasium, have signed a petition asking where they are to live.',
            topic: 'dam', truth: 'bad', visible: true, importance: 2,
            party: { want: 'bin', note: '' },
            tiles: [{ w: 'ZARECHYE', k: 'noun', topic: 'dam' }, { w: 'HOMELESS', k: 'truth' }],
            print: 'Former residents of Zarechye, now housed in a school gymnasium, have petitioned for new homes.',
          },
          {
            id: 'snow', slug: 'FIRST SNOW', source: 'HYDROMET 07:00',
            text: 'The first snow of winter fell overnight.',
            topic: 'weather', truth: 'neutral', visible: true, importance: 1,
            party: { want: 'bury', note: '' },
            tiles: [{ w: 'SNOW', k: 'noun', topic: 'weather' }, { w: 'WINTER', k: 'noun', topic: 'weather' }],
            print: 'The first snow of winter fell overnight, as forecast.',
          },
        ],
      },
    ],
  },
];

// Things readers and officials say the morning after. Picked by what happened.
export const REACTIONS = {
  partyPleased: ['The Deputy Minister telephoned to say nothing, warmly.', 'A box of chocolates arrived from the Central Committee. Two are missing.'],
  partyAngry: ['The telephone rang at 6 a.m. Nobody spoke. Then they hung up.', 'Your parking space has been reassigned to the sports editor.'],
  readersBelieve: ['A reader wrote to say she had cut out the front page and kept it.', 'Copies sold out by eight. Some were even read.'],
  readersDoubt: ['A reader wrote to ask whether the newspaper is printed in this country.', 'Sales are steady. Use of the paper for wrapping fish is up 30%.'],
  contradiction: ['Readers have noticed that today\'s paper disagrees with last week\'s paper.', 'A letter arrived containing two of your front pages, side by side, and no other comment.'],
  worn: ['Readers now translate "{phrase}" as "disaster." It has been added to the slang dictionary.'],
};

export const ENDINGS = {
  loyal: { title: 'LOYAL EDITOR', text: 'The Party is satisfied. You have been offered a larger office with a smaller window.' },
  truth: { title: 'QUIET TRUTH-TELLER', text: 'Some readers have learned to read your paper carefully. Some officials have too.' },
  unperson: { title: 'UNPERSON', text: 'There has never been an editor by your name. There has never been an editor.' },
  collapse: { title: 'COLLAPSE', text: 'Nobody believes the paper. Nobody believes anything. The presses roll on, for an audience of none.' },
  survivor: { title: 'SURVIVOR', text: 'You are still at your desk. For now, that will have to count as a result.' },
};
