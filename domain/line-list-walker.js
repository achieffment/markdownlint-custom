"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkLineBasedListBlocks = void 0;
const regex_1 = require("../regex");
const outside_code_lines_1 = require("./outside-code-lines");
const list_item_body_end_1 = require("./list-item-body-end");
const micromark_token_utils_1 = require("./micromark-token-utils");
class LineListBlockWalker {
    constructor(lines, lineParser) {
        this.lines = lines;
        this.lineParser = lineParser;
    }
    findItemEnd(beg, shouldBrk) {
        return (0, list_item_body_end_1.findListItemBodyEnd)(this.lines, beg, this.lineParser, {
            traverseFence: true,
            shouldBrk
        });
    }
    findNumItemEnd(beg) {
        return this.findItemEnd(beg, (line) => {
            return this.lineParser.isNumItem(line);
        });
    }
    findBulItemEnd(beg) {
        return this.findItemEnd(beg, (line) => {
            return this.lineParser.isBulItem(line) || this.lineParser.isNumItem(line);
        });
    }
    collectBlock(fstBeg, isItem, shouldBrk, findEnd) {
        const baseInd = this.lineParser.getIndent(this.lines[fstBeg]);
        const items = [];
        let idx = fstBeg;
        while (idx < this.lines.length) {
            while (idx < this.lines.length && (0, micromark_token_utils_1.isBlankLine)(this.lines[idx]))
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
        return this.collectBlock(fstBeg, (line) => {
            return this.lineParser.isNumItem(line);
        }, () => {
            return false;
        }, (beg) => {
            return this.findNumItemEnd(beg);
        });
    }
    collectBulBlock(fstBeg) {
        return this.collectBlock(fstBeg, (line) => {
            return this.lineParser.isBulItem(line);
        }, (line) => {
            return this.lineParser.isNumItem(line);
        }, (beg) => {
            return this.findBulItemEnd(beg);
        });
    }
}
const walkLineBasedListBlocks = (lines, lineParser, onBlock) => {
    const walker = new LineListBlockWalker(lines, lineParser);
    (0, outside_code_lines_1.walkOutsideCode)(lines, (ix) => {
        if (lineParser.isNumItem(lines[ix])) {
            const items = walker.collectNumBlock(ix);
            if (items.length === 0)
                return ix + 1;
            onBlock(items);
            return walker.findNumItemEnd(items[items.length - 1]);
        }
        if (lineParser.isBulItem(lines[ix])) {
            const items = walker.collectBulBlock(ix);
            if (items.length === 0)
                return ix + 1;
            onBlock(items);
            return walker.findBulItemEnd(items[items.length - 1]);
        }
        return undefined;
    });
};
exports.walkLineBasedListBlocks = walkLineBasedListBlocks;
