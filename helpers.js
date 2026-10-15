const WORDS = {
  gripTip: 'Click me and hold to move me around to where fits you best on the screen.',
  sizeNote: 'Click me to make the text bigger or smaller.',
  biggerLabel: 'Make the text bigger',
  smallerLabel: 'Make the text smaller',
  resetLabel: 'Back to normal size',
  biggerTip: 'Click me to make the text bigger',
  smallerTip: 'Click me to make the text smaller',
  resetTip: 'Click me to go back to normal size',
  printToggleTip: 'Click me to see the steps',
  printNowTip: 'Click me to print this page',
  printTitle: 'Print me',
  printNote: 'Click me for the steps to print this page.',
  printSteps: [
    'Click the button below.',
    'A box will open. Choose your printer from the list at the top.',
    'Click <strong>Print</strong> in that box.'
  ],

  printButton: 'Print this page now'
};

const SIZES = [100, 115, 130, 150, 175];

let step = 0;

const helpers = document.createElement('div');
helpers.className = 'helpers';

helpers.innerHTML = `
  <div class="card textsize-card" data-tip="${WORDS.gripTip}">
    <p class="card-note">${WORDS.sizeNote}</p>
    <div class="textsize-row">
      <button class="size-btn" id="smaller" aria-label="${WORDS.smallerLabel}" data-tip="${WORDS.smallerTip}">&minus;</button>
      <span class="size-now" id="sizeNow" aria-live="polite">100%</span>
      <button class="size-btn" id="bigger" aria-label="${WORDS.biggerLabel}" data-tip="${WORDS.biggerTip}">+</button>
    </div>
    <button class="size-reset" id="resetSize" data-tip="${WORDS.resetTip}">${WORDS.resetLabel}</button>
  </div>

  <div class="card print-card" data-tip="${WORDS.gripTip}">
    <p class="card-note">${WORDS.printNote}</p>
    <button class="print-toggle" id="printToggle" aria-expanded="false" aria-controls="printSteps" data-tip="${WORDS.printToggleTip}">
      <span>${WORDS.printTitle}</span>
      <span class="chev" aria-hidden="true">&rsaquo;</span>
    </button>
    <div id="printSteps" hidden>
      <ol class="print-steps">
        ${WORDS.printSteps.map(s => `<li>${s}</li>`).join('')}
      </ol>
      <button class="print-now" id="printNow" data-tip="${WORDS.printNowTip}">${WORDS.printButton}</button>
    </div>
  </div>
`;

document.body.appendChild(helpers);

const sizeNow = document.getElementById('sizeNow');
const biggerBtn = document.getElementById('bigger');
const smallerBtn = document.getElementById('smaller');

/* Set once the cards exist. Growing the text makes them taller, so a card the
   reader has already dragged somewhere can end up hanging off the bottom. */
let afterResize = null;

function applySize() {
  const pct = SIZES[step];

  document.documentElement.style.fontSize = pct + '%';

  /* The root size only reaches type measured in rem. The landing's big line is
     measured off the window width instead, so it never heard about any of this
     — handing the setting over as a bare number lets that rule multiply it in. */
  document.documentElement.style.setProperty('--type-scale', String(pct / 100));

  sizeNow.textContent = pct + '%';

  smallerBtn.disabled = (step === 0);
  biggerBtn.disabled = (step === SIZES.length - 1);

  if (afterResize) afterResize();
}

biggerBtn.addEventListener('click', () => {
  if (step < SIZES.length - 1) {
    step = step + 1;
    applySize();
  }
});

smallerBtn.addEventListener('click', () => {
  if (step > 0) {
    step = step - 1;
    applySize();
  }
});

document.getElementById('resetSize').addEventListener('click', () => {
  step = 0;
  applySize();
});

applySize();

const printToggle = document.getElementById('printToggle');
const printSteps = document.getElementById('printSteps');

printToggle.addEventListener('click', () => {
  const isOpen = printToggle.getAttribute('aria-expanded') === 'true';

  printToggle.setAttribute('aria-expanded', String(!isOpen));

  printSteps.hidden = isOpen;

  // opening the steps makes the card taller, which can push it off the bottom
  const card = printToggle.closest('.card');
  if (card && card.dataset.pinned) {
    moveTo(card, parseFloat(card.style.left), parseFloat(card.style.top));
  }
});

document.getElementById('printNow').addEventListener('click', () => {
  window.print();
});

const cards = helpers.querySelectorAll('.card');

function pinCard(card) {
  if (card.dataset.pinned) return;

  const box = card.getBoundingClientRect();

  card.style.width = box.width + 'px';
  card.style.position = 'fixed';
  card.style.left = box.left + 'px';
  card.style.top = box.top + 'px';

  card.dataset.pinned = 'yes';
}

function moveTo(card, x, y) {
  const box = card.getBoundingClientRect();

  const maxX = window.innerWidth  - box.width  - 8;
  const maxY = window.innerHeight - box.height - 8;

  card.style.left = Math.max(8, Math.min(x, maxX)) + 'px';
  card.style.top  = Math.max(8, Math.min(y, maxY)) + 'px';
}

cards.forEach((card) => {
  let dragging = false;

  let grabOffsetX = 0;
  let grabOffsetY = 0;

  card.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;

    cards.forEach(pinCard);

    dragging = true;

    grabOffsetX = e.clientX - parseFloat(card.style.left);
    grabOffsetY = e.clientY - parseFloat(card.style.top);

    card.classList.add('dragging');

    card.setPointerCapture(e.pointerId);
  });

  card.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    moveTo(card, e.clientX - grabOffsetX, e.clientY - grabOffsetY);
  });

  card.addEventListener('pointerup', () => {
    dragging = false;
    card.classList.remove('dragging');
  });

  card.addEventListener('pointercancel', () => {
    dragging = false;
    card.classList.remove('dragging');
  });
});

function keepCardsOnScreen() {
  cards.forEach((card) => {
    if (!card.dataset.pinned) return;

    moveTo(card, parseFloat(card.style.left), parseFloat(card.style.top));
  });
}

window.addEventListener('resize', keepCardsOnScreen);

/* applySize runs once before this point, while cards is still in its dead
   zone, which is why it asks through a variable rather than calling directly */
afterResize = keepCardsOnScreen;

/* Stacked in the bottom-right corner these read as browser chrome and get
   skipped. Starting them dead centre of the page puts them in the reader's
   path, which is the point — and they stay draggable from there, so anyone
   who wants them out of the way can move them. */
function centre() {
  const list = Array.from(cards);
  if (!list.length) return;

  list.forEach(pinCard);

  const gap = 14;

  const boxes = list.map((card) => card.getBoundingClientRect());

  const stackH =
    boxes.reduce((sum, box) => sum + box.height, 0) + gap * (list.length - 1);

  /* Dead centre of the screen, which is also where the page splits — the
     words run to 50vw and the pictures start there — so the two cards sit
     on the seam between the halves rather than off to one side of it. */
  const midX = window.innerWidth / 2;

  let y = (window.innerHeight - stackH) / 2;

  list.forEach((card, i) => {
    moveTo(card, midX - boxes[i].width / 2, y);
    y = y + boxes[i].height + gap;
  });
}

/* The cards are sized by their text, so measuring before the webfont lands
   gives the wrong box and the stack sits off-centre. Hide, wait, place,
   reveal. */
helpers.style.visibility = 'hidden';

let placed = false;

function place() {
  if (placed) return;
  placed = true;

  centre();
  helpers.style.visibility = '';
}

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(place);
}

setTimeout(place, 1500);

(() => {
  const runs = Array.from(document.querySelectorAll('.run'));

  const hasArt = (run) => !!run.querySelector('.art img');
  const drawn = runs.filter(hasArt);

  if (!drawn.length) return;

  document.documentElement.classList.add('js-art');

  let current = null;

  const pick = () => {
    const middle = window.innerHeight / 2;

    let found = drawn[0];

    runs.forEach((run) => {
      const words = run.querySelector('.words');
      if (!words) return;

      if (words.getBoundingClientRect().top > middle) return;

      if (!hasArt(run)) return;

      found = run;
    });

    if (found === current) return;

    if (current) current.classList.remove('is-current');
    found.classList.add('is-current');
    current = found;
  };

  let waiting = false;

  const queue = () => {
    if (waiting) return;
    waiting = true;
    requestAnimationFrame(() => {
      waiting = false;
      pick();
    });
  };

  pick();
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
})();

(() => {
  const buttons = Array.from(document.querySelectorAll('.mode-btn'));

  if (!buttons.length) return;

  const setMode = (mode) => {
    document.body.classList.toggle('is-dark', mode === 'dark');

    buttons.forEach((button) => {
      const isOn = button.dataset.mode === mode;

      button.classList.toggle('is-on', isOn);

      button.setAttribute('aria-pressed', isOn ? 'true' : 'false');
    });
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
  });
})();
