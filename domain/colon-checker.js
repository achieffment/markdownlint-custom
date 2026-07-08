"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColonChecker = void 0;
const regex_1 = require("../regex");
class ColonChecker {
    constructor(listAnalyzer, lineParser) {
        this.listAnalyzer = listAnalyzer;
        this.lineParser = lineParser;
    }
    checkPrecededByColon(lines, ix, onError, colDet) {
        const prev = this.lineParser.skipBlankBck(lines, ix);
        if (prev < 0)
            return;
        const prevTrim = lines[prev].trim();
        if (!prevTrim || prevTrim.startsWith("#") || prevTrim.startsWith("```") || this.lineParser.isLstItem(lines[prev])) {
            return;
        }
        if (!regex_1.endsWithColonRx.test(prevTrim)) {
            onError({ lineNumber: prev + 1, detail: colDet, context: lines[prev] });
        }
    }
    checkListPrecededByColon(lines, onError, colDet) {
        this.listAnalyzer.walkListBlocks(lines, (items) => {
            if (this.lineParser.isNestedLstItem(lines[items[0]]))
                return;
            this.checkPrecededByColon(lines, items[0], onError, colDet);
        });
    }
}
exports.ColonChecker = ColonChecker;
