import { endsWithColonRx, tableRowRx } from "../regex";
import type { OnErrorFn } from "../types";
import type { ListBlockAnalyzer } from "./list-block-analyzer";
import type { ListLineParser } from "./list-line-parser";

export class ColonChecker {
    constructor(
        private readonly listAnalyzer: ListBlockAnalyzer,
        private readonly lineParser: ListLineParser
    ) {}

    checkPrecededByColon(
        lines: readonly string[],
        ix: number,
        onError: OnErrorFn,
        colDet: string
    ): void {
        let prev = this.lineParser.skipBlankBck(lines, ix);
        while (prev >= 0 && tableRowRx.test(lines[prev].trim())) {
            prev--;
        }
        if (prev >= 0 && !lines[prev].trim()) {
            prev = this.lineParser.skipBlankBck(lines, prev);
        }
        if (prev < 0) return;
        const prevTrim = lines[prev].trim();
        if (!prevTrim || prevTrim.startsWith("#") || prevTrim.startsWith("```") || this.lineParser.isLstItem(lines[prev])) {
            return;
        }
        if (!endsWithColonRx.test(prevTrim)) {
            onError({ lineNumber: prev + 1, detail: colDet, context: lines[prev] });
        }
    }

    checkListPrecededByColon(lines: readonly string[], onError: OnErrorFn, colDet: string): void {
        this.listAnalyzer.walkListBlocks(lines, (items) => {
            if (this.lineParser.isNestedLstItem(lines[items[0]])) return;
            this.checkPrecededByColon(lines, items[0], onError, colDet);
        });
    }
}
