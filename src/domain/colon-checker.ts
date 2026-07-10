import type { RuleOnError } from "markdownlint";
import { endsWithColonRx, headingRx, codeFenceRx, tableRowRx } from "../regex";
import { walkLineBasedListBlocks } from "./line-list-walker";
import type { ListLineParser } from "./list-line-parser";
import { eachOpeningCodeFenceLine } from "./outside-code-lines";

export class ColonChecker {
    constructor(private readonly lineParser: ListLineParser) {}

    checkPrecededByColon(
        lines: readonly string[],
        ix: number,
        onError: RuleOnError,
        colDet: string
    ): void {
        let prev = this.lineParser.skipBlankBck(lines, ix);
        while (prev >= 0) {
            const prevTrim = lines[prev].trim();
            if (!prevTrim) {
                prev--;
                continue;
            }
            if (tableRowRx.test(prevTrim)) {
                prev--;
                continue;
            }
            break;
        }
        if (prev < 0) return;
        const prevTrim = lines[prev].trim();
        if (!prevTrim || headingRx.test(prevTrim) || codeFenceRx.test(prevTrim) || this.lineParser.isLstItem(lines[prev])) {
            return;
        }
        if (!endsWithColonRx.test(prevTrim)) {
            onError({ lineNumber: prev + 1, detail: colDet, context: lines[prev] });
        }
    }

    checkListPrecededByColon(lines: readonly string[], onError: RuleOnError, colDet: string): void {
        walkLineBasedListBlocks(lines, this.lineParser, (items) => {
            if (this.lineParser.isNestedLstItem(lines[items[0]])) return;
            this.checkPrecededByColon(lines, items[0], onError, colDet);
        });
    }

    checkOpeningCodeFences(lines: readonly string[], onError: RuleOnError, colDet: string): void {
        eachOpeningCodeFenceLine(lines, (ix) => {
            this.checkPrecededByColon(lines, ix, onError, colDet);
        });
    }
}
