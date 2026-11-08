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
  {
    id: 'krasnoye',
    name: 'KRASNOYE',
    memo: {
      no: 'PV-1/02',
      subject: 'Inspection of the model settlement "Krasnoye"',
      body: [
        'The Deputy Inspector has had his neck seen to by the Ministry physician. He now looks out of both windows.',
        'The left side of Krasnoye was not previously considered part of Krasnoye. It is now.',
        'Materials: nine sheets of plywood (recovered from Zarechnoe), five tins of paint, nine volunteers.',
      ],
    },
    windows: ['left', 'right'],
    speed: 7,
    budget: { plywood: 9, paint: 5, people: 9 },
    route: [
      [-50, 0],
      [50, 0],
    ],
    things: [
      { id: 'house-k1', type: 'house', pos: [-30, 9], rot: 0.1, weight: 3, label: 'a house with a hole for a window' },
      { id: 'shop', type: 'shop', pos: [-13, 8], weight: 3, label: 'a shop selling the shelves' },
      { id: 'mud-k1', type: 'mud', pos: [-4, 4], weight: 1.5, label: 'a lake of mud', praise: 'a village green' },
      { id: 'barn-k', type: 'barn', pos: [7, 12], weight: 2, label: 'a barn returning to the soil' },
      { id: 'house-k2', type: 'house', pos: [21, 9], rot: -0.06, weight: 3, label: 'a house propped on a cart' },
      { id: 'junk-k', type: 'junk', pos: [33, 4.5], weight: 2, label: 'a combine harvester, disassembled for inventory' },
      { id: 'house-k3', type: 'house', pos: [-23, -9], rot: Math.PI + 0.1, weight: 3, label: 'a house missing a wall' },
      { id: 'fence-k', type: 'fence', pos: [-7, -4], len: 8, weight: 1, label: 'a fence that has given up', praise: 'a freshly painted fence' },
      { id: 'house-k4', type: 'house', pos: [12, -10], rot: Math.PI - 0.1, weight: 3, label: 'a house with a goat on the roof' },
      { id: 'well-k', type: 'well', pos: [26, -5.5], weight: 1, label: 'a well full of bicycles' },
      { id: 'mud-k2', type: 'mud', pos: [38, -4], weight: 1.5, label: 'mud, on the left this time', praise: 'a second village green' },
    ],
    slots: [
      { id: 'f-k1', kind: 'facade', pos: [-30, 4.6] },
      { id: 'f-k2', kind: 'facade', pos: [21, 4.8] },
      { id: 'f-barn', kind: 'facade', pos: [7, 6.4] },
      { id: 'f-k3', kind: 'facade', pos: [-23, -4.6] },
      { id: 'f-k4', kind: 'facade', pos: [12, -5.4] },
      { id: 'w-shop', kind: 'window', target: 'shop', pos: [-13, 5.4] },
      { id: 'p-mud1', kind: 'paint', target: 'mud-k1', pos: [-4, 4] },
      { id: 'p-fence', kind: 'paint', target: 'fence-k', pos: [-7, -4] },
      { id: 'p-mud2', kind: 'paint', target: 'mud-k2', pos: [38, -4] },
      { id: 'b-junk', kind: 'banner', pos: [33, 2.8] },
      { id: 'b-well', kind: 'banner', pos: [26, -3.4] },
      { id: 'c-shop', kind: 'crowd', pos: [-17, 2.6] },
      { id: 'c-left', kind: 'crowd', pos: [1, -2.6] },
      { id: 'c-east', kind: 'crowd', pos: [29, 2.6] },
    ],
  },
  {
    id: 'novaya-zhizn',
    name: 'NOVAYA ZHIZN',
    memo: {
      no: 'PV-1/03',
      subject: 'Inspection of the collective farm "New Life"',
      body: [
        'The Deputy Inspector looks out of the right-hand window only. His neck has relapsed.',
        'However, the car will stop twice (marked on the road). When the car stops, the Inspector turns his head and looks ahead and behind. A facade is flat. He is not.',
        'Materials: eight sheets of plywood, five tins of paint, nine volunteers.',
      ],
    },
    windows: ['right'],
    speed: 6,
    budget: { plywood: 8, paint: 5, people: 9 },
    route: [
      [-46, 0],
      [46, 0],
    ],
    stops: [
      { x: -8, secs: 5, text: 'The driver has stopped for a goose.' },
      { x: 22, secs: 4, text: 'The Inspector asks to stop. He wishes to admire the view.' },
    ],
    things: [
      { id: 'mud-n1', type: 'mud', pos: [-34, 3.5], weight: 1.5, label: 'a mud of historic proportions', praise: 'a village green' },
      { id: 'house-n1', type: 'house', pos: [-24, 9], rot: 0.05, weight: 3, label: 'a house with the roof in the garden' },
      { id: 'house-n2', type: 'house', pos: [-2, 9.5], rot: -0.08, weight: 3, label: 'a house, mostly door' },
      { id: 'junk-n', type: 'junk', pos: [-13, 11], weight: 2, label: 'a tractor, retired with honours' },
      { id: 'fence-n', type: 'fence', pos: [6, 4], len: 8, weight: 1, label: 'a fence with gaps instead of planks', praise: 'a freshly painted fence' },
      { id: 'shop', type: 'shop', pos: [15, 8], weight: 3, label: 'a shop, closed for stock-taking since 1971' },
      { id: 'house-n3', type: 'house', pos: [30, 9], rot: 0.12, weight: 3, label: 'a house sinking gracefully' },
      { id: 'barn-n', type: 'barn', pos: [24, 17], weight: 2, label: 'a barn behind the view' },
      { id: 'well-n', type: 'well', pos: [38, 5], weight: 1, label: 'a well with a lid on it, nailed' },
      { id: 'ruin-n1', type: 'house', pos: [-14, -10], rot: 0.4, weight: 3, side: 'left', label: 'a ruin' },
      { id: 'ruin-n2', type: 'barn', pos: [16, -11], weight: 2, side: 'left', label: 'a ruin with a cow in it' },
    ],
    slots: [
      { id: 'f-n1', kind: 'facade', pos: [-24, 4.6] },
      { id: 'f-n2', kind: 'facade', pos: [-2, 5.0] },
      { id: 'f-n3', kind: 'facade', pos: [30, 4.8] },
      { id: 'f-barn', kind: 'facade', pos: [24, 12.4] },
      { id: 'w-shop', kind: 'window', target: 'shop', pos: [15, 5.4] },
      { id: 'p-mud', kind: 'paint', target: 'mud-n1', pos: [-34, 3.5] },
      { id: 'p-fence', kind: 'paint', target: 'fence-n', pos: [6, 4] },
      { id: 'b-junk', kind: 'banner', pos: [-13, 7.4] },
      { id: 'b-well', kind: 'banner', pos: [38, 3.2] },
      { id: 'c-goose', kind: 'crowd', pos: [-9, 2.6] },
      { id: 'c-shop', kind: 'crowd', pos: [19, 2.6] },
      { id: 'c-view', kind: 'crowd', pos: [27, 2.6] },
    ],
  },
  {
    id: 'svetloye',
    name: 'SVETLOYE',
    memo: {
      no: 'PV-1/04',
      subject: 'Inspection of the village "Svetloye" (meaning: bright)',
      body: [
        'The Deputy Inspector will drive through Svetloye in the afternoon. The weather forecast for the afternoon is classified.',
        'Stores have been generous with paint this time, and less generous with plywood. Draw no conclusions.',
        'Materials: five sheets of plywood, eight tins of paint (water-based), nine volunteers (waterproof).',
      ],
    },
    windows: ['right'],
    speed: 6,
    budget: { plywood: 5, paint: 8, people: 9 },
    route: [
      [-46, 0],
      [46, 0],
    ],
    rain: {
      at: 0.45,
      text: 'It has started to rain. The paint is water-based. So was the plan.',
      textDry: 'It has started to rain. The banners droop. Nothing else was painted, which is now a virtue.',
    },
    things: [
      { id: 'mud-s1', type: 'mud', pos: [-34, 3.5], weight: 1.5, label: 'mud', praise: 'a village green' },
      { id: 'fence-s1', type: 'fence', pos: [-26, 4], len: 8, weight: 1, label: 'a fence in two minds', praise: 'a freshly painted fence' },
      { id: 'house-s1', type: 'house', pos: [-17, 9], rot: -0.05, weight: 3, label: 'a house with the stove outside' },
      { id: 'mud-s2', type: 'mud', pos: [-8, 4], weight: 1.5, label: 'more mud', praise: 'a second village green' },
      { id: 'well-s', type: 'well', pos: [0, 5.5], weight: 1, label: 'a well, dry, in this weather' },
      { id: 'shop', type: 'shop', pos: [9, 8], weight: 3, label: 'a shop with a sign that says "NO"' },
      { id: 'mud-s3', type: 'mud', pos: [17, 3.8], weight: 1.5, label: 'mud, getting muddier', praise: 'a third village green' },
      { id: 'house-s2', type: 'house', pos: [24, 9.5], rot: 0.1, weight: 3, label: 'a house you can see through' },
      { id: 'fence-s2', type: 'fence', pos: [32, 4], len: 8, weight: 1, label: 'a fence lying in the mud', praise: 'a freshly painted fence' },
      { id: 'junk-s', type: 'junk', pos: [39, 5], weight: 2, label: 'a lorry used as a henhouse' },
      { id: 'ruin-s', type: 'house', pos: [6, -10], rot: -0.3, weight: 3, side: 'left', label: 'a ruin' },
    ],
    slots: [
      { id: 'p-mud1', kind: 'paint', target: 'mud-s1', pos: [-34, 3.5] },
      { id: 'p-fence1', kind: 'paint', target: 'fence-s1', pos: [-26, 4] },
      { id: 'f-s1', kind: 'facade', pos: [-17, 4.8] },
      { id: 'p-mud2', kind: 'paint', target: 'mud-s2', pos: [-8, 4] },
      { id: 'b-well', kind: 'banner', pos: [0, 3.6] },
      { id: 'w-shop', kind: 'window', target: 'shop', pos: [9, 5.4] },
      { id: 'p-mud3', kind: 'paint', target: 'mud-s3', pos: [17, 3.8] },
      { id: 'f-s2', kind: 'facade', pos: [24, 5.2] },
      { id: 'p-fence2', kind: 'paint', target: 'fence-s2', pos: [32, 4] },
      { id: 'b-junk', kind: 'banner', pos: [39, 3.2] },
      { id: 'c-square', kind: 'crowd', pos: [4, 2.6] },
      { id: 'c-east', kind: 'crowd', pos: [20, 2.6] },
      { id: 'c-end', kind: 'crowd', pos: [35, 2.4] },
    ],
  },
  {
    id: 'bolshevo',
    name: 'BOLSHEVO',
    memo: {
      no: 'PV-1/05',
      subject: 'Inspection of the village "Bolshevo" (final)',
      body: [
        'The Deputy Inspector has asked to see "the real village". He will get out of the car at the well and walk round the back of the houses, then rejoin the car.',
        'On foot he looks in every direction, including behind things. A facade seen from behind is a house that was plywood.',
        'Materials: eight sheets of plywood, six tins of paint, twelve volunteers. This is the last village. The plywood has been everywhere.',
      ],
    },
    windows: ['right'],
    speed: 6,
    budget: { plywood: 8, paint: 6, people: 12 },
    route: [
      [-46, 0],
      [0, 0, 'walk'],
      [2, 13, 'walk'],
      [14, 14, 'walk'],
      [16, 0],
      [46, 0],
    ],
    walk: {
      speed: 2.2,
      text: 'The Inspector would like to stretch his legs.',
      back: 'The Inspector returns to the car, thoughtful.',
    },
    things: [
      { id: 'house-b1', type: 'house', pos: [-30, 9], rot: 0.06, weight: 3, label: 'a house held together by a portrait' },
      { id: 'junk-b', type: 'junk', pos: [-19, 5], weight: 2, label: 'a tractor, planted' },
      { id: 'house-b2', type: 'house', pos: [-9, 9], rot: -0.1, weight: 3, label: 'a house with chickens upstairs' },
      { id: 'well-b', type: 'well', pos: [-2, 4.5], weight: 1, label: 'the well' },
      { id: 'mud-b1', type: 'mud', pos: [6, 9], weight: 1.5, label: 'the mud behind the houses', praise: 'a back garden' },
      { id: 'fence-b', type: 'fence', pos: [8, 17], len: 10, weight: 1, label: 'a fence protecting nothing', praise: 'a freshly painted fence' },
      { id: 'barn-b', type: 'barn', pos: [20, 18], weight: 2, label: 'the barn nobody mentions' },
      { id: 'house-b3', type: 'house', pos: [24, 8], rot: 0.08, weight: 3, label: 'a house without a floor' },
      { id: 'shop', type: 'shop', pos: [36, 8], weight: 3, label: 'a shop, empty but honest' },
      { id: 'mud-b2', type: 'mud', pos: [-24, -4], weight: 1.5, side: 'left', label: 'mud on the other side', praise: 'a green on the other side' },
    ],
    slots: [
      { id: 'f-b1', kind: 'facade', pos: [-30, 4.6] },
      { id: 'b-junk', kind: 'banner', pos: [-19, 3] },
      { id: 'f-b2', kind: 'facade', pos: [-9, 4.8] },
      { id: 'p-mud1', kind: 'paint', target: 'mud-b1', pos: [6, 9] },
      { id: 'p-fence', kind: 'paint', target: 'fence-b', pos: [8, 17] },
      { id: 'f-barn', kind: 'facade', pos: [20, 15.4], rot: Math.PI },
      { id: 'f-b3', kind: 'facade', pos: [24, 3.6] },
      { id: 'w-shop', kind: 'window', target: 'shop', pos: [36, 5.4] },
      { id: 'b-well', kind: 'banner', pos: [-2, 2.6] },
      { id: 'p-mud2', kind: 'paint', target: 'mud-b2', pos: [-24, -4] },
      { id: 'c-well', kind: 'crowd', pos: [-5, 2.4] },
      { id: 'c-yard', kind: 'crowd', pos: [9, 12] },
      { id: 'c-shop', kind: 'crowd', pos: [31, 2.6] },
      { id: 'c-back', kind: 'crowd', pos: [-4, 13] },
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
