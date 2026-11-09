// THE SPEECH — the data. Seven hours, abridged by nobody. [BRACKETS] mark a key phrase the
// stenographer must type; a trailing * marks a line that calls for applause. The joke is on the
// length, the cult and the record, never on the crowd, who have been standing since 22:00.

export const HOURS = [
  {
    topic: 'Opening remarks',
    lines: [
      'Compañeros. I will be brief. *',
      'As I said in my previous speech, which was also brief, [THE HARVEST] has exceeded the plan.',
      'The plan has also been exceeded, by the harvest, which is a sign of [MUTUAL RESPECT]. *',
      'Some have asked why there is no rice. I ask: why do they ask?',
      'The answer is in the plan, which I will now read.',
      'Chapter one.',
    ],
  },
  {
    topic: 'The plan, chapter one',
    lines: [
      'In 1961 the plan foresaw everything, including this speech, which is going well. *',
      'Sugar production rose by eleven percent, and then by a further [ELEVEN PERCENT] when it was recounted.',
      'The cows of the eastern provinces have been asked to produce more milk, and have agreed in principle.',
      'Their contribution will be recognised at [THE NEXT CONGRESS]. *',
      'I turn now to the matter of bicycles.',
      'There are enough bicycles. There are also enough pedals, in theory.',
    ],
  },
  {
    topic: 'The matter of bicycles, continued',
    lines: [
      'A bicycle is a car that has [ACHIEVED HUMILITY]. *',
      'The imperialists have cars. We have bicycles, and also cars from 1957, which are better. *',
      'I thank the mechanics, who are [NOT PRESENT] because they are holding something together.',
      'I now come to the second part of my introduction.',
      'I see some comrades are sitting down. This is permitted after the fourth hour.',
      'We are in the third hour.',
    ],
  },
  {
    topic: 'The second part of the introduction',
    lines: [
      'The revolution is not a party. It is [A LONG MEETING]. *',
      'And at a long meeting, everybody stays until [THE END].',
      'The end has been scheduled. Its date is a matter of state security. *',
      'I see that some of you are taking notes. Good. Continue.',
      'I see that one of you has stopped taking notes.',
      'We will discuss this later, at length.',
    ],
  },
  {
    topic: 'Lessons of the sugar',
    lines: [
      'Ten million tons were promised. We produced a smaller number with [GREATER CONVICTION]. *',
      'Conviction does not dissolve in coffee, which is why there is no coffee.',
      'There is [MIXED COFFEE], which is coffee that has made friends with peas. *',
      'The peas have been decorated. *',
      'I turn now, briefly, to everything else.',
      'Everything else is going well.',
    ],
  },
  {
    topic: 'Everything else',
    lines: [
      'Electricity is going well, at night, in principle. [THE BLACKOUTS] are a form of rest. *',
      'Rest is a right, and we have extended it to [THE REFRIGERATORS].',
      'The refrigerators have thanked the Party. *',
      'Housing: every family has a roof. Some families have the same roof.',
      'This is called [SOLIDARITY]. *',
      'I will now begin to conclude.',
    ],
  },
  {
    topic: 'In conclusion (part one)',
    lines: [
      'In conclusion, the sun is rising, as [THE PLAN] foresaw. *',
      'Some of you have been standing for seven hours. History will remember [YOUR KNEES].',
      'I could go on.',
      'I will go on, [TOMORROW], at nine. *',
      'Long live the revolution, long live the harvest, and long live this speech. *',
      'The speech continues in tomorrow\'s newspaper.',
    ],
  },
];

/** Parse a line into words, with key-phrase ids and the applause flag. */
export function parseLine(raw) {
  const applause = /\*\s*$/.test(raw);
  const text = raw.replace(/\s*\*\s*$/, '');
  const words = [];
  const phrases = [];
  let inPhrase = null;
  for (const tok of text.split(/\s+/)) {
    let w = tok;
    if (w.startsWith('[')) {
      inPhrase = { words: [], start: words.length };
      w = w.slice(1);
    }
    let end = false;
    const m = w.match(/^(.*?)\](.*)$/);
    if (m) {
      w = m[1] + m[2];
      end = true;
    }
    words.push({ text: w, phrase: inPhrase ? phrases.length : -1 });
    if (inPhrase) inPhrase.words.push(m ? m[1] : w);
    if (end && inPhrase) {
      phrases.push({ text: inPhrase.words.join(' '), start: inPhrase.start, end: words.length - 1 });
      inPhrase = null;
    }
  }
  return { raw: text.replace(/[[\]]/g, ''), words, phrases, applause };
}

export const START_HOUR = 23; // the clock on the tower: 23:00 to 06:00

export const TEXT = {
  dept: 'Office of the Stenographer',
  memo: {
    no: 'ST-3/01',
    subject: 'Tonight\'s address, from 23:00, briefly',
    body: [
      'The Comandante will speak tonight. The address is expected to be brief, by the usual standard of seven hours.',
      'TYPE each key phrase as it is spoken; it appears on your pad. Press ENTER when a line calls for (APPLAUSE). Applause is spontaneous and compulsory.',
      'Press the UP ARROW on the beat to stay awake. Typing also helps. A gentleman in a grey suit will be keeping a separate record of the applause.',
    ],
    button: 'LOAD THE PAPER',
  },
  noticed: [
    'The gentleman in the grey suit writes something down.',
    'The gentleman in the grey suit writes something down, and underlines it.',
    'The gentleman in the grey suit has started a second page.',
    'The gentleman in the grey suit has sent for a colleague.',
  ],
  early: 'Your applause was early. It has been recorded as enthusiasm.',
  asleep: 'You have closed your eyes for a moment. The speech has not.',
  awake: 'You are awake. You have missed nothing, officially.',
  hour: (n, topic) => `HOUR ${n} OF 7 · ${topic.toUpperCase()}`,
};

export const NEWSPAPER = {
  masthead: 'LA VERDAD REVOLUCIONARIA',
  motto: 'ORGAN OF THE OFFICE OF THE STENOGRAPHER',
  date: 'THE MORNING AFTER, AT 06:00',
  price: '20 CENTAVOS',
  headline: 'THE SPEECH, IN FULL',
  deck: 'Continued on every page of this edition; the sports section has been postponed until the end of the speech',
  columns: (r) => [
    r.transcript,
    `The transcript above was taken down by hand, in the press box, by a stenographer who recorded ${r.phrases} of the ${r.total} key phrases and applauded ${r.hits} times. The applause, which was spontaneous, lasted ${r.applauseMinutes} minutes in total.`,
    r.good
      ? 'The stenographer has been awarded the Order of the Open Eyes. The gentleman in the grey suit has filed his record, which agrees with the newspaper.'
      : `The gentleman in the grey suit noted ${r.noticed} lapse${r.noticed === 1 ? '' : 's'} in applause. They will be discussed at the next meeting, which will be long.`,
  ],
  sidebar: (r) => ({
    title: 'THE SPEECH IN FIGURES',
    items: ['Duration: 7 hours (abridged: no)', `Key phrases recorded: ${r.phrases} of ${r.total}`, `Applause: ${r.cues} cues, all spontaneous`, `Times the stenographer rested their eyes: ${r.naps}`, `Noted by the grey suit: ${r.noticed}`],
  }),
  caption: 'The plaza at dawn. The Comandante, centre, continuing.',
};
