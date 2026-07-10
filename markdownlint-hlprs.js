"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_context_1 = require("./composition/app-context");
const outside_code_lines_1 = require("./domain/outside-code-lines");
const { lineParser, spacingChecker, colonChecker } = app_context_1.appContext;
module.exports = {
    lstItemRx: lineParser.lstItemRx,
    getIndent(line) {
        return lineParser.getIndent(line);
    },
    isLstItem(line) {
        return lineParser.isLstItem(line);
    },
    isChildLstItem(parentLine, childLine) {
        return lineParser.isChildLstItem(parentLine, childLine);
    },
    skipBlankFwd(lines, ix) {
        return lineParser.skipBlankFwd(lines, ix);
    },
    eachLineOutsideCode(lines, fn) {
        return (0, outside_code_lines_1.eachLineOutsideCode)(lines, fn);
    },
    findPrevListInd(lines, ix) {
        return lineParser.findPrevListInd(lines, ix);
    },
    checkPrecededByColon(lines, ix, onError, colDet) {
        return colonChecker.checkPrecededByColon(lines, ix, onError, colDet);
    },
    checkListBlankSpacing(lines, onError, blankDets) {
        return spacingChecker.checkLines(lines, onError, blankDets);
    },
    checkListPrecededByColon(lines, onError, colDet) {
        return colonChecker.checkListPrecededByColon(lines, onError, colDet);
    }
};
