// ─────────────────────────────────────────────────────────────────────────────
// main.js – Entry point: initialise everything and run the animation loop
// ─────────────────────────────────────────────────────────────────────────────
import { SOLAR_BODIES, YEARS_PER_REAL_SECOND } from './config.js';
import { SceneManager }   from './scene.js';
import { BodyManager }    from './bodies.js';
import { integrateNBody } from './physics.js';
import { EclipseMode }    from './eclipse.js';
import { QuizMode }       from './quiz.js';
import { UIManager }      from './ui.js';

// ── Simulation state ──────────────────────────────────────────────────────────
const simState = {
  timeScale:  1.0,
  paused:     false,
  showOrbits: true,
  showLabels: true,
  showTrails: false,
  useNBody:   false,
};

// ── Build scene ───────────────────────────────────────────────────────────────
const canvas   = document.getElementById('solar-canvas');
const sceneMgr = new SceneManager(canvas);
const bodyMgr  = new BodyManager(sceneMgr.scene);

// ── Populate solar system ─────────────────────────────────────────────────────
for (const cfg of SOLAR_BODIES) {
  bodyMgr.add(cfg);
}

// ── Apply initial visibility ───────────────────────────────────────────────────
bodyMgr.setAllOrbits(true);
bodyMgr.setAllLabels(true);

// ── Special modes ─────────────────────────────────────────────────────────────
const eclipseMgr = new EclipseMode(sceneMgr, bodyMgr, simState);
const quizMgr    = new QuizMode(simState);
const uiMgr      = new UIManager(sceneMgr, bodyMgr, simState, eclipseMgr, quizMgr);

// ── Animation loop ────────────────────────────────────────────────────────────
let lastTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);

  const wallDt = Math.min((now - lastTime) / 1000, 0.05); // seconds, capped at 50 ms
  lastTime     = now;

  if (!simState.paused && !eclipseMgr.active) {
    const dt = wallDt * simState.timeScale * YEARS_PER_REAL_SECOND;

    if (simState.useNBody) {
      // N-body: integrateNBody mutates body.position and body.velocity in-place
      // (nBodyStates() returns references, not copies)
      integrateNBody(bodyMgr.nBodyStates(), dt);
      for (const body of bodyMgr.all()) {
        body.updatePosition(dt, true);
      }
    } else {
      // Keplerian: advance each body's orbital angle
      for (const body of bodyMgr.all()) {
        body.updatePosition(dt, false);
      }
    }

    // Keep moon orbit rings centred on their parent planet
    for (const body of bodyMgr.all()) {
      if (body.orbitLine && body.parent) {
        body.orbitLine.position.copy(body.parent.position);
      }
    }
  }

  sceneMgr.render();
}

requestAnimationFrame(animate);
