import type { RuleOnError } from "markdownlint";
import { appContext } from "./composition/app-context";
import type { BlankDets, OutsideCodeCallback } from "./types";
import { eachLineOutsideCode } from "./domain/outside-code-lines";

const { lineParser, spacingChecker, colonChecker } = appContext;

module.exports = {
    lstItemRx: lineParser.lstItemRx,
    getIndent(line: string) {
        return lineParser.getIndent(line);
    },
    isLstItem(line: string) {
        return lineParser.isLstItem(line);
    },
    isChildLstItem(parentLine: string, childLine: string) {
        return lineParser.isChildLstItem(parentLine, childLine);
    },
    skipBlankFwd(lines: readonly string[], ix: number) {
        return lineParser.skipBlankFwd(lines, ix);
    },
    eachLineOutsideCode(lines: readonly string[], fn: OutsideCodeCallback) {
        return eachLineOutsideCode(lines, fn);
    },
    findPrevListInd(lines: readonly string[], ix: number) {
        return lineParser.findPrevListInd(lines, ix);
    },
    checkPrecededByColon(lines: readonly string[], ix: number, onError: RuleOnError, colDet: string) {
        return colonChecker.checkPrecededByColon(lines, ix, onError, colDet);
    },
    checkListBlankSpacing(lines: readonly string[], onError: RuleOnError, blankDets: BlankDets) {
        return spacingChecker.checkLines(lines, onError, blankDets);
    },
    checkListPrecededByColon(lines: readonly string[], onError: RuleOnError, colDet: string) {
        return colonChecker.checkListPrecededByColon(lines, onError, colDet);
    }
};
