const fs = require("fs");
const path = require("path");
const markdownlint = require("markdownlint/sync");
const customRules = require("./markdownlint-rules.js");
const { loadLintConfig } = require("./load-cli2-config.cjs");
const hlprs = require("./markdownlint-hlprs");
const { details } = require("./details.js");
const { codeFenceRx, h2Rx, bulItemRx, numItemRx, endsWithSemiRx } = require("./regex.js");
const { lstItemRx, isLstItem, eachLineOutsideCode, getIndent, isChildLstItem, skipBlankFwd, findPrevListInd } = hlprs;

const { config: lintConfig } = loadLintConfig();

const examplesDir = path.join(__dirname, "markdownlint-examples");
const ruleNames = customRules.flatMap(rule => rule.names);

ruleNames.forEach(name => {
    if (lintConfig[name] !== true) {
        console.error(`FAIL cli2 config must enable custom rule "${name}"`);
        process.exit(1);
    }
});
console.log(`OK   cli2 custom keys (${ruleNames.length} rules)`);

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
        config: lintConfig
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

const hasH2OutsideCode = (text) => {
    const lines = text.split("\n");
    let found = false;
    eachLineOutsideCode(lines, (_line, _ix, trim) => {
        if (h2Rx.test(trim)) found = true;
    });
    return found;
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
    const errText = fs.readFileSync(errPath, "utf8");
    const hasH2 = hasH2OutsideCode(errText);
    if (name === "minimum-h2-heading") {
        assert(!hasH2, `${name}/_err.md must not contain ## outside code fence (target violation)`);
    } else {
        assert(hasH2, `${name}/_err.md must contain ## outside code fence for exclusivity with minimum-h2-heading`);
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
    if (errLine.endsWith(";") && sucLine === errLine.slice(0, -1) + ":") return true;
    if (sucLine === errLine.trimStart() && errLine.length > sucLine.length) return true;
    if (bulItemRx.test(errLine) && errLine.replace(bulItemRx, "").trim() === "" && bulItemRx.test(sucLine) && endsWithSemiRx.test(sucLine) && sucLine.replace(bulItemRx, "").trim() !== "") return true;
    if (numItemRx.test(errLine) && errLine.replace(numItemRx, "").trim() === "" && numItemRx.test(sucLine) && endsWithSemiRx.test(sucLine) && sucLine.replace(numItemRx, "").trim() !== "") return true;
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
        const sucLines = suc.split("\n");
        const lastLine = sucLines[sucLines.length - 1].trim();
        assert(h2Rx.test(lastLine), `${rel}: _suc must add ## heading`);
        const sucBody = sucLines.slice(0, -1).join("\n");
        assert(err === sucBody, `${rel}: _suc must differ from _err only by added ## heading`);
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
        if (!inCodeB && (!codeFenceRx.test(trim) || trim === "```")) {
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

const listBlankErrPath = path.join(examplesDir, "list-blank-line-spacing", "_err.md");
const listBlankViol = getViolations(listBlankErrPath);
const blankDets = [details.listBlankBef, details.listBlankAft, details.listBlankGap];
const foundBlankDets = new Set(listBlankViol.map(v => v.errorDetail));
blankDets.forEach(det => {
    if (!foundBlankDets.has(det)) {
        assert(false, `list-blank-line-spacing/_err.md missing sub-detail: ${det}`);
    }
});
if (failed === 0) {
    console.log("OK   list-blank-line-spacing/_err sub-details");
}

const listItemsErrPath = path.join(examplesDir, "list-items-end-with-semicolon-or-colon", "_err.md");
const listItemsViol = getViolations(listItemsErrPath);
const itemsDets = [details.listItemsEmpty, details.listItemsColon, details.listItemsSemi];
const foundItemsDets = new Set(listItemsViol.map(v => v.errorDetail));
itemsDets.forEach(det => {
    if (!foundItemsDets.has(det)) {
        assert(false, `list-items-end-with-semicolon-or-colon/_err.md missing sub-detail: ${det}`);
    }
});
if (failed === 0) {
    console.log("OK   list-items-end-with-semicolon-or-colon/_err sub-details");
}

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
if (failed === 0) {
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
const prevLines = ["1. пункт;", "", "2. второй;"];
if (findPrevListInd(prevLines, 2) !== 0) {
    assert(false, "findPrevListInd: expected indent 0");
}
if (failed === 0) {
    console.log("OK   hlprs behavior (isChildLstItem, getIndent, skipBlankFwd, findPrevListInd)");
}

const collectErrs = (fn) => {
    const errs = [];
    fn((info) => {
        errs.push(info);
    });
    return errs;
};

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
if (failed === 0) {
    console.log("OK   hlprs checkers (checkPrecededByColon, checkListPrecededByColon)");
}

const deepIndents = [3, 6, 9, 12, 15];
deepIndents.forEach(sp => {
    const line = `${" ".repeat(sp)}1. пункт;`;
    const trim = line.trim();
    if (!lstItemRx.test(trim) || !isLstItem(line)) {
        assert(false, `nested num regex: "${trim}" not recognized as list item`);
    }
});
if (failed === 0) {
    console.log(`OK   nested num regex (${deepIndents.length} levels)`);
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
const unorderedBoundariesOkRes = lintStrings({ t: unorderedBoundariesOk }, ruleNames);
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
    } else if (failed === 0) {
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
        .find(v => v.ruleNames.includes("list-preceded-by-colon"))?.lineNumber;
    if (listColonBulLine !== 3) {
        assert(false, `list colon bul err line: expected 3 got ${listColonBulLine ?? "none"}`);
    } else if (failed === 0) {
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
} else if (failed === 0) {
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
} else if (failed === 0) {
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

const noLeadingDedntErr = `## T

1. parent:
   1. ok;
 1. bad;
`;
const noLeadingDedntErrRes = lintStrings({ t: noLeadingDedntErr }, ["no-leading-spaces", "minimum-h2-heading", "list-items-end-with-semicolon-or-colon", "list-blank-line-spacing"]);
const noLeadingDedntViol = noLeadingDedntErrRes.t || [];
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

if (failed > 0) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
}
console.log("\nAll checks passed");
