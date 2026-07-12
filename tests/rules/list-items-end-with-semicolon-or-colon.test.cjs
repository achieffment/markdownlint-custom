const { examplesDir, getViolations, getFiredRules, lintStrings, ruleNames, assert, getFailed } = require("../helpers.cjs");
const { details } = require("../../details.js");
const path = require("path");

const listItemsErrPath = path.join(examplesDir, "list-items-end-with-semicolon-or-colon", "_err.md");
const listItemsViol = getViolations(listItemsErrPath);
const itemsDets = [details.listItemsEmpty, details.listItemsColon, details.listItemsSemi];
const foundItemsDets = new Set(listItemsViol.map(v => v.errorDetail));
itemsDets.forEach(det => {
    if (!foundItemsDets.has(det)) {
        assert(false, `list-items-end-with-semicolon-or-colon/_err.md missing sub-detail: ${det}`);
    }
});
if (getFailed() === 0) {
    console.log("OK   list-items-end-with-semicolon-or-colon/_err sub-details");
}

const deepOk = `## T

1. корень:

   1. второй:

      1. третий:

         1. четвёртый:

            1. пятый;
`;
const deepOkRes = lintStrings({ deep: deepOk }, ruleNames);
if (getFiredRules(deepOkRes.deep || []).size > 0) {
    assert(false, "deep nesting valid md: " + [...getFiredRules(deepOkRes.deep || [])].join(", "));
} else {
    console.log("OK   deep nesting (5 levels) → clean");
}

const deepErr = `## T

1. корень;

   1. без точки с запятой

      1. тоже без

         1. и глубже без
`;
const emptyItemErr = `## T

- 
`;
const emptyItemRes = lintStrings({ t: emptyItemErr }, ["list-items-end-with-semicolon-or-colon", "minimum-h2-heading"]);
const emptyItemViol = emptyItemRes.t || [];
const emptyItemFired = getFiredRules(emptyItemViol);
if (!emptyItemFired.has("list-items-end-with-semicolon-or-colon") || emptyItemFired.size !== 1) {
    assert(false, "empty list item: expected list-items-end-with-semicolon-or-colon only, got " + [...emptyItemFired].join(", "));
} else {
    const emptyDetail = emptyItemViol[0]?.errorDetail;
    if (emptyDetail !== details.listItemsEmpty) {
        assert(false, `empty list item detail: expected "${details.listItemsEmpty}" got "${emptyDetail || "none"}"`);
    } else {
        console.log("OK   empty list item → list-items-end-with-semicolon-or-colon");
    }
}

const deepErrRes = lintStrings({ deep: deepErr }, ["list-items-end-with-semicolon-or-colon", "minimum-h2-heading"]);
const deepErrViol = deepErrRes.deep || [];
const deepErrFired = getFiredRules(deepErrViol);
const deepErrLines = deepErrViol.map(v => v.lineNumber).sort((a, b) => a - b);
if (!deepErrFired.has("list-items-end-with-semicolon-or-colon") || deepErrFired.size !== 1) {
    assert(false, "deep nesting err: expected list-items-end-with-semicolon-or-colon only, got " + [...deepErrFired].join(", "));
} else if (deepErrLines.join() !== "3,5,7,9") {
    assert(false, `deep nesting err lines: expected 3,5,7,9 got ${deepErrLines.join() || "none"}`);
} else {
    console.log("OK   deep nesting err → list-items on lines 3,5,7,9");
}

const colonSubOk = `## T

8. Настроил папкам и файлам права:
   - \`find /home/bitrix/www/ -type d -exec chmod 755 {} +\` - первый;
   - \`find /home/bitrix/www/ -type f -exec chmod 644 {} +\` - второй;
`;
const colonSubOkRes = lintStrings({ t: colonSubOk }, ["list-items-end-with-semicolon-or-colon", "minimum-h2-heading"]);
if (getFiredRules(colonSubOkRes.t || []).size > 0) {
    assert(false, "colon before nested sublist: " + [...getFiredRules(colonSubOkRes.t || [])].join(", "));
} else {
    console.log("OK   colon before nested sublist → clean");
}

const colonSiblingErr = `## T

1. первый:
2. второй;
`;
const colonSiblingErrRes = lintStrings({ t: colonSiblingErr }, ["list-items-end-with-semicolon-or-colon", "minimum-h2-heading"]);
const colonSiblingFired = getFiredRules(colonSiblingErrRes.t || []);
if (!colonSiblingFired.has("list-items-end-with-semicolon-or-colon") || colonSiblingFired.size !== 1) {
    assert(false, "colon sibling err: expected list-items-end-with-semicolon-or-colon only, got " + [...colonSiblingFired].join(", "));
} else {
    const colonSiblingDet = (colonSiblingErrRes.t || [])[0]?.errorDetail;
    if (colonSiblingDet !== details.listItemsSemi) {
        assert(false, `colon sibling detail: expected listItemsSemi got "${colonSiblingDet || "none"}"`);
    } else {
        console.log("OK   colon before sibling → list-items-end-with-semicolon-or-colon");
    }
}

const semiChildErr = `## T

1. root;

   1. child;
`;
const semiChildErrRes = lintStrings({ t: semiChildErr }, ["list-items-end-with-semicolon-or-colon", "minimum-h2-heading"]);
const semiChildViol = semiChildErrRes.t || [];
const semiChildFired = getFiredRules(semiChildViol);
const semiChildLines = semiChildViol.map(v => v.lineNumber).sort((a, b) => a - b);
if (!semiChildFired.has("list-items-end-with-semicolon-or-colon") || semiChildFired.size !== 1) {
    assert(false, "semicolon before child err: expected list-items-end-with-semicolon-or-colon only, got " + [...semiChildFired].join(", "));
} else if (semiChildLines.join() !== "3") {
    assert(false, `semicolon before child err lines: expected 3 got ${semiChildLines.join() || "none"}`);
} else {
    const semiChildDet = semiChildViol[0]?.errorDetail;
    if (semiChildDet !== details.listItemsColon) {
        assert(false, `semicolon before child detail: expected listItemsColon got "${semiChildDet || "none"}"`);
    } else {
        console.log("OK   semicolon before child → list-items on line 3");
    }
}

const semiBulChildErr = `## T

- root;

   - child;
`;
const semiBulChildErrRes = lintStrings({ t: semiBulChildErr }, ["list-items-end-with-semicolon-or-colon", "minimum-h2-heading"]);
const semiBulChildViol = semiBulChildErrRes.t || [];
const semiBulChildFired = getFiredRules(semiBulChildViol);
const semiBulChildLines = semiBulChildViol.map(v => v.lineNumber).sort((a, b) => a - b);
if (!semiBulChildFired.has("list-items-end-with-semicolon-or-colon") || semiBulChildFired.size !== 1) {
    assert(false, "semicolon before bul child err: expected list-items-end-with-semicolon-or-colon only, got " + [...semiBulChildFired].join(", "));
} else if (semiBulChildLines.join() !== "3") {
    assert(false, `semicolon before bul child err lines: expected 3 got ${semiBulChildLines.join() || "none"}`);
} else {
    const semiBulChildDet = semiBulChildViol[0]?.errorDetail;
    if (semiBulChildDet !== details.listItemsColon) {
        assert(false, `semicolon before bul child detail: expected listItemsColon got "${semiBulChildDet || "none"}"`);
    } else {
        console.log("OK   semicolon before bul child → listItemsColon on line 3");
    }
}

const codFenceSemiErr = `## T

- перед кодом;

\`\`\`js
const x = 1;
\`\`\`
`;
const codFenceSemiErrRes = lintStrings({ t: codFenceSemiErr }, ["list-items-end-with-semicolon-or-colon", "minimum-h2-heading"]);
const codFenceSemiViol = codFenceSemiErrRes.t || [];
const codFenceSemiFired = getFiredRules(codFenceSemiViol);
if (!codFenceSemiFired.has("list-items-end-with-semicolon-or-colon") || codFenceSemiFired.size !== 1) {
    assert(false, "semicolon before code fence err: expected list-items-end-with-semicolon-or-colon only, got " + [...codFenceSemiFired].join(", "));
} else {
    const codFenceSemiDet = codFenceSemiViol[0]?.errorDetail;
    if (codFenceSemiDet !== details.listItemsColon) {
        assert(false, `semicolon before code fence detail: expected listItemsColon got "${codFenceSemiDet || "none"}"`);
    } else {
        console.log("OK   semicolon before code fence → listItemsColon");
    }
}

const wrapFenceOk = `## T

1. пункт без двоеточия
   продолжение с двоеточием:

\`\`\`js
const x = 1;
\`\`\`
`;
const wrapFenceOkRes = lintStrings({ t: wrapFenceOk }, ["list-items-end-with-semicolon-or-colon", "minimum-h2-heading"]);
if (getFiredRules(wrapFenceOkRes.t || []).size > 0) {
    assert(false, "wrapped prose before fence ok: " + [...getFiredRules(wrapFenceOkRes.t || [])].join(", "));
} else {
    console.log("OK   wrapped prose colon before fence → clean");
}

const wrapChildOk = `## T

1. parent
   intro text:

   1. child;
`;
const wrapChildOkRes = lintStrings({ t: wrapChildOk }, ["list-items-end-with-semicolon-or-colon", "minimum-h2-heading"]);
if (getFiredRules(wrapChildOkRes.t || []).size > 0) {
    assert(false, "wrapped prose before child ok: " + [...getFiredRules(wrapChildOkRes.t || [])].join(", "));
} else {
    console.log("OK   wrapped prose colon before child → clean");
}

const wrapFenceErr = `## T

1. пункт без двоеточия
   продолжение без двоеточия

\`\`\`js
const x = 1;
\`\`\`
`;
const wrapFenceErrRes = lintStrings({ t: wrapFenceErr }, ["list-items-end-with-semicolon-or-colon", "minimum-h2-heading"]);
const wrapFenceErrViol = wrapFenceErrRes.t || [];
const wrapFenceErrFired = getFiredRules(wrapFenceErrViol);
if (!wrapFenceErrFired.has("list-items-end-with-semicolon-or-colon") || wrapFenceErrFired.size !== 1) {
    assert(false, "wrapped prose fence err: expected list-items only, got " + [...wrapFenceErrFired].join(", "));
} else {
    const wrapFenceLine = wrapFenceErrViol[0]?.lineNumber;
    const wrapFenceDet = wrapFenceErrViol[0]?.errorDetail;
    if (wrapFenceLine !== 4) {
        assert(false, `wrapped prose fence err line: expected 4 got ${wrapFenceLine ?? "none"}`);
    } else if (wrapFenceDet !== details.listItemsColon) {
        assert(false, `wrapped prose fence err detail: expected listItemsColon got "${wrapFenceDet || "none"}"`);
    } else {
        console.log("OK   wrapped prose before fence → listItemsColon on line 4");
    }
}

const starBulSemiErr = `## T

* пункт без точки с запятой
`;
const starBulSemiErrRes = lintStrings({ t: starBulSemiErr }, ["list-items-end-with-semicolon-or-colon", "minimum-h2-heading"]);
const starBulSemiFired = getFiredRules(starBulSemiErrRes.t || []);
if (!starBulSemiFired.has("list-items-end-with-semicolon-or-colon") || starBulSemiFired.size !== 1) {
    assert(false, "star bullet semi err: expected list-items-end-with-semicolon-or-colon only, got " + [...starBulSemiFired].join(", "));
} else {
    const starBulSemiDet = (starBulSemiErrRes.t || [])[0]?.errorDetail;
    if (starBulSemiDet !== details.listItemsSemi) {
        assert(false, `star bullet semi detail: expected listItemsSemi got "${starBulSemiDet || "none"}"`);
    } else {
        console.log("OK   star bullet without semicolon → listItemsSemi");
    }
}

const plusBulSemiErr = `## T

+ пункт без точки с запятой
`;
const plusBulSemiErrRes = lintStrings({ t: plusBulSemiErr }, ["list-items-end-with-semicolon-or-colon", "minimum-h2-heading"]);
const plusBulSemiFired = getFiredRules(plusBulSemiErrRes.t || []);
if (!plusBulSemiFired.has("list-items-end-with-semicolon-or-colon") || plusBulSemiFired.size !== 1) {
    assert(false, "plus bullet semi err: expected list-items-end-with-semicolon-or-colon only, got " + [...plusBulSemiFired].join(", "));
} else {
    const plusBulSemiDet = (plusBulSemiErrRes.t || [])[0]?.errorDetail;
    if (plusBulSemiDet !== details.listItemsSemi) {
        assert(false, `plus bullet semi detail: expected listItemsSemi got "${plusBulSemiDet || "none"}"`);
    } else {
        console.log("OK   plus bullet without semicolon → listItemsSemi");
    }
}

const nestedNumSiblingOk = `## T

1. root:
   1. first;
   1. second;
`;
const nestedNumSiblingOkRes = lintStrings({ t: nestedNumSiblingOk }, ["list-items-end-with-semicolon-or-colon", "minimum-h2-heading"]);
if (getFiredRules(nestedNumSiblingOkRes.t || []).size > 0) {
    assert(false, "nested num sibling ok: " + [...getFiredRules(nestedNumSiblingOkRes.t || [])].join(", "));
} else {
    console.log("OK   nested num sibling → clean");
}

const orphanNumOk = `## T

1. first;
2. not child of one;
`;
const orphanNumOkRes = lintStrings({ t: orphanNumOk }, ["list-items-end-with-semicolon-or-colon", "minimum-h2-heading"]);
if (getFiredRules(orphanNumOkRes.t || []).size > 0) {
    assert(false, "orphan num ok: " + [...getFiredRules(orphanNumOkRes.t || [])].join(", "));
} else {
    console.log("OK   orphan num not child → clean");
}

const emptyNumErr = `## T

1.  
`;
const emptyNumRes = lintStrings({ t: emptyNumErr }, ["list-items-end-with-semicolon-or-colon", "minimum-h2-heading"]);
const emptyNumFired = getFiredRules(emptyNumRes.t || []);
if (!emptyNumFired.has("list-items-end-with-semicolon-or-colon") || emptyNumFired.size !== 1) {
    assert(false, "empty numbered item: expected list-items-end-with-semicolon-or-colon only, got " + [...emptyNumFired].join(", "));
} else {
    const emptyNumDet = (emptyNumRes.t || [])[0]?.errorDetail;
    if (emptyNumDet !== details.listItemsEmpty) {
        assert(false, `empty numbered item detail: expected listItemsEmpty got ${emptyNumDet || "none"}`);
    } else {
        console.log("OK   empty numbered list item → list-items-end-with-semicolon-or-colon");
    }
}
