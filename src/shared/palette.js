// The official palette of the Ministry. Deviations must be filed in triplicate.
export const PALETTE = {
  red: 0xc1272d,
  redDark: 0x8a1a1f,
  black: 0x161514,
  ink: 0x24221f,
  cream: 0xf2e8d5,
  paper: 0xe6dac2,
  greyLight: 0xb9b4aa,
  grey: 0x7d7a74,
  greyDark: 0x45433f,
  concrete: 0x9a958b,
  brass: 0xb08d3c,
  gold: 0xd4a72c,
  wood: 0x4a2f22,
  woodDark: 0x2e1d15,
  coat: 0x3d3a36,
  skin: 0xc9a587,
};

// Same colours as CSS strings, for canvas drawing and the HTML overlay.
export const CSS = Object.fromEntries(
  Object.entries(PALETTE).map(([k, v]) => [k, `#${v.toString(16).padStart(6, '0')}`]),
);

export const FONTS = {
  display: '"Bebas Neue", "Oswald", Impact, sans-serif',
  body: '"Oswald", "Arial Narrow", sans-serif',
  type: '"Special Elite", "Courier New", monospace',
};
