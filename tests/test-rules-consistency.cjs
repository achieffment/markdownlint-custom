const fs = require("fs");
const path = require("path");

const repoRoot = path.join(__dirname, "..");
const claudeDir = path.join(repoRoot, ".claude", "rules");
const cursorDir = path.join(repoRoot, ".cursor", "rules");
const nameRx = "[a-z][a-z0-9-]*";

let failed = 0;

const assert = (ok, msg) => {
    if (!ok) {
        console.error("FAIL " + msg);
        failed++;
    }
};

const ruleNames = (dir, ext) => {
    return new Set(fs.readdirSync(dir).filter(f => f.endsWith(ext)).map(f => f.slice(0, -ext.length)));
};

const setDiff = (a, b) => [...a].filter(x => !b.has(x));

const readLines = (filePath) => fs.readFileSync(filePath, "utf8").split("\n");

const matchOrder = (lines, rx) => {
    const order = [];
    lines.forEach(line => {
        const m = line.match(rx);
        if (m) {
            order.push(m[1]);
        }
    });
    return order;
};

const claudeMdOrder = () => {
    const rx = new RegExp(`^- \\[\`\\.claude/rules/(${nameRx})\\.md\`\\]`);
    return matchOrder(readLines(path.join(repoRoot, "CLAUDE.md")), rx);
};

const agentsMdOrder = () => {
    const rx = new RegExp(`^\\| \\[${nameRx}\\.mdc\\]\\(\\.cursor/rules/(${nameRx})\\.mdc\\)`);
    return matchOrder(readLines(path.join(repoRoot, "AGENTS.md")), rx);
};

const rulesSyncOrder = () => {
    const rx = new RegExp(`^\\| \`(${nameRx})\\.mdc\`\\s*\\|`);
    return matchOrder(readLines(path.join(claudeDir, "rules-sync.md")), rx);
};

const checkPairSymmetry = () => {
    const claudeNames = ruleNames(claudeDir, ".md");
    const cursorNames = ruleNames(cursorDir, ".mdc");
    const onlyClaude = setDiff(claudeNames, cursorNames);
    const onlyCursor = setDiff(cursorNames, claudeNames);
    assert(onlyClaude.length === 0 && onlyCursor.length === 0, `несимметричные пары правил: только Claude [${onlyClaude}], только Cursor [${onlyCursor}]`);
    return claudeNames;
};

const checkListingsOrder = (claudeNames) => {
    const expected = [...claudeNames].sort();
    const claudeOrder = claudeMdOrder();
    const agentsOrder = agentsMdOrder();
    const syncOrder = rulesSyncOrder();
    assert(JSON.stringify([...claudeOrder].sort()) === JSON.stringify(expected), "CLAUDE.md: список правил неполон или устарел");
    assert(JSON.stringify([...agentsOrder].sort()) === JSON.stringify(expected), "AGENTS.md: таблица правил неполна или устарела");
    assert(JSON.stringify([...syncOrder].sort()) === JSON.stringify(expected), "rules-sync.md: карта соответствия неполна или устарела");
    assert(JSON.stringify(claudeOrder) === JSON.stringify(expected), "CLAUDE.md: порядок правил не алфавитный/не синхронный");
    assert(JSON.stringify(agentsOrder) === JSON.stringify(expected), "AGENTS.md: порядок правил не алфавитный/не синхронный");
    assert(JSON.stringify(syncOrder) === JSON.stringify(expected), "rules-sync.md: порядок правил не алфавитный/не синхронный");
};

const checkBlockquoteLinks = (claudeNames) => {
    claudeNames.forEach(name => {
        if (name === "rules-sync") return;
        const text = fs.readFileSync(path.join(claudeDir, `${name}.md`), "utf8");
        const expected = `> Claude-эквивалент [\`.cursor/rules/${name}.mdc\`](../../.cursor/rules/${name}.mdc).`;
        assert(text.includes(expected), `${name}.md: нет blockquote-ссылки на парный .mdc`);
    });
};

const checkCursorFrontmatter = () => {
    fs.readdirSync(cursorDir).filter(f => f.endsWith(".mdc")).sort().forEach(f => {
        const text = fs.readFileSync(path.join(cursorDir, f), "utf8");
        assert(text.startsWith("---\n"), `${f}: нет frontmatter в начале файла`);
        const frontmatter = text.split("---", 3)[1] || "";
        assert(frontmatter.includes("description:"), `${f}: нет поля description`);
        assert(frontmatter.includes("alwaysApply:") || frontmatter.includes("globs:"), `${f}: нет alwaysApply/globs`);
    });
};

const claudeNames = checkPairSymmetry();
checkListingsOrder(claudeNames);
checkBlockquoteLinks(claudeNames);
checkCursorFrontmatter();

if (failed > 0) {
    console.error(`\n${failed} rules consistency check(s) failed`);
    process.exit(1);
}

console.log("OK   rules consistency (pairs, order, blockquotes, frontmatter)");
