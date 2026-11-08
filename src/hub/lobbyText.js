// Words for the lobby's standing features: the queue, the clock and the honours board.
// Plain data, so it can be edited without touching the scene code.

export const QUEUE = {
  shuffleSeconds: 30, // idle time per place advanced
  startMin: 3800,
  startMax: 4600,
  maxAnimated: 3, // shuffles shown on return; the rest are applied quietly
  awayToastOver: 10, // only mention the time away if it was more than this many places
  standTitle: 'YOUR POSITION',
  standFoot: 'PLEASE REMAIN IN THE QUEUE',
  away: (n) => `While you were away you advanced ${n.toLocaleString('en-GB')} places. Thank you for your patience.`,
  lunch: 'The window has closed for lunch. Your place has been transferred to the back of the queue.',
};

export const CLOCK = {
  adjusted: 'Official time has been adjusted to reflect the Plan.',
  plate: (h) => ['OFFICIAL TIME', `ADJUSTED −${h} h`],
  tip: 'The clock is correct. Reality is running fast.',
};

export const BOARD = {
  title: 'HEROES OF LABOUR',
  subtitle: 'THIS DISTRICT',
  pending: 'NOMINATIONS PENDING',
  removed: 'REMOVED',
  citizen: (no) => `Citizen No. ${String(no).padStart(6, '0')}`,
  tipTitle: 'HEROES OF LABOUR · THIS DISTRICT',
  tipBody: 'Twelve most recent honours. Withdrawn honours remain on display as a reminder.',
  tipHint: 'CLICK TO OPEN THE REGISTER',
  register: {
    no: 'HL-REG',
    subject: 'Honours Register (most recent first)',
    empty: 'No honours have been recorded. Nominations are pending.',
    withdrawn: '[Entry withdrawn]',
    foot: 'Entries are retained for forty records. Earlier heroes have been consolidated.',
  },
};
