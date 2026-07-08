const fs = require("fs");
const path = require("path");
const { parse } = require("jsonc-parser");

const repoRoot = __dirname;
const schemaPath = path.join(repoRoot, "schema", ".markdownlint.jsonc");
const cli2Path = path.join(repoRoot, ".markdownlint-cli2.jsonc");
const customRules = require("./markdownlint-rules.js");

const ruleNames = customRules.flatMap(rule => rule.names);

const ovrdRules = new Set([
    "MD013",
    "MD007",
    "MD029",
    "MD032",
    "MD043",
    "MD046"
]);

const metaIgnores = [
    "README.md",
    "AGENTS.md",
    ".cursor/**"
];

const loadJsonc = (fp) => {
    const raw = fs.readFileSync(fp, "utf8");
    const val = parse(raw);
    if (!val || typeof val !== "object") {
        throw new Error(`Unable to parse ${fp}`);
    }
    return val;
};

const isMdKey = (key) => /^MD\d{3}$/.test(key);

const deepEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

let failed = 0;

const assert = (ok, msg) => {
    if (!ok) {
        console.error("FAIL " + msg);
        failed++;
    }
};

const schema = loadJsonc(schemaPath);
const cli2 = loadJsonc(cli2Path);
const cfg = cli2.config || {};

assert(cfg.default === true, 'config.default must be true');
assert(Array.isArray(cli2.customRules) && cli2.customRules.length === 1
    && cli2.customRules[0] === "./markdownlint-rules.js", "customRules must be ['./markdownlint-rules.js']");

assert(Array.isArray(cli2.ignores), "ignores must be set");
metaIgnores.forEach(ig => {
    assert(cli2.ignores.includes(ig), `ignores must include ${ig}`);
});

assert(Array.isArray(cli2.globs), "globs must be set");
assert(cli2.globs.includes("**/*.{md,markdown}"), 'globs must include "**/*.{md,markdown}"');
assert(cli2.globs.includes("!node_modules"), 'globs must include "!node_modules"');

ovrdRules.forEach(key => {
    assert(cfg[key] === false, `${key} override must be false`);
});

ruleNames.forEach(name => {
    assert(cfg[name] === true, `rule ${name} must be enabled in cli2 config`);
});

Object.keys(schema).forEach(key => {
    if (key === "extends" || key === "default") return;
    if (!isMdKey(key)) return;
    assert(Object.prototype.hasOwnProperty.call(cfg, key), `config missing ${key} from schema`);
    if (ovrdRules.has(key)) return;
    assert(deepEq(cfg[key], schema[key]), `${key} must match schema default`);
});

Object.keys(cfg).forEach(key => {
    if (key === "default" || ruleNames.includes(key)) return;
    if (!isMdKey(key)) {
        assert(false, `unexpected config key ${key}`);
    }
});

if (failed > 0) {
    console.error(`\n${failed} cli2 config check(s) failed`);
    process.exit(1);
}

console.log("OK   cli2 config (schema parity, custom rules, ignores)");
