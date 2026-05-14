// ─────────────────────────────────────────────────────────────────────────────
// config.js – All static data: bodies, quiz questions, eclipse scripts
// ─────────────────────────────────────────────────────────────────────────────

// Gravitational constant (simulation units, NOT SI)
export const G = 0.0008;

// Simulation years advanced per real second at 1× speed.
// At 60 fps this gives ~0.004 years/frame → Earth year in ~4 real seconds.
export const YEARS_PER_REAL_SECOND = 0.24;

// Milliseconds before the quiz notification fires
export const QUIZ_DELAY_MS = 3 * 60 * 1000; // 3 minutes

// ── Solar-system body definitions ─────────────────────────────────────────────
// orbitRadius : distance from parent in scene units
// radius      : sphere radius in scene units (not to real scale, just visible)
// mass        : arbitrary units used by N-body engine (Sun ≈ 333000 × Earth)
// period      : orbital period in simulation "years"
// parent      : id of the body this one orbits (null for the Sun)
export const SOLAR_BODIES = [
  {
    id: 'sun',
    name: 'The Sun',
    emoji: '☀️',
    type: 'star',
    radius: 14,
    color: 0xFDB813,
    emissive: 0xFDB813,
    emissiveIntensity: 1.0,
    mass: 333000,
    fixed: true,
    orbitRadius: 0,
    period: 0,
    parent: null,
    description:
      "I'm the Sun! 🌞 I'm a GIANT ball of super-hot gas called plasma. " +
      "I'm so BIG that more than one million Earths could fit inside me! " +
      "All the planets orbit around me because of my gravity – an invisible pulling force!",
    funFact: 'The Sun is about 4.6 billion years old and has enough fuel for another 5 billion years! 🔥',
  },
  {
    id: 'mercury',
    name: 'Mercury',
    emoji: '🪨',
    type: 'planet',
    radius: 1.4,
    color: 0xA8A8A8,
    mass: 0.055,
    orbitRadius: 38,
    period: 0.241,
    parent: 'sun',
    description:
      "Hi, I'm Mercury! 🪨 I'm the smallest planet and the closest one to the Sun. " +
      "I zoom around the Sun in just 88 Earth days – super fast! " +
      "But a single day on me (one spin) takes 59 Earth days!",
    funFact:
      'Mercury has almost no atmosphere, so it swings from 430 °C during the day to −180 °C at night! 🥵🥶',
  },
  {
    id: 'venus',
    name: 'Venus',
    emoji: '🌕',
    type: 'planet',
    radius: 2.6,
    color: 0xE8C882,
    mass: 0.815,
    orbitRadius: 58,
    period: 0.615,
    parent: 'sun',
    description:
      "I'm Venus! 🌕 I'm the hottest planet even though Mercury is closer to the Sun. " +
      "My thick clouds trap heat like a blanket. I'm also called Earth's twin because " +
      "we're almost the same size!",
    funFact:
      "Venus spins backwards compared to most planets, so the Sun rises in the west there! 🌅",
  },
  {
    id: 'earth',
    name: 'Earth',
    emoji: '🌍',
    type: 'planet',
    radius: 3.0,
    color: 0x2E8BC0,
    mass: 1.0,
    orbitRadius: 80,
    period: 1.0,
    parent: 'sun',
    description:
      "That's home! 🌍 Earth is the only planet we know that has liquid water, " +
      "breathable air, and LIFE! I orbit the Sun once every 365 days – that's one year!",
    funFact: 'About 71 % of Earth\'s surface is covered by oceans! 🌊',
  },
  {
    id: 'moon',
    name: 'The Moon',
    emoji: '🌙',
    type: 'moon',
    radius: 0.9,
    color: 0xC8C8C8,
    mass: 0.012,
    orbitRadius: 12,
    period: 0.0748,  // ~27.3 days
    parent: 'earth',
    description:
      "I'm the Moon! 🌙 I'm Earth's only natural satellite. " +
      "I orbit Earth once every 27 days. My gravity causes the ocean tides on Earth!",
    funFact:
      'The Moon is slowly drifting away from Earth at about 3.8 cm per year – roughly as fast as your fingernails grow! 🌙',
  },
  {
    id: 'mars',
    name: 'Mars',
    emoji: '🔴',
    type: 'planet',
    radius: 2.0,
    color: 0xC1440E,
    mass: 0.107,
    orbitRadius: 115,
    period: 1.881,
    parent: 'sun',
    description:
      "I'm Mars! 🔴 People call me the Red Planet because my soil has lots of rust (iron oxide). " +
      "I have the tallest volcano in the solar system – Olympus Mons – three times taller than Mount Everest!",
    funFact: 'A day on Mars is 24 hours and 37 minutes – almost the same as on Earth! 📅',
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    emoji: '🪐',
    type: 'planet',
    radius: 9.0,
    color: 0xC9A96E,
    mass: 317.8,
    orbitRadius: 200,
    period: 11.86,
    parent: 'sun',
    description:
      "I'm Jupiter! 🪐 I'm the BIGGEST planet – all the other planets could fit inside me! " +
      "I'm a gas giant, meaning I don't have a solid surface. " +
      "My famous Great Red Spot is a storm that has been raging for over 300 years!",
    funFact: 'Jupiter has at least 95 known moons! Its biggest moon, Ganymede, is larger than the planet Mercury! 🌑',
  },
  {
    id: 'saturn',
    name: 'Saturn',
    emoji: '🪐',
    type: 'planet',
    radius: 7.5,
    color: 0xEAD191,
    mass: 95.2,
    orbitRadius: 280,
    period: 29.46,
    parent: 'sun',
    rings: true,
    description:
      "I'm Saturn! 🪐 I'm famous for my beautiful rings, made of billions of chunks " +
      "of ice and rock. I'm a gas giant and I'm so light that I would float on water!",
    funFact:
      "Saturn's rings are huge – they stretch 282,000 km across – but are only about 10 m thick! 💍",
  },
  {
    id: 'uranus',
    name: 'Uranus',
    emoji: '🔵',
    type: 'planet',
    radius: 5.5,
    color: 0x7DE8E8,
    mass: 14.5,
    orbitRadius: 360,
    period: 84.0,
    parent: 'sun',
    description:
      "I'm Uranus! 🔵 I'm an ice giant and I spin on my side – my axis is tilted so much " +
      "that I basically roll around the Sun! My seasons each last about 21 Earth years!",
    funFact: 'Uranus was the first planet discovered with a telescope, in 1781! 🔭',
  },
  {
    id: 'neptune',
    name: 'Neptune',
    emoji: '🌀',
    type: 'planet',
    radius: 5.0,
    color: 0x3E66F9,
    mass: 17.1,
    orbitRadius: 440,
    period: 164.8,
    parent: 'sun',
    description:
      "I'm Neptune! 🌀 I'm the farthest planet from the Sun. " +
      "I have the strongest winds in the solar system – up to 2,100 km/h! " +
      "One year on me takes 165 Earth years!",
    funFact: 'Neptune was never seen by the naked eye – it was discovered because astronomers calculated it must exist from Uranus\'s weird orbit! 🧮',
  },
];

// ── Quiz question bank ─────────────────────────────────────────────────────────
// correct: index of the correct option (0-based)
export const QUIZ_QUESTIONS = [
  {
    question: 'What is at the very center of our solar system?',
    options: ['🌍 Earth', '☀️ The Sun', '🌙 The Moon', '⭐ A distant star'],
    correct: 1,
    explanation: 'The Sun is at the center of our solar system! All the planets orbit around it because of its huge gravity. ☀️',
  },
  {
    question: 'What causes a SOLAR eclipse?',
    options: [
      '🌍 Earth moves in front of the Sun',
      '🌙 The Moon moves between the Sun and Earth',
      '☀️ The Sun turns off for a moment',
      '⛅ A big cloud blocks the Sun',
    ],
    correct: 1,
    explanation: 'A solar eclipse happens when the Moon passes between the Sun and Earth, blocking the Sun\'s light! 🌑',
  },
  {
    question: 'What causes a LUNAR eclipse?',
    options: [
      '🌙 The Moon hides behind a cloud',
      '🌍 Earth passes between the Sun and the Moon',
      '☀️ The Sun moves behind Earth',
      '🌙 The Moon turns off its light',
    ],
    correct: 1,
    explanation: 'A lunar eclipse happens when Earth passes between the Sun and the Moon, casting a shadow on the Moon! 🌍',
  },
  {
    question: 'What invisible force keeps the planets orbiting the Sun?',
    options: ['🧲 Magnetism', '💨 Solar wind', '🌌 Gravity', '💡 Sunlight'],
    correct: 2,
    explanation: 'Gravity is the force that pulls objects together! The Sun\'s huge mass creates gravity that pulls all the planets into orbit. 🌌',
  },
  {
    question: 'Which is the LARGEST planet in our solar system?',
    options: ['🪐 Saturn', '🌍 Earth', '🪐 Jupiter', '🔴 Mars'],
    correct: 2,
    explanation: 'Jupiter is the biggest planet! It\'s so enormous that all the other planets could fit inside it! 🪐',
  },
  {
    question: 'How many planets are in our solar system?',
    options: ['7', '8', '9', '10'],
    correct: 1,
    explanation: 'There are 8 planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune! 🌍',
  },
  {
    question: 'What is the Moon doing when it goes around Earth?',
    options: ['Flying through space randomly', 'Orbiting Earth', 'Falling toward Earth', 'Following the Sun'],
    correct: 1,
    explanation: 'The Moon orbits (goes around) Earth once every 27 days! Gravity keeps it on this path. 🌙',
  },
  {
    question: 'During a lunar eclipse, the Moon sometimes looks what color?',
    options: ['💙 Blue', '💚 Green', '🩸 Red or orange', '⬛ Pure black'],
    correct: 2,
    explanation: 'The Moon turns reddish during a lunar eclipse because Earth\'s atmosphere bends red sunlight into the shadow – that\'s why it\'s called a "Blood Moon"! 🩸',
  },
  {
    question: 'Which planet has a giant storm that has lasted over 300 years?',
    options: ['🔴 Mars', '🪐 Jupiter', '🌀 Neptune', '🔵 Uranus'],
    correct: 1,
    explanation: 'Jupiter\'s Great Red Spot is a massive storm bigger than Earth that has been swirling for hundreds of years! 🌪️',
  },
  {
    question: 'What are Saturn\'s rings mostly made of?',
    options: ['💨 Gas and air', '🔥 Fire and ash', '🧊 Ice and rock chunks', '⭐ Tiny stars'],
    correct: 2,
    explanation: 'Saturn\'s stunning rings are made of billions of chunks of ice and rock, ranging from tiny grains to house-sized boulders! 🧊',
  },
  {
    question: 'Which planet is CLOSEST to the Sun?',
    options: ['🪨 Mercury', '🌕 Venus', '🌍 Earth', '🔴 Mars'],
    correct: 0,
    explanation: 'Mercury is the closest planet to the Sun! It zips around the Sun in just 88 Earth days. 🪨',
  },
  {
    question: 'What is a moon?',
    options: [
      'A small sun',
      'A natural object that orbits a planet',
      'A planet far from the Sun',
      'A piece of the Sun',
    ],
    correct: 1,
    explanation: 'A moon is a natural object (also called a satellite) that orbits a planet. Earth has one Moon, but Jupiter has at least 95! 🌙',
  },
  {
    question: 'What would happen if the Sun\'s gravity suddenly disappeared?',
    options: [
      'Planets would stay in their orbits',
      'Planets would fall into the Sun',
      'Planets would fly off into space',
      'Nothing would change',
    ],
    correct: 2,
    explanation: 'Without the Sun\'s gravity to hold them in orbit, all the planets would fly off in straight lines into deep space! 🚀',
  },
  {
    question: 'How long does it take Earth to go around the Sun once?',
    options: ['1 day', '1 month', '1 year', '10 years'],
    correct: 2,
    explanation: 'Earth takes exactly 365.25 days – one year – to complete one orbit around the Sun! 📅',
  },
  {
    question: 'The Sun is a what?',
    options: ['🌍 Planet', '🌙 Moon', '⭐ Star', '☄️ Comet'],
    correct: 2,
    explanation: 'The Sun is a star – a giant ball of hot plasma that produces energy through nuclear fusion! There are billions of stars in our galaxy. ⭐',
  },
];

// ── Eclipse step scripts ───────────────────────────────────────────────────────
export const ECLIPSE_SCRIPTS = {
  solar: [
    {
      title: 'What is a Solar Eclipse? ☀️',
      text:
        'A solar eclipse happens when the Moon passes directly between the Sun and Earth, ' +
        'blocking the Sun\'s light! 🌑\n\n' +
        'This can only happen during a New Moon, when the Moon is on the same side of Earth as the Sun.',
      fact: 'A total solar eclipse turns day into night for a few minutes! Animals sometimes get confused and think it\'s bedtime! 🦜',
      cameraHint: 'side',
    },
    {
      title: 'The Moon Lines Up! 🌑',
      text:
        'Watch as the Moon moves to line up perfectly between the Sun and Earth.\n\n' +
        'The Moon\'s shadow has two parts:\n' +
        '• Umbra – the very dark central shadow (total eclipse)\n' +
        '• Penumbra – the lighter outer shadow (partial eclipse)',
      fact: 'The Moon is 400 times smaller than the Sun, but also about 400 times closer – that\'s why they look the same size in our sky! 🤯',
      cameraHint: 'side',
    },
    {
      title: 'Totality! 🌑☀️',
      text:
        'During totality, the Moon completely covers the Sun! ' +
        'From Earth you can see the Sun\'s corona (its outer atmosphere) – ' +
        'a glowing ring of light around the dark Moon.\n\n' +
        'Only people standing inside the umbra (the tiny dark spot on Earth) see the total eclipse.',
      fact: 'Total solar eclipses happen somewhere on Earth about every 18 months, but the same spot on Earth only sees one every 375 years! ⏳',
      cameraHint: 'earth',
    },
  ],
  lunar: [
    {
      title: 'What is a Lunar Eclipse? 🌕',
      text:
        'A lunar eclipse happens when Earth passes between the Sun and the Moon, ' +
        'casting Earth\'s shadow onto the Moon! 🌍\n\n' +
        'This can only happen during a Full Moon, when the Moon is on the opposite side of Earth from the Sun.',
      fact: 'Unlike solar eclipses, a lunar eclipse can be seen by everyone on the night side of Earth at the same time! 🌍',
      cameraHint: 'side',
    },
    {
      title: 'Earth\'s Shadow Falls on the Moon 🌑',
      text:
        'Watch as the Moon moves into Earth\'s shadow.\n\n' +
        'Earth\'s shadow also has two parts:\n' +
        '• Umbra – the full shadow where sunlight is completely blocked\n' +
        '• Penumbra – the partial shadow where some sunlight gets through',
      fact: 'A lunar eclipse lasts much longer than a solar eclipse – the total phase can last up to 100 minutes! ⏱️',
      cameraHint: 'side',
    },
    {
      title: 'Blood Moon! 🩸',
      text:
        'When the Moon is fully inside Earth\'s umbra, it turns a deep red or orange color!\n\n' +
        'This happens because Earth\'s atmosphere bends (refracts) sunlight around the planet. ' +
        'The red wavelengths of light pass through the atmosphere more easily and illuminate the Moon.',
      fact: 'Native American tribes gave lunar eclipses the name "Blood Moon" because of this eerie red glow! 🩸',
      cameraHint: 'moon',
    },
  ],
};

// ── Preset colors for the add-body picker ──────────────────────────────────────
export const BODY_COLORS = [
  { label: 'Red',    hex: '#e74c3c', value: 0xe74c3c },
  { label: 'Orange', hex: '#e67e22', value: 0xe67e22 },
  { label: 'Yellow', hex: '#f1c40f', value: 0xf1c40f },
  { label: 'Green',  hex: '#2ecc71', value: 0x2ecc71 },
  { label: 'Cyan',   hex: '#1abc9c', value: 0x1abc9c },
  { label: 'Blue',   hex: '#3498db', value: 0x3498db },
  { label: 'Purple', hex: '#9b59b6', value: 0x9b59b6 },
  { label: 'Pink',   hex: '#e91e63', value: 0xe91e63 },
  { label: 'White',  hex: '#ecf0f1', value: 0xecf0f1 },
  { label: 'Grey',   hex: '#95a5a6', value: 0x95a5a6 },
];

// ── Size presets for new bodies ────────────────────────────────────────────────
export const SIZE_PRESETS = [
  { label: 'Tiny 🐜',   radius: 1.0 },
  { label: 'Small 🔹',  radius: 2.0 },
  { label: 'Medium 🌍', radius: 3.5 },
  { label: 'Large 🪐',  radius: 6.0 },
  { label: 'Huge 🌟',   radius: 10.0 },
];

// ── Orbit distance presets ────────────────────────────────────────────────────
export const ORBIT_PRESETS = [
  { label: 'Very close ☀️', radius: 50 },
  { label: 'Close 🔥',      radius: 100 },
  { label: 'Medium 🌍',     radius: 170 },
  { label: 'Far 🌨️',       radius: 250 },
  { label: 'Very far 🌌',   radius: 380 },
];
