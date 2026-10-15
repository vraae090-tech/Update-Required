document.querySelectorAll('[data-diagram]').forEach((diagram) => {
  const dots = diagram.querySelectorAll('.hotspot');

  const notes = diagram.parentElement.querySelector('.hotspot-notes');
  if (!notes) return;

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const which = dot.dataset.note;
      const wasOpen = dot.getAttribute('aria-expanded') === 'true';

      dots.forEach(d => d.setAttribute('aria-expanded', 'false'));
      notes.querySelectorAll('li').forEach(li => li.classList.remove('is-open'));

      if (wasOpen) return;

      dot.setAttribute('aria-expanded', 'true');

      const note = notes.querySelector(`li[data-note="${which}"]`);
      if (note) {
        note.classList.add('is-open');

        note.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  });
});

const pwInput = document.getElementById('pw');

if (pwInput) {
  const checkList = document.getElementById('pw-checks');
  const verdict = document.getElementById('pw-verdict');

  const EMPTY = 'Nothing yet. Type a password above to see how it does.';

  const VERDICTS = [
    'None of the four yet. Try making it longer first.',
    'A start, but a computer would guess this in seconds.',
    'Getting there. Add one more thing from the list.',
    'Good. One more and it is genuinely hard to guess.',
    'Strong. This is the kind you want.'
  ];

  const RULES = {
    length: (p) => p.length >= 12,

    phrase: (p) => p
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(/[^A-Za-z]+/)
      .filter((piece) => piece.length >= 2)
      .length >= 2,

    number: (p) => /[0-9]/.test(p),

    symbol: (p) => /[^A-Za-z0-9\s]/.test(p)
  };

  const checks = checkList ? checkList.querySelectorAll('li[data-check]') : [];

  pwInput.addEventListener('input', () => {
    const typed = pwInput.value;
    let passed = 0;

    checks.forEach((item) => {
      const rule = RULES[item.dataset.check];
      const ok = !!rule && typed.length > 0 && rule(typed);
      if (ok) passed = passed + 1;

      item.classList.toggle('pass', ok);
      const mark = item.querySelector('.mark');
      if (mark) mark.textContent = ok ? '\u25CF' : '\u25CB';
    });

    if (verdict) {
      verdict.textContent = typed.length === 0 ? EMPTY : VERDICTS[passed];
    }
  });
}

/* Once a card is open the answer is already on the screen, so the invitation
   to go and see it is no longer true. The card carries both halves and swaps
   between them as it opens and shuts. */
const SCAM_SHUT = 'Click me to see what gives this one away.';
const SCAM_OPEN = 'Click me to put the answer away again.';

document.querySelectorAll('.scam').forEach((card) => {
  const tell = card.querySelector('.tell');
  if (!tell) return;

  tell.hidden = true;
  card.dataset.tip = SCAM_SHUT;

  card.addEventListener('click', () => {
    const isOpen = card.getAttribute('aria-expanded') === 'true';
    card.setAttribute('aria-expanded', String(!isOpen));
    tell.hidden = isOpen;
    card.dataset.tip = isOpen ? SCAM_SHUT : SCAM_OPEN;
  });
});

document.querySelectorAll('.view-switch').forEach((group) => {
  const buttons = Array.from(group.querySelectorAll('.view-btn'));
  if (!buttons.length) return;

  const says = group.parentElement
    ? group.parentElement.querySelector('.view-says')
    : null;

  const SAYS = {
    map:
      'The everyday one. Streets, parks and shop names, and the one to ' +
      'leave it on. If you are not sure which view you are in, this is ' +
      'probably it.',

    transit:
      'Subway and bus lines drawn on top, in their own colours, with the ' +
      'stations marked. This is the one to switch to before you work out ' +
      'how to get somewhere.',

    satellite:
      'Photographs taken from above instead of a drawing. Useful for ' +
      'recognising a building before you get to it, and harder to read ' +
      'for anything else.'
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      buttons.forEach((b) => {
        b.classList.remove('is-on');
        b.setAttribute('aria-pressed', 'false');
      });

      button.classList.add('is-on');
      button.setAttribute('aria-pressed', 'true');

      const line = SAYS[button.dataset.view];
      if (says && line) says.textContent = line;
    });
  });
});

document.querySelectorAll('.quiz').forEach((quiz) => {
  const questions = Array.from(quiz.querySelectorAll('.quiz-q'));
  const buttons = Array.from(quiz.querySelectorAll('.quiz-btn'));
  if (!questions.length || !buttons.length) return;

  const count = quiz.querySelector('.quiz-count');
  const says = quiz.querySelector('.quiz-says');
  const next = quiz.querySelector('.quiz-next');
  const score = quiz.querySelector('.quiz-score');

  const answers = buttons.map((b) => b.dataset.answer);
  questions.forEach((q, i) => {
    if (answers.indexOf(q.dataset.answer) === -1) {
      console.warn(
        'quiz "' + (quiz.dataset.quiz || '?') + '": question ' + (i + 1) +
        ' answers "' + q.dataset.answer + '", which is not on any button.'
      );
    }
  });

  let at = 0;
  let right = 0;
  let answered = false;

  const show = () => {
    answered = false;

    questions.forEach((q, i) => {
      q.hidden = i !== at;
      const why = q.querySelector('.quiz-why');
      if (why) why.hidden = true;
    });

    buttons.forEach((b) => {
      b.disabled = false;
      b.classList.remove('is-right', 'is-wrong');

      b.removeAttribute('aria-pressed');
    });

    if (count) count.textContent = (at + 1) + ' of ' + questions.length;
    if (says) says.textContent = '';
    if (next) next.hidden = true;
  };

  const tell = () => {
    if (!score) return;

    const done = at + 1;
    if (done < questions.length) {
      score.textContent = right + ' right out of ' + done + ' so far.';
      return;
    }

    if (right === questions.length) {
      score.textContent =
        'All ' + questions.length + ' right. You already know this - the ' +
        'rest of the chapter is just confirming it.';
    } else if (right === 0) {
      score.textContent =
        'None right this time, which is genuinely fine: this is the ' +
        'chapter that teaches it. Press Start again and see.';
    } else {
      score.textContent =
        right + ' right out of ' + questions.length + '. The ones you ' +
        'missed are the ones worth reading twice.';
    }
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      if (answered) return;
      answered = true;

      const question = questions[at];
      const correct = question.dataset.answer;
      const ok = button.dataset.answer === correct;
      if (ok) right = right + 1;

      buttons.forEach((b) => {
        b.disabled = true;

        if (b.dataset.answer === correct) b.classList.add('is-right');
      });

      if (!ok) button.classList.add('is-wrong');
      button.setAttribute('aria-pressed', 'true');

      const why = question.querySelector('.quiz-why');
      if (why) why.hidden = false;

      if (says) {
        const name = buttons
          .filter((b) => b.dataset.answer === correct)
          .map((b) => b.textContent.trim())[0] || correct;

        says.textContent = ok
          ? 'Yes - ' + name + ' is the one.'
          : 'Not this time. The answer is ' + name + '.';
      }

      tell();

      if (next) {
        next.hidden = false;
        next.textContent = at + 1 < questions.length
          ? 'Next one'
          : 'Start again';
      }
    });
  });

  if (next) {
    next.addEventListener('click', () => {
      if (at + 1 < questions.length) {
        at = at + 1;
      } else {
        at = 0;
        right = 0;
        if (score) score.textContent = '';
      }

      show();

      buttons[0].focus();
    });
  }

  show();
});
