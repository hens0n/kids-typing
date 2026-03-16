import { TypingLevel } from "@/lib/course-types";

export const LEVELS: TypingLevel[] = [
  {
    id: "home-row-reach",
    order: 1,
    name: "Home Row Reach",
    description: "Start with the center keys and short home-row words.",
    focusKeys: ["a", "s", "d", "f", "j", "k", "l", ";"],
    passWpm: 8,
    passAccuracy: 90,
    words: [
      "dad",
      "sad",
      "ask",
      "fall",
      "all",
      "lad",
      "flask",
      "lass",
      "jads",
      "alfa",
      "jak",
      "fad",
    ],
  },
  {
    id: "home-row-flow",
    order: 2,
    name: "Home Row Flow",
    description: "Build rhythm with longer home-row patterns and quick repeats.",
    focusKeys: ["a", "s", "d", "f", "j", "k", "l", ";"],
    passWpm: 10,
    passAccuracy: 92,
    words: [
      "alfalfa",
      "sad lad",
      "flask",
      "falls",
      "ask dad",
      "lass",
      "dad asks",
      "all falls",
      "fad",
      "jaks",
      "salad",
      "flasks",
    ],
  },
  {
    id: "top-row-intro",
    order: 3,
    name: "Top Row Intro",
    description: "Add E, R, U, and I to reach up without losing home-row form.",
    focusKeys: ["e", "r", "u", "i"],
    passWpm: 11,
    passAccuracy: 93,
    words: [
      "surf",
      "rise",
      "fair",
      "fires",
      "sure",
      "arise",
      "leaf",
      "slide",
      "raise",
      "usual",
      "fairies",
      "serial",
    ],
  },
  {
    id: "top-row-full",
    order: 4,
    name: "Top Row Full",
    description: "Complete the top row with W, O, P, and Q, then read full words.",
    focusKeys: ["q", "w", "o", "p"],
    passWpm: 13,
    passAccuracy: 94,
    words: [
      "power",
      "square",
      "pillow",
      "flower",
      "window",
      "praise",
      "quirk",
      "swoop",
      "rope",
      "sprout",
      "proper",
      "row",
    ],
  },
  {
    id: "bottom-row-intro",
    order: 5,
    name: "Bottom Row Intro",
    description: "Reach down for C, V, M, and N while keeping wrists quiet.",
    focusKeys: ["c", "v", "m", "n"],
    passWpm: 14,
    passAccuracy: 94,
    words: [
      "can",
      "move",
      "cave",
      "name",
      "save",
      "dance",
      "cover",
      "canvas",
      "mice",
      "maven",
      "seven",
      "sunbeam",
    ],
  },
  {
    id: "bottom-row-full",
    order: 6,
    name: "Bottom Row Full",
    description: "Finish the alphabet with X, B, G, H, T, and Y in mixed words.",
    focusKeys: ["x", "b", "g", "h", "t", "y"],
    passWpm: 16,
    passAccuracy: 95,
    words: [
      "bright",
      "habit",
      "boxing",
      "guitar",
      "thrive",
      "basket",
      "yellow",
      "goblin",
      "thunder",
      "bouncy",
      "rhythm",
      "great",
    ],
  },
  {
    id: "sentence-builder",
    order: 7,
    name: "Sentence Builder",
    description: "Read and type short, friendly sentences with spaces and punctuation.",
    focusKeys: ["space", ".", ","],
    passWpm: 18,
    passAccuracy: 95,
    words: [
      "we can type fast.",
      "sam is on a swing.",
      "i can make a brave move.",
      "you and i write with calm hands.",
      "the puppy ran home.",
      "we wave, smile, and type.",
      "mom made a warm pie.",
      "kids can learn one key at a time.",
    ],
  },
  {
    id: "speed-run",
    order: 8,
    name: "Speed Run",
    description: "Mix everything together and chase smooth, accurate speed.",
    focusKeys: ["all keys"],
    passWpm: 20,
    passAccuracy: 96,
    words: [
      "quick minds build strong typing habits.",
      "focus on calm hands and gentle rhythm.",
      "accuracy first, then speed will follow.",
      "small practice every day beats one huge session.",
      "eyes stay up while fingers do the work.",
      "great typing feels quiet, smooth, and steady.",
    ],
  },
];

const LEVELS_BY_ID = new Map(LEVELS.map((level) => [level.id, level]));

export function getLevelById(levelId: string) {
  return LEVELS_BY_ID.get(levelId);
}

export function getNextLevelId(levelId: string) {
  const currentIndex = LEVELS.findIndex((level) => level.id === levelId);
  if (currentIndex === -1 || currentIndex === LEVELS.length - 1) {
    return null;
  }

  return LEVELS[currentIndex + 1].id;
}

function hashSeed(seed: string) {
  let value = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }

  return value >>> 0;
}

export function buildPracticeText(level: TypingLevel, wordCount = 24, seed = "0") {
  const words: string[] = [];
  let state = hashSeed(seed);

  for (let index = 0; index < wordCount; index += 1) {
    state = Math.imul(state ^ (state >>> 15), 2246822519) >>> 0;
    const pick = level.words[state % level.words.length];
    words.push(pick);
  }

  return words.join(" ");
}
