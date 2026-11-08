// THE PRESS CONFERENCE · data. Edit freely: the scene reads every line and number from here.
//
// You answer each question by choosing one fragment for each of three slots:
//   begin  how sure you sound        conf: multiplies what the rest of the sentence does to the border
//   say    a line from the note      border: how much it opens things up; calm: the Committee's mood
//   when   when it happens           mult: multiplies again. "Immediately" is very large.
// The border opens if the total reaches RULES.openAt by the end.

export const RULES = {
  openAt: 60,
  calmStart: 100,
};

export const BEGIN = [
  { text: 'I would have to check, but', conf: 0.3, calm: 4 },
  { text: 'This has been discussed, and', conf: 0.6, calm: 2 },
  { text: 'As far as I know,', conf: 1.0, calm: -2 },
  { text: 'The Council of Ministers has decided that', conf: 1.3, calm: -8 },
];

export const WHEN = [
  { text: 'subject to the usual procedures.', mult: 0.2, calm: 6 },
  { text: 'in due course.', mult: 0.4, calm: 3 },
  { text: 'shortly.', mult: 0.9, calm: -4 },
  { text: 'immediately, without delay.', mult: 2.0, calm: -20, loud: true },
];

// Only offered if you have read the small print on the note.
export const WHEN_READ = { text: 'not before four o\'clock tomorrow morning.', mult: 0, calm: 25, read: true };

export const QUESTIONS = [
  {
    who: 'Italian news agency',
    seat: 5,
    clock: '18:12',
    text: 'Comrade spokesman, is the government discussing the question of travel?',
    say: [
      { text: 'the question of travel is being studied', border: 1, calm: 5 },
      { text: 'travel regulations are to be simplified', border: 8, calm: -2 },
      { text: 'private travel abroad may be applied for', border: 14, calm: -6 },
    ],
  },
  {
    who: 'A local newspaper',
    seat: 1,
    clock: '18:27',
    text: 'Will citizens need a reason to travel? A wedding? A funeral?',
    say: [
      { text: 'reasons will be considered on their merits', border: 1, calm: 5 },
      { text: 'applications will be approved at short notice', border: 9, calm: -3 },
      { text: 'no preconditions need to be presented', border: 16, calm: -8 },
    ],
  },
  {
    who: 'West German television',
    seat: 8,
    clock: '18:41',
    text: 'Does this also apply to West Berlin?',
    say: [
      { text: 'the matter of Berlin is a separate matter', border: 1, calm: 4 },
      { text: 'the regulation applies to all crossing points', border: 12, calm: -6 },
      { text: 'permanent exit is possible via all border crossings into the West', border: 20, calm: -12 },
    ],
  },
  {
    who: 'An American network',
    seat: 3,
    clock: '18:49',
    text: 'Will people need a passport? Most people do not have a passport.',
    say: [
      { text: 'passports will be issued in the normal way', border: 1, calm: 4 },
      { text: 'the police will issue visas on application', border: 8, calm: -3 },
      { text: 'an identity card will do', border: 15, calm: -8 },
    ],
  },
  {
    who: 'A young reporter at the back',
    seat: 11,
    clock: '18:53',
    text: 'When does this come into effect?',
    final: true,
    say: [
      { text: 'this will be clarified by the relevant authorities', border: 2, calm: 6 },
      { text: 'the new regulation comes into effect', border: 18, calm: -5 },
      { text: 'the crossings are open', border: 30, calm: -15 },
    ],
  },
];

export const NOTE = {
  heading: 'DRAFT · FOR THE SPOKESMAN',
  lines: [
    'Re: Temporary transitional regulation on travel and permanent exit.',
    'Applications for private travel abroad may be submitted without presenting preconditions.',
    'Permits will be issued at short notice. Grounds for refusal will apply only in exceptional cases.',
    'Permanent exit is possible via all border crossings.',
    'The police are instructed to issue visas without delay.',
  ],
  smallPrint: 'Embargo: not to be announced before 04:00 tomorrow.',
  unread: 'You have not read this note. It was handed to you on the way in.',
};

export const TEXT = {
  dept: 'Office of Official Statements',
  title: 'THE PRESS CONFERENCE',
  intro: {
    no: 'MF-1989/11',
    from: 'The Committee',
    subject: 'Tonight\'s press conference',
    body: [
      'You will be the spokesman this evening. The foreign press will be present. Television will be present. You will be calm.',
      'A note concerning travel has been prepared. It has been placed in your hand. There was not time to read it to you, and there is not time for you to read it.',
      'Answer each question by combining phrases. Everything is fine. Say so.',
    ],
    button: 'FACE THE PRESS',
  },
  slots: { begin: 'BEGIN', say: 'FROM THE NOTE', when: 'WHEN' },
  speak: 'SPEAK',
  readNote: 'READ THE NOTE',
  closeNote: 'PUT IT DOWN',
  border: 'THE BORDER',
  borderStates: ['CLOSED', 'CLOSED (MURMURING)', 'CROWDS GATHERING', 'CROWDS AT THE GATE', 'OPEN'],
  calm: 'THE COMMITTEE',
  calmStates: ['TELEPHONING', 'STANDING UP', 'CONCERNED', 'CALM'],
  pick: 'Choose a phrase for each slot.',
  reactions: {
    quiet: ['(The press writes nothing down.)', '(A pen is put away.)', '(Someone yawns.)'],
    murmur: ['(Murmuring.)', '(Several pens move at once.)', '(A camera flash.)'],
    loud: ['(Uproar.)', '(Reporters are standing.)', '(Every camera flashes.)'],
  },
  readNote2: 'You have read the note. Nobody has ever read the note.',
  open: {
    memo: {
      no: 'MF-1989/11-X',
      from: 'The Committee',
      subject: 'Your answer',
      body: [
        'The press conference ended at 19:01. By 19:30 people were at the crossings. By 23:30 the crossings were open, on your authority, which you do not have.',
        'Everything is fine. Your career has been awarded the Medal for Immediate Effect, posthumously. You may keep the note.',
      ],
      stamp: 'IMMEDIATELY',
      button: 'ACCEPT THE MEDAL',
    },
    headline: 'BORDER OPENS "IMMEDIATELY, WITHOUT DELAY"',
    deck: 'Spokesman\'s announcement surprises spokesman; crowds report that everything is fine',
    columns: [
      'At an evening press conference the government spokesman confirmed that private travel abroad was now possible, effective immediately, as far as he knew.',
      'Within hours citizens had gathered at every crossing to verify the announcement in person. Officials confirmed it was correct, and that it had always been the plan, in a sense.',
    ],
    sidebar: (n) => ({ title: 'THE EVENING IN FIGURES', items: ['Crossings opened: all', 'Notes read in advance: 0', `Questions answered: ${n}`, 'Careers: 1 (former)'] }),
    caption: 'The press conference, shortly after the press left it.',
  },
  closed: {
    memo: {
      no: 'MF-1989/11-C',
      from: 'The Committee',
      subject: 'Your answers',
      body: [
        'Your answers were vague, cautious and correct. Nothing was announced. The press have gone home with nothing.',
        'The Committee is satisfied. The crowds have gathered anyway, having watched the broadcast and decided for themselves what it meant.',
      ],
      stamp: 'SATISFACTORY',
      button: 'GO HOME',
    },
    headline: 'SPOKESMAN CONFIRMS: EVERYTHING IS FINE',
    deck: 'Travel question "being studied"; studies continue',
    columns: [
      'At an evening press conference the government spokesman addressed questions on travel with great calm, confirming that the matter was being handled by the relevant authorities in due course.',
      'Reporters left the conference with a clear understanding that nothing had changed. Reports of crowds at the crossings are unrelated and are also being studied.',
    ],
    sidebar: (n) => ({ title: 'THE EVENING IN FIGURES', items: ['Crossings opened: none (officially)', 'Phrases used: approved', `Questions answered: ${n}`, 'Careers: 1 (intact)'] }),
    caption: 'The press conference, at which nothing happened.',
  },
  read: {
    memo: {
      no: 'MF-1989/11-R',
      from: 'The Committee',
      subject: 'Your answers',
      body: [
        'You read the note, including the part at the bottom. This has not happened before. The Committee is unsettled by it.',
        'The regulation will come into effect at four o\'clock tomorrow morning, in an orderly way, exactly as planned. The crowds will be informed when they arrive.',
      ],
      stamp: 'AS PLANNED',
      button: 'GO HOME',
    },
    headline: 'NEW TRAVEL RULES FROM 04:00, AS PLANNED',
    deck: 'Spokesman reads note; officials describe the experience as "irregular"',
    columns: [
      'At an evening press conference the government spokesman read out a note in full, including the date on which it was to be read out.',
      'The new travel regulation will take effect in an orderly manner tomorrow morning. Citizens are asked to remain calm until then, and to queue.',
    ],
    sidebar: (n) => ({ title: 'THE EVENING IN FIGURES', items: ['Crossings opened: at 04:00', 'Notes read in advance: 1', `Questions answered: ${n}`, 'Careers: 1 (unsettling)'] }),
    caption: 'The press conference, at which the note was read.',
  },
};
