"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkLineBasedListBlocks = void 0;
const regex_1 = require("../regex");
const outside_code_lines_1 = require("./outside-code-lines");
class LineListBlockWalker {
    constructor(lines, lineParser) {
        this.lines = lines;
        this.lineParser = lineParser;
    }
    findItemEnd(beg, shouldBrk) {
        const ind = this.lineParser.getIndent(this.lines[beg]);
        let end = beg;
        let aftFence = false;
        for (let ix = beg + 1; ix < this.lines.length; ix++) {
            const trim = this.lines[ix].trim();
            if (!trim)
                continue;
            if (regex_1.headingRx.test(trim))
                break;
            if (shouldBrk(this.lines[ix]))
                break;
            const jInd = this.lineParser.getIndent(this.lines[ix]);
            if (regex_1.codeFenceRx.test(trim)) {
                end = ix;
                ix++;
                while (ix < this.lines.length && !regex_1.codeFenceRx.test(this.lines[ix].trim()))
                    ix++;
                if (ix < this.lines.length)
                    end = ix;
                aftFence = true;
                continue;
            }
            if (jInd > ind || (aftFence && jInd >= ind))
                end = ix;
            else
                break;
        }
        return end;
    }
    findNumItemEnd(beg) {
        return this.findItemEnd(beg, (line) => this.lineParser.isNumItem(line));
    }
    findBulItemEnd(beg) {
        return this.findItemEnd(beg, (line) => this.lineParser.isBulItem(line) || this.lineParser.isNumItem(line));
    }
    collectBlock(fstBeg, isItem, shouldBrk, findEnd) {
        const baseInd = this.lineParser.getIndent(this.lines[fstBeg]);
        const items = [];
        let idx = fstBeg;
        while (idx < this.lines.length) {
            while (idx < this.lines.length && this.lines[idx].trim() === "")
                idx++;
            if (idx >= this.lines.length)
                break;
            const trim = this.lines[idx].trim();
            if (regex_1.headingRx.test(trim) || regex_1.codeFenceRx.test(trim))
                break;
            if (shouldBrk(this.lines[idx]))
                break;
            if (!isItem(this.lines[idx])) {
                if (items.length === 0)
                    break;
                const lineInd = this.lineParser.getIndent(this.lines[idx]);
                if (lineInd <= baseInd)
                    break;
                idx++;
                continue;
            }
            items.push(idx);
            idx = findEnd(idx) + 1;
        }
        return items;
    }
    collectNumBlock(fstBeg) {
        return this.collectBlock(fstBeg, (line) => this.lineParser.isNumItem(line), () => false, (beg) => this.findNumItemEnd(beg));
    }
    collectBulBlock(fstBeg) {
        return this.collectBlock(fstBeg, (line) => this.lineParser.isBulItem(line), (line) => this.lineParser.isNumItem(line), (beg) => this.findBulItemEnd(beg));
    }
}
const walkLineBasedListBlocks = (lines, lineParser, onBlock) => {
    const walker = new LineListBlockWalker(lines, lineParser);
    (0, outside_code_lines_1.walkOutsideCode)(lines, (ix) => {
        if (lineParser.isNumItem(lines[ix])) {
            const items = walker.collectNumBlock(ix);
            if (items.length === 0)
                return ix + 1;
            onBlock(items, (beg) => walker.findNumItemEnd(beg), (line) => lineParser.isNumItem(line), true);
            return walker.findNumItemEnd(items[items.length - 1]);
        }
        if (lineParser.isBulItem(lines[ix])) {
            const items = walker.collectBulBlock(ix);
            if (items.length === 0)
                return ix + 1;
            onBlock(items, (beg) => walker.findBulItemEnd(beg), (line) => lineParser.isBulItem(line), false);
            return walker.findBulItemEnd(items[items.length - 1]);
        }
        return undefined;
    });
};
exports.walkLineBasedListBlocks = walkLineBasedListBlocks;
