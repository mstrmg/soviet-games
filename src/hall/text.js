// Words for the International Hall of Fraternal Nations and its passport control.

export const HALL = {
  masthead: { kicker: 'All visitors are welcome to be processed', title: ['INTERNATIONAL HALL', 'OF FRATERNAL NATIONS'], sub: 'Friendship is mandatory · Queue on the left' },
  banner: 'INTERNATIONAL HALL OF FRATERNAL NATIONS',
  subBanner: 'FRIENDSHIP BETWEEN PEOPLES  ★  BY APPOINTMENT ONLY',
  booth: ['PASSPORT CONTROL', 'ALL NATIONS · ONE WINDOW'],
  floorLine: 'WAIT HERE UNTIL CALLED',
  directoryTitle: 'FRATERNAL WINGS',
  notices: [
    'Visitors may travel freely between fraternal nations, subject to approval by each of them.',
    'Your passport photograph has been improved for your convenience.',
    'Luggage left unattended will be reported, then admired, then confiscated.',
    'The exchange rate between fraternal currencies is one to one, and also not available.',
    'Please do not photograph the guard. The guard has already photographed you.',
  ],
  issue: {
    no: 'IH-0001',
    from: 'Duty Guard, Passport Control',
    subject: 'Issue of a Fraternal Passport',
    body: [
      'Good day. Please look at the camera. Please do not look like that.',
      'Your passport admits you to three fraternal nations. Each will record your visit. Each will record the others recording it.',
      'Your photograph will be kept up to date with how you ought to look.',
    ],
    button: 'ACCEPT PASSPORT',
  },
  tip: {
    open: 'CLICK TO PRESENT YOUR PASSPORT',
    medals: (n, of) => `DECORATIONS ${n}/${of}`,
    stamped: 'VISA STAMP ISSUED',
  },
  newStamp: (w) => `★ VISA ISSUED: ${w.short}`,
};

export const PASSPORT = {
  cover: ['PASSPORT', 'OF THE FRATERNAL NATIONS'],
  fields: (p) => [
    ['Holder', p.name],
    ['Nationality', 'Fraternal'],
    ['Occupation', 'Visitor (approved)'],
    ['Issued', p.issued],
    ['Valid until', 'Further notice'],
  ],
  photoCaption: (rev) => (rev ? `Likeness improved · revision ${rev}` : 'Likeness as presented'),
  visasTitle: 'VISAS',
  hallStamp: ['INT. HALL', 'ADMITTED'],
  emptySlot: 'Space reserved for stamp',
  close: 'CLOSE PASSPORT',
};
