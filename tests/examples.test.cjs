const fs = require("fs");
const path = require("path");
const {
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
    checkExampleFenceLang
} = require("./helpers.cjs");

ruleNames.forEach(name => {
    if (lintConfig[name] !== true) {
        console.error(`FAIL cli2 config must enable custom rule "${name}"`);
        process.exit(1);
    }
});
console.log(`OK   cli2 custom keys (${ruleNames.length} rules)`);

const exampleCases = collectCases();

const exampleRuleNames = fs.readdirSync(examplesDir)
    .filter(name => fs.statSync(path.join(examplesDir, name)).isDirectory());

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
if (getFailed() === 0 && exampleRuleNames.length > 0) {
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
if (getFailed() === 0) {
    console.log(`OK   example H2 exclusivity (${exampleRuleNames.length} rules)`);
}

ruleNames.forEach(name => {
    checkExamplePair(name, path.join(examplesDir, name, "_err.md"), path.join(examplesDir, name, "_suc.md"));
});
if (getFailed() === 0) {
    console.log(`OK   example pairs (${ruleNames.length} rules)`);
}

exampleCases.forEach(({ filePath }) => {
    checkExampleFenceLang(filePath);
});
if (getFailed() === 0) {
    console.log(`OK   example fences (${exampleCases.length} files)`);
}

exampleCases.forEach(({ ruleName, kind, filePath }) => {
    const rel = path.relative(path.join(__dirname, ".."), filePath);
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

if (getFailed() > 0) {
    console.error(`\n${getFailed()} example(s) failed`);
    process.exit(1);
}
console.log(`\nAll ${exampleCases.length} examples passed`);
