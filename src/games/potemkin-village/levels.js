// POTEMKIN VILLAGE — village data. Coordinates in metres. The road runs along x at z = 0;
// the inspector drives toward +x, so his right-hand window looks toward +z.
//
// things:  what exists in the village. type decides the model; weight is how bad it looks.
//          label is what he notes if he sees it; praise (optional) is what he admires once it is fixed.
//          side: 'right' | 'left' (which window can see it, before any occlusion).
// slots:   where the player can build. kind decides what can go there:
//            facade  (plywood) a painted house-front that hides whatever is behind it
//            banner  (paint)   a slogan on poles
//            crowd   (people)  cheerful citizens, waving
//            paint   (paint)   repaint/green the target thing      target: thing id
//            window  (plywood) stock the shop window with fake goods target: thing id

export const OPTIONS = {
  facade: { label: 'PLYWOOD FACADE', cost: { plywood: 2 }, good: 8, praise: 'a model dwelling' },
  banner: { label: 'BANNER', cost: { paint: 1 }, good: 4, praise: 'an inspiring slogan' },
  crowd: { label: 'CHEERFUL CITIZENS', cost: { people: 3 }, good: 6, praise: 'cheerful citizens' },
  paint: { label: 'PAINT IT', cost: { paint: 1 }, good: 3, praise: 'a fresh coat of paint' },
  window: { label: 'STOCK THE WINDOW', cost: { plywood: 1 }, good: 5, praise: 'a well-stocked shop' },
};

export const LEVELS = [
  {
    id: 'zarechnoe',
    name: 'ZARECHNOE',
    memo: {
      no: 'PV-1/01',
      subject: 'Inspection of the model collective farm "Bright Path"',
      body: [
        'A Deputy Inspector from the capital will drive through the village tomorrow at 10:00.',
        'He will look out of his right-hand window. He has a stiff neck and has never looked out of the left one.',
        'You have one night, seven sheets of plywood, four tins of paint and nine volunteers. The volunteers have volunteered.',
      ],
    },
    windows: ['right'],
    speed: 6, // metres per second
    budget: { plywood: 7, paint: 4, people: 9 },
    route: [
      [-46, 0],
      [46, 0],
    ],
    things: [
      { id: 'mud-1', type: 'mud', pos: [-31, 3.5], weight: 1.5, label: 'a sea of mud', praise: 'a village green' },
      { id: 'house-a', type: 'house', pos: [-25, 9], rot: 0.08, weight: 3, label: 'a house with no roof' },
      { id: 'fence-1', type: 'fence', pos: [-17, 4], len: 8, weight: 1, label: 'a fence held up by optimism', praise: 'a freshly painted fence' },
      { id: 'house-b', type: 'house', pos: [-9, 10], rot: -0.12, weight: 3, label: 'a house leaning on another house' },
      { id: 'house-b2', type: 'house', pos: [-14, 17], rot: 0.2, weight: 2, label: 'a house behind a house' },
      { id: 'well', type: 'well', pos: [-2, 5.5], weight: 1, label: 'a dry well' },
      { id: 'shop', type: 'shop', pos: [5, 8], weight: 3, label: 'an empty shop' },
      { id: 'mud-2', type: 'mud', pos: [12, 4], weight: 1.5, label: 'more mud', praise: 'a second village green' },
      { id: 'barn', type: 'barn', pos: [17, 12], weight: 2, label: 'a barn lying down' },
      { id: 'house-c', type: 'house', pos: [26, 9], rot: 0.05, weight: 3, label: 'a house with a tree inside it' },
      { id: 'junk', type: 'junk', pos: [33, 4.5], weight: 2, label: 'a tractor in pieces' },
      // the left side: unseen, therefore fine
      { id: 'ruin-l1', type: 'house', pos: [-20, -10], rot: 0.3, weight: 3, side: 'left', label: 'a ruin' },
      { id: 'ruin-l2', type: 'barn', pos: [2, -11], weight: 2, side: 'left', label: 'another ruin' },
      { id: 'ruin-l3', type: 'house', pos: [22, -9], rot: -0.2, weight: 3, side: 'left', label: 'a ruin, smaller' },
      { id: 'mud-l', type: 'mud', pos: [-6, -4], weight: 1.5, side: 'left', label: 'mud, unobserved' },
    ],
    slots: [
      { id: 'f-a', kind: 'facade', pos: [-25, 4.6] },
      { id: 'f-b', kind: 'facade', pos: [-9, 5.2] },
      { id: 'f-c', kind: 'facade', pos: [26, 4.8] },
      { id: 'f-barn', kind: 'facade', pos: [17, 6.4] },
      { id: 'p-fence', kind: 'paint', target: 'fence-1', pos: [-17, 4] },
      { id: 'p-mud1', kind: 'paint', target: 'mud-1', pos: [-31, 3.5] },
      { id: 'p-mud2', kind: 'paint', target: 'mud-2', pos: [12, 4] },
      { id: 'w-shop', kind: 'window', target: 'shop', pos: [5, 5.4] },
      { id: 'b-well', kind: 'banner', pos: [-2, 3.6] },
      { id: 'b-junk', kind: 'banner', pos: [33, 2.8] },
      { id: 'c-square', kind: 'crowd', pos: [0.5, 2.6] },
      { id: 'c-shop', kind: 'crowd', pos: [9, 2.6] },
      { id: 'c-east', kind: 'crowd', pos: [21, 2.6] },
    ],
  },
];

// The Inspector's remarks, as he sees things.
export const REMARKS = {
  bad: ['What is that?', 'Write that down.', 'Hm.', 'Is that... normal?', 'Driver, slow down. No — speed up.'],
  good: ['Charming.', 'Splendid.', 'Look at them wave!', 'Very modern.', 'Exactly as reported.'],
};

export const NEWSPAPER = {
  good: {
    headline: 'MODEL VILLAGE ASTONISHES INSPECTOR',
    deck: '"{name} could serve as an example to the whole Oblast," says visiting official',
    columns: [
      'The Deputy Inspector toured {name} at a steady speed and declared it "{impression}% exemplary."',
      'Residents waved without interruption for the length of the visit. They have since been assigned to the next village, together with the village.',
    ],
  },
  poor: {
    headline: 'INSPECTOR NOTES "AREAS FOR GROWTH"',
    deck: 'Village of {name} to receive additional attention',
    columns: [
      'The Deputy Inspector\'s visit to {name} has resulted in a report of {impression}% and a list.',
      'The list has been forwarded to the Chairman of the collective farm, who has been forwarded to a different collective farm.',
    ],
  },
};
