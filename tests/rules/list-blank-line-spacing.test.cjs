const { examplesDir, getViolations, getFiredRules, lintStrings, lintStringsFull, assert, getFailed } = require("../helpers.cjs");
const { details } = require("../../details.js");
const path = require("path");

const listBlankErrPath = path.join(examplesDir, "list-blank-line-spacing", "_err.md");
const listBlankViol = getViolations(listBlankErrPath);
const blankDets = [details.listBlankBef, details.listBlankAft, details.listBlankGap];
const foundBlankDets = new Set(listBlankViol.map(v => v.errorDetail));
blankDets.forEach(det => {
    if (!foundBlankDets.has(det)) {
        assert(false, `list-blank-line-spacing/_err.md missing sub-detail: ${det}`);
    }
});
if (getFailed() === 0) {
    console.log("OK   list-blank-line-spacing/_err sub-details");
}

const spacingFullBefErr = `# Документ

## Раздел

Текст перед маркированным списком:
- пункт один;
`;
const spacingFullBefRes = lintStringsFull({ t: spacingFullBefErr });
const spacingFullBefViol = spacingFullBefRes.t || [];
const spacingFullBefFired = getFiredRules(spacingFullBefViol);
if (!spacingFullBefFired.has("list-blank-line-spacing")) {
    assert(false, "spacing full config bef: expected list-blank-line-spacing, got " + ([...spacingFullBefFired].join(", ") || "none"));
} else {
    const extra = [...spacingFullBefFired].filter(n => n !== "list-blank-line-spacing");
    const befDet = spacingFullBefViol.find(v => v.errorDetail === details.listBlankBef);
    if (extra.length > 0) {
        assert(false, "spacing full config bef: extra rules " + extra.join(", "));
    } else if (!befDet || befDet.lineNumber !== 6) {
        assert(false, `spacing full config bef: expected listBlankBef on line 6 got ${befDet?.lineNumber || "none"}`);
    } else {
        console.log("OK   spacing full config bef → listBlankBef on line 6");
    }
}

const spacingFullGapErr = `# Документ

## Раздел

Текст перед списком без blank между пунктами:

1. один;
2. два;

3. три;
`;
const spacingFullGapRes = lintStringsFull({ t: spacingFullGapErr });
const spacingFullGapViol = spacingFullGapRes.t || [];
const spacingFullGapFired = getFiredRules(spacingFullGapViol);
if (!spacingFullGapFired.has("list-blank-line-spacing")) {
    assert(false, "spacing full config gap: expected list-blank-line-spacing, got " + ([...spacingFullGapFired].join(", ") || "none"));
} else {
    const extra = [...spacingFullGapFired].filter(n => n !== "list-blank-line-spacing");
    const gapDet = spacingFullGapViol.find(v => v.errorDetail === details.listBlankGap);
    if (extra.length > 0) {
        assert(false, "spacing full config gap: extra rules " + extra.join(", "));
    } else if (!gapDet || gapDet.lineNumber !== 8) {
        assert(false, `spacing full config gap: expected listBlankGap on line 8 got ${gapDet?.lineNumber || "none"}`);
    } else {
        console.log("OK   spacing full config gap → listBlankGap on line 8");
    }
}

const nestedSpacingErr = `## T

1. родитель:

   1. вложенный;
      1. третий уровень;

         1. четвёртый уровень;
`;
const nestedSpacingRes = lintStrings({ t: nestedSpacingErr }, ["list-blank-line-spacing", "minimum-h2-heading"]);
const nestedSpacingViol = nestedSpacingRes.t || [];
const nestedSpacingFired = getFiredRules(nestedSpacingViol);
if (!nestedSpacingFired.has("list-blank-line-spacing")) {
    assert(false, "nested spacing err: expected list-blank-line-spacing, got " + ([...nestedSpacingFired].join(", ") || "none"));
} else {
    const extra = [...nestedSpacingFired].filter(n => n !== "list-blank-line-spacing");
    const spacingLines = nestedSpacingViol
        .filter(v => v.ruleNames.includes("list-blank-line-spacing"))
        .map(v => v.lineNumber)
        .sort((a, b) => a - b);
    if (extra.length > 0) {
        assert(false, "nested spacing err: extra rules " + extra.join(", "));
    } else if (spacingLines.join() !== "6") {
        assert(false, `nested spacing err lines: expected 6 got ${spacingLines.join() || "none"}`);
    } else {
        console.log("OK   nested spacing err → list-blank-line-spacing on line 6");
    }
}

const unorderedBoundariesErr = `## T

Текст перед списком:

- пункт один;
- пункт два;
Текст после списка.
`;
const unorderedBoundariesRes = lintStrings({ t: unorderedBoundariesErr }, ["list-blank-line-spacing", "minimum-h2-heading", "list-preceded-by-colon"]);
const unorderedBoundariesViol = unorderedBoundariesRes.t || [];
const unorderedBoundariesFired = getFiredRules(unorderedBoundariesViol);
if (!unorderedBoundariesFired.has("list-blank-line-spacing")) {
    assert(false, "unordered boundaries err: expected list-blank-line-spacing");
} else {
    const extra = [...unorderedBoundariesFired].filter(n => n !== "list-blank-line-spacing");
    if (extra.length > 0) {
        assert(false, "unordered boundaries err: extra rules " + extra.join(", "));
    } else {
        const aftDet = unorderedBoundariesViol.find(v => v.errorDetail === details.listBlankAft);
        if (!aftDet) {
            assert(false, "unordered boundaries err: expected listBlankAft detail");
        } else {
            console.log("OK   unordered boundaries err → list-blank-line-spacing");
        }
    }
}

const unorderedBoundariesOk = `## T

Текст перед списком:

- пункт один;
- пункт два;

- пункт три;

Текст после списка.
`;
const unorderedBoundariesOkRes = lintStrings({ t: unorderedBoundariesOk }, ["list-blank-line-spacing", "minimum-h2-heading", "list-preceded-by-colon", "list-items-end-with-semicolon-or-colon", "sentences-end-with-mark"]);
if (getFiredRules(unorderedBoundariesOkRes.t || []).size > 0) {
    assert(false, "unordered boundaries ok: " + [...getFiredRules(unorderedBoundariesOkRes.t || [])].join(", "));
} else {
    console.log("OK   unordered boundaries ok → clean");
}

const bulInternalBlankOk = `## T

Текст:

- первый;

- второй;

Текст после.
`;
const bulInternalBlankRes = lintStrings({ t: bulInternalBlankOk }, ["list-blank-line-spacing", "minimum-h2-heading", "list-preceded-by-colon", "list-items-end-with-semicolon-or-colon", "sentences-end-with-mark"]);
if (getFiredRules(bulInternalBlankRes.t || []).size > 0) {
    assert(false, "bul internal blank ok: " + [...getFiredRules(bulInternalBlankRes.t || [])].join(", "));
} else {
    console.log("OK   bulleted internal blank between items → clean");
}

const numHeadingBoundErr = `## T

1. one;
## Next
`;
const numHeadingBoundRes = lintStrings({ t: numHeadingBoundErr }, ["list-blank-line-spacing", "minimum-h2-heading"]);
const numHeadingBoundFired = getFiredRules(numHeadingBoundRes.t || []);
if (!numHeadingBoundFired.has("list-blank-line-spacing") || numHeadingBoundFired.size !== 1) {
    assert(false, "num heading bound err: expected list-blank-line-spacing only, got " + [...numHeadingBoundFired].join(", "));
} else {
    console.log("OK   num block before heading no blank → list-blank-line-spacing");
}

const tightThenBlankErr = `## T

1. один;
2. два;

3. три;
`;
const tightThenBlankRes = lintStrings({ t: tightThenBlankErr }, ["list-blank-line-spacing", "minimum-h2-heading"]);
const tightThenBlankViol = tightThenBlankRes.t || [];
const tightThenBlankFired = getFiredRules(tightThenBlankViol);
if (!tightThenBlankFired.has("list-blank-line-spacing") || tightThenBlankFired.size !== 1) {
    assert(false, "tight then blank err: expected list-blank-line-spacing only, got " + [...tightThenBlankFired].join(", "));
} else {
    const spacingLines = tightThenBlankViol
        .map(v => v.lineNumber)
        .sort((a, b) => a - b);
    if (spacingLines.join() !== "4") {
        assert(false, `tight then blank err lines: expected 4 got ${spacingLines.join() || "none"}`);
    } else {
        const gapDet = tightThenBlankViol.find(v => v.errorDetail === details.listBlankGap);
        if (!gapDet) {
            assert(false, "tight then blank err: expected listBlankGap detail");
        } else {
            console.log("OK   tight then blank err → list-blank-line-spacing on line 4");
        }
    }
}

const numSameKindBoundOk = `## T

Текст:

1. one;
2. two;
1. three;
`;
const numSameKindBoundOkRes = lintStrings({ t: numSameKindBoundOk }, ["list-blank-line-spacing", "minimum-h2-heading", "list-preceded-by-colon", "list-items-end-with-semicolon-or-colon"]);
if (getFiredRules(numSameKindBoundOkRes.t || []).size > 0) {
    assert(false, "num same-kind bound skip: " + [...getFiredRules(numSameKindBoundOkRes.t || [])].join(", "));
} else {
    console.log("OK   num same-kind bound skip → clean");
}

const listEndsAtEofOk = `## T

1. пункт;
`;
const listEndsAtEofRes = lintStrings({ t: listEndsAtEofOk }, ["list-blank-line-spacing", "minimum-h2-heading"]);
if (getFiredRules(listEndsAtEofRes.t || []).has("list-blank-line-spacing")) {
    assert(false, "list at EOF must not trigger after-boundary");
} else {
    console.log("OK   list at EOF → no after-boundary");
}

const fenceContinuationOk = `## T

Вводный текст:

1. пункт:

\`\`\`js
const x = 1;
\`\`\`
Продолжение того же пункта;

2. второй;
`;
const fenceContinuationOkRes = lintStrings({ t: fenceContinuationOk }, ["list-blank-line-spacing", "list-preceded-by-colon", "minimum-h2-heading", "list-items-end-with-semicolon-or-colon", "sentences-end-with-mark"]);
if (getFiredRules(fenceContinuationOkRes.t || []).size > 0) {
    assert(false, "fence continuation ok: " + [...getFiredRules(fenceContinuationOkRes.t || [])].join(", "));
} else {
    console.log("OK   num item fence continuation → clean");
}

const listAfterHeadingNoBlankErr = `## T
1. пункт;
`;
const listAfterHeadingRes = lintStrings({ t: listAfterHeadingNoBlankErr }, ["list-blank-line-spacing", "minimum-h2-heading"]);
const listAfterHeadingFired = getFiredRules(listAfterHeadingRes.t || []);
if (!listAfterHeadingFired.has("list-blank-line-spacing") || listAfterHeadingFired.size !== 1) {
    assert(false, "list after heading without blank: expected list-blank-line-spacing only, got " + [...listAfterHeadingFired].join(", "));
} else {
    const befDet = (listAfterHeadingRes.t || []).find(v => v.errorDetail === details.listBlankBef);
    if (!befDet || befDet.lineNumber !== 2) {
        assert(false, `list after heading detail: expected listBlankBef on line 2 got ${befDet?.lineNumber || "none"}`);
    } else {
        console.log("OK   list after heading no blank → list-blank-line-spacing");
    }
}

const bulBlankBefErr = `## T
- пункт;
`;
const bulBlankBefRes = lintStrings({ t: bulBlankBefErr }, ["list-blank-line-spacing", "minimum-h2-heading"]);
const bulBlankBefFired = getFiredRules(bulBlankBefRes.t || []);
if (!bulBlankBefFired.has("list-blank-line-spacing") || bulBlankBefFired.size !== 1) {
    assert(false, "bul blank bef err: expected list-blank-line-spacing only, got " + [...bulBlankBefFired].join(", "));
} else {
    const bulBefDet = (bulBlankBefRes.t || []).find(v => v.errorDetail === details.listBlankBef);
    if (!bulBefDet || bulBefDet.lineNumber !== 2) {
        assert(false, `bul blank bef detail: expected listBlankBef on line 2 got ${bulBefDet?.lineNumber || "none"}`);
    } else {
        console.log("OK   bulleted blank bef → listBlankBef on line 2");
    }
}

const numProseBlankBefErr = `## T

Текст:
1. пункт;
`;
const numProseBlankBefRes = lintStrings({ t: numProseBlankBefErr }, ["list-blank-line-spacing", "minimum-h2-heading"]);
const numProseBlankBefFired = getFiredRules(numProseBlankBefRes.t || []);
if (!numProseBlankBefFired.has("list-blank-line-spacing") || numProseBlankBefFired.size !== 1) {
    assert(false, "num prose blank bef err: expected list-blank-line-spacing only, got " + [...numProseBlankBefFired].join(", "));
} else {
    const numProseBefDet = (numProseBlankBefRes.t || []).find(v => v.errorDetail === details.listBlankBef);
    if (!numProseBefDet || numProseBefDet.lineNumber !== 4) {
        assert(false, `num prose blank bef detail: expected listBlankBef on line 4 got ${numProseBefDet?.lineNumber || "none"}`);
    } else {
        console.log("OK   num prose blank bef → listBlankBef on line 4");
    }
}

const numThenBulNoBlankErr = `## T

1. num;
- bul;
`;
const numThenBulRes = lintStrings({ t: numThenBulNoBlankErr }, ["list-blank-line-spacing", "minimum-h2-heading"]);
const numThenBulFired = getFiredRules(numThenBulRes.t || []);
if (!numThenBulFired.has("list-blank-line-spacing") || numThenBulFired.size !== 1) {
    assert(false, "num then bul no blank: expected list-blank-line-spacing only, got " + [...numThenBulFired].join(", "));
} else {
    const boundLines = (numThenBulRes.t || [])
        .filter(v => v.ruleNames.includes("list-blank-line-spacing"))
        .map(v => v.lineNumber)
        .sort((a, b) => a - b);
    if (boundLines.join() !== "4,4") {
        assert(false, `num then bul bound lines: expected 4,4 got ${boundLines.join() || "none"}`);
    } else {
        console.log("OK   num then bul no blank → bounds on lines 4,4");
    }
}

const numBlankAftErr = `## T

1. один;
2. два;
Текст после.
`;
const numBlankAftRes = lintStrings({ t: numBlankAftErr }, ["list-blank-line-spacing", "minimum-h2-heading", "sentences-end-with-mark"]);
const numBlankAftViol = numBlankAftRes.t || [];
const numBlankAftFired = getFiredRules(numBlankAftViol);
if (!numBlankAftFired.has("list-blank-line-spacing") || numBlankAftFired.size !== 1) {
    assert(false, "num blank aft err: expected list-blank-line-spacing only, got " + [...numBlankAftFired].join(", "));
} else {
    const numAftDet = numBlankAftViol.find(v => v.errorDetail === details.listBlankAft);
    if (!numAftDet || numAftDet.lineNumber !== 5) {
        assert(false, `num blank aft detail: expected listBlankAft on line 5 got ${numAftDet?.lineNumber || "none"}`);
    } else {
        console.log("OK   num blank aft → listBlankAft on line 5");
    }
}

const numThenNumSameBlockOk = `## T

1. a;

2. b;
`;
const numSameBlockRes = lintStrings({ t: numThenNumSameBlockOk }, ["list-blank-line-spacing", "minimum-h2-heading"]);
if (getFiredRules(numSameBlockRes.t || []).size > 0) {
    assert(false, "num same block with internal blank: " + [...getFiredRules(numSameBlockRes.t || [])].join(", "));
} else {
    console.log("OK   num same block internal blank → clean");
}

const numTightOk = `## T

1. a;
2. b;
3. c;
`;
const numTightRes = lintStrings({ t: numTightOk }, ["list-blank-line-spacing", "minimum-h2-heading"]);
if (getFiredRules(numTightRes.t || []).size > 0) {
    assert(false, "num tight ok: " + [...getFiredRules(numTightRes.t || [])].join(", "));
} else {
    console.log("OK   num tight no blanks → clean");
}
