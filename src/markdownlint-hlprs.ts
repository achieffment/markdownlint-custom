import type { RuleOnError } from "markdownlint";
import { appContext } from "./composition/app-context";
import type { OutsideCodeCallback } from "./types";

const { lineParser, codeWalker, spacingChecker, colonChecker } = appContext;

module.exports = {
    lstItemRx: lineParser.lstItemRx,
    getIndent: (line: string) => lineParser.getIndent(line),
    isLstItem: (line: string) => lineParser.isLstItem(line),
    isChildLstItem: (parentLine: string, childLine: string) =>
        lineParser.isChildLstItem(parentLine, childLine),
    skipBlankFwd: (lines: readonly string[], ix: number) => lineParser.skipBlankFwd(lines, ix),
    eachLineOutsideCode: (lines: readonly string[], fn: OutsideCodeCallback) =>
        codeWalker.eachLineOutsideCode(lines, fn),
    findPrevListInd: (lines: readonly string[], ix: number) => lineParser.findPrevListInd(lines, ix),
    checkPrecededByColon: (
        lines: readonly string[],
        ix: number,
        onError: RuleOnError,
        colDet: string
    ) => colonChecker.checkPrecededByColon(lines, ix, onError, colDet),
    checkListBlankSpacing: (lines: readonly string[], onError: RuleOnError) =>
        spacingChecker.checkLines(lines, onError),
    checkListPrecededByColon: (lines: readonly string[], onError: RuleOnError, colDet: string) =>
        colonChecker.checkListPrecededByColon(lines, onError, colDet)
};
