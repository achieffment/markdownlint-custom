import { bulItemRx, codeFenceRx, headingRx, lstItemRx, numItemRx } from "../regex";
import { skipFenceBlockBck } from "./outside-code-lines";
import { isBlankLine } from "./micromark-token-utils";

export class ListLineParser {
    get lstItemRx(): RegExp {
        return lstItemRx;
    }

    trimStart(line: string): string {
        return line.replace(/^\s*/, "");
    }

    getIndent(line: string): number {
        return line.match(/^(\s*)/)?.[1]?.length ?? 0;
    }

    isLstItem(line: string): boolean {
        return lstItemRx.test(this.trimStart(line));
    }

    isNumItem(line: string): boolean {
        return numItemRx.test(this.trimStart(line));
    }

    isBulItem(line: string): boolean {
        return bulItemRx.test(this.trimStart(line));
    }

    isNestedLstItem(line: string): boolean {
        return this.getIndent(line) > 0;
    }

    isChildLstItem(parentLine: string, childLine: string): boolean {
        if (!this.isLstItem(parentLine) || !this.isLstItem(childLine)) return false;
        return this.getIndent(childLine) > this.getIndent(parentLine);
    }

    skipBlankFwd(lines: readonly string[], ix: number): number {
        let next = ix + 1;
        while (next < lines.length && isBlankLine(lines[next])) next++;
        return next;
    }

    skipBlankBck(lines: readonly string[], ix: number): number {
        let prev = ix - 1;
        while (prev >= 0 && isBlankLine(lines[prev])) prev--;
        return prev;
    }

    findPrevListInd(lines: readonly string[], ix: number): number {
        const currInd = this.getIndent(lines[ix]);
        let prev = ix - 1;
        let prevInd = -1;
        while (prev >= 0) {
            const prevTrim = lines[prev].trim();
            if (isBlankLine(lines[prev])) {
                prev--;
                continue;
            }
            if (codeFenceRx.test(prevTrim)) {
                prev = skipFenceBlockBck(lines, prev);
                continue;
            }
            if (this.isLstItem(lines[prev])) {
                prevInd = this.getIndent(lines[prev]);
                break;
            }
            const lineInd = this.getIndent(lines[prev]);
            if (lineInd >= currInd && !headingRx.test(prevTrim)) {
                prev--;
                continue;
            }
            break;
        }
        return prevInd;
    }
}
