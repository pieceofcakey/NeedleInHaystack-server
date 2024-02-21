const englishWords = require("an-array-of-english-words");
const jsWords = require("./jsWords");

const Trie = require("./trie");

const trie = new Trie();
const validWords = [...englishWords, ...jsWords];
const MIN_SIMILARITY_SCORE = 0.7;
const SOUNDEX_MATCH_CONSTANT = 1;
const SOUNDEX_UNMATCH_CONSTANT = 0.5;

validWords.forEach((word) => trie.insert(word.toLowerCase()));

function generateNGrams(input, n) {
  const ngrams = [];

  for (let i = 0; i < input.length - n + 1; i += 1) {
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

  for (let i = 1; i < word.length; i += 1) {
    const letter = word.charAt(i).toLowerCase();
    const code = codes[letter];

    if (code && code !== prevCode) {
      soundexCode += code;
    }

    prevCode = code;
  }

  return soundexCode.padEnd(4, "0").slice(0, 4);
}

function checkSpell(misspelledWord) {
  const biGramsOfMisspelledWord = generateNGrams(misspelledWord, 2);
  const misspelledSoundex = soundex(misspelledWord);

  const suggestions = [];

  const filtered = validWords.filter((el) => {
    const shouldHaveSimilarLength =
      el.length <= misspelledWord.length + 3 ||
      el.length >= misspelledWord.length - 3;
    const shouldStartWithSameLetter = el.startsWith(misspelledWord[0]);

    if (shouldHaveSimilarLength && shouldStartWithSameLetter) {
      return el;
    }

    return null;
  });

  filtered.forEach((correctWord) => {
    const biGramsOfCorrectWord = generateNGrams(correctWord, 2);
    const correctSoundex = soundex(correctWord);
    const intersection = biGramsOfMisspelledWord.filter((element) =>
      biGramsOfCorrectWord.includes(element),
    ).length;
    const union = new Set([...biGramsOfMisspelledWord, ...biGramsOfCorrectWord])
      .size;
    const jaccardSimilarity = intersection / union;
    const isSoundexMatch = misspelledSoundex === correctSoundex;
    const similarityScore =
      jaccardSimilarity *
      (isSoundexMatch ? SOUNDEX_MATCH_CONSTANT : SOUNDEX_UNMATCH_CONSTANT);

    if (similarityScore > MIN_SIMILARITY_SCORE) {
      suggestions.push({
        word: correctWord,
        similarityScore,
      });
    }
  });

  suggestions.sort((a, b) => b.similarityScore - a.similarityScore);

  return suggestions[0];
}

function checkUserInputSpelling(userInput) {
  const userInputArray = userInput.toLowerCase().trim().split(" ");
  const output = [];
  userInputArray.forEach((word) => {
    if (trie.search(word)) {
      output.push(word);
    } else if (checkSpell(word) === undefined) {
      output.push(word);
    } else {
      output.push(checkSpell(word).word);
    }
  });

  return output.join(" ");
}

module.exports = checkUserInputSpelling;
