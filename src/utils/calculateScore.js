const { K1, B } = require("../constants/rankingConstants");

exports.calculateIDF = function (totalDocuments, documents) {
  return Math.log(
    (totalDocuments - documents.length + 0.5) / (documents.length + 0.5) + 1,
  );
};

exports.calculateTF = function (document, keyword) {
  return document.filter((word) => keyword === word).length;
};

exports.calculateBM25 = function (
  IDF,
  TF,
  documentLength,
  averageDocumentLength,
) {
  return (
    (IDF * (TF * (K1 + 1))) /
    (TF + K1 * (1 - B + (B * documentLength) / averageDocumentLength))
  );
};
