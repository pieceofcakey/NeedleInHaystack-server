const OriginalKeyword = require("../models/OriginalKeyword");

async function getOriginalKeywords() {
  const correctWords = await OriginalKeyword.findOne({
    name: "originalKeywords",
  }).lean();

  return correctWords.value;
}

function generateNGrams(input, n) {
  const ngrams = [];

  for (let i = 0; i < input.length - n + 1; i++) {
    ngrams.push(input.slice(i, i + n));
  }

  return ngrams;
}

function soundex(word) {
  const codes = {
    b: 1,
    f: 1,
    p: 1,
    v: 1,
    c: 2,
    g: 2,
    j: 2,
    k: 2,
    q: 2,
    s: 2,
    x: 2,
    z: 2,
    d: 3,
    t: 3,
    l: 4,
    m: 5,
    n: 5,
    r: 6,
  };

  const firstLetter = word.charAt(0).toLowerCase();
  let soundexCode = firstLetter.toUpperCase();

  let prevCode = codes[firstLetter];

  for (let i = 1; i < word.length; i++) {
    const letter = word.charAt(i).toLowerCase();
    const code = codes[letter];

    if (code && code !== prevCode) {
      soundexCode += code;
    }

    prevCode = code;
  }

  return soundexCode.padEnd(4, "0").slice(0, 4);
}

async function checkSpell(misspelledWord) {
  const biGramsOfMisspelledWord = generateNGrams(misspelledWord, 2);
  const misspelledSoundex = soundex(misspelledWord);
  const allCorrectWords = await getOriginalKeywords();
  const suggestions = [];

  for (const correctWord of allCorrectWords) {
    const biGramsOfCorrectWord = generateNGrams(correctWord, 2);
    const correctSoundex = soundex(correctWord);
    const intersection = biGramsOfMisspelledWord.filter((element) =>
      biGramsOfCorrectWord.includes(element),
    ).length;
    const union = new Set([...biGramsOfMisspelledWord, ...biGramsOfCorrectWord])
      .size;
    const jaccardSimilarity = intersection / union;
    const soundexMatch = misspelledSoundex === correctSoundex;
    const similarityScore = jaccardSimilarity * (soundexMatch ? 1 : 0.5);

    if (similarityScore > 0.5) {
      suggestions.push({
        word: correctWord,
        similarityScore,
      });
    }
  }

  suggestions.sort((a, b) => b.similarityScore - a.similarityScore);

  return suggestions[0];
}

async function checkUserInputSpelling(userInput) {
  const suggestions = await Promise.all(
    userInput
      .trim()
      .split(" ")
      .map((word) => checkSpell(word)),
  );
  const output = [];

  suggestions.forEach((element) => {
    output.push(element?.word);
  });

  return output.join(" ");
}

module.exports = checkUserInputSpelling;
