"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListBlockAnalyzer = void 0;
class ListBlockAnalyzer {
    constructor(lineParser, codeWalker) {
        this.lineParser = lineParser;
        this.codeWalker = codeWalker;
    }
    createHelpers(lines) {
        const findItemEnd = (beg, shouldBrk) => {
            const ind = this.lineParser.getIndent(lines[beg]);
            let end = beg;
            for (let ix = beg + 1; ix < lines.length; ix++) {
                const trim = lines[ix].trim();
                if (!trim)
                    continue;
                if (trim.startsWith("#"))
                    break;
                if (shouldBrk(lines[ix]))
                    break;
                const jInd = this.lineParser.getIndent(lines[ix]);
                if (trim.startsWith("```")) {
                    end = ix;
                    ix++;
                    while (ix < lines.length && !lines[ix].trim().startsWith("```"))
                        ix++;
                    if (ix < lines.length)
                        end = ix;
                    break;
                }
                if (jInd > ind)
                    end = ix;
                else
                    break;
            }
            return end;
        };
        const findNumItemEnd = (beg) => findItemEnd(beg, (line) => this.lineParser.isNumItem(line));
        const findBulItemEnd = (beg) => findItemEnd(beg, (line) => this.lineParser.isBulItem(line) || this.lineParser.isNumItem(line));
        const collectBlock = (fstBeg, isItem, shouldBrk, findEnd) => {
            const baseInd = this.lineParser.getIndent(lines[fstBeg]);
            const items = [];
            let idx = fstBeg;
            while (idx < lines.length) {
                while (idx < lines.length && lines[idx].trim() === "")
                    idx++;
                if (idx >= lines.length)
                    break;
                const trim = lines[idx].trim();
                if (trim.startsWith("#") || trim.startsWith("```"))
                    break;
                if (shouldBrk(lines[idx]))
                    break;
                if (!isItem(lines[idx])) {
                    if (items.length === 0)
                        break;
                    const lineInd = this.lineParser.getIndent(lines[idx]);
                    if (lineInd <= baseInd)
                        break;
                    idx++;
                    continue;
                }
                items.push(idx);
                idx = findEnd(idx) + 1;
            }
            return items;
        };
        const collectNumBlock = (fstBeg) => collectBlock(fstBeg, (line) => this.lineParser.isNumItem(line), () => false, findNumItemEnd);
        const collectBulBlock = (fstBeg) => collectBlock(fstBeg, (line) => this.lineParser.isBulItem(line), (line) => this.lineParser.isNumItem(line), findBulItemEnd);
        return { findNumItemEnd, findBulItemEnd, collectNumBlock, collectBulBlock };
    }
    walkListBlocks(lines, onBlock) {
        const { findNumItemEnd, findBulItemEnd, collectNumBlock, collectBulBlock } = this.createHelpers(lines);
        this.codeWalker.walkOutsideCode(lines, (ix) => {
            if (this.lineParser.isNumItem(lines[ix])) {
                const items = collectNumBlock(ix);
                if (items.length === 0)
                    return ix;
                onBlock(items, findNumItemEnd, (line) => this.lineParser.isNumItem(line), true);
                return findNumItemEnd(items[items.length - 1]);
            }
            if (this.lineParser.isBulItem(lines[ix])) {
                const items = collectBulBlock(ix);
                if (items.length === 0)
                    return ix;
                onBlock(items, findBulItemEnd, (line) => this.lineParser.isBulItem(line), false);
                return findBulItemEnd(items[items.length - 1]);
            }
            return undefined;
        });
    }
}
exports.ListBlockAnalyzer = ListBlockAnalyzer;
