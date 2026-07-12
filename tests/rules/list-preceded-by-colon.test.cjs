const { examplesDir, getViolations, getFiredRules, lintStrings, assert, getFailed } = require("../helpers.cjs");
const { details } = require("../../details.js");
const path = require("path");

const errPath = path.join(examplesDir, "list-preceded-by-colon", "_err.md");
const errViols = getViolations(errPath).filter(v => v.ruleNames.includes("list-preceded-by-colon"));
if (errViols.length !== 2) {
    assert(false, `list-preceded-by-colon/_err.md: expected 2 violations, got ${errViols.length}`);
}
if (getFailed() === 0) {
    console.log("OK   multi-violation example count (list-preceded-by-colon)");
}

const listColonErr = `## T

Текст перед списком.

1. пункт;
`;
const listColonErrRes = lintStrings({ t: listColonErr }, ["list-preceded-by-colon", "minimum-h2-heading", "list-blank-line-spacing"]);
const listColonErrFired = getFiredRules(listColonErrRes.t || []);
if (!listColonErrFired.has("list-preceded-by-colon") || listColonErrFired.size !== 1) {
    assert(false, "list colon err: expected list-preceded-by-colon only, got " + [...listColonErrFired].join(", "));
} else {
    console.log("OK   list colon err → list-preceded-by-colon");
    const listColonViol = (listColonErrRes.t || [])
        .find(v => v.ruleNames.includes("list-preceded-by-colon"));
    const listColonLine = listColonViol?.lineNumber;
    if (listColonLine !== 3) {
        assert(false, `list colon err line: expected 3 got ${listColonLine ?? "none"}`);
    } else if (listColonViol?.errorDetail !== details.listPrecededByColon) {
        assert(false, `list colon err detail: expected listPrecededByColon got ${listColonViol?.errorDetail ?? "none"}`);
    } else if (getFailed() === 0) {
        console.log("OK   list colon err lineNumber on prose");
    }
}

const listColonBulErr = `## T

Текст перед списком.

- пункт;
`;
const listColonBulErrRes = lintStrings({ t: listColonBulErr }, ["list-preceded-by-colon", "minimum-h2-heading", "list-blank-line-spacing"]);
const listColonBulErrFired = getFiredRules(listColonBulErrRes.t || []);
if (!listColonBulErrFired.has("list-preceded-by-colon") || listColonBulErrFired.size !== 1) {
    assert(false, "list colon bul err: expected list-preceded-by-colon only, got " + [...listColonBulErrFired].join(", "));
} else {
    console.log("OK   list colon bul err → list-preceded-by-colon");
    const listColonBulLine = (listColonBulErrRes.t || [])
        .find(v => v.ruleNames.includes("list-preceded-by-colon"));
    if (listColonBulLine?.lineNumber !== 3) {
        assert(false, `list colon bul err line: expected 3 got ${listColonBulLine?.lineNumber ?? "none"}`);
    } else if (listColonBulLine?.errorDetail !== details.listPrecededByColon) {
        assert(false, `list colon bul err detail: expected listPrecededByColon got ${listColonBulLine?.errorDetail ?? "none"}`);
    } else if (getFailed() === 0) {
        console.log("OK   list colon bul err lineNumber on prose");
    }
}

const listColonOk = `## T

Текст перед списком:

1. пункт;
`;
const listColonOkRes = lintStrings({ t: listColonOk }, ["list-preceded-by-colon", "minimum-h2-heading", "list-blank-line-spacing"]);
if (getFiredRules(listColonOkRes.t || []).size > 0) {
    assert(false, "list colon ok: " + [...getFiredRules(listColonOkRes.t || [])].join(", "));
} else {
    console.log("OK   list colon ok → clean");
}

const listColonNestedOk = `## T

Текст без двоеточия.

   1. вложенный;
`;
const listColonNestedOkRes = lintStrings({ t: listColonNestedOk }, ["list-preceded-by-colon", "minimum-h2-heading"]);
const listColonNestedFired = getFiredRules(listColonNestedOkRes.t || []);
if (listColonNestedFired.has("list-preceded-by-colon")) {
    assert(false, "nested list must not trigger list-preceded-by-colon");
} else {
    console.log("OK   nested list skips list-preceded-by-colon");
}

const listColonBulNestedOk = `## T

Текст без двоеточия.

   - вложенный;
`;
const listColonBulNestedOkRes = lintStrings({ t: listColonBulNestedOk }, ["list-preceded-by-colon", "minimum-h2-heading", "list-items-end-with-semicolon-or-colon"]);
const listColonBulNestedFired = getFiredRules(listColonBulNestedOkRes.t || []);
if (listColonBulNestedFired.has("list-preceded-by-colon")) {
    assert(false, "indented bullet must not trigger list-preceded-by-colon");
} else {
    console.log("OK   indented bullet skips list-preceded-by-colon");
}

const listColonSkipHeadingOk = `## T

## Заголовок

1. пункт;
`;
const listColonSkipHeadingRes = lintStrings({ t: listColonSkipHeadingOk }, ["list-preceded-by-colon", "minimum-h2-heading", "list-blank-line-spacing"]);
if (getFiredRules(listColonSkipHeadingRes.t || []).size > 0) {
    assert(false, "list colon skip heading: " + [...getFiredRules(listColonSkipHeadingRes.t || [])].join(", "));
} else {
    console.log("OK   list-preceded-by-colon skip heading → clean");
}

const listColonSkipLstPrevOk = `## T

- первый;

1. второй блок;
`;
const listColonSkipLstPrevRes = lintStrings({ t: listColonSkipLstPrevOk }, ["list-preceded-by-colon", "minimum-h2-heading", "list-items-end-with-semicolon-or-colon"]);
if (getFiredRules(listColonSkipLstPrevRes.t || []).size > 0) {
    assert(false, "list colon skip list prev: " + [...getFiredRules(listColonSkipLstPrevRes.t || [])].join(", "));
} else {
    console.log("OK   list-preceded-by-colon skip list item prev → clean");
}

const listColonSkipCodblkOk = `## T

\`\`\`js
const x = 1;
\`\`\`

1. пункт;
`;
const listColonSkipCodblkRes = lintStrings({ t: listColonSkipCodblkOk }, ["list-preceded-by-colon", "minimum-h2-heading", "codeblock-preceded-by-colon"]);
if (getFiredRules(listColonSkipCodblkRes.t || []).size > 0) {
    assert(false, "list colon skip code fence prev: " + [...getFiredRules(listColonSkipCodblkRes.t || [])].join(", "));
} else {
    console.log("OK   list-preceded-by-colon skip code fence prev → clean");
}

const listAtDocStartOk = `1. первый;
`;
const listAtDocStartRes = lintStrings({ t: listAtDocStartOk }, ["list-preceded-by-colon"]);
if (getFiredRules(listAtDocStartRes.t || []).size > 0) {
    assert(false, "list at doc start: expected skip, got " + [...getFiredRules(listAtDocStartRes.t || [])].join(", "));
} else {
    console.log("OK   list at doc start skips list-preceded-by-colon");
}

const listBulAtDocStartOk = `- первый;
`;
const listBulAtDocStartRes = lintStrings({ t: listBulAtDocStartOk }, ["list-preceded-by-colon"]);
if (getFiredRules(listBulAtDocStartRes.t || []).size > 0) {
    assert(false, "bul list at doc start: expected skip, got " + [...getFiredRules(listBulAtDocStartRes.t || [])].join(", "));
} else {
    console.log("OK   bulleted list at doc start skips list-preceded-by-colon");
}

const listColonTablePrevOk = `## T

| Col | Val |
| --- | --- |
| a | b |

1. пункт;
`;
const listColonTablePrevRes = lintStrings({ t: listColonTablePrevOk }, ["list-preceded-by-colon", "minimum-h2-heading", "list-blank-line-spacing", "list-items-end-with-semicolon-or-colon"]);
if (getFiredRules(listColonTablePrevRes.t || []).size > 0) {
    assert(false, "list colon table prev: " + [...getFiredRules(listColonTablePrevRes.t || [])].join(", "));
} else {
    console.log("OK   list-preceded-by-colon skip pipe table prev → clean");
}

const listColonTableProseErr = `## T

Текст перед таблицей.

| Col | Val |
| --- | --- |
| a | b |

1. пункт;
`;
const listColonTableProseErrRes = lintStrings({ t: listColonTableProseErr }, ["list-preceded-by-colon", "minimum-h2-heading", "list-blank-line-spacing", "list-items-end-with-semicolon-or-colon", "sentences-end-with-mark"]);
const listColonTableProseFired = getFiredRules(listColonTableProseErrRes.t || []);
if (!listColonTableProseFired.has("list-preceded-by-colon") || listColonTableProseFired.size !== 1) {
    assert(false, "list colon table prose err: expected list-preceded-by-colon only, got " + [...listColonTableProseFired].join(", "));
} else {
    console.log("OK   list colon prose above table → list-preceded-by-colon");
}

const listColonTableGapOk = `## T

| Col | Val |

| --- | --- |

| a | b |

1. пункт;
`;
const listColonTableGapOkRes = lintStrings({ t: listColonTableGapOk }, ["list-preceded-by-colon", "minimum-h2-heading", "list-blank-line-spacing", "list-items-end-with-semicolon-or-colon"]);
if (getFiredRules(listColonTableGapOkRes.t || []).size > 0) {
    assert(false, "list colon table gap: " + [...getFiredRules(listColonTableGapOkRes.t || [])].join(", "));
} else {
    console.log("OK   list-preceded-by-colon skip pipe table with blank gaps → clean");
}

const listFenceSplitErr = `## T

Вводный:

1. первый;

Второй блок без двоеточия;

1. второй;
`;
const listFenceSplitErrRes = lintStrings({ t: listFenceSplitErr }, ["list-preceded-by-colon", "minimum-h2-heading", "list-blank-line-spacing", "list-items-end-with-semicolon-or-colon", "sentences-end-with-mark"]);
const listFenceSplitErrFired = getFiredRules(listFenceSplitErrRes.t || []);
if (!listFenceSplitErrFired.has("list-preceded-by-colon") || listFenceSplitErrFired.size !== 1) {
    assert(false, "list fence split err: expected list-preceded-by-colon only, got " + [...listFenceSplitErrFired].join(", "));
} else {
    const listFenceSplitLine = (listFenceSplitErrRes.t || [])[0]?.lineNumber;
    if (listFenceSplitLine !== 7) {
        assert(false, `list fence split err lineNumber: expected 7 got ${listFenceSplitLine || "none"}`);
    } else {
        console.log("OK   second list block without colon → list-preceded-by-colon");
    }
}
