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
//   blameClaim         optional: what a BLAME headline asserts about the topic ('bad' once the
//                      Party wants the failure admitted and pinned on someone)
//   crisis             true for the accident in Act Three: whether readers act on a warning
//                      depends on whether they still believe the paper
//
// A day may also carry:
//   revise   { term, replace: [[from, to]], rewriteTo?, topic?, claim?, why, clean }
//            before the desk opens, every past edition mentioning `term` must be rewritten,
//            corrected or left (unpersons, and allies who were always enemies)
//   reverse  { topic, claim, text }  the Party changes Official Reality on a topic
//
// An act may carry `intro` (a memo before its first day), `year`, and `crossword: true`
// (page 6 has a crossword, in which a buried story can be hidden for readers who look).
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
    year: 1978,
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
  {
    title: 'ACT TWO · REVISIONS',
    year: 1978,
    crossword: true,
    intro: {
      no: 'P-2/001',
      from: 'Department of Agitation and Propaganda',
      subject: 'Continuation of your appointment',
      body: [
        'Your appointment has been continued. This is not a promotion. It is a continuation.',
        'In the coming weeks certain facts will be revised. When a fact is revised, it has always been revised. Past editions will be brought into line before each new edition is set.',
        'Separately: the residents of Zarechye have written to you privately, asking that somebody, somewhere, print the truth. Page 6 now carries a crossword. Nobody at the Committee does the crossword. Usually.',
      ],
      stamp: 'CONTINUED',
      button: 'RETURN TO THE DESK',
    },
    days: [
      {
        date: '14 NOVEMBER',
        season: 'snow',
        revise: {
          term: 'VOLKOV',
          replace: [['COMRADE VOLKOV', 'A comrade'], ['VOLKOV', '']],
          why: 'Comrade Volkov has been relieved of all his posts, including his past. Every edition that mentions him is to be brought into line before tonight\'s edition is set.',
          clean: 'Your archive contains no mention of him. The Committee notes that you anticipated its decision by several weeks, and would like to know how.',
        },
        directives: [
          'There has never been a Comrade Volkov. He is not to be mentioned, including in this sentence.',
          'Turbines have arrived at the Northern Dam, which has always been called the Northern Dam. HEADLINE.',
        ],
        wires: [
          {
            id: 'turbines', slug: 'TURBINES REACH DAM, THIRTEEN MONTHS LATE', source: 'TASS 10:40',
            text: 'The turbines for the dam have arrived. They were built for a different dam and do not fit. Engineers are "adapting the dam."',
            topic: 'dam', truth: 'neutral', visible: false, importance: 2,
            party: { want: 'headline', note: 'The Northern Dam.' },
            tiles: [{ w: 'NORTHERN DAM', k: 'noun', topic: 'dam' }, { w: 'TURBINES', k: 'noun', topic: 'dam' }, { w: 'ARRIVE', k: 'link' }, { w: 'DO NOT FIT', k: 'truth' }, { w: 'ELECTRIFIED', k: 'praise' }],
            print: 'The turbines for the Northern Dam have arrived and are being fitted, with adjustments to the dam.',
          },
          {
            id: 'gym', slug: 'ZARECHYE FAMILIES IN GYMNASIUM FOR FIFTH WEEK', source: 'LETTERS 12:15',
            text: 'The 140 residents of Zarechye are still living in the school gymnasium. The school has moved its lessons to the corridor.',
            topic: 'zarechye', truth: 'bad', visible: true, importance: 2,
            party: { want: 'bin', note: 'Resolved.' },
            tiles: [{ w: 'ZARECHYE', k: 'noun', topic: 'zarechye' }, { w: 'HOMELESS', k: 'truth' }, { w: 'GYMNASIUM', k: 'noun', topic: 'zarechye' }],
            print: 'One hundred and forty residents of Zarechye remain in a school gymnasium, five weeks after their village was flooded.',
          },
          {
            id: 'plenum', slug: 'PLENUM ENDS WITH ELEVEN-MINUTE OVATION', source: 'TASS 17:30',
            text: 'The ovation at the close of the Plenum lasted eleven minutes. It ended when a delegate from the paper industry fainted and was taken to be the first to stop.',
            topic: 'plenum', truth: 'good', visible: false, importance: 1,
            party: { want: 'front', note: '' },
            tiles: [{ w: 'PLENUM', k: 'noun', topic: 'plenum' }, { w: 'OVATION', k: 'praise' }, { w: 'UNANIMOUS', k: 'praise' }],
            print: 'The Plenum closed with an ovation of eleven minutes. All delegates applauded until the end.',
          },
          {
            id: 'valdaria-1', slug: 'FRATERNAL DELEGATION FROM VALDARIA VISITS TRACTOR WORKS', source: 'TASS 14:05',
            text: 'A delegation from the fraternal People\'s Republic of Valdaria toured the Tractor Works and admired the frames.',
            topic: 'valdaria', truth: 'good', visible: false, importance: 1,
            party: { want: 'front', note: 'Eternal friendship.' },
            tiles: [{ w: 'VALDARIA', k: 'noun', topic: 'valdaria' }, { w: 'FRIENDSHIP', k: 'praise' }, { w: 'ETERNAL', k: 'praise' }],
            print: 'A delegation from fraternal Valdaria toured the Tractor Works, and spoke of eternal friendship.',
          },
        ],
      },
      {
        date: '21 NOVEMBER',
        season: 'snow',
        reverse: { topic: 'harvest', claim: 'bad', text: 'THE HARVEST WAS SABOTAGED BY WRECKERS (Central Committee)' },
        directives: [
          'The harvest failed. It was sabotaged by wreckers, as this newspaper has always reported. HEADLINE.',
          'The Motherland does not import grain. Ships are not news.',
        ],
        wires: [
          {
            id: 'agronomists', slug: 'SEVEN AGRONOMISTS ARRESTED FOR "WRECKING"', source: 'TASS 09:30',
            text: 'Seven agronomists who warned in August of an early frost have been arrested for causing it.',
            topic: 'harvest', truth: 'bad', visible: false, importance: 3, blameClaim: 'bad',
            party: { want: 'headline', note: 'Wreckers.' },
            tiles: [{ w: 'AGRONOMISTS', k: 'noun', topic: 'harvest' }, { w: 'HARVEST', k: 'noun', topic: 'harvest' }, { w: 'WRECKERS', k: 'blame' }, { w: 'ARRESTED', k: 'truth' }, { w: 'WARNED', k: 'truth' }],
            print: 'Seven agronomists, who in August warned of an early frost, have been arrested in connection with the harvest.',
          },
          {
            id: 'ships', slug: 'GRAIN SHIPS FROM ABROAD UNLOAD AT ODESSKAYA', source: 'PORT DESK 11:50',
            text: 'Four foreign grain ships are unloading at the port. Dockers have been asked not to look at the flags.',
            topic: 'imports', truth: 'neutral', visible: true, importance: 2,
            party: { want: 'bin', note: 'Not news.' },
            tiles: [{ w: 'GRAIN', k: 'noun', topic: 'imports' }, { w: 'SHIPS', k: 'noun', topic: 'imports' }, { w: 'IMPORTED', k: 'truth' }],
            print: 'Four grain ships from abroad are unloading at the port of Odesskaya.',
          },
          {
            id: 'ration-up', slug: 'BREAD RATION RAISED TO 450 G', source: 'REGIONAL DESK 15:10',
            text: 'The bread ration in the Northern Oblast has been raised by fifty grams, thanks to the ships that are not news.',
            topic: 'ration', truth: 'good', visible: true, importance: 1,
            party: { want: 'front', note: 'Thanks to the Party.' },
            tiles: [{ w: 'BREAD', k: 'noun', topic: 'ration' }, { w: 'RATION', k: 'noun', topic: 'ration' }, { w: 'GENEROUS', k: 'praise' }],
            print: 'The bread ration in the Northern Oblast has been raised to 450 grams per adult per day.',
          },
          {
            id: 'hockey', slug: 'HOCKEY: NATIONAL TEAM BEATS VALDARIA 7–0', source: 'SPORT 21:40',
            text: 'The national team beat fraternal Valdaria 7–0. The Valdarian goalkeeper has asked for asylum, in hockey.',
            topic: 'hockey', truth: 'good', visible: true, importance: 1,
            party: { want: 'front', note: '' },
            tiles: [{ w: 'HOCKEY', k: 'noun', topic: 'hockey' }, { w: 'VICTORY', k: 'praise' }],
            print: 'The national hockey team defeated Valdaria by seven goals to nil, in a friendly match.',
          },
        ],
      },
      {
        date: '2 DECEMBER',
        season: 'snow',
        revise: {
          term: 'VALDARIA',
          replace: [['FRATERNAL VALDARIA', 'hostile Valdaria'], ['VALDARIA', 'Valdaria (an enemy state)']],
          rewriteTo: 'VALDARIA: A THREAT, AS ALWAYS',
          topic: 'valdaria',
          claim: 'bad',
          why: 'Valdaria has always been the enemy. Editions describing Valdaria as fraternal were printed in error, by you, and are to be brought into line.',
          clean: 'Your archive contains nothing about Valdaria. This is noted as foresight.',
        },
        directives: [
          'Valdaria has always been the enemy. HEADLINE.',
          'The Valdarian delegation was never here. Its departure is not news.',
        ],
        wires: [
          {
            id: 'valdaria-2', slug: 'VALDARIAN TRACTORS DESCRIBED AS "AGGRESSIVE"', source: 'TASS 10:10',
            text: 'The Foreign Ministry describes Valdaria\'s new tractors as aggressive in design. No other change in Valdaria has been reported.',
            topic: 'valdaria', truth: 'neutral', visible: false, importance: 2, blameClaim: 'bad',
            party: { want: 'headline', note: 'Always the enemy.' },
            tiles: [{ w: 'VALDARIA', k: 'noun', topic: 'valdaria' }, { w: 'AGGRESSION', k: 'blame' }, { w: 'PROVOCATION', k: 'blame' }, { w: 'TRACTORS', k: 'noun', topic: 'valdaria' }, { w: 'NOTHING CHANGED', k: 'truth' }],
            print: 'The Foreign Ministry has expressed concern at the design of Valdarian tractors.',
          },
          {
            id: 'delegation-leaves', slug: 'VALDARIAN DELEGATION LEAVES EARLY', source: 'CITY DESK 12:30',
            text: 'The Valdarian delegation left the capital at dawn. Several hundred people watched them go. One of them was still carrying a souvenir tractor frame.',
            topic: 'valdaria', truth: 'neutral', visible: true, importance: 1,
            party: { want: 'bin', note: 'Never here.' },
            tiles: [{ w: 'DELEGATION', k: 'noun', topic: 'valdaria' }, { w: 'LEAVES', k: 'link' }],
            print: 'A Valdarian delegation left the capital this morning.',
          },
          {
            id: 'heating', slug: 'HEATING OFF IN FORTY APARTMENT BLOCKS', source: 'CITY DESK 08:15',
            text: 'Forty apartment blocks on the east side have had no heating for six days. Residents are sleeping in their coats.',
            topic: 'heating', truth: 'bad', visible: true, importance: 2,
            party: { want: 'bury', note: 'Seasonal.' },
            tiles: [{ w: 'HEATING', k: 'noun', topic: 'heating' }, { w: 'COLD', k: 'truth' }, { w: 'RESIDENTS', k: 'noun', topic: 'heating' }],
            print: 'Forty apartment blocks on the east side have been without heating for six days.',
          },
          {
            id: 'trees', slug: 'NEW YEAR TREES ARRIVE IN CAPITAL', source: 'CITY DESK 16:20',
            text: 'The first New Year trees have arrived at the markets. They are smaller than last year\'s, which is attributed to Valdaria.',
            topic: 'trees', truth: 'good', visible: true, importance: 1,
            party: { want: 'front', note: '' },
            tiles: [{ w: 'NEW YEAR', k: 'noun', topic: 'trees' }, { w: 'TREES', k: 'noun', topic: 'trees' }, { w: 'FESTIVE', k: 'praise' }],
            print: 'New Year trees have arrived at the capital\'s markets.',
          },
        ],
      },
    ],
  },
  {
    title: 'ACT THREE · THE ACCIDENT',
    year: 1979,
    crossword: true,
    intro: {
      no: 'P-3/001',
      from: 'Department of Agitation and Propaganda',
      subject: 'Spring',
      body: [
        'It is spring. The paper has completed a year of continuous accuracy, by its own account.',
        'The Severny Atomic Power Station, 110 kilometres north of the capital, will this week celebrate its fifth year without an incident.',
        'A reminder: when the paper tells people something, they decide whether to believe it based on everything the paper has told them before. The Committee does not regard this as a problem.',
      ],
      stamp: 'SPRING',
      button: 'RETURN TO THE DESK',
    },
    days: [
      {
        date: '26 APRIL',
        season: 'spring',
        directives: [
          'A minor incident at the Severny Atomic Power Station is fully under control. It is not news.',
          'May Day preparations are going splendidly. HEADLINE.',
        ],
        wires: [
          {
            id: 'severny-fire', slug: 'FIRE AT SEVERNY POWER STATION, UNIT 2', source: 'REGIONAL DESK 04:10',
            text: 'A fire, and "readings above the scale," at Unit 2. Firemen from Lesnogorsk attended in shirtsleeves. The station director says there is nothing to worry about, and has sent his family to his mother\'s.',
            topic: 'severny', truth: 'bad', visible: false, importance: 3, crisis: true,
            party: { want: 'bin', note: 'Not news.' },
            tiles: [{ w: 'SEVERNY', k: 'noun', topic: 'severny' }, { w: 'REACTOR', k: 'noun', topic: 'severny' }, { w: 'FIRE', k: 'truth' }, { w: 'STAY INDOORS', k: 'truth' }, { w: 'UNDER CONTROL', k: 'praise' }],
            print: 'A fire broke out overnight at Unit 2 of the Severny Atomic Power Station. Instruments recorded readings above their scale.',
          },
          {
            id: 'mayday-1', slug: 'MAY DAY REHEARSALS BEGIN', source: 'CITY DESK 11:00',
            text: 'Rehearsals for the May Day parade have begun. This year schoolchildren will march at the front.',
            topic: 'mayday', truth: 'good', visible: true, importance: 1,
            party: { want: 'headline', note: '' },
            tiles: [{ w: 'MAY DAY', k: 'noun', topic: 'mayday' }, { w: 'PARADE', k: 'noun', topic: 'mayday' }, { w: 'JOYFUL', k: 'praise' }],
            print: 'Rehearsals for the May Day parade have begun on Red Square.',
          },
          {
            id: 'fish', slug: 'ANGLERS REPORT FISH "BEHAVING STRANGELY"', source: 'LETTERS 14:40',
            text: 'Anglers on the Severka river report that the fish are floating, and that the river is warm.',
            topic: 'severny', truth: 'bad', visible: false, importance: 1, crisis: true,
            party: { want: 'bin', note: '' },
            tiles: [{ w: 'RIVER', k: 'noun', topic: 'severny' }, { w: 'FISH', k: 'noun', topic: 'severny' }],
            print: 'Anglers on the Severka report dead fish and unusually warm water.',
          },
        ],
      },
      {
        date: '28 APRIL',
        season: 'spring',
        directives: [
          'There has been no accident. There was a fire, which was heroically put out. The firemen are heroes. HEADLINE.',
          'The residents of Lesnogorsk are on a short holiday. Holidays are not news.',
        ],
        wires: [
          {
            id: 'firemen', slug: 'SIX FIREMEN FLOWN TO MOSCOW HOSPITAL', source: 'TASS 09:05',
            text: 'Six firemen who fought the Severny fire have been flown to a specialist hospital. Doctors are not permitted to say what they are suffering from, and do not need to.',
            topic: 'severny', truth: 'bad', visible: false, importance: 2, crisis: true,
            party: { want: 'headline', note: 'Heroes.' },
            tiles: [{ w: 'FIREMEN', k: 'noun', topic: 'severny' }, { w: 'HEROES', k: 'praise' }, { w: 'RADIATION', k: 'truth' }, { w: 'SEVERNY', k: 'noun', topic: 'severny' }, { w: 'STAY INDOORS', k: 'truth' }],
            print: 'Six firemen who fought the fire at Severny are being treated in hospital for radiation sickness.',
          },
          {
            id: 'buses', slug: 'LESNOGORSK EVACUATED BY 1,100 BUSES', source: 'REGIONAL DESK 13:30',
            text: 'Lesnogorsk, a town of 49,000, was emptied in three hours. Residents were told to bring documents for three days. The buses drove through the northern suburbs of the capital.',
            topic: 'severny', truth: 'bad', visible: true, importance: 3, crisis: true,
            party: { want: 'bury', note: 'A holiday.' },
            tiles: [{ w: 'LESNOGORSK', k: 'noun', topic: 'severny' }, { w: 'EVACUATED', k: 'truth' }, { w: 'HOLIDAY', k: 'euph' }],
            print: 'The town of Lesnogorsk, 49,000 people, has been evacuated in 1,100 buses.',
          },
          {
            id: 'detected', slug: 'FOREIGN STATIONS DETECT RADIATION 1,000 KM AWAY', source: 'MONITORING 18:20',
            text: 'Monitoring stations abroad have detected raised radiation and traced it to our territory. They are asking questions.',
            topic: 'severny', truth: 'bad', visible: false, importance: 2, crisis: true,
            party: { want: 'front', note: 'Western lies.' },
            tiles: [{ w: 'RADIATION', k: 'truth' }, { w: 'FOREIGN', k: 'noun', topic: 'severny' }],
            print: 'Monitoring stations abroad report raised radiation, which they trace to Severny.',
          },
        ],
      },
      {
        date: '1 MAY',
        season: 'spring',
        directives: [
          'The May Day parade will go ahead as planned. The children will march at the front. HEADLINE.',
          'The direction of the wind is a state secret.',
        ],
        wires: [
          {
            id: 'mayday-2', slug: 'MAY DAY: CHILDREN TO LEAD THE PARADE', source: 'CITY DESK 06:00',
            text: 'Thirty thousand schoolchildren will lead the parade through the capital this morning, in the open air.',
            topic: 'mayday', truth: 'neutral', visible: true, importance: 2,
            party: { want: 'headline', note: '' },
            tiles: [{ w: 'MAY DAY', k: 'noun', topic: 'mayday' }, { w: 'CHILDREN', k: 'noun', topic: 'mayday' }, { w: 'JOYFUL', k: 'praise' }, { w: 'POSTPONED', k: 'truth' }],
            print: 'Thirty thousand schoolchildren led the May Day parade through the capital.',
          },
          {
            id: 'wind', slug: 'WIND TURNS SOUTH, TOWARDS THE CAPITAL', source: 'HYDROMET 05:15',
            text: 'Overnight the wind turned. The meteorological service has measured raised radiation in the northern districts and recommends that people stay indoors with their windows closed.',
            topic: 'severny', truth: 'bad', visible: false, importance: 3, crisis: true,
            party: { want: 'bin', note: 'State secret.' },
            tiles: [{ w: 'WIND', k: 'noun', topic: 'severny' }, { w: 'STAY INDOORS', k: 'truth' }, { w: 'CLOSE WINDOWS', k: 'truth' }, { w: 'FRESH AIR', k: 'praise' }],
            print: 'The meteorological service recommends that residents of the capital stay indoors and keep their windows closed.',
          },
          {
            id: 'iodine', slug: 'PHARMACIES SELL OUT OF IODINE', source: 'CITY DESK 10:45',
            text: 'Pharmacies in the capital have sold out of iodine. Nobody has told anybody anything, so everybody has told everybody.',
            topic: 'severny', truth: 'bad', visible: true, importance: 2, crisis: true,
            party: { want: 'bin', note: 'Rumours.' },
            tiles: [{ w: 'IODINE', k: 'noun', topic: 'severny' }, { w: 'RUMOURS', k: 'blame' }],
            print: 'Pharmacies in the capital report that iodine is sold out.',
          },
        ],
      },
      {
        date: '6 MAY',
        season: 'spring',
        reverse: { topic: 'severny', claim: 'bad', text: 'ACCIDENT AT SEVERNY; HEROIC RESPONSE (Central Committee)' },
        directives: [
          'The Central Committee today announces the accident at Severny and the heroic response to it, as this newspaper has always reported. HEADLINE.',
          'Readers are to remain calm and to believe this newspaper.',
        ],
        wires: [
          {
            id: 'announce', slug: 'GOVERNMENT ANNOUNCES "ACCIDENT" AT SEVERNY', source: 'TASS 12:00',
            text: 'Ten days after the fire, the Government has announced an accident at Severny. A thirty-kilometre zone has been closed. Residents of the capital are advised to wash vegetables and keep children indoors.',
            topic: 'severny', truth: 'bad', visible: true, importance: 3, crisis: true,
            party: { want: 'headline', note: 'Heroic response.' },
            tiles: [{ w: 'SEVERNY', k: 'noun', topic: 'severny' }, { w: 'ACCIDENT', k: 'truth' }, { w: 'HEROIC RESPONSE', k: 'praise' }, { w: 'KEEP CHILDREN INDOORS', k: 'truth' }, { w: 'WESTERN EXAGGERATION', k: 'blame' }],
            print: 'The Government has announced an accident at the Severny Atomic Power Station. Residents are advised to keep children indoors and to wash vegetables.',
          },
          {
            id: 'sowing', slug: 'SPRING SOWING COMPLETED AHEAD OF PLAN', source: 'TASS 15:30',
            text: 'Spring sowing is complete ahead of plan, except in a thirty-kilometre circle, which has been removed from the plan.',
            topic: 'sowing', truth: 'good', visible: false, importance: 1,
            party: { want: 'front', note: '' },
            tiles: [{ w: 'SOWING', k: 'noun', topic: 'sowing' }, { w: 'AHEAD OF PLAN', k: 'praise' }],
            print: 'Spring sowing has been completed ahead of plan.',
          },
          {
            id: 'firemen-2', slug: 'TWO FIREMEN DIE IN HOSPITAL', source: 'LETTERS 18:10',
            text: 'Two of the six firemen have died. Their families were told by telephone and asked not to hold a funeral.',
            topic: 'severny', truth: 'bad', visible: false, importance: 2, crisis: true,
            party: { want: 'bury', note: '' },
            tiles: [{ w: 'FIREMEN', k: 'noun', topic: 'severny' }, { w: 'DIE', k: 'truth' }, { w: 'HEROES', k: 'praise' }],
            print: 'Two firemen who fought the fire at Severny have died in hospital.',
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
  crosswordSafe: ['A reader posted in the completed crossword. Fourteen across was "{word}". Underneath, in pencil: "understood."', 'The crossword was solved by more readers than usual. Several did it twice.'],
  crosswordCaught: ['The Censor\'s office completed the crossword. Fourteen across was "{word}". The Censor would like a word, and it is not that one.'],
  crisisHeard: ['Readers believed the paper. Across the capital, windows were closed and children kept indoors.', 'Queues formed outside pharmacies, calmly, because the paper had said so.'],
  crisisIgnored: ['Readers assumed the warning was more of the same, and opened their windows to look for it.', 'Nobody believed the warning. A reader wrote to say that if the paper says stay indoors, it is surely a good day for a picnic.'],
};

// A word from a buried story, for the crossword.
export const CROSSWORD_WORD = (story) => (story.tiles.find((t) => t.k === 'truth') || story.tiles[0]).w;

// What the archive revision costs, per past edition.
export const REVISION_EFFECTS = {
  rewrite: { approval: 3, credibility: -1, conscience: -4 },
  correct: { approval: 1, credibility: -4, conscience: 0 },
  leave: { approval: -8, credibility: 0, conscience: 1 },
};

export const ENDINGS = {
  loyal: { title: 'LOYAL EDITOR', text: 'The Party is satisfied. You have been offered a larger office with a smaller window.' },
  truth: { title: 'QUIET TRUTH-TELLER', text: 'Some readers have learned to read your paper carefully. Some officials have too.' },
  unperson: { title: 'UNPERSON', text: 'There has never been an editor by your name. There has never been an editor.' },
  collapse: { title: 'COLLAPSE', text: 'Nobody believes the paper. Nobody believes anything. The presses roll on, for an audience of none.' },
  survivor: { title: 'SURVIVOR', text: 'You are still at your desk. For now, that will have to count as a result.' },
};
