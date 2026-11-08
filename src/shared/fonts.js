// Canvas textures need the web fonts loaded before drawing, or they fall back
// to Arial (an unauthorised typeface). Waits briefly, then proceeds regardless.
let ready;
export function fontsReady(timeoutMs = 2500) {
  if (!ready) {
    const wanted = [
      '64px "Bebas Neue"',
      '400 32px "Oswald"',
      '700 32px "Oswald"',
      '24px "Special Elite"',
    ];
    const load = document.fonts
      ? Promise.all(wanted.map((f) => document.fonts.load(f).catch(() => null)))
      : Promise.resolve();
    ready = Promise.race([load, new Promise((r) => setTimeout(r, timeoutMs))]);
  }
  return ready;
}
