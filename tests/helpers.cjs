const fs = require("fs");
const path = require("path");
const markdownlint = require("markdownlint/sync");
const customRules = require("../markdownlint-rules.js");
const { loadLintConfig } = require("../load-cli2-config.cjs");
const hlprs = require("../markdownlint-hlprs");
const { hasMinimumH2 } = require("../domain/micromark-heading.js");
const { parseMicromarkTokens } = require("../domain/micromark-parse.js");
const { isOpeningCodeFenceAt, eachOpeningCodeFenceLine } = require("../domain/outside-code-lines.js");
const { codeFenceRx, h2Rx, bulItemRx, numItemRx, endsWithSemiRx } = require("../regex.js");

const { config: lintConfig } = loadLintConfig(path.join(__dirname, ".."));

const examplesDir = path.join(__dirname, "..", "markdownlint-examples");
const ruleNames = customRules.flatMap(rule => rule.names);

let failed = 0;

const assert = (ok, msg) => {
    if (!ok) {
        console.error("FAIL " + msg);
        failed++;
    }
};

const getFailed = () => failed;

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
    return hasMinimumH2(parseMicromarkTokens(lines));
};

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
    const rel = path.relative(path.join(__dirname, ".."), path.dirname(errPath));
    if (ruleName === "list-blank-line-spacing") {
        assert(errRaw !== sucRaw, `${rel}: _err and _suc must differ by blank lines`);
        assert(err === suc, `${rel}: _err and _suc must have identical non-blank text`);
        return;
    }
    if (ruleName === "minimum-h2-heading") {
        const sucLines = suc.split("\n");
        const lastLine = sucLines[sucLines.length - 1].trim();
        assert(h2Rx.test(lastLine), `${rel}: _suc must add ## heading`);
        assert(hasMinimumH2(parseMicromarkTokens(sucRaw.split("\n"))), `${rel}: _suc must have H2 per micromark`);
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

const checkExampleFenceLang = (filePath) => {
    const rel = path.relative(path.join(__dirname, ".."), filePath);
    const lines = fs.readFileSync(filePath, "utf8").split("\n");
    eachOpeningCodeFenceLine(lines, (fenceIx) => {
        const trim = lines[fenceIx].trim();
        if (!codeFenceRx.test(trim) || trim === "```") {
            assert(false, `${rel}:${fenceIx + 1}: opening fence must have language tag (e.g. js, pr)`);
        }
    });
};

const lintStrings = (strings, rules) => {
    const config = { default: false };
    rules.forEach(name => {
        config[name] = true;
    });
    return markdownlint.lint({ strings, customRules, config });
};

const lintStringsFull = (strings) => {
    return markdownlint.lint({ strings, customRules, config: lintConfig });
};

const collectErrs = (fn) => {
    const errs = [];
    fn((info) => {
        errs.push(info);
    });
    return errs;
};

module.exports = {
    hlprs,
    lintConfig,
    examplesDir,
    ruleNames,
    assert,
    getFailed,
    getViolations,
    getFiredRules,
    hasH2OutsideCode,
    collectCases,
    checkExamplePair,
    checkExampleFenceLang,
    lintStrings,
    lintStringsFull,
    collectErrs,
    isOpeningCodeFenceAt
};
