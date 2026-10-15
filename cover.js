/* Scroll-driven crossfade: the cover photo dissolves into the large type on white.
   The .cover-js class flips the landing from a plain two-screen stack (no JS)
   into a pinned stage, so the page still works if this script never runs. */

document.documentElement.classList.add('cover-js');

const cover = document.querySelector('.cover');
const coverTitle = document.querySelector('.cover-title');
const sheet = document.querySelector('.landing-sheet');

if (cover && sheet) {
  /* The two headlines both sit large and bottom-left, so they are staggered:
     the cover title clears out early, and the welcome line only starts to
     arrive once it has gone. Otherwise they overlap into mush mid-scroll. */
  const SPAN = 0.85;   // the whole fade is done within 85% of one screen
  const TITLE_OUT = 0.40;   // cover title is gone by here
  const SHEET_IN = 0.38;   // welcome line starts here
  const SHEET_FULL = 0.84;   // ...and is solid by here

  let queued = false;

  function ramp(value, from, to) {
    return Math.min(1, Math.max(0, (value - from) / (to - from)));
  }

  function paint() {
    const screen = window.innerHeight || 1;
    const seen = Math.min(1, Math.max(0, window.scrollY / (screen * SPAN)));

    cover.style.opacity = String(1 - seen);
    sheet.style.opacity = String(ramp(seen, SHEET_IN, SHEET_FULL));

    if (coverTitle) {
      coverTitle.style.opacity = String(1 - ramp(seen, 0, TITLE_OUT));
    }

    cover.classList.toggle('is-gone', seen === 1);
  }

  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; paint(); });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  paint();
}
