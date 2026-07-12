const { hlprs, assert, getFailed, collectErrs, isOpeningCodeFenceAt } = require("./helpers.cjs");
const { details } = require("../details.js");
const { lstItemRx, isLstItem, eachLineOutsideCode, getIndent, isChildLstItem, skipBlankFwd, findPrevListInd } = hlprs;

const expectedHlprsKeys = [
    "lstItemRx",
    "getIndent",
    "isLstItem",
    "isChildLstItem",
    "skipBlankFwd",
    "eachLineOutsideCode",
    "findPrevListInd",
    "checkPrecededByColon",
    "checkListBlankSpacing",
    "checkListPrecededByColon"
];
expectedHlprsKeys.forEach(key => {
    const val = hlprs[key];
    if (key === "lstItemRx") {
        if (!(val instanceof RegExp)) {
            assert(false, `hlprs.${key} must be RegExp`);
        }
    } else if (typeof val !== "function") {
        assert(false, `hlprs.${key} must be function`);
    }
});
if (getFailed() === 0) {
    console.log(`OK   hlprs API (${expectedHlprsKeys.length} exports)`);
}

if (!isChildLstItem("1. родитель;", "   1. дочерний;")) {
    assert(false, "isChildLstItem: nested should be child");
}
if (isChildLstItem("1. пункт;", "1. sibling;")) {
    assert(false, "isChildLstItem: sibling should not be child");
}
if (getIndent("   текст") !== 3) {
    assert(false, "getIndent: expected 3");
}
const skipLines = ["a", "", "", "b"];
if (skipBlankFwd(skipLines, 0) !== 3) {
    assert(false, "skipBlankFwd: expected index 3");
}
const outsideMd = ["before", "```js", "inside", "```", "after"];
const outsideIxs = [];
eachLineOutsideCode(outsideMd, (_line, ix) => {
    outsideIxs.push(ix);
});
if (outsideIxs.length !== 2 || outsideIxs[0] !== 0 || outsideIxs[1] !== 4) {
    assert(false, "eachLineOutsideCode: expected outside lines 0 and 4 only");
}
const prevLines = ["1. пункт;", "", "2. второй;"];
if (findPrevListInd(prevLines, 2) !== 0) {
    assert(false, "findPrevListInd: expected indent 0");
}
if (getFailed() === 0) {
    console.log("OK   hlprs behavior (isChildLstItem, getIndent, skipBlankFwd, eachLineOutsideCode, findPrevListInd)");
}

const colonPrevLines = ["Текст перед кодом.", "```js"];
const colonPrevErrs = collectErrs((onErr) => {
    hlprs.checkPrecededByColon(colonPrevLines, 1, onErr, details.codeblockColon);
});
if (colonPrevErrs.length !== 1 || colonPrevErrs[0].lineNumber !== 1 || colonPrevErrs[0].detail !== details.codeblockColon) {
    assert(false, "checkPrecededByColon err: expected line 1 codeblockColon");
}
const colonPrevOk = collectErrs((onErr) => {
    hlprs.checkPrecededByColon(["Текст:", "```js"], 1, onErr, details.codeblockColon);
});
if (colonPrevOk.length !== 0) {
    assert(false, "checkPrecededByColon ok: expected no errors");
}

const listColonHlprsLines = ["## T", "", "Текст.", "", "1. пункт;"];
const listColonHlprsErrs = collectErrs((onErr) => {
    hlprs.checkListPrecededByColon(listColonHlprsLines, onErr, details.listPrecededByColon);
});
if (listColonHlprsErrs.length !== 1 || listColonHlprsErrs[0].lineNumber !== 3 || listColonHlprsErrs[0].detail !== details.listPrecededByColon) {
    assert(false, "checkListPrecededByColon err: expected line 3 listPrecededByColon");
}
const listColonHlprsOk = collectErrs((onErr) => {
    hlprs.checkListPrecededByColon(["## T", "", "Текст:", "", "1. пункт;"], onErr, details.listPrecededByColon);
});
if (listColonHlprsOk.length !== 0) {
    assert(false, "checkListPrecededByColon ok: expected no errors");
}

const blankSpacingDets = {
    bef: details.listBlankBef,
    aft: details.listBlankAft,
    gap: details.listBlankGap
};
const spacingBefLines = ["## T", "- пункт;"];
const spacingBefErrs = collectErrs((onErr) => {
    hlprs.checkListBlankSpacing(spacingBefLines, onErr, blankSpacingDets);
});
if (spacingBefErrs.length !== 1 || spacingBefErrs[0].lineNumber !== 2 || spacingBefErrs[0].detail !== details.listBlankBef) {
    assert(false, "checkListBlankSpacing bef: expected line 2 listBlankBef");
}
const spacingAftLines = ["## T", "", "1. один;", "2. два;", "Текст после."];
const spacingAftErrs = collectErrs((onErr) => {
    hlprs.checkListBlankSpacing(spacingAftLines, onErr, blankSpacingDets);
});
if (spacingAftErrs.length !== 1 || spacingAftErrs[0].lineNumber !== 5 || spacingAftErrs[0].detail !== details.listBlankAft) {
    assert(false, "checkListBlankSpacing aft: expected line 5 listBlankAft");
}
const spacingGapLines = ["## T", "", "1. один;", "2. два;", "", "3. три;"];
const spacingGapErrs = collectErrs((onErr) => {
    hlprs.checkListBlankSpacing(spacingGapLines, onErr, blankSpacingDets);
});
if (spacingGapErrs.length !== 1 || spacingGapErrs[0].lineNumber !== 4 || spacingGapErrs[0].detail !== details.listBlankGap) {
    assert(false, "checkListBlankSpacing gap: expected line 4 listBlankGap");
}

if (getFailed() === 0) {
    console.log("OK   hlprs checkers (checkPrecededByColon, checkListPrecededByColon, checkListBlankSpacing)");
}

const deepIndents = [3, 6, 9, 12, 15];
deepIndents.forEach(sp => {
    const line = `${" ".repeat(sp)}1. пункт;`;
    const trim = line.trim();
    if (!lstItemRx.test(trim) || !isLstItem(line)) {
        assert(false, `nested num regex: "${trim}" not recognized as list item`);
    }
});
if (getFailed() === 0) {
    console.log(`OK   nested num regex (${deepIndents.length} levels)`);
}

const openingFenceLines = ["```js", "x", "```", "", "- a;", "```"];
if (!isOpeningCodeFenceAt(openingFenceLines, 0)) {
    assert(false, "isOpeningCodeFenceAt: first fence should be opening");
}
if (isOpeningCodeFenceAt(openingFenceLines, 2)) {
    assert(false, "isOpeningCodeFenceAt: closing fence should not be opening");
}
if (!isOpeningCodeFenceAt(openingFenceLines, 5)) {
    assert(false, "isOpeningCodeFenceAt: fence after closed block should be opening");
}
const closingAfterListLines = ["```js", "x", "", "- a;", "```"];
if (isOpeningCodeFenceAt(closingAfterListLines, 4)) {
    assert(false, "isOpeningCodeFenceAt: fence closing open block should not be opening");
} else {
    console.log("OK   isOpeningCodeFenceAt closing vs opening");
}
