const { SUFFIXES } = require("../constants/wordData");

const c = "[^aeiou]";
const v = "[aeiouy]";
const C = `${c}[^aeiouy]*`;
const V = `${v}[aeiou]*`;
const regexMGreater0 = new RegExp(`^(${C})?${V}${C}`);
const regexMEqual1 = new RegExp(`^(${C})?${V}${C}(${V})?$`);
const regexMGreater1 = new RegExp(`^(${C})?${V}${C}${V}${C}`);
const regexStemVowel = new RegExp(`^(${C})?${v}`);
const regexEndsWithDoubleConsonant = /([^aeiouylsz])\1$/;
const regexStemEndCVC = new RegExp(`^${C}${v}[^aeiouwxy]$`);

function stemWord(word) {
  const firstCharacter = word.slice(0, 1);

  if (word.length < 3) {
    return word;
  }

  if (firstCharacter === "y") {
    word = firstCharacter.toUpperCase() + word.slice(1);
  }

  const step1A = [/^(.+?)(ss|i)es$/, /^(.+?)([^s])s$/];

  if (step1A[0].test(word)) {
    word = word.replace(step1A[0], "$1$2");
  } else if (step1A[1].test(word)) {
    word = word.replace(step1A[1], "$1$2");
  }

  const step1B = [/^(.+?)eed$/, /^(.+?)(ed|ing)$/];

  if (step1B[0].test(word)) {
    const stem = step1B[0].exec(word)[1];

    if (regexMGreater0.test(stem)) {
      word = word.replace(/.$/, "");
    }
  } else if (step1B[1].test(word)) {
    const stem = step1B[1].exec(word)[1];

    if (regexStemVowel.test(stem)) {
      word = stem;

      if (/(at|bl|iz)$/.test(word)) {
        word += "e";
      } else if (regexEndsWithDoubleConsonant.test(word)) {
        word = word.replace(/.$/, "");
      } else if (regexStemEndCVC.test(word)) {
        word += "e";
      }
    }
  }

  const step1C = /^(.*[aeiouy].*)y$/;

  if (step1C.test(word)) {
    const stem = step1C.exec(word)[1];

    word = `${stem}i`;
  }

  const step2 =
    /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
  if (step2.test(word)) {
    const stem = step2.exec(word)[1];
    const suffix = step2.exec(word)[2];

    if (regexMGreater0.test(stem)) {
      word = stem + SUFFIXES[suffix];
    }
  }

  const step3 = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
  if (step3.test(word)) {
    const stem = step3.exec(word)[1];
    const suffix = step3.exec(word)[2];

    if (regexMGreater0.test(stem)) {
      word = stem + SUFFIXES[suffix];
    }
  }

  const step4 =
    /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
  const endsWithSionOrTion = /^(.+?)(s|t)(ion)$/;

  if (step4.test(word)) {
    const stem = step4.exec(word)[1];

    if (regexMGreater1.test(stem)) {
      word = stem;
    }
  } else if (endsWithSionOrTion.test(word)) {
    const fullParts = endsWithSionOrTion.exec(word);
    const stem = fullParts[1] + fullParts[2];

    if (regexMGreater1.test(stem)) {
      word = stem;
    }
  }

  const step5 = /^(.+?)e$/;

  if (step5.test(word)) {
    const stem = step5.exec(word)[1];

    if (
      regexMGreater1.test(stem) ||
      (regexMEqual1.test(stem) && !regexStemEndCVC.test(stem))
    ) {
      word = stem;
    }
  }

  if (regexEndsWithDoubleConsonant.test(word) && regexMGreater1.test(word)) {
    word = word.replace(/.$/, "");
  }

  if (firstCharacter === "y") {
    word = firstCharacter.toLowerCase() + word.slice(1);
  }

  return word;
}

module.exports = stemWord;
