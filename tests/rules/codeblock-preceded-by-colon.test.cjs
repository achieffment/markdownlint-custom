const { examplesDir, getViolations, getFiredRules, lintStrings, assert, getFailed } = require("../helpers.cjs");
const { details } = require("../../details.js");
const path = require("path");

const errPath = path.join(examplesDir, "codeblock-preceded-by-colon", "_err.md");
const errViols = getViolations(errPath).filter(v => v.ruleNames.includes("codeblock-preceded-by-colon"));
if (errViols.length !== 2) {
    assert(false, `codeblock-preceded-by-colon/_err.md: expected 2 violations, got ${errViols.length}`);
}
if (getFailed() === 0) {
    console.log("OK   multi-violation example count (codeblock-preceded-by-colon)");
}

const lstCod = `## T

- пункт перед кодом:

\`\`\`js
const x = 1;
\`\`\`
`;
const lstCodRes = lintStrings({ t: lstCod }, ["codeblock-preceded-by-colon", "minimum-h2-heading"]);
const lstCodFired = getFiredRules(lstCodRes.t || []);
if (lstCodFired.size > 0) {
    assert(false, "list item before code must not trigger codeblock rule: " + [...lstCodFired].join(", "));
} else {
    console.log("OK   codeblock skips list items before code");
}

const lstSemiCod = `## T

- пункт;

\`\`\`js
const x = 1;
\`\`\`
`;
const lstSemiCodRes = lintStrings({ t: lstSemiCod }, ["codeblock-preceded-by-colon", "minimum-h2-heading"]);
if (getFiredRules(lstSemiCodRes.t || []).size > 0) {
    assert(false, "list item with ; before code must not trigger codeblock rule: " + [...getFiredRules(lstSemiCodRes.t || [])].join(", "));
} else {
    console.log("OK   codeblock skips list item with ; before code");
}

const codblkSkipHeadingOk = `## T

## Заголовок

\`\`\`js
const x = 1;
\`\`\`
`;
const codblkSkipHeadingRes = lintStrings({ t: codblkSkipHeadingOk }, ["codeblock-preceded-by-colon", "minimum-h2-heading"]);
if (getFiredRules(codblkSkipHeadingRes.t || []).size > 0) {
    assert(false, "codeblock skip heading: " + [...getFiredRules(codblkSkipHeadingRes.t || [])].join(", "));
} else {
    console.log("OK   codeblock skip heading before fence → clean");
}

const codblkColonThroughBlankOk = `## T

Ввод:


\`\`\`js
const x = 1;
\`\`\`
`;
const codblkColonThroughBlankRes = lintStrings({ t: codblkColonThroughBlankOk }, ["codeblock-preceded-by-colon", "minimum-h2-heading"]);
if (getFiredRules(codblkColonThroughBlankRes.t || []).size > 0) {
    assert(false, "codeblock colon through blank: " + [...getFiredRules(codblkColonThroughBlankRes.t || [])].join(", "));
} else {
    console.log("OK   codeblock colon through blank lines → clean");
}

const codblkSkipAdjacentFenceOk = `## T

\`\`\`js
const a = 1;
\`\`\`

\`\`\`js
const b = 2;
\`\`\`
`;
const codblkSkipAdjacentFenceRes = lintStrings({ t: codblkSkipAdjacentFenceOk }, ["codeblock-preceded-by-colon", "minimum-h2-heading"]);
if (getFiredRules(codblkSkipAdjacentFenceRes.t || []).size > 0) {
    assert(false, "codeblock skip adjacent fence: " + [...getFiredRules(codblkSkipAdjacentFenceRes.t || [])].join(", "));
} else {
    console.log("OK   codeblock skip prev closing fence → clean");
}

const bareCodErr = `## T

Текст перед кодом.

\`\`\`
const x = 1;
\`\`\`
`;
const bareCodRes = lintStrings({ t: bareCodErr }, ["codeblock-preceded-by-colon", "minimum-h2-heading"]);
const bareCodFired = getFiredRules(bareCodRes.t || []);
if (!bareCodFired.has("codeblock-preceded-by-colon") || bareCodFired.size !== 1) {
    assert(false, "bare fence err: expected codeblock-preceded-by-colon only, got " + [...bareCodFired].join(", "));
} else {
    console.log("OK   bare fence without lang → codeblock-preceded-by-colon");
}
const bareCodViol = (bareCodRes.t || [])
    .find(v => v.ruleNames.includes("codeblock-preceded-by-colon"));
const bareCodLine = bareCodViol?.lineNumber;
if (bareCodLine !== 3) {
    assert(false, `bare fence err line: expected 3 got ${bareCodLine ?? "none"}`);
} else if (bareCodViol?.errorDetail !== details.codeblockColon) {
    assert(false, `bare fence err detail: expected codeblockColon got ${bareCodViol?.errorDetail ?? "none"}`);
} else if (getFailed() === 0) {
    console.log("OK   bare fence err lineNumber on prose");
}

const jsCodErr = `## T

Текст перед кодом.

\`\`\`js
const x = 1;
\`\`\`
`;
const jsCodRes = lintStrings({ t: jsCodErr }, ["codeblock-preceded-by-colon", "minimum-h2-heading"]);
const jsCodFired = getFiredRules(jsCodRes.t || []);
if (!jsCodFired.has("codeblock-preceded-by-colon") || jsCodFired.size !== 1) {
    assert(false, "js fence err: expected codeblock-preceded-by-colon only, got " + [...jsCodFired].join(", "));
} else {
    console.log("OK   js fence without colon → codeblock-preceded-by-colon");
}
const jsCodViol = (jsCodRes.t || [])
    .find(v => v.ruleNames.includes("codeblock-preceded-by-colon"));
const jsCodLine = jsCodViol?.lineNumber;
if (jsCodLine !== 3) {
    assert(false, `js fence err line: expected 3 got ${jsCodLine ?? "none"}`);
} else if (jsCodViol?.errorDetail !== details.codeblockColon) {
    assert(false, `js fence err detail: expected codeblockColon got ${jsCodViol?.errorDetail ?? "none"}`);
} else if (getFailed() === 0) {
    console.log("OK   js fence err lineNumber on prose");
}

const bareCodOk = `## T

Текст перед кодом:

\`\`\`
const x = 1;
\`\`\`
`;
const bareCodOkRes = lintStrings({ t: bareCodOk }, ["codeblock-preceded-by-colon", "minimum-h2-heading"]);
if (getFiredRules(bareCodOkRes.t || []).size > 0) {
    assert(false, "bare fence ok: " + [...getFiredRules(bareCodOkRes.t || [])].join(", "));
} else {
    console.log("OK   bare fence with colon → clean");
}

const codeblockTablePrevOk = `## T

Вводный текст:

| Col | Val |
| --- | --- |
| a | b |

\`\`\`js
const x = 1;
\`\`\`
`;
const codeblockTablePrevRes = lintStrings({ t: codeblockTablePrevOk }, ["codeblock-preceded-by-colon", "minimum-h2-heading"]);
if (getFiredRules(codeblockTablePrevRes.t || []).size > 0) {
    assert(false, "codeblock table prev: " + [...getFiredRules(codeblockTablePrevRes.t || [])].join(", "));
} else {
    console.log("OK   codeblock-preceded-by-colon skip pipe table prev → clean");
}

const codeblockTableProseErr = `## T

Текст перед таблицей.

| Col | Val |
| --- | --- |
| a | b |

\`\`\`js
const x = 1;
\`\`\`
`;
const codeblockTableProseErrRes = lintStrings({ t: codeblockTableProseErr }, ["codeblock-preceded-by-colon", "minimum-h2-heading", "list-blank-line-spacing", "list-items-end-with-semicolon-or-colon", "sentences-end-with-mark"]);
const codeblockTableProseFired = getFiredRules(codeblockTableProseErrRes.t || []);
if (!codeblockTableProseFired.has("codeblock-preceded-by-colon") || codeblockTableProseFired.size !== 1) {
    assert(false, "codeblock table prose err: expected codeblock-preceded-by-colon only, got " + [...codeblockTableProseFired].join(", "));
} else {
    console.log("OK   codeblock prose above table → codeblock-preceded-by-colon");
}

const codblkAtDocStartOk = `\`\`\`js
const x = 1;
\`\`\`
`;
const codblkAtDocStartRes = lintStrings({ t: codblkAtDocStartOk }, ["codeblock-preceded-by-colon"]);
if (getFiredRules(codblkAtDocStartRes.t || []).size > 0) {
    assert(false, "fence at doc start: expected skip, got " + [...getFiredRules(codblkAtDocStartRes.t || [])].join(", "));
} else {
    console.log("OK   fence at doc start skips codeblock-preceded-by-colon");
}

const codblkIndentedFenceErr = `## T

Строка перед кодом;

    \`\`\`js
    const x = 1;
    \`\`\`
`;
const codblkIndentedFenceErrRes = lintStrings({ t: codblkIndentedFenceErr }, ["codeblock-preceded-by-colon", "minimum-h2-heading"]);
const codblkIndentedFenceErrFired = getFiredRules(codblkIndentedFenceErrRes.t || []);
if (!codblkIndentedFenceErrFired.has("codeblock-preceded-by-colon") || codblkIndentedFenceErrFired.size !== 1) {
    assert(false, "indented fence colon err: expected codeblock-preceded-by-colon only, got " + [...codblkIndentedFenceErrFired].join(", "));
} else {
    const codblkIndentedFenceLine = (codblkIndentedFenceErrRes.t || [])[0]?.lineNumber;
    if (codblkIndentedFenceLine !== 3) {
        assert(false, `indented fence colon err lineNumber: expected 3 got ${codblkIndentedFenceLine || "none"}`);
    } else {
        console.log("OK   indented opening fence without colon → codeblock-preceded-by-colon");
    }
}
