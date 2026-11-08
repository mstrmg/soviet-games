// BACKYARD FURNACE · data. Edit freely: the scene reads every number and line from here.
//
// An item:
//   shape    which low-poly model to build (see world.js ITEM_SHAPES)
//   name     shown when you hover it
//   jin      pig iron it produces (metal only). 1 jin = half a kilogram.
//   heat     heat it gives the furnace (wood only)
//   harvest  points off the harvest forecast when it goes in (farm tools)
//   count    how many arrive this week
//   from     'heap' (delivered to the heap) or a piece of the yard: 'door', 'tree', 'beams', 'cart'
//
// A week:
//   seconds, quota, raises [{ at, quota, text }]  as in the Sparrow Campaign
//   items    what is delivered at the start of the week. Leftovers carry over.

export const FURNACE = {
  heatStart: 70,
  heatMax: 100,
  heatDecay: 1.1, // per second
  meltCost: (jin) => 4 + jin * 0.3, // heat used up by melting an item
  meltTime: 1.6, // seconds from the mouth to an ingot at the spout
};

export const WEEKS = [
  {
    id: 'kitchen',
    title: 'WEEK ONE · THE KITCHEN',
    memo: {
      no: 'BS-1958/09',
      subject: 'Every household a steelworks',
      body: [
        'The province will overtake Britain in steel production within fifteen years. Your yard will contribute.',
        'A furnace has been built behind your house. Drag household iron into its mouth. Pig iron will come out of the spout. Burn wood to keep it hot.',
        'Your weekly quota is announced below. It will be revised upwards as enthusiasm permits.',
      ],
      button: 'LIGHT THE FURNACE',
    },
    seconds: 55,
    quota: 40,
    raises: [{ at: 22, quota: 60, text: 'ATTENTION. THE VILLAGE HAS PLEDGED TO DOUBLE OUTPUT. THE WEEKLY QUOTA IS NOW 60 JIN.' }],
    items: [
      { shape: 'wok', name: 'Wok', jin: 8, count: 3 },
      { shape: 'kettle', name: 'Kettle', jin: 4, count: 2 },
      { shape: 'pot', name: 'Cooking pot', jin: 10, count: 2 },
      { shape: 'hinge', name: 'Door hinge', jin: 1, count: 4 },
      { shape: 'bicycle', name: 'Bicycle', jin: 25, count: 1 },
      { shape: 'chair', name: 'Chair', heat: 25, count: 3 },
      { shape: 'stool', name: 'Stool', heat: 15, count: 2 },
    ],
  },
  {
    id: 'gate',
    title: 'WEEK TWO · THE GATE',
    memo: {
      no: 'BS-1958/10',
      subject: 'Revised targets',
      body: [
        'Last week\'s output has been reported to the province, rounded up. The province has rounded it up again.',
        'The kitchen is now empty and therefore efficient. Please proceed to the gate, the beds and anything else that rings when struck.',
        'Hoes and sickles have also been delivered to the heap. Their use is at your discretion. The quota is not.',
      ],
      button: 'CONTINUE SMELTING',
    },
    seconds: 55,
    quota: 80,
    raises: [{ at: 20, quota: 110, text: 'ATTENTION. THE NEIGHBOURING VILLAGE HAS PLEDGED 100. OUR QUOTA IS NOW 110 JIN.' }],
    items: [
      { shape: 'gate', name: 'Iron gate', jin: 30, count: 1 },
      { shape: 'bed', name: 'Bed frame', jin: 20, count: 1 },
      { shape: 'bicycle', name: 'Neighbour\'s bicycle', jin: 25, count: 1 },
      { shape: 'sewing', name: 'Sewing machine', jin: 15, count: 1 },
      { shape: 'basin', name: 'Wash basin', jin: 6, count: 2 },
      { shape: 'hoe', name: 'Hoe', jin: 6, harvest: 5, count: 3 },
      { shape: 'sickle', name: 'Sickle', jin: 3, harvest: 4, count: 3 },
      { shape: 'table', name: 'Table', heat: 35, count: 1 },
      { shape: 'bench', name: 'Bench', heat: 20, count: 1 },
      { shape: 'door', name: 'The front door', heat: 40, count: 1, from: 'door' },
    ],
  },
  {
    id: 'fields',
    title: 'WEEK THREE · THE FIELDS',
    memo: {
      no: 'BS-1958/11',
      subject: 'The final push',
      body: [
        'The harvest is ripe. The furnace is hungrier. The province has asked us to consider which of these is the priority, and has answered for us.',
        'Ploughs, rakes and the rims of the cart wheels are now available for smelting. The fruit trees and the roof beams will keep the fire going.',
        'The grain will be brought in by hand, or by enthusiasm.',
      ],
      button: 'FEED THE FURNACE',
    },
    seconds: 55,
    quota: 150,
    raises: [{ at: 20, quota: 180, text: 'ATTENTION. THE COUNTY HAS REPORTED A SATELLITE OF STEEL. OUR QUOTA IS NOW 180 JIN.' }],
    items: [
      { shape: 'plough', name: 'Plough', jin: 35, harvest: 12, count: 2 },
      { shape: 'rake', name: 'Rake', jin: 5, harvest: 3, count: 3 },
      { shape: 'hoe', name: 'Hoe', jin: 6, harvest: 5, count: 4 },
      { shape: 'sickle', name: 'Sickle', jin: 3, harvest: 4, count: 4 },
      { shape: 'rim', name: 'Cart wheel rim', jin: 12, harvest: 6, count: 2 },
      { shape: 'bell', name: 'The school bell', jin: 35, count: 1 },
      { shape: 'wok', name: 'The last wok', jin: 8, count: 1 },
      { shape: 'stove', name: 'Stove top', jin: 15, count: 1 },
      { shape: 'tree', name: 'Pear tree', heat: 45, count: 2, from: 'tree' },
      { shape: 'beams', name: 'Roof beams', heat: 40, count: 1, from: 'beams' },
      { shape: 'cart', name: 'The cart', heat: 30, harvest: 6, count: 1, from: 'cart' },
    ],
  },
];

export const TEXT = {
  dept: 'Bureau of Domestic Steel',
  title: 'BACKYARD FURNACE',
  output: 'PIG IRON THIS WEEK',
  quota: 'QUOTA',
  time: 'WEEK ENDS',
  unit: 'JIN',
  harvest: 'HARVEST FORECAST',
  heat: 'FURNACE',
  hint: 'DRAG IRON INTO THE FURNACE · BURN WOOD TO KEEP IT HOT',
  cold: 'THE FURNACE IS TOO COLD. BURN SOMETHING WOODEN.',
  grades: ['GRADE: EXCELLENT', 'GRADE: SUPERIOR', 'GRADE: OUTSTANDING', 'GRADE: EXCELLENT (PROVISIONAL)'],
  tip: (it) => (it.heat ? `${it.name} · fuel` : `${it.name} · ${it.jin} jin`) + (it.harvest ? ' · needed for the harvest' : ''),
  report: {
    no: (i) => `BS-1958/${String(9 + i).padStart(2, '0')}-R`,
    subject: (w) => `Results of ${w.title.split(' · ')[0].toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}`,
    met: (n, q) => [`Pig iron produced: ${n} jin. Quota: ${q} jin.`, 'The quota has been exceeded. The figure has been forwarded to the province, which has improved it.'],
    missed: (n, q) => [`Pig iron produced: ${n} jin. Quota: ${q} jin.`, 'The quota has not been met. The difference has been recorded as a pledge.'],
    button: 'NEXT WEEK',
  },
  inspector: {
    no: 'PSI-1958/12',
    from: 'Provincial Steel Inspectorate',
    subject: 'Quality of pig iron received',
    body: (n) => [
      `Your yard has delivered ${n} jin of pig iron. Samples have been examined.`,
      'The samples are excellent. They are brittle, full of holes, and cannot be used to make anything. They have been added to the national total.',
      'You are reminded that the harvest is also a national priority, and that tools are available from the usual suppliers.',
    ],
    button: 'FILE THE REPORT',
  },
};

export const NEWSPAPER = {
  headline: 'PROVINCE OVERTAKES TARGET IN STEEL',
  missedHeadline: 'STEEL OUTPUT CONTINUES TO RISE (FIGURES REVISED)',
  deck: 'Every household a steelworks; experts hail "unprecedented" tonnage',
  columns: [
    'Backyard furnaces across the province glowed through the night as villagers answered the call for steel. Your yard alone produced {n} jin of pig iron, every jin of it excellent.',
    'With kitchens, gates and fields now fully mobilised, observers expect the province to overtake Britain well ahead of schedule. The harvest is proceeding.',
  ],
  sidebar: (n, harvest) => ({ title: 'THE LEAP IN FIGURES', items: [`Pig iron: ${n} jin`, 'Furnaces lit: one per yard', 'Woks remaining: none', `Harvest: ${harvest}%`] }),
  caption: 'Pig iron awaiting collection, as of this morning.',
};
