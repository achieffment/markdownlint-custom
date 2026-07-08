const fs = require("fs");
const path = require("path");
const { parse } = require("jsonc-parser");

const repoRoot = path.join(__dirname);

const loadLintConfig = (root = repoRoot) => {
    const cfgPath = path.join(root, ".markdownlint-cli2.jsonc");
    if (!fs.existsSync(cfgPath)) {
        throw new Error(`Missing ${cfgPath}`);
    }
    const raw = fs.readFileSync(cfgPath, "utf8");
    const cli2 = parse(raw);
    if (!cli2 || typeof cli2 !== "object") {
        throw new Error(`Unable to parse ${cfgPath}`);
    }
    return { config: cli2.config || {} };
};

module.exports = {
    loadLintConfig
};
