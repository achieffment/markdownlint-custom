const { examplesDir, getViolations, lintStrings, ruleNames, getFiredRules, assert, getFailed } = require("../helpers.cjs");
const path = require("path");

const errPath = path.join(examplesDir, "no-leading-spaces", "_err.md");
const errViols = getViolations(errPath).filter(v => v.ruleNames.includes("no-leading-spaces"));
if (errViols.length !== 4) {
    assert(false, `no-leading-spaces/_err.md: expected 4 violations, got ${errViols.length}`);
}
if (getFailed() === 0) {
    console.log("OK   multi-violation example count (no-leading-spaces)");
}

const noLeadingNestedOk = `## T

1. родитель:

   1. вложенный;
`;
const noLeadingNestedOkRes = lintStrings({ t: noLeadingNestedOk }, ["no-leading-spaces", "minimum-h2-heading", "list-items-end-with-semicolon-or-colon", "list-blank-line-spacing"]);
if (getFiredRules(noLeadingNestedOkRes.t || []).size > 0) {
    assert(false, "nested list indent ok: " + [...getFiredRules(noLeadingNestedOkRes.t || [])].join(", "));
} else {
    console.log("OK   nested list indent → clean");
}

const noLeadingDedentErr = `## T

1. parent:
   1. ok;
 1. bad;
`;
const noLeadingDedentErrRes = lintStrings({ t: noLeadingDedentErr }, ["no-leading-spaces", "minimum-h2-heading", "list-items-end-with-semicolon-or-colon", "list-blank-line-spacing"]);
const noLeadingDedntViol = noLeadingDedentErrRes.t || [];
const noLeadingDedntFired = getFiredRules(noLeadingDedntViol);
if (!noLeadingDedntFired.has("no-leading-spaces") || noLeadingDedntFired.size !== 1) {
    assert(false, "list dedent err: expected no-leading-spaces only, got " + [...noLeadingDedntFired].join(", "));
} else {
    const dedntLine = noLeadingDedntViol.find(v => v.ruleNames.includes("no-leading-spaces"))?.lineNumber;
    if (dedntLine !== 5) {
        assert(false, `list dedent err line: expected 5 got ${dedntLine ?? "none"}`);
    } else {
        console.log("OK   list dedent → no-leading-spaces on line 5");
    }
}

const noLeadingBulSiblingsOk = `## T

- parent:

  - key;

  - paths;
`;
const noLeadingBulSiblingsOkRes = lintStrings({ t: noLeadingBulSiblingsOk }, ["no-leading-spaces", "minimum-h2-heading", "list-items-end-with-semicolon-or-colon", "list-blank-line-spacing"]);
if (getFiredRules(noLeadingBulSiblingsOkRes.t || []).size > 0) {
    assert(false, "nested bullet siblings ok: " + [...getFiredRules(noLeadingBulSiblingsOkRes.t || [])].join(", "));
} else {
    console.log("OK   nested bullet siblings → clean");
}

const noLeadingFenceNestedOk = `## T

1. parent:

\`\`\`js
code
\`\`\`

   1. child;
`;
const noLeadingFenceNestedOkRes = lintStrings({ t: noLeadingFenceNestedOk }, ["no-leading-spaces", "minimum-h2-heading", "list-items-end-with-semicolon-or-colon", "list-blank-line-spacing", "codeblock-preceded-by-colon"]);
if (getFiredRules(noLeadingFenceNestedOkRes.t || []).size > 0) {
    assert(false, "fence then nested list ok: " + [...getFiredRules(noLeadingFenceNestedOkRes.t || [])].join(", "));
} else {
    console.log("OK   fence then nested list → clean");
}

const noLeadingTopErr = `## T

  текст с отступом;
`;
const noLeadingTopErrRes = lintStrings({ t: noLeadingTopErr }, ["no-leading-spaces", "minimum-h2-heading", "sentences-end-with-mark"]);
const noLeadingTopErrFired = getFiredRules(noLeadingTopErrRes.t || []);
if (!noLeadingTopErrFired.has("no-leading-spaces") || noLeadingTopErrFired.size !== 1) {
    assert(false, "top-level indent err: expected no-leading-spaces only, got " + [...noLeadingTopErrFired].join(", "));
} else {
    console.log("OK   top-level indent → no-leading-spaces");
}

const noLeadingListIndentErr = `## T

  - пункт;
`;
const noLeadingListIndentErrRes = lintStrings({ t: noLeadingListIndentErr }, ["no-leading-spaces", "minimum-h2-heading", "list-items-end-with-semicolon-or-colon"]);
const noLeadingListIndentFired = getFiredRules(noLeadingListIndentErrRes.t || []);
if (!noLeadingListIndentFired.has("no-leading-spaces") || noLeadingListIndentFired.size !== 1) {
    assert(false, "top-level list indent err: expected no-leading-spaces only, got " + [...noLeadingListIndentFired].join(", "));
} else {
    const listIndentLine = (noLeadingListIndentErrRes.t || []).find(v => v.ruleNames.includes("no-leading-spaces"))?.lineNumber;
    if (listIndentLine !== 3) {
        assert(false, `top-level list indent err line: expected 3 got ${listIndentLine ?? "none"}`);
    } else {
        console.log("OK   top-level list indent → no-leading-spaces on line 3");
    }
}

const noLeadingSkipHeadingOk = ` ## T

Текст с точкой.
`;
const noLeadingSkipHeadingRes = lintStrings({ t: noLeadingSkipHeadingOk }, ["no-leading-spaces", "minimum-h2-heading", "sentences-end-with-mark"]);
if (getFiredRules(noLeadingSkipHeadingRes.t || []).has("no-leading-spaces")) {
    assert(false, "skip heading: expected clean no-leading-spaces, got " + [...getFiredRules(noLeadingSkipHeadingRes.t || [])].join(", "));
} else {
    console.log("OK   no-leading-spaces skip heading → clean");
}

const noLeadingFirstIndentedErr = `## T

   1. первый без родителя;
`;
const noLeadingFirstIndentedRes = lintStrings({ t: noLeadingFirstIndentedErr }, ["no-leading-spaces", "minimum-h2-heading", "list-items-end-with-semicolon-or-colon"]);
const noLeadingFirstIndentedFired = getFiredRules(noLeadingFirstIndentedRes.t || []);
if (!noLeadingFirstIndentedFired.has("no-leading-spaces") || noLeadingFirstIndentedFired.size !== 1) {
    assert(false, "first indented list item err: expected no-leading-spaces only, got " + [...noLeadingFirstIndentedFired].join(", "));
} else {
    console.log("OK   first indented list item → no-leading-spaces");
}

const noLeadingFenceIndentErr = `## T

Строка перед кодом:

    \`\`\`js
    const x = 1;
    \`\`\`
`;
const noLeadingFenceIndentErrRes = lintStrings({ t: noLeadingFenceIndentErr }, ruleNames);
const noLeadingFenceIndentErrFired = getFiredRules(noLeadingFenceIndentErrRes.t || []);
if (!noLeadingFenceIndentErrFired.has("no-leading-spaces") || noLeadingFenceIndentErrFired.size !== 1) {
    assert(false, "indented fence err: expected no-leading-spaces only, got " + [...noLeadingFenceIndentErrFired].join(", "));
} else {
    console.log("OK   indented fence → no-leading-spaces");
}

const noLeadingClosingFenceIndentErr = `## T

Строка перед кодом:

\`\`\`js
const x = 1;
    \`\`\`
`;
const noLeadingClosingFenceIndentErrRes = lintStrings({ t: noLeadingClosingFenceIndentErr }, ruleNames);
const noLeadingClosingFenceIndentErrFired = getFiredRules(noLeadingClosingFenceIndentErrRes.t || []);
if (!noLeadingClosingFenceIndentErrFired.has("no-leading-spaces") || noLeadingClosingFenceIndentErrFired.size !== 1) {
    assert(false, "indented closing fence err: expected no-leading-spaces only, got " + [...noLeadingClosingFenceIndentErrFired].join(", "));
} else {
    console.log("OK   indented closing fence → no-leading-spaces");
}

const noLeadingFenceIndentOk = `## T

Строка перед кодом:

\`\`\`js
    const x = 1;
\`\`\`
`;
const noLeadingFenceIndentOkRes = lintStrings({ t: noLeadingFenceIndentOk }, ruleNames);
if (getFiredRules(noLeadingFenceIndentOkRes.t || []).size > 0) {
    assert(false, "indented code inside fence ok: " + [...getFiredRules(noLeadingFenceIndentOkRes.t || [])].join(", "));
} else {
    console.log("OK   indented code inside fence → clean");
}
