const tip = document.createElement('div');
tip.className = 'tooltip';
tip.setAttribute('aria-hidden', 'true');
document.body.appendChild(tip);

const GAP = 12;

const WORDING = {
  link:    'Click me',
  here:    'You are here — click me to go back to the front page',
  jump:    'Click me to jump to',
  nextprev: 'Click me to go to the next part of the guide',
  home:    'Click me to go back to the front page',
  credits: 'Click me to see who made this',

  top:     'You are on the front page'
};

const TIPPED = [
  ['.tab',            WORDING.link],
  ['.side-list a',    WORDING.jump],
  ['.side-foot a',    WORDING.link],
  ['.home-link a',    WORDING.home],
  ['.landing-mark a', WORDING.top],
  ['.mode-btn',       WORDING.link],
  ['.view-btn',       WORDING.link]
];

TIPPED.forEach(([selector, words]) => {
  document.querySelectorAll(selector).forEach((el) => {
    if (el.dataset.tip) return;

    if (el.getAttribute('aria-current')) {
      el.dataset.tip = WORDING.here;
      return;
    }

    const name = el.querySelector('.t');
    el.dataset.tip = (words === WORDING.jump && name)
      ? words + ' ' + name.textContent
      : words;
  });
});

const footLinks = document.querySelectorAll('.side-foot a');
if (footLinks.length === 2) {
  footLinks[0].dataset.tip = WORDING.home;
  footLinks[1].dataset.tip = WORDING.credits;
}

let current = null;
let mouseX = 0;
let mouseY = 0;
let hasMouse = false;

function placeTip() {
  const box = tip.getBoundingClientRect();

  let x, y;

  if (hasMouse) {
    x = mouseX + GAP;
    y = mouseY + GAP;

    if (x + box.width + 8 > window.innerWidth)  x = mouseX - box.width - GAP;
    if (y + box.height + 8 > window.innerHeight) y = mouseY - box.height - GAP;
  } else {
    const thing = current.getBoundingClientRect();
    x = thing.left;
    y = thing.bottom + GAP;
  }

  x = Math.max(8, Math.min(x, window.innerWidth  - box.width  - 8));
  y = Math.max(8, Math.min(y, window.innerHeight - box.height - 8));

  tip.style.left = x + 'px';
  tip.style.top  = y + 'px';
}

function showTip(el) {
  const words = el.dataset.tip;
  if (!words) return;

  current = el;
  tip.textContent = words;

  tip.classList.add('is-on');
  tip.classList.remove('tip--above', 'tip--below', 'tip--left');

  placeTip();
}

function hideTip() {
  current = null;
  hasMouse = false;
  tip.classList.remove('is-on');
}

document.querySelectorAll('[data-tip]').forEach((el) => {
  el.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    mouseX = e.clientX;
    mouseY = e.clientY;
    hasMouse = true;
    showTip(el);
  });

  el.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || current !== el) return;
    mouseX = e.clientX;
    mouseY = e.clientY;
    hasMouse = true;
    onMove();
  });

  el.addEventListener('pointerleave', hideTip);

  el.addEventListener('focus', () => {
    hasMouse = false;
    showTip(el);
  });
  el.addEventListener('blur', hideTip);

  /* The words under a thing can change when it is pressed — a card that has
     just been opened no longer invites you to open it. Read them again. With
     a mouse the press has already put the tooltip away, so this does nothing
     and nothing flickers back under the pointer; it is for the keyboard,
     where the tip is still sitting there with the old wording on it. */
  el.addEventListener('click', () => {
    if (current === el) showTip(el);
  });
});

let queued = false;

/* A picture in the panel is still in the page after its section has scrolled
   by: the panel is pinned to the window, so the next section's panel is simply
   drawn over the top of the old one. A tooltip belonging to a picture nobody
   can see any more has to go, which is what this is for.

   It has to ask about the panel and not about the section, though. The cards
   and buttons in the reading column scroll along with everything else and are
   plainly on the screen whichever panel happens to be showing — and a section
   only becomes the current one if it has a panel at all. Asking about the
   section was therefore taking the tooltips off every control in a section
   with no picture beside it: hover one and it appeared, move the mouse a
   hair and it was gone again. That is the six scam cards and the quiz under
   them, which is the whole of that section. */
function outOfSight(el) {
  const art = el.closest('.art');
  if (!art) return false;

  const run = art.closest('.run');
  return !!run && !run.classList.contains('is-current');
}

function follow() {
  if (!current) return;

  if (!current.isConnected || outOfSight(current)) {
    hideTip();
    return;
  }

  showTip(current);
}

function onMove() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; follow(); });
}

window.addEventListener('scroll', onMove, { passive: true });
window.addEventListener('resize', onMove);

document.addEventListener('pointerdown', () => {
  if (current && current.matches('figure[data-tip]')) return;
  hideTip();
});
