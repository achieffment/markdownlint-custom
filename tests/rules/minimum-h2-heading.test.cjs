const { lintStrings, getFiredRules, assert } = require("../helpers.cjs");

const h2InCodeErr = "```js\n## fake h2\n```";
const h2InCodeRes = lintStrings({ t: h2InCodeErr }, ["minimum-h2-heading"]);
const h2InCodeFired = getFiredRules(h2InCodeRes.t || []);
if (!h2InCodeFired.has("minimum-h2-heading") || h2InCodeFired.size !== 1) {
    assert(false, "H2 inside code block: expected minimum-h2-heading only, got " + [...h2InCodeFired].join(", "));
} else {
    console.log("OK   H2 in code block → minimum-h2-heading");
}

const h3OnlyErr = `### Заголовок H3

Текст.
`;
const h3OnlyRes = lintStrings({ t: h3OnlyErr }, ["minimum-h2-heading", "sentences-end-with-mark"]);
const h3OnlyFired = getFiredRules(h3OnlyRes.t || []);
if (!h3OnlyFired.has("minimum-h2-heading") || h3OnlyFired.size !== 1) {
    assert(false, "H3 without H2 err: expected minimum-h2-heading only, got " + [...h3OnlyFired].join(", "));
} else {
    console.log("OK   H3 without H2 → minimum-h2-heading");
}

const h3OnlyViol = h3OnlyRes.t || [];
if (!h3OnlyViol.some(v => v.lineNumber === 1)) {
    assert(false, "minimum-h2-heading: expected lineNumber 1");
} else {
    console.log("OK   minimum-h2-heading lineNumber 1");
}

const h2EmptyErr = `## 

Текст.
`;
const h2EmptyRes = lintStrings({ t: h2EmptyErr }, ["minimum-h2-heading", "sentences-end-with-mark"]);
const h2EmptyFired = getFiredRules(h2EmptyRes.t || []);
if (!h2EmptyFired.has("minimum-h2-heading") || h2EmptyFired.size !== 1) {
    assert(false, "H2 without text: expected minimum-h2-heading only, got " + [...h2EmptyFired].join(", "));
} else {
    console.log("OK   H2 without text → minimum-h2-heading");
}

const setextH2Ok = `Заголовок
---

Текст.
`;
const setextH2OkRes = lintStrings({ t: setextH2Ok }, ["minimum-h2-heading", "sentences-end-with-mark"]);
if (getFiredRules(setextH2OkRes.t || []).has("minimum-h2-heading")) {
    assert(false, "setext H2 ok: expected clean minimum-h2-heading, got " + [...getFiredRules(setextH2OkRes.t || [])].join(", "));
} else {
    console.log("OK   setext H2 → clean");
}

const setextH1OnlyErr = `Заголовок
===
`;
const setextH1OnlyErrRes = lintStrings({ t: setextH1OnlyErr }, ["minimum-h2-heading"]);
const setextH1OnlyFired = getFiredRules(setextH1OnlyErrRes.t || []);
if (!setextH1OnlyFired.has("minimum-h2-heading") || setextH1OnlyFired.size !== 1) {
    assert(false, "setext H1 only err: expected minimum-h2-heading only, got " + [...setextH1OnlyFired].join(", "));
} else {
    console.log("OK   setext H1 without H2 → minimum-h2-heading");
}

const atxH1OnlyErr = `# Заголовок H1

Текст.
`;
const atxH1OnlyErrRes = lintStrings({ t: atxH1OnlyErr }, ["minimum-h2-heading", "sentences-end-with-mark"]);
const atxH1OnlyFired = getFiredRules(atxH1OnlyErrRes.t || []);
if (!atxH1OnlyFired.has("minimum-h2-heading") || atxH1OnlyFired.size !== 1) {
    assert(false, "ATX H1 only err: expected minimum-h2-heading only, got " + [...atxH1OnlyFired].join(", "));
} else {
    console.log("OK   ATX H1 without H2 → minimum-h2-heading");
}
