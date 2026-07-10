"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSpacingChecker = void 0;
const regex_1 = require("../regex");
const micromark_lists_1 = require("./micromark-lists");
const micromark_parse_1 = require("./micromark-parse");
const micromark_token_utils_1 = require("./micromark-token-utils");
class ListSpacingChecker {
    constructor(lineParser) {
        this.lineParser = lineParser;
    }
    hasBlankGap(lines, beg, end) {
        if (beg > end)
            return false;
        for (let ix = beg; ix <= end; ix++) {
            if ((0, micromark_token_utils_1.isBlankLine)(lines[ix]))
                return true;
        }
        return false;
    }
    boundBefIdx(lines, fstBeg, isSameKind) {
        const prev = this.lineParser.skipBlankBck(lines, fstBeg);
        if (prev < 0)
            return -1;
        if (isSameKind(lines[prev]))
            return -1;
        if (this.hasBlankGap(lines, prev + 1, fstBeg - 1))
            return -1;
        return fstBeg;
    }
    boundAftIdx(lines, lstEnd, isSameKind) {
        const next = this.lineParser.skipBlankFwd(lines, lstEnd);
        if (next >= lines.length)
            return -1;
        if (isSameKind(lines[next]))
            return -1;
        if (this.hasBlankGap(lines, lstEnd + 1, next - 1))
            return -1;
        return next;
    }
    findPrefixItemEnd(lines, begIx, maxIx) {
        const ind = this.lineParser.getIndent(lines[begIx]);
        let end = begIx;
        for (let ix = begIx + 1; ix < maxIx; ix++) {
            const trim = lines[ix].trim();
            if (!trim)
                continue;
            if (regex_1.headingRx.test(trim) || regex_1.codeFenceRx.test(trim))
                break;
            if (this.lineParser.isLstItem(lines[ix]))
                break;
            const jInd = this.lineParser.getIndent(lines[ix]);
            if (jInd > ind)
                end = ix;
            else
                break;
        }
        return end;
    }
    checkMicromark(lines, tokens, onError, blankDets) {
        const befDet = blankDets.bef;
        const aftDet = blankDets.aft;
        const gapDet = blankDets.gap;
        (0, micromark_lists_1.eachTopLevelList)(tokens, (list) => {
            const isNum = list.type === "listOrdered";
            const prefixes = (0, micromark_lists_1.collectPrefixesInList)(list);
            if (prefixes.length === 0)
                return;
            const isSameKind = isNum
                ? (line) => this.lineParser.isNumItem(line)
                : (line) => this.lineParser.isBulItem(line);
            const fstBeg = prefixes[0].startLine - 1;
            const lastPrefix = prefixes[prefixes.length - 1];
            const visualEnd = this.findPrefixItemEnd(lines, lastPrefix.startLine - 1, lines.length);
            const befIdx = this.boundBefIdx(lines, fstBeg, isSameKind);
            if (befIdx >= 0) {
                onError({ lineNumber: befIdx + 1, detail: befDet, context: lines[fstBeg].trim() });
            }
            const aftIdx = this.boundAftIdx(lines, visualEnd, isSameKind);
            if (aftIdx >= 0) {
                onError({ lineNumber: aftIdx + 1, detail: aftDet, context: lines[visualEnd].trim() });
            }
            if (!isNum || prefixes.length < 2)
                return;
            const gaps = prefixes.slice(0, -1).map((prefix, i) => {
                const begIx = prefix.startLine - 1;
                const nxtBeg = prefixes[i + 1].startLine - 1;
                const end = this.findPrefixItemEnd(lines, begIx, nxtBeg);
                return { nxtBeg, hasBlank: this.hasBlankGap(lines, end + 1, nxtBeg - 1) };
            });
            const anyBlank = gaps.some((gap) => gap.hasBlank);
            if (!anyBlank)
                return;
            gaps.forEach((gap) => {
                if (!gap.hasBlank) {
                    onError({ lineNumber: gap.nxtBeg + 1, detail: gapDet, context: lines[gap.nxtBeg].trim() });
                }
            });
        });
    }
    checkLines(lines, onError, blankDets) {
        this.checkMicromark(lines, (0, micromark_parse_1.parseMicromarkTokens)(lines), onError, blankDets);
    }
}
exports.ListSpacingChecker = ListSpacingChecker;
