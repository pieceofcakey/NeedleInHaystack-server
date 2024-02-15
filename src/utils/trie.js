const TrieNode = require("./trieNode");

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;

    word.split("").forEach((char) => {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }

      node = node.children.get(char);
    });

    node.isEndOfWord = true;
  }

  search(word) {
    let node = this.root;

    return (
      word.split("").every((char) => {
        if (!node.children.has(char)) {
          return false;
        }

        node = node.children.get(char);

        return true;
      }) && node.isEndOfWord
    );
  }
}

module.exports = Trie;
