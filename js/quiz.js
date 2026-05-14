// ─────────────────────────────────────────────────────────────────────────────
// quiz.js – Pop-quiz mode with timer trigger
// ─────────────────────────────────────────────────────────────────────────────
import { QUIZ_QUESTIONS, QUIZ_DELAY_MS } from './config.js';

export class QuizMode {
  constructor(simState) {
    this.simState     = simState;
    this._questions   = [];  // shuffled subset for this round
    this._currentIdx  = 0;
    this._score       = 0;
    this._answered    = false;
    this._timerHandle = null;

    // DOM
    this.overlay      = document.getElementById('quiz-overlay');
    this.completeEl   = document.getElementById('quiz-complete');
    this.toastEl      = document.getElementById('quiz-toast');

    this.questionNum  = document.getElementById('quiz-question-num');
    this.questionText = document.getElementById('quiz-question-text');
    this.optionsEl    = document.getElementById('quiz-options');
    this.feedbackEl   = document.getElementById('quiz-feedback');
    this.nextBtn      = document.getElementById('quiz-next-btn');
    this.closeBtn     = document.getElementById('quiz-close');
    this.scoreText    = document.getElementById('quiz-score-text');
    this.starsEl      = document.getElementById('quiz-stars');

    this.completeTitle   = document.getElementById('quiz-complete-title');
    this.finalStars      = document.getElementById('quiz-final-stars');
    this.finalMessage    = document.getElementById('quiz-final-message');
    this.finalScore      = document.getElementById('quiz-final-score');
    this.againBtn        = document.getElementById('quiz-again-btn');
    this.doneBtn         = document.getElementById('quiz-done-btn');

    this.toastYes        = document.getElementById('toast-yes-btn');
    this.toastNo         = document.getElementById('toast-no-btn');

    this._bindEvents();
    this._scheduleAutoPrompt();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  start() {
    this._hideToast();

    // Pick 5 random questions
    const pool = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
    this._questions  = pool.slice(0, 5);
    this._currentIdx = 0;
    this._score      = 0;

    this.simState.paused = true;
    this.overlay.classList.remove('hidden');
    this.completeEl.classList.add('hidden');
    this._showQuestion();
  }

  close() {
    this.overlay.classList.add('hidden');
    this.completeEl.classList.add('hidden');
    this.simState.paused = false;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  _scheduleAutoPrompt() {
    this._timerHandle = setTimeout(() => {
      // Only show if not already in any special mode
      if (!this.simState.eclipseActive && !this.simState.quizActive) {
        this._showToast();
      }
    }, QUIZ_DELAY_MS);
  }

  _showToast() {
    this.toastEl.classList.remove('hidden');
  }

  _hideToast() {
    this.toastEl.classList.add('hidden');
  }

  _showQuestion() {
    const q = this._questions[this._currentIdx];
    this._answered = false;

    // Progress
    this.questionNum.textContent = `Question ${this._currentIdx + 1} of ${this._questions.length}`;
    this._updateScoreDisplay();

    // Question text
    this.questionText.textContent = q.question;

    // Options
    this.optionsEl.innerHTML = '';
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className   = 'quiz-option-btn';
      btn.textContent = opt;
      btn.dataset.idx = i;
      btn.addEventListener('click', () => this._answer(i));
      this.optionsEl.appendChild(btn);
    });

    // Hide feedback and next button
    this.feedbackEl.classList.add('hidden');
    this.nextBtn.classList.add('hidden');
  }

  _answer(choiceIdx) {
    if (this._answered) return;
    this._answered = true;

    const q       = this._questions[this._currentIdx];
    const correct = choiceIdx === q.correct;
    if (correct) this._score++;

    // Highlight buttons
    const btns = this.optionsEl.querySelectorAll('.quiz-option-btn');
    btns.forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.correct)    btn.classList.add('correct');
      if (i === choiceIdx && !correct) btn.classList.add('wrong');
    });

    // Feedback
    this.feedbackEl.classList.remove('hidden', 'feedback-correct', 'feedback-wrong');
    if (correct) {
      this.feedbackEl.classList.add('feedback-correct');
      this.feedbackEl.textContent =
        ['🎉 Awesome!', '⭐ Great job!', '🚀 You got it!', '🌟 Brilliant!', '✅ Correct!'][
          Math.floor(Math.random() * 5)
        ] + `\n${q.explanation}`;
    } else {
      this.feedbackEl.classList.add('feedback-wrong');
      this.feedbackEl.textContent = `Not quite! 🤔\n${q.explanation}`;
    }

    this._updateScoreDisplay();

    // Show next / finish button
    this.nextBtn.classList.remove('hidden');
    this.nextBtn.textContent =
      this._currentIdx < this._questions.length - 1 ? 'Next Question ▶' : 'See My Score! 🎉';
  }

  _nextQuestion() {
    this._currentIdx++;
    if (this._currentIdx < this._questions.length) {
      this._showQuestion();
    } else {
      this._showComplete();
    }
  }

  _showComplete() {
    this.overlay.classList.add('hidden');
    this.completeEl.classList.remove('hidden');

    const total = this._questions.length;
    const pct   = this._score / total;

    let title, message;
    if (pct === 1) {
      title   = '🏆 Perfect Score!';
      message = 'WOW! You\'re a space genius! Every single answer was correct! 🌌';
    } else if (pct >= 0.8) {
      title   = '🌟 Amazing Work!';
      message = 'You really know your space stuff! Just a couple to review. 🚀';
    } else if (pct >= 0.6) {
      title   = '👍 Good Job!';
      message = 'You\'re getting there! Keep exploring the solar system and you\'ll be an expert! 🌍';
    } else if (pct >= 0.4) {
      title   = '🌙 Keep Learning!';
      message = 'Space is huge and there\'s so much to discover! Try again and see how much more you know! 🔭';
    } else {
      title   = '🚀 Keep Exploring!';
      message = 'Don\'t worry – even real astronauts keep learning! Play with the simulation and try again! ☀️';
    }

    this.completeTitle.textContent  = title;
    this.finalMessage.textContent   = message;
    this.finalScore.textContent     = `You got ${this._score} out of ${total} right!`;
    this.finalStars.textContent     = '⭐'.repeat(this._score) + '☆'.repeat(total - this._score);
  }

  _updateScoreDisplay() {
    const total        = this._questions.length;
    this.scoreText.textContent = `Score: ${this._score}/${total}`;
    this.starsEl.textContent   =
      '⭐'.repeat(this._score) + '☆'.repeat(Math.max(0, this._currentIdx - this._score));
  }

  _bindEvents() {
    this.nextBtn.addEventListener('click',  () => this._nextQuestion());
    this.closeBtn.addEventListener('click', () => this.close());
    this.againBtn.addEventListener('click', () => this.start());
    this.doneBtn.addEventListener('click',  () => this.close());
    this.toastYes.addEventListener('click', () => this.start());
    this.toastNo.addEventListener('click',  () => this._hideToast());
  }
}
