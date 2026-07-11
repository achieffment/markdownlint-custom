"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColonChecker = void 0;
const regex_1 = require("../regex");
const line_list_walker_1 = require("./line-list-walker");
const outside_code_lines_1 = require("./outside-code-lines");
class ColonChecker {
    constructor(lineParser) {
        this.lineParser = lineParser;
    }
    checkPrecededByColon(lines, ix, onError, colDet) {
        let prev = this.lineParser.skipBlankBck(lines, ix);
        while (prev >= 0) {
            const prevTrim = lines[prev].trim();
            if (!prevTrim) {
                prev--;
                continue;
            }
            if (regex_1.tableRowRx.test(prevTrim)) {
                prev--;
                continue;
            }
            break;
        }
        if (prev < 0)
            return;
        const prevTrim = lines[prev].trim();
        if (regex_1.headingRx.test(prevTrim) || regex_1.codeFenceRx.test(prevTrim) || this.lineParser.isLstItem(lines[prev])) {
            return;
        }
        if (!regex_1.endsWithColonRx.test(prevTrim)) {
            onError({ lineNumber: prev + 1, detail: colDet, context: lines[prev] });
        }
    }
    checkListPrecededByColon(lines, onError, colDet) {
        (0, line_list_walker_1.walkLineBasedListBlocks)(lines, this.lineParser, (items) => {
            if (this.lineParser.isNestedLstItem(lines[items[0]]))
                return;
            this.checkPrecededByColon(lines, items[0], onError, colDet);
        });
    }
    checkOpeningCodeFences(lines, onError, colDet) {
        (0, outside_code_lines_1.eachOpeningCodeFenceLine)(lines, (ix) => {
            this.checkPrecededByColon(lines, ix, onError, colDet);
        });
    }
}
exports.ColonChecker = ColonChecker;
