const { examplesDir, getViolations, lintStrings, getFiredRules, assert, getFailed } = require("../helpers.cjs");
const path = require("path");

const errPath = path.join(examplesDir, "sentences-end-with-mark", "_err.md");
const errViols = getViolations(errPath).filter(v => v.ruleNames.includes("sentences-end-with-mark"));
if (errViols.length !== 3) {
    assert(false, `sentences-end-with-mark/_err.md: expected 3 violations, got ${errViols.length}`);
}
if (getFailed() === 0) {
    console.log("OK   multi-violation example count (sentences-end-with-mark)");
}

const sentencesSkipOk = `## T

- пункт;

Текст с точкой.
`;
const sentencesSkipOkRes = lintStrings({ t: sentencesSkipOk }, ["sentences-end-with-mark", "minimum-h2-heading", "list-items-end-with-semicolon-or-colon", "list-blank-line-spacing", "list-preceded-by-colon"]);
if (getFiredRules(sentencesSkipOkRes.t || []).size > 0) {
    assert(false, "sentences skip heading/list: " + [...getFiredRules(sentencesSkipOkRes.t || [])].join(", "));
} else {
    console.log("OK   sentences skip heading/list → clean");
}

const sentencesErr = `## T

Текст без знака
`;
const sentencesErrRes = lintStrings({ t: sentencesErr }, ["sentences-end-with-mark", "minimum-h2-heading"]);
const sentencesErrFired = getFiredRules(sentencesErrRes.t || []);
if (!sentencesErrFired.has("sentences-end-with-mark") || sentencesErrFired.size !== 1) {
    assert(false, "sentence without mark err: expected sentences-end-with-mark only, got " + [...sentencesErrFired].join(", "));
} else {
    console.log("OK   sentence without mark → sentences-end-with-mark");
}

const sentencesMultiErr = `## T

Текст без знака

Вторая без знака

Третья без знака
`;
const sentencesMultiErrRes = lintStrings({ t: sentencesMultiErr }, ["sentences-end-with-mark", "minimum-h2-heading"]);
const sentencesMultiViol = sentencesMultiErrRes.t || [];
const sentencesMultiFired = getFiredRules(sentencesMultiViol);
if (!sentencesMultiFired.has("sentences-end-with-mark") || sentencesMultiFired.size !== 1) {
    assert(false, "sentences multi err: expected sentences-end-with-mark only, got " + [...sentencesMultiFired].join(", "));
} else {
    const multiLines = sentencesMultiViol.map(v => v.lineNumber).sort((a, b) => a - b);
    if (multiLines.join() !== "3,5,7") {
        assert(false, `sentences multi err lines: expected 3,5,7 got ${multiLines.join() || "none"}`);
    } else {
        console.log("OK   sentences multi err → lines 3,5,7");
    }
}

const sentencesMarksOk = `## T

Восклицание!
Вопрос?
Двоеточие:
Точка с запятой;
`;
const sentencesMarksOkRes = lintStrings({ t: sentencesMarksOk }, ["sentences-end-with-mark", "minimum-h2-heading"]);
if (getFiredRules(sentencesMarksOkRes.t || []).size > 0) {
    assert(false, "sentences marks ok: " + [...getFiredRules(sentencesMarksOkRes.t || [])].join(", "));
} else {
    console.log("OK   sentences marks ! ? : ; → clean");
}

const sentencesSkipQuoteHrOk = `## T

> цитата без знака
продолжение без маркера

---

***

___
`;
const sentencesSkipQuoteHrRes = lintStrings({ t: sentencesSkipQuoteHrOk }, ["sentences-end-with-mark", "minimum-h2-heading"]);
if (getFiredRules(sentencesSkipQuoteHrRes.t || []).size > 0) {
    assert(false, "sentences skip quote/hr: " + [...getFiredRules(sentencesSkipQuoteHrRes.t || [])].join(", "));
} else {
    console.log("OK   sentences skip blockquote/HR → clean");
}

const sentencesQuoteBlankProseErr = `## T

> цитата.

Текст без маркера
`;
const sentencesQuoteBlankProseErrRes = lintStrings({ t: sentencesQuoteBlankProseErr }, ["sentences-end-with-mark", "minimum-h2-heading"]);
const sentencesQuoteBlankProseFired = getFiredRules(sentencesQuoteBlankProseErrRes.t || []);
if (!sentencesQuoteBlankProseFired.has("sentences-end-with-mark") || sentencesQuoteBlankProseFired.size !== 1) {
    assert(false, "quote blank prose err: expected sentences-end-with-mark only, got " + [...sentencesQuoteBlankProseFired].join(", "));
} else {
    console.log("OK   blockquote + blank + prose without mark → sentences-end-with-mark");
}

const sentencesInCodeOk = `## T

Текст с точкой.

\`\`\`js
текст без знака
\`\`\`
`;
const sentencesInCodeOkRes = lintStrings({ t: sentencesInCodeOk }, ["sentences-end-with-mark", "minimum-h2-heading"]);
if (getFiredRules(sentencesInCodeOkRes.t || []).size > 0) {
    assert(false, "sentences in code fence: " + [...getFiredRules(sentencesInCodeOkRes.t || [])].join(", "));
} else {
    console.log("OK   sentences skip code fence body → clean");
}

const sentencesSkipTableOk = `## T

| Col | Val |
| --- | --- |
| a | b |

Текст с точкой.
`;
const sentencesSkipTableOkRes = lintStrings({ t: sentencesSkipTableOk }, ["sentences-end-with-mark", "minimum-h2-heading"]);
if (getFiredRules(sentencesSkipTableOkRes.t || []).size > 0) {
    assert(false, "sentences skip table: " + [...getFiredRules(sentencesSkipTableOkRes.t || [])].join(", "));
} else {
    console.log("OK   sentences skip pipe table → clean");
}

const sentencesSkipTableIndentedOk = `## T

  | a | b |

Текст с точкой.
`;
const sentencesSkipTableIndentedRes = lintStrings({ t: sentencesSkipTableIndentedOk }, ["sentences-end-with-mark", "minimum-h2-heading"]);
if (getFiredRules(sentencesSkipTableIndentedRes.t || []).size > 0) {
    assert(false, "sentences skip indented table: " + [...getFiredRules(sentencesSkipTableIndentedRes.t || [])].join(", "));
} else {
    console.log("OK   sentences skip indented pipe table → clean");
}

const sentencesTableProseErr = `## T

| Col | Val |
| --- | --- |
| a | b |

Текст без знака
`;
const sentencesTableProseErrRes = lintStrings({ t: sentencesTableProseErr }, ["sentences-end-with-mark", "minimum-h2-heading"]);
const sentencesTableProseFired = getFiredRules(sentencesTableProseErrRes.t || []);
if (!sentencesTableProseFired.has("sentences-end-with-mark") || sentencesTableProseFired.size !== 1) {
    assert(false, "sentences table prose err: expected sentences-end-with-mark only, got " + [...sentencesTableProseFired].join(", "));
} else {
    console.log("OK   sentences table + prose without mark → sentences-end-with-mark");
}
