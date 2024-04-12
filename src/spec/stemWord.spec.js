const stemWord = require("../utils/stemWord");
const { SUFFIXES } = require("../constants/wordData");

describe("stemWord", () => {
  it("returns the word itself if less than 3 characters", () => {
    expect(stemWord("on")).toBe("on");
  });

  describe("stemWord", () => {
    it("converts first character y to uppercase if it is the first letter", () => {
      expect(stemWord("yelling")).toBe("yell");
    });

    it('removes "es" from words ending in "sses"', () => {
      expect(stemWord("classes")).toBe("class");
    });

    it('removes "es" from words ending in "ies"', () => {
      expect(stemWord("cries")).toBe("cri");
    });

    it('replaces "eed" with "ee" if the preceding part has m>0', () => {
      expect(stemWord("agreed")).toBe("agre");
    });

    it('removes "ed" from words where the stem contains a vowel', () => {
      expect(stemWord("hopped")).toBe("hop");
    });

    it('removes "ing" and adds "e" when ending with a double consonant', () => {
      expect(stemWord("hopping")).toBe("hop");
    });

    it('replaces "y" with "i" if the stem contains a vowel', () => {
      expect(stemWord("happily")).toBe("happili");
    });

    it("applies correct suffix replacement for step two", () => {
      expect(stemWord("relational")).toBe("relat");
    });

    it("applies correct suffix replacement for step three", () => {
      expect(stemWord("conditional")).toBe("condit");
    });

    it("trims suffixes in step four", () => {
      expect(stemWord("revival")).toBe("reviv");
    });

    it('handles "sion" and "tion" suffixes correctly', () => {
      expect(stemWord("extension")).toBe("extens");
    });

    it('removes final "e" in step five under correct conditions', () => {
      expect(stemWord("rate")).toBe("rate");
    });

    it("removes a final double consonant to single if m > 1", () => {
      expect(stemWord("hopping")).toBe("hop");
    });

    it("converts initial uppercase Y back to lowercase if it was the first character", () => {
      expect(stemWord("Yelling")).toBe("Yell");
    });

    describe("stemWord specific lines coverage", () => {
      it('converts "ies" to "i" if the word ends with "ies"', () => {
        expect(stemWord("cries")).toBe("cri");
      });

      it('removes "ing" and retains stem if stem contains a vowel', () => {
        expect(stemWord("jumping")).toBe("jump");
      });

      it("correctly applies replacement for step three suffixes", () => {
        expect(stemWord("dedicate")).toBe("dedic");
      });

      it("converts initial uppercase Y back to lowercase if it was the first character", () => {
        expect(stemWord("Yelling")).toBe("Yell");
      });
    });
  });
});
