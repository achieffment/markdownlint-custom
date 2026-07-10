"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLineParser = void 0;
const regex_1 = require("../regex");
const outside_code_lines_1 = require("./outside-code-lines");
const micromark_token_utils_1 = require("./micromark-token-utils");
class ListLineParser {
    get lstItemRx() {
        return regex_1.lstItemRx;
    }
    trimStart(line) {
        return line.replace(/^\s*/, "");
    }
    getIndent(line) {
        return line.match(/^(\s*)/)?.[1]?.length ?? 0;
    }
    isLstItem(line) {
        return regex_1.lstItemRx.test(this.trimStart(line));
    }
    isNumItem(line) {
        return regex_1.numItemRx.test(this.trimStart(line));
    }
    isBulItem(line) {
        return regex_1.bulItemRx.test(this.trimStart(line));
    }
    isNestedLstItem(line) {
        return this.getIndent(line) > 0;
    }
    isChildLstItem(parentLine, childLine) {
        if (!this.isLstItem(parentLine) || !this.isLstItem(childLine))
            return false;
        return this.getIndent(childLine) > this.getIndent(parentLine);
    }
    skipBlankFwd(lines, ix) {
        let next = ix + 1;
        while (next < lines.length && (0, micromark_token_utils_1.isBlankLine)(lines[next]))
            next++;
        return next;
    }
    skipBlankBck(lines, ix) {
        let prev = ix - 1;
        while (prev >= 0 && (0, micromark_token_utils_1.isBlankLine)(lines[prev]))
            prev--;
        return prev;
    }
    findPrevListInd(lines, ix) {
        const currInd = this.getIndent(lines[ix]);
        let prev = ix - 1;
        let prevInd = -1;
        while (prev >= 0) {
            const prevTrim = lines[prev].trim();
            if ((0, micromark_token_utils_1.isBlankLine)(lines[prev])) {
                prev--;
                continue;
            }
            if (regex_1.codeFenceRx.test(prevTrim)) {
                prev = (0, outside_code_lines_1.skipFenceBlockBck)(lines, prev);
                continue;
            }
            if (this.isLstItem(lines[prev])) {
                prevInd = this.getIndent(lines[prev]);
                break;
            }
            const lineInd = this.getIndent(lines[prev]);
            if (lineInd >= currInd && !regex_1.headingRx.test(prevTrim)) {
                prev--;
                continue;
            }
            break;
        }
        return prevInd;
    }
}
exports.ListLineParser = ListLineParser;
