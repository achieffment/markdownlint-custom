import type { LinePredicate, ListBlockHandler } from "../types";
import { codeFenceRx, headingRx } from "../regex";
import { walkOutsideCode } from "./outside-code-lines";
import type { ListLineParser } from "./list-line-parser";

class LineListBlockWalker {
    constructor(
        private readonly lines: readonly string[],
        private readonly lineParser: ListLineParser
    ) {}

    private findItemEnd(beg: number, shouldBrk: LinePredicate): number {
        const ind = this.lineParser.getIndent(this.lines[beg]);
        let end = beg;
        let aftFence = false;
        for (let ix = beg + 1; ix < this.lines.length; ix++) {
            const trim = this.lines[ix].trim();
            if (!trim) continue;
            if (headingRx.test(trim)) break;
            if (shouldBrk(this.lines[ix])) break;
            const jInd = this.lineParser.getIndent(this.lines[ix]);
            if (codeFenceRx.test(trim)) {
                end = ix;
                ix++;
                while (ix < this.lines.length && !codeFenceRx.test(this.lines[ix].trim())) ix++;
                if (ix < this.lines.length) end = ix;
                aftFence = true;
                continue;
            }
            if (jInd > ind || (aftFence && jInd >= ind)) end = ix;
            else break;
        }
        return end;
    }

    findNumItemEnd(beg: number): number {
        return this.findItemEnd(beg, (line) => this.lineParser.isNumItem(line));
    }

    findBulItemEnd(beg: number): number {
        return this.findItemEnd(beg, (line) => this.lineParser.isBulItem(line) || this.lineParser.isNumItem(line));
    }

    private collectBlock(
        fstBeg: number,
        isItem: LinePredicate,
        shouldBrk: LinePredicate,
        findEnd: (beg: number) => number
    ): number[] {
        const baseInd = this.lineParser.getIndent(this.lines[fstBeg]);
        const items: number[] = [];
        let idx = fstBeg;
        while (idx < this.lines.length) {
            while (idx < this.lines.length && this.lines[idx].trim() === "") idx++;
            if (idx >= this.lines.length) break;
            const trim = this.lines[idx].trim();
            if (headingRx.test(trim) || codeFenceRx.test(trim)) break;
            if (shouldBrk(this.lines[idx])) break;
            if (!isItem(this.lines[idx])) {
                if (items.length === 0) break;
                const lineInd = this.lineParser.getIndent(this.lines[idx]);
                if (lineInd <= baseInd) break;
                idx++;
                continue;
            }
            items.push(idx);
            idx = findEnd(idx) + 1;
        }
        return items;
    }

    collectNumBlock(fstBeg: number): number[] {
        return this.collectBlock(fstBeg, (line) => this.lineParser.isNumItem(line), () => false, (beg) => this.findNumItemEnd(beg));
    }

    collectBulBlock(fstBeg: number): number[] {
        return this.collectBlock(fstBeg, (line) => this.lineParser.isBulItem(line), (line) => this.lineParser.isNumItem(line), (beg) => this.findBulItemEnd(beg));
    }
}

export const walkLineBasedListBlocks = (
    lines: readonly string[],
    lineParser: ListLineParser,
    onBlock: ListBlockHandler
): void => {
    const walker = new LineListBlockWalker(lines, lineParser);
    walkOutsideCode(lines, (ix) => {
        if (lineParser.isNumItem(lines[ix])) {
            const items = walker.collectNumBlock(ix);
            if (items.length === 0) return ix + 1;
            onBlock(items, (beg) => walker.findNumItemEnd(beg), (line) => lineParser.isNumItem(line), true);
            return walker.findNumItemEnd(items[items.length - 1]);
        }
        if (lineParser.isBulItem(lines[ix])) {
            const items = walker.collectBulBlock(ix);
            if (items.length === 0) return ix + 1;
            onBlock(items, (beg) => walker.findBulItemEnd(beg), (line) => lineParser.isBulItem(line), false);
            return walker.findBulItemEnd(items[items.length - 1]);
        }
        return undefined;
    });
};
