const {
  TITLE_WEIGHT,
  DESCRIPTION_WEIGHT,
  TRANSCRIPT_WEIGHT,
  TAG_WEIGHT,
  K1,
  B,
} = require("../constants/rankingConstants");

function calculateBM25(IDF, TF, documentLength, averageDocumentLength) {
  return (
    (IDF * (TF * (K1 + 1))) /
    (TF + K1 * (1 - B + (B * documentLength) / averageDocumentLength))
  );
}

exports.calculateAverage = function (prevAverage, totalCount, documentLength) {
  return (prevAverage * (totalCount - 1) + documentLength) / totalCount;
};

exports.calculateIDF = function (totalDocuments, documents) {
  return Math.log(
    (totalDocuments - documents.length + 0.5) / (documents.length + 0.5) + 1,
  );
};

exports.calculateTF = function (document, keyword) {
  return document.filter((word) => keyword === word).length / document.length;
};

exports.calculateBM25F = function (
  IDF,
  TFs,
  fieldTokens,
  averageDocumentLength,
) {
  const score =
    TITLE_WEIGHT *
      calculateBM25(
        IDF,
        parseFloat(TFs.titleTF),
        fieldTokens.titleTokens.length,
        parseInt(averageDocumentLength.titleLength, 10),
      ) +
    DESCRIPTION_WEIGHT *
      calculateBM25(
        IDF,
        parseFloat(TFs.descriptionTF),
        fieldTokens.descriptionTokens.length,
        parseInt(averageDocumentLength.descriptionLength, 10),
      ) +
    TRANSCRIPT_WEIGHT *
      (calculateBM25(
        IDF,
        parseFloat(TFs.transcriptTF),
        fieldTokens.transcriptTokens.length,
        parseInt(averageDocumentLength.transcriptLength, 10),
      ) || 0) +
    TAG_WEIGHT *
      (calculateBM25(
        IDF,
        parseFloat(TFs.tagTF),
        fieldTokens.tagTokens.length,
        parseInt(averageDocumentLength.tagLength, 10),
      ) || 0);

  return score;
};
