"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_context_1 = require("./composition/app-context");
const { lineParser, codeWalker, spacingChecker, colonChecker } = app_context_1.appContext;
module.exports = {
    lstItemRx: lineParser.lstItemRx,
    getIndent: (line) => lineParser.getIndent(line),
    isLstItem: (line) => lineParser.isLstItem(line),
    isChildLstItem: (parentLine, childLine) => lineParser.isChildLstItem(parentLine, childLine),
    skipBlankFwd: (lines, ix) => lineParser.skipBlankFwd(lines, ix),
    eachLineOutsideCode: (lines, fn) => codeWalker.eachLineOutsideCode(lines, fn),
    findPrevListInd: (lines, ix) => lineParser.findPrevListInd(lines, ix),
    checkPrecededByColon: (lines, ix, onError, colDet) => colonChecker.checkPrecededByColon(lines, ix, onError, colDet),
    checkListBlankSpacing: (lines, onError, blankDets) => spacingChecker.checkLines(lines, onError, blankDets),
    checkListPrecededByColon: (lines, onError, colDet) => colonChecker.checkListPrecededByColon(lines, onError, colDet)
};
