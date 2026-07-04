import fs from "fs";
import path from "path";

let VOCABULARY: string[] = [];
let WORDS_1: string[] = [];
let WORDS_2: string[] = [];
let WORDS_3: string[] = [];

try {
  const wordsPath = path.join(import.meta.dir, "..", "words.json");
  const wordsData = fs.readFileSync(wordsPath, "utf-8");
  VOCABULARY = JSON.parse(wordsData);

  WORDS_1 = VOCABULARY.filter((w) => w.split(" ").length === 1);
  WORDS_2 = VOCABULARY.filter((w) => w.split(" ").length === 2);
  WORDS_3 = VOCABULARY.filter((w) => w.split(" ").length >= 3);

  console.log(`Loaded ${VOCABULARY.length} words into vocabulary.`);
} catch (e) {
  console.error("Failed to load words.json, falling back to default.", e);
  VOCABULARY = [
    "apple",
    "banana",
    "car",
    "dog",
    "elephant",
    "fish",
    "guitar",
    "house",
  ];
  WORDS_1 = VOCABULARY;
  WORDS_2 = ["ice cream", "hot dog"];
  WORDS_3 = ["statue of liberty", "eiffel tower"];
}

export function getRandomWords(
  count: number,
  customWordsStr?: string,
  customWordsOnly?: boolean,
): string[] {
  let customArray: string[] = [];
  if (customWordsStr) {
    customArray = customWordsStr
      .split(",")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
  }

  let choices: string[] = [];

  if (customWordsOnly && customArray.length >= count) {
    const shuffled = [...customArray].sort(() => 0.5 - Math.random());
    choices = shuffled.slice(0, count);
  } else {
    while (choices.length < count) {
      let pool = VOCABULARY;

      // If mixing custom words, give them a 30% chance to appear
      if (customArray.length > 0 && !customWordsOnly && Math.random() < 0.3) {
        pool = customArray;
      } else {
        // Probabilities: 70% 1-word (common), 25% 2-word (rare), 5% 3-word (super rare)
        const r = Math.random();
        if (r < 0.7 && WORDS_1.length > 0) {
          pool = WORDS_1;
        } else if (r < 0.95 && WORDS_2.length > 0) {
          pool = WORDS_2;
        } else if (WORDS_3.length > 0) {
          pool = WORDS_3;
        }
      }

      const w = pool[Math.floor(Math.random() * pool.length)];
      if (!choices.includes(w)) {
        choices.push(w);
      }
    }
  }

  // Sort by word length so single words come first
  choices.sort((a, b) => {
    const countA = a.split(" ").length;
    const countB = b.split(" ").length;
    if (countA !== countB) return countA - countB;
    return a.localeCompare(b);
  });

  return choices;
}

export function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1),
        );
      }
    }
  }
  return matrix[b.length][a.length];
}
