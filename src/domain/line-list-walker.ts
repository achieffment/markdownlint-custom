import type { LinePredicate, ListBlockHandler } from "../types";
import { codeFenceRx, headingRx } from "../regex";
import { walkOutsideCode } from "./outside-code-lines";
import type { ListLineParser } from "./list-line-parser";
import { findListItemBodyEnd } from "./list-item-body-end";
import { isBlankLine } from "./micromark-token-utils";

class LineListBlockWalker {
    constructor(
        private readonly lines: readonly string[],
        private readonly lineParser: ListLineParser
    ) {}

    private findItemEnd(beg: number, shouldBrk: LinePredicate): number {
        return findListItemBodyEnd(this.lines, beg, this.lineParser, {
            traverseFence: true,
            shouldBrk
        });
    }

    findNumItemEnd(beg: number): number {
        return this.findItemEnd(beg, (line) => {
            return this.lineParser.isNumItem(line);
        });
    }

    findBulItemEnd(beg: number): number {
        return this.findItemEnd(beg, (line) => {
            return this.lineParser.isBulItem(line) || this.lineParser.isNumItem(line);
        });
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
            while (idx < this.lines.length && isBlankLine(this.lines[idx])) idx++;
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
        return this.collectBlock(
            fstBeg,
            (line) => {
                return this.lineParser.isNumItem(line);
            },
            () => {
                return false;
            },
            (beg) => {
                return this.findNumItemEnd(beg);
            }
        );
    }

    collectBulBlock(fstBeg: number): number[] {
        return this.collectBlock(
            fstBeg,
            (line) => {
                return this.lineParser.isBulItem(line);
            },
            (line) => {
                return this.lineParser.isNumItem(line);
            },
            (beg) => {
                return this.findBulItemEnd(beg);
            }
        );
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
            onBlock(
                items,
                (beg) => {
                    return walker.findNumItemEnd(beg);
                },
                (line) => {
                    return lineParser.isNumItem(line);
                },
                true
            );
            return walker.findNumItemEnd(items[items.length - 1]);
        }
        if (lineParser.isBulItem(lines[ix])) {
            const items = walker.collectBulBlock(ix);
            if (items.length === 0) return ix + 1;
            onBlock(
                items,
                (beg) => {
                    return walker.findBulItemEnd(beg);
                },
                (line) => {
                    return lineParser.isBulItem(line);
                },
                false
            );
            return walker.findBulItemEnd(items[items.length - 1]);
        }
        return undefined;
    });
};
