"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSpacingChecker = void 0;
class ListSpacingChecker {
    constructor(listAnalyzer, lineParser) {
        this.listAnalyzer = listAnalyzer;
        this.lineParser = lineParser;
    }
    hasBlankGap(lines, beg, end) {
        if (beg > end)
            return false;
        for (let ix = beg; ix <= end; ix++) {
            if (lines[ix].trim() === "")
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
    checkLines(lines, onError, blankDets) {
        const befDet = blankDets.bef;
        const aftDet = blankDets.aft;
        const gapDet = blankDets.gap;
        const checkBlockBounds = (items, findEnd, isSameKind) => {
            if (items.length === 0)
                return;
            const fstBeg = items[0];
            const befIdx = this.boundBefIdx(lines, fstBeg, isSameKind);
            if (befIdx >= 0) {
                onError({ lineNumber: befIdx + 1, detail: befDet, context: lines[fstBeg].trim() });
            }
            const lstEnd = findEnd(items[items.length - 1]);
            const aftIdx = this.boundAftIdx(lines, lstEnd, isSameKind);
            if (aftIdx >= 0) {
                onError({ lineNumber: aftIdx + 1, detail: aftDet, context: lines[lstEnd].trim() });
            }
        };
        const checkBlockGaps = (items, findEnd) => {
            if (items.length < 2)
                return;
            const gaps = items.slice(0, -1).map((beg, i) => {
                const end = findEnd(beg);
                const nxtBeg = items[i + 1];
                return { nxtBeg, hasBlank: this.hasBlankGap(lines, end + 1, nxtBeg - 1) };
            });
            const anyBlank = gaps.some(gap => gap.hasBlank);
            if (!anyBlank)
                return;
            gaps.forEach(gap => {
                if (!gap.hasBlank) {
                    onError({ lineNumber: gap.nxtBeg + 1, detail: gapDet, context: lines[gap.nxtBeg].trim() });
                }
            });
        };
        this.listAnalyzer.walkListBlocks(lines, (items, findEnd, isSameKind, isNum) => {
            checkBlockBounds(items, findEnd, isSameKind);
            if (isNum)
                checkBlockGaps(items, findEnd);
        });
    }
}
exports.ListSpacingChecker = ListSpacingChecker;
