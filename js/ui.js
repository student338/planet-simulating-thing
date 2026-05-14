// ─────────────────────────────────────────────────────────────────────────────
// ui.js – UI event handlers, info panel, add-body modal
// ─────────────────────────────────────────────────────────────────────────────
import { BODY_COLORS, SIZE_PRESETS, ORBIT_PRESETS } from './config.js';
import { circularOrbitVelocity } from './physics.js';

export class UIManager {
  /**
   * @param {SceneManager}  sceneMgr
   * @param {BodyManager}   bodyMgr
   * @param {SimulationState} simState
   * @param {EclipseMode}   eclipseMgr
   * @param {QuizMode}      quizMgr
   */
  constructor(sceneMgr, bodyMgr, simState, eclipseMgr, quizMgr) {
    this.sceneMgr   = sceneMgr;
    this.bodyMgr    = bodyMgr;
    this.simState   = simState;
    this.eclipseMgr = eclipseMgr;
    this.quizMgr    = quizMgr;

    this._addType          = 'planet';  // current add-modal type
    this._selectedColor    = BODY_COLORS[5];  // default blue

    this._bindAll();
    this._buildColorPicker();
    this._buildSpeedDisplay();
  }

  // ── Wire up all button/control events ────────────────────────────────────

  _bindAll() {
    // Speed
    document.getElementById('speed-slider').addEventListener('input', e => {
      this.simState.timeScale = parseFloat(e.target.value);
      this._buildSpeedDisplay();
    });

    // Pause
    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.addEventListener('click', () => {
      this.simState.paused = !this.simState.paused;
      pauseBtn.textContent = this.simState.paused ? '▶️ Resume' : '⏸️ Pause';
    });

    // View toggles
    document.getElementById('toggle-orbits').addEventListener('change', e => {
      this.simState.showOrbits = e.target.checked;
      this.bodyMgr.setAllOrbits(e.target.checked);
    });
    document.getElementById('toggle-labels').addEventListener('change', e => {
      this.simState.showLabels = e.target.checked;
      this.bodyMgr.setAllLabels(e.target.checked);
    });
    document.getElementById('toggle-trails').addEventListener('change', e => {
      this.simState.showTrails = e.target.checked;
      this.bodyMgr.setAllTrails(e.target.checked);
    });
    document.getElementById('toggle-gravity').addEventListener('change', e => {
      this.simState.useNBody = e.target.checked;
      if (e.target.checked) {
        // Initialise N-body velocities from current Keplerian state
        this.bodyMgr.initNBodyVelocities();
      }
    });

    // Add body buttons
    document.getElementById('add-planet-btn').addEventListener('click',   () => this._openAddModal('planet'));
    document.getElementById('add-moon-btn').addEventListener('click',     () => this._openAddModal('moon'));
    document.getElementById('add-star-btn').addEventListener('click',     () => this._openAddModal('star'));
    document.getElementById('add-asteroid-btn').addEventListener('click', () => this._openAddModal('asteroid'));

    // Add modal
    document.getElementById('add-modal-close').addEventListener('click',  () => this._closeAddModal());
    document.getElementById('add-confirm-btn').addEventListener('click',  () => this._confirmAdd());

    // Size / orbit sliders inside modal
    document.getElementById('add-size').addEventListener('input', e => {
      const idx = parseInt(e.target.value, 10) - 1;
      document.getElementById('size-display').textContent = SIZE_PRESETS[idx].label;
    });
    document.getElementById('add-orbit').addEventListener('input', e => {
      const idx = parseInt(e.target.value, 10) - 1;
      document.getElementById('orbit-display').textContent = ORBIT_PRESETS[idx].label;
    });

    // Eclipse
    document.getElementById('solar-eclipse-btn').addEventListener('click', () => {
      this.eclipseMgr.start('solar');
    });
    document.getElementById('lunar-eclipse-btn').addEventListener('click', () => {
      this.eclipseMgr.start('lunar');
    });
    document.getElementById('eclipse-prev-btn').addEventListener('click',  () => this.eclipseMgr.prev());
    document.getElementById('eclipse-next-btn').addEventListener('click',  () => this.eclipseMgr.next());
    document.getElementById('eclipse-close').addEventListener('click',     () => this.eclipseMgr.exit());

    // Quiz
    document.getElementById('quiz-btn').addEventListener('click', () => this.quizMgr.start());

    // Reset
    document.getElementById('reset-btn').addEventListener('click', () => {
      if (confirm('Reset everything back to the start? 🔄')) {
        window.location.reload();
      }
    });

    // Info panel close / follow
    document.getElementById('info-close').addEventListener('click',      () => this._closeInfoPanel());
    document.getElementById('info-follow-btn').addEventListener('click', () => {
      const bodyId = document.getElementById('info-panel').dataset.bodyId;
      const body   = bodyId ? this.bodyMgr.bodies.get(bodyId) : null;
      if (body) {
        this.sceneMgr.follow(body);
        this._closeInfoPanel();
      }
    });

    // Panel toggle (mobile)
    document.getElementById('panel-toggle').addEventListener('click', () => {
      document.getElementById('control-panel').classList.toggle('panel-hidden');
    });

    // Click on simulation canvas to select a body
    document.getElementById('solar-canvas').addEventListener('click', e => {
      this._onCanvasClick(e);
    });
  }

  // ── Speed display ─────────────────────────────────────────────────────────

  _buildSpeedDisplay() {
    const ts = this.simState.timeScale;
    let label;
    if      (ts === 0)   label = 'Stopped ⛔';
    else if (ts < 0.5)   label = 'Very slow 🐌';
    else if (ts < 1.2)   label = 'Normal speed 🌍';
    else if (ts < 2.5)   label = 'Fast 🚗';
    else if (ts < 4.0)   label = 'Very fast 🚀';
    else                 label = 'Turbo! ⚡';
    document.getElementById('speed-display').textContent = label;
  }

  // ── Color picker ──────────────────────────────────────────────────────────

  _buildColorPicker() {
    const row = document.getElementById('color-picker-row');
    BODY_COLORS.forEach((c, i) => {
      const swatch = document.createElement('button');
      swatch.className   = 'color-swatch';
      swatch.title       = c.label;
      swatch.style.background = c.hex;
      if (i === 5) swatch.classList.add('selected');
      swatch.addEventListener('click', () => {
        row.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        this._selectedColor = c;
      });
      row.appendChild(swatch);
    });
  }

  // ── Add-body modal ────────────────────────────────────────────────────────

  _openAddModal(type) {
    this._addType = type;
    const labels = {
      planet:   '🪐 Add a Planet',
      moon:     '🌙 Add a Moon',
      star:     '⭐ Add a Star',
      asteroid: '☄️ Add an Asteroid',
    };
    document.getElementById('add-modal-title').textContent = labels[type] ?? '➕ Add a Body';

    // Show/hide orbit slider (moons orbit Earth, not the Sun)
    const orbitGroup = document.getElementById('orbit-group');
    orbitGroup.style.display = type === 'moon' ? 'none' : '';

    // Show/hide size slider (asteroids are always tiny)
    const sizeSlider = document.getElementById('add-size');
    if (type === 'asteroid') { sizeSlider.value = 1; sizeSlider.disabled = true; }
    else                     { sizeSlider.disabled = false; }

    // Default name
    const defaultNames = {
      planet:   'Planet X',
      moon:     'Mini Moon',
      star:     'Baby Star',
      asteroid: 'Space Rock',
    };
    document.getElementById('add-name').value = defaultNames[type] ?? '';

    // Star warning
    let warn = document.getElementById('star-warn');
    if (!warn) {
      warn = document.createElement('p');
      warn.id        = 'star-warn';
      warn.className = 'star-warning';
      warn.textContent = '⚠️ Adding a star can cause chaos! Turn on "Real gravity" to see it interact!';
      document.getElementById('add-confirm-btn').before(warn);
    }
    warn.style.display = type === 'star' ? '' : 'none';

    document.getElementById('add-modal').classList.remove('hidden');
  }

  _closeAddModal() {
    document.getElementById('add-modal').classList.add('hidden');
  }

  _confirmAdd() {
    const type   = this._addType;
    const name   = document.getElementById('add-name').value.trim() || 'Mystery Body';
    const sizeI  = parseInt(document.getElementById('add-size').value, 10) - 1;
    const orbitI = parseInt(document.getElementById('add-orbit').value, 10) - 1;
    const color  = this._selectedColor.value;
    const radius = SIZE_PRESETS[sizeI]?.radius ?? 3.5;

    const id = this.bodyMgr.nextId(type);

    let cfg;
    if (type === 'moon') {
      cfg = {
        id,
        name,
        emoji:       '🌙',
        type:        'moon',
        radius,
        color,
        mass:        0.01 * radius,
        orbitRadius: 14 + radius * 1.5,
        period:      0.1 + Math.random() * 0.15,
        parent:      'earth',
        isCustom:    true,
        description: `${name} is a moon you added! 🌙`,
        funFact:     'You created this moon – how cool is that?! 🚀',
      };
    } else if (type === 'star') {
      const starColors = [0xFDB813, 0xFFDDDD, 0xDDEEFF, 0xFFFFCC];
      cfg = {
        id,
        name,
        emoji:             '⭐',
        type:              'star',
        radius:            8 + radius,
        color:             color || starColors[Math.floor(Math.random() * starColors.length)],
        emissive:          color || 0xFDB813,
        emissiveIntensity: 0.9,
        mass:              5000 + Math.random() * 50000,
        orbitRadius:       ORBIT_PRESETS[orbitI]?.radius ?? 170,
        period:            3 + Math.random() * 5,
        parent:            'sun',
        isCustom:          true,
        description:       `${name} is a star you added! ⭐`,
        funFact:           'You\'re literally building your own solar system! 🌌',
      };
    } else if (type === 'asteroid') {
      cfg = {
        id,
        name,
        emoji:       '☄️',
        type:        'asteroid',
        radius:      0.7 + Math.random() * 0.8,
        color:       0x8a8a7a,
        mass:        0.0001,
        orbitRadius: 145 + Math.random() * 30,
        period:      2.5 + Math.random() * 1.5,
        parent:      'sun',
        isCustom:    true,
        description: `${name} is a small space rock drifting through the asteroid belt.`,
        funFact:     'Most asteroids live in the Asteroid Belt between Mars and Jupiter! ☄️',
      };
    } else {
      // Planet
      const orbitR = ORBIT_PRESETS[orbitI]?.radius ?? 170;
      cfg = {
        id,
        name,
        emoji:       '🪐',
        type:        'planet',
        radius,
        color,
        mass:        0.5 * radius * radius,
        orbitRadius: orbitR,
        period:      Math.pow(orbitR / 80, 1.5), // Kepler's 3rd law (approx)
        parent:      'sun',
        isCustom:    true,
        description: `${name} is a planet you added! 🪐`,
        funFact:     'You added this planet – you\'re like a real astronomer! 🔭',
      };
    }

    const body = this.bodyMgr.add(cfg);

    // Apply current visibility settings
    body.setOrbitVisible(this.simState.showOrbits);
    body.setLabelVisible(this.simState.showLabels);

    // If N-body mode is on, give the new body a circular orbital velocity
    if (this.simState.useNBody) {
      const parentBody = body.parent ?? this.bodyMgr.bodies.get('sun');
      if (parentBody) {
        body.velocity.copy(
          circularOrbitVelocity(body.position, parentBody.position, parentBody.mass)
        );
        if (body.parent && body.parent.id !== 'sun') {
          body.velocity.add(body.parent.velocity);
        }
      }
    }

    this._closeAddModal();
  }

  // ── Info panel ────────────────────────────────────────────────────────────

  showBodyInfo(body) {
    document.getElementById('info-panel').dataset.bodyId = body.id;
    document.getElementById('info-emoji-display').textContent = body.emoji ?? '🌍';
    document.getElementById('info-name').textContent         = body.name;
    document.getElementById('info-description').textContent  = body.description || '(No description)';
    document.getElementById('info-fun-fact').textContent     = body.funFact     || '';
    document.getElementById('info-panel').classList.remove('hidden');
  }

  _closeInfoPanel() {
    document.getElementById('info-panel').classList.add('hidden');
    this.sceneMgr.stopFollowing();
  }

  // ── Canvas click → pick body ──────────────────────────────────────────────

  _onCanvasClick(e) {
    // Ignore clicks on UI elements
    if (e.target !== document.getElementById('solar-canvas')) return;

    const meshes = this.bodyMgr.all().map(b => b.mesh).filter(Boolean);
    const hit    = this.sceneMgr.pick(e.clientX, e.clientY, meshes);
    if (hit) {
      const body = this.bodyMgr.findByMesh(hit);
      if (body) this.showBodyInfo(body);
    } else {
      this._closeInfoPanel();
    }
  }
}
