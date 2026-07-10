import type { MicromarkToken, RuleOnError } from "markdownlint";
import type { BlankDets, LinePredicate } from "../types";
import { codeFenceRx, headingRx } from "../regex";
import {
    collectPrefixesInList,
    eachTopLevelList
} from "./micromark-lists";
import { parseMicromarkTokens } from "./micromark-parse";
import { isBlankLine } from "./micromark-token-utils";
import type { ListLineParser } from "./list-line-parser";

export class ListSpacingChecker {
    constructor(private readonly lineParser: ListLineParser) {}

    private hasBlankGap(lines: readonly string[], beg: number, end: number): boolean {
        if (beg > end) return false;
        for (let ix = beg; ix <= end; ix++) {
            if (isBlankLine(lines[ix])) return true;
        }
        return false;
    }

    private boundBefIdx(lines: readonly string[], fstBeg: number, isSameKind: LinePredicate): number {
        const prev = this.lineParser.skipBlankBck(lines, fstBeg);
        if (prev < 0) return -1;
        if (isSameKind(lines[prev])) return -1;
        if (this.hasBlankGap(lines, prev + 1, fstBeg - 1)) return -1;
        return fstBeg;
    }

    private boundAftIdx(lines: readonly string[], lstEnd: number, isSameKind: LinePredicate): number {
        const next = this.lineParser.skipBlankFwd(lines, lstEnd);
        if (next >= lines.length) return -1;
        if (isSameKind(lines[next])) return -1;
        if (this.hasBlankGap(lines, lstEnd + 1, next - 1)) return -1;
        return next;
    }

    private findPrefixItemEnd(lines: readonly string[], begIx: number, maxIx: number): number {
        const ind = this.lineParser.getIndent(lines[begIx]);
        let end = begIx;
        for (let ix = begIx + 1; ix < maxIx; ix++) {
            const trim = lines[ix].trim();
            if (!trim) continue;
            if (headingRx.test(trim) || codeFenceRx.test(trim)) break;
            if (this.lineParser.isLstItem(lines[ix])) break;
            const jInd = this.lineParser.getIndent(lines[ix]);
            if (jInd > ind) end = ix;
            else break;
        }
        return end;
    }

    checkMicromark(
        lines: readonly string[],
        tokens: readonly MicromarkToken[],
        onError: RuleOnError,
        blankDets: BlankDets
    ): void {
        const befDet = blankDets.bef;
        const aftDet = blankDets.aft;
        const gapDet = blankDets.gap;
        eachTopLevelList(tokens, (list) => {
            const isNum = list.type === "listOrdered";
            const prefixes = collectPrefixesInList(list);
            if (prefixes.length === 0) return;
            const isSameKind: LinePredicate = isNum
                ? (line) => {
                    return this.lineParser.isNumItem(line);
                }
                : (line) => {
                    return this.lineParser.isBulItem(line);
                };
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
            if (!isNum || prefixes.length < 2) return;
            const gaps = prefixes.slice(0, -1).map((prefix, i) => {
                const begIx = prefix.startLine - 1;
                const nxtBeg = prefixes[i + 1].startLine - 1;
                const end = this.findPrefixItemEnd(lines, begIx, nxtBeg);
                return { nxtBeg, hasBlank: this.hasBlankGap(lines, end + 1, nxtBeg - 1) };
            });
            const anyBlank = gaps.some((gap) => {
                return gap.hasBlank;
            });
            if (!anyBlank) return;
            gaps.forEach((gap) => {
                if (!gap.hasBlank) {
                    onError({ lineNumber: gap.nxtBeg + 1, detail: gapDet, context: lines[gap.nxtBeg].trim() });
                }
            });
        });
    }

    checkLines(lines: readonly string[], onError: RuleOnError, blankDets: BlankDets): void {
        this.checkMicromark(lines, parseMicromarkTokens(lines), onError, blankDets);
    }
}
