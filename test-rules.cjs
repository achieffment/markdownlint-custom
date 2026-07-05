const fs = require("fs");
const path = require("path");
const markdownlint = require("markdownlint/sync");
const customRules = require("./markdownlint-rules.js");
const { lstItemRx, isLstItem } = require("./markdownlint-hlprs");

const examplesDir = path.join(__dirname, "markdownlint-examples");
const ruleNames = customRules.flatMap(rule => rule.names);
const ruleConfig = { default: false };
ruleNames.forEach(name => {
    ruleConfig[name] = true;
});

const h2Rx = /^##(?!\#)\s+\S/;

const collectCases = () => {
    const cases = [];
    fs.readdirSync(examplesDir).forEach(ruleName => {
        const ruleDir = path.join(examplesDir, ruleName);
        if (!fs.statSync(ruleDir).isDirectory()) return;
        ["_err", "_suc"].forEach(kind => {
            const filePath = path.join(ruleDir, `${kind}.md`);
            if (fs.existsSync(filePath)) {
                cases.push({ ruleName, kind, filePath });
            }
        });
    });
    return cases;
};

const exampleCases = collectCases();

const exampleRuleNames = fs.readdirSync(examplesDir)
    .filter(name => fs.statSync(path.join(examplesDir, name)).isDirectory());

const getViolations = (filePath) => {
    const rel = path.relative(process.cwd(), filePath);
    const result = markdownlint.lint({
        files: [filePath],
        customRules,
        config: ruleConfig
    });
    return result[rel] || result[filePath] || [];
};

const getFiredRules = (violations) => {
    const fired = new Set();
    violations.forEach(v => {
        v.ruleNames.forEach(name => fired.add(name));
    });
    return fired;
};

let failed = 0;

const assert = (ok, msg) => {
    if (!ok) {
        console.error("FAIL " + msg);
        failed++;
    }
};

ruleNames.forEach(name => {
    if (!exampleRuleNames.includes(name)) {
        assert(false, `rule "${name}" has no markdownlint-examples/${name}/ directory`);
    }
});
exampleRuleNames.forEach(name => {
    if (!ruleNames.includes(name)) {
        assert(false, `markdownlint-examples/${name}/ has no matching rule in markdownlint-rules.js`);
    } else {
        ["_err", "_suc"].forEach(kind => {
            const filePath = path.join(examplesDir, name, `${kind}.md`);
            if (!fs.existsSync(filePath)) {
                assert(false, `markdownlint-examples/${name}/${kind}.md is missing`);
            }
        });
    }
});
if (failed === 0 && exampleRuleNames.length > 0) {
    console.log(`OK   examples sync (${ruleNames.length} rules)`);
}

exampleRuleNames.forEach(name => {
    const errPath = path.join(examplesDir, name, "_err.md");
    const errLines = fs.readFileSync(errPath, "utf8").split("\n");
    const hasH2 = errLines.some(line => h2Rx.test(line.trim()));
    if (name === "minimum-h2-heading") {
        assert(!hasH2, `${name}/_err.md must not contain ## (target violation)`);
    } else {
        assert(hasH2, `${name}/_err.md must contain ## for exclusivity with minimum-h2-heading`);
    }
});
if (failed === 0) {
    console.log(`OK   example H2 exclusivity (${exampleRuleNames.length} rules)`);
}

const stripBlanks = (text) => text.split("\n").filter(line => line.trim() !== "").join("\n");

const allowedLineDiff = (errLine, sucLine) => {
    if (errLine === sucLine) return true;
    if (sucLine === errLine + ";" || sucLine === errLine + ":" || sucLine === errLine + ".") return true;
    if (sucLine === errLine + "!" || sucLine === errLine + "?") return true;
    if (errLine.endsWith(".") && sucLine === errLine.slice(0, -1) + ":") return true;
    if (sucLine === errLine.trimStart() && errLine.length > sucLine.length) return true;
    return false;
};

const checkExamplePair = (ruleName, errPath, sucPath) => {
    const errRaw = fs.readFileSync(errPath, "utf8");
    const sucRaw = fs.readFileSync(sucPath, "utf8");
    const err = stripBlanks(errRaw);
    const suc = stripBlanks(sucRaw);
    const rel = path.relative(__dirname, path.dirname(errPath));
    if (ruleName === "list-blank-line-spacing") {
        assert(err === suc, `${rel}: _err and _suc must have identical non-blank text`);
        return;
    }
    if (ruleName === "minimum-h2-heading") {
        const sucBody = suc.replace(/\n## (?!\#)\S[^\n]*$/, "");
        assert(err === sucBody, `${rel}: _suc must differ from _err only by added ## heading`);
        assert(/^## (?!\#)\S/.test(suc.split("\n").pop()), `${rel}: _suc must add ## heading`);
        return;
    }
    const errLines = err.split("\n");
    const sucLines = suc.split("\n");
    assert(errLines.length === sucLines.length, `${rel}: non-blank line count _err=${errLines.length} _suc=${sucLines.length}`);
    let hasDiff = false;
    errLines.forEach((errLine, i) => {
        const sucLine = sucLines[i];
        if (errLine !== sucLine) {
            hasDiff = true;
            if (!allowedLineDiff(errLine, sucLine)) {
                assert(false, `${rel}: line ${i + 1} unexpected diff:\n  _err: ${errLine}\n  _suc: ${sucLine}`);
            }
        }
    });
    assert(hasDiff, `${rel}: _suc must fix at least one non-blank line`);
};

ruleNames.forEach(name => {
    checkExamplePair(name, path.join(examplesDir, name, "_err.md"), path.join(examplesDir, name, "_suc.md"));
});
if (failed === 0) {
    console.log(`OK   example pairs (${ruleNames.length} rules)`);
}

const checkExampleFenceLang = (filePath) => {
    const rel = path.relative(__dirname, filePath);
    const lines = fs.readFileSync(filePath, "utf8").split("\n");
    let inCodeB = false;
    lines.forEach((line, ix) => {
        const trim = line.trim();
        if (!trim.startsWith("```")) return;
        if (!inCodeB && !/^```\S+/.test(trim)) {
            assert(false, `${rel}:${ix + 1}: opening fence must have language tag (e.g. js, pr)`);
        }
        inCodeB = !inCodeB;
    });
};

exampleCases.forEach(({ filePath }) => {
    checkExampleFenceLang(filePath);
});
if (failed === 0) {
    console.log(`OK   example fences (${exampleCases.length} files)`);
}

exampleCases.forEach(({ ruleName, kind, filePath }) => {
    const rel = path.relative(__dirname, filePath);
    const violations = getViolations(filePath);
    const fired = getFiredRules(violations);
    if (kind === "_err") {
        if (!fired.has(ruleName)) {
            assert(false, `${rel}: expected rule "${ruleName}", got [${[...fired].join(", ") || "none"}]`);
        } else {
            const extra = [...fired].filter(n => n !== ruleName);
            if (extra.length > 0) {
                assert(false, `${rel}: extra rules [${extra.join(", ")}]`);
            } else {
                console.log(`OK   ${rel} → ${ruleName}`);
            }
        }
    } else if (fired.size > 0) {
        assert(false, `${rel}: expected clean, got [${[...fired].join(", ")}]`);
    } else {
        console.log(`OK   ${rel} → clean`);
    }
});

if (failed > 0) {
    console.error(`\n${failed} example(s) failed`);
    process.exit(1);
}
console.log(`\nAll ${exampleCases.length} examples passed`);

const lintStrings = (strings, rules) => {
    const config = { default: false };
    rules.forEach(name => {
        config[name] = true;
    });
    return markdownlint.lint({ strings, customRules, config });
};

const deepMarks = ["1.1", "1.1.1", "1.1.1.1", "1.1.1.1.1"];
deepMarks.forEach(mark => {
    const line = `   ${mark} пункт;`;
    const trim = line.trim();
    if (!lstItemRx.test(trim) || !isLstItem(line)) {
        assert(false, `deep regex: "${trim}" not recognized as list item`);
    }
});
if (failed === 0) {
    console.log(`OK   deep regex (${deepMarks.length} marks)`);
}

const deepOk = `## T

1. корень;

   1.1 второй;

      1.1.1 третий;

         1.1.1.1 четвёртый;

            1.1.1.1.1 пятый;
`;
const deepOkRes = lintStrings({ deep: deepOk }, ruleNames);
if (getFiredRules(deepOkRes.deep || []).size > 0) {
    assert(false, "deep nesting valid md: " + [...getFiredRules(deepOkRes.deep || [])].join(", "));
} else {
    console.log("OK   deep nesting (5 levels) → clean");
}

const deepErr = `## T

1. корень;

   1.1 без точки с запятой

      1.1.1 тоже без

         1.1.1.1 и глубже без
`;
const emptyItemErr = `## T

- 
`;
const emptyItemRes = lintStrings({ t: emptyItemErr }, ["list-items-end-with-semicolon-or-colon", "minimum-h2-heading"]);
const emptyItemFired = getFiredRules(emptyItemRes.t || []);
if (!emptyItemFired.has("list-items-end-with-semicolon-or-colon") || emptyItemFired.size !== 1) {
    assert(false, "empty list item: expected list-items-end-with-semicolon-or-colon only, got " + [...emptyItemFired].join(", "));
} else {
    console.log("OK   empty list item → list-items-end-with-semicolon-or-colon");
}

const deepErrRes = lintStrings({ deep: deepErr }, ["list-items-end-with-semicolon-or-colon", "minimum-h2-heading"]);
const deepErrViol = deepErrRes.deep || [];
const deepErrLines = deepErrViol.map(v => v.lineNumber).sort((a, b) => a - b);
if (deepErrLines.join() !== "5,7,9") {
    assert(false, `deep nesting err lines: expected 5,7,9 got ${deepErrLines.join() || "none"}`);
} else {
    console.log("OK   deep nesting err → list-items on lines 5,7,9");
}

const nestedSpacingErr = `## T

1. родитель;

   1.1 вложенный;
      1.1.1 третий уровень;

         1.1.1.1 четвёртый уровень;
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
        console.log("OK   unordered boundaries err → list-blank-line-spacing");
    }
}

const unorderedBoundariesOk = `## T

Текст перед списком:

- пункт один;
- пункт два;

- пункт три;

Текст после списка.
`;
const unorderedBoundariesOkRes = lintStrings({ t: unorderedBoundariesOk }, ruleNames);
if (getFiredRules(unorderedBoundariesOkRes.t || []).size > 0) {
    assert(false, "unordered boundaries ok: " + [...getFiredRules(unorderedBoundariesOkRes.t || [])].join(", "));
} else {
    console.log("OK   unordered boundaries ok → clean");
}

const tightThenBlankErr = `## T

1. один;
2. два;

3. три;
`;
const tightThenBlankRes = lintStrings({ t: tightThenBlankErr }, ["list-blank-line-spacing", "minimum-h2-heading"]);
const tightThenBlankViol = tightThenBlankRes.t || [];
const tightThenBlankFired = getFiredRules(tightThenBlankViol);
if (!tightThenBlankFired.has("list-blank-line-spacing")) {
    assert(false, "tight then blank err: expected list-blank-line-spacing");
} else {
    const spacingLines = tightThenBlankViol
        .filter(v => v.ruleNames.includes("list-blank-line-spacing"))
        .map(v => v.lineNumber)
        .sort((a, b) => a - b);
    if (spacingLines.join() !== "4") {
        assert(false, `tight then blank err lines: expected 4 got ${spacingLines.join() || "none"}`);
    } else {
        console.log("OK   tight then blank err → list-blank-line-spacing on line 4");
    }
}

const listColonErr = `## T

Текст перед списком.

1. пункт;
`;
const listColonErrRes = lintStrings({ t: listColonErr }, ["list-preceded-by-colon", "minimum-h2-heading", "list-blank-line-spacing"]);
const listColonErrFired = getFiredRules(listColonErrRes.t || []);
if (!listColonErrFired.has("list-preceded-by-colon")) {
    assert(false, "list colon err: expected list-preceded-by-colon, got " + [...listColonErrFired].join(", "));
} else {
    const extra = [...listColonErrFired].filter(n => n !== "list-preceded-by-colon");
    if (extra.length > 0) {
        assert(false, "list colon err: extra rules " + extra.join(", "));
    } else {
        console.log("OK   list colon err → list-preceded-by-colon");
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

   1.1 вложенный;
`;
const listColonNestedOkRes = lintStrings({ t: listColonNestedOk }, ["list-preceded-by-colon", "minimum-h2-heading"]);
const listColonNestedFired = getFiredRules(listColonNestedOkRes.t || []);
if (listColonNestedFired.has("list-preceded-by-colon")) {
    assert(false, "nested list must not trigger list-preceded-by-colon");
} else {
    console.log("OK   nested list skips list-preceded-by-colon");
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

const listAfterHeadingNoBlankErr = `## T
1. пункт;
`;
const listAfterHeadingRes = lintStrings({ t: listAfterHeadingNoBlankErr }, ["list-blank-line-spacing", "minimum-h2-heading"]);
const listAfterHeadingFired = getFiredRules(listAfterHeadingRes.t || []);
if (!listAfterHeadingFired.has("list-blank-line-spacing")) {
    assert(false, "list after heading without blank: expected list-blank-line-spacing");
} else {
    console.log("OK   list after heading no blank → list-blank-line-spacing");
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

const h2InCodeErr = "```js\n## fake h2\n```";
const h2InCodeRes = lintStrings({ t: h2InCodeErr }, ["minimum-h2-heading"]);
if (!getFiredRules(h2InCodeRes.t || []).has("minimum-h2-heading")) {
    assert(false, "H2 inside code block must not satisfy minimum-h2-heading");
} else {
    console.log("OK   H2 in code block → minimum-h2-heading");
}

const noLeadingNestedOk = `## T

1. родитель;

   1.1 вложенный;
`;
const noLeadingNestedOkRes = lintStrings({ t: noLeadingNestedOk }, ["no-leading-spaces", "minimum-h2-heading", "list-items-end-with-semicolon-or-colon", "list-blank-line-spacing"]);
if (getFiredRules(noLeadingNestedOkRes.t || []).size > 0) {
    assert(false, "nested list indent ok: " + [...getFiredRules(noLeadingNestedOkRes.t || [])].join(", "));
} else {
    console.log("OK   nested list indent → clean");
}

const noLeadingFenceNestedOk = `## T

1. parent:

\`\`\`js
code
\`\`\`

   1.1 child;
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

if (failed > 0) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
}
console.log("\nAll checks passed");
