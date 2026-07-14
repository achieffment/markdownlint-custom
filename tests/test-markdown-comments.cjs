const fs = require("fs");
const path = require("path");

const repoRoot = path.join(__dirname, "..");
const skipDirs = new Set(["node_modules", ".git"]);
const cmdLangs = new Set(["bash", "sh", "shell", "powershell", "pwsh", "bat", "cmd"]);
const fenceOpenRx = /^```\s*([A-Za-z0-9_+-]*)\s*$/;
const commentSplitRx = /^(.*\S)( +)#(.*)$/;

let failed = 0;

const assert = (ok, msg) => {
    if (!ok) {
        console.error("FAIL " + msg);
        failed++;
    }
};

const collectMdFiles = (rootDir, out) => {
    const pending = [rootDir];
    while (pending.length > 0) {
        const dir = pending.pop();
        fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
            if (skipDirs.has(entry.name)) return;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                pending.push(full);
                return;
            }
            if (/\.(md|mdc)$/.test(entry.name)) {
                out.push(full);
            }
        });
    }
    return out;
};

const findCommandFences = (lines) => {
    const fences = [];
    let ix = 0;
    while (ix < lines.length) {
        const openMatch = lines[ix].trim().match(fenceOpenRx);
        if (!openMatch) {
            ix++;
            continue;
        }
        const lang = openMatch[1].toLowerCase();
        let end = ix + 1;
        while (end < lines.length && lines[end].trim() !== "```") {
            end++;
        }
        if (cmdLangs.has(lang)) {
            fences.push([ix + 1, end]);
        }
        ix = end + 1;
    }
    return fences;
};

const splitGroups = (block) => {
    const groups = [];
    let curr = [];
    let currBeg = 0;
    block.forEach((line, ix) => {
        if (line.trim() === "") {
            if (curr.length > 0) groups.push([currBeg, curr]);
            curr = [];
            currBeg = ix + 1;
            return;
        }
        if (curr.length === 0) currBeg = ix;
        curr.push(line);
    });
    if (curr.length > 0) groups.push([currBeg, curr]);
    return groups;
};

const parseLine = (line) => {
    const trimStart = line.replace(/^\s+/, "");
    if (trimStart.startsWith("#")) return { kind: "commentOnly" };
    const m = line.match(commentSplitRx);
    if (!m) return { kind: "plain", text: line };
    return { kind: "inline", text: m[1], comment: m[3] };
};

const checkGroup = (relPath, blockBeg, groupBeg, groupLines, errlist) => {
    const parsed = groupLines.map(parseLine);
    const relevant = parsed.filter(p => p.kind !== "commentOnly");
    const inlineCount = relevant.filter(p => p.kind === "inline").length;
    if (inlineCount < 2) return;
    const anchor = Math.max(...relevant.map(p => p.text.length));
    groupLines.forEach((line, ix) => {
        const p = parsed[ix];
        if (p.kind !== "inline") return;
        const expected = p.text.padEnd(anchor) + "    #" + p.comment;
        if (line !== expected) {
            const lineNo = blockBeg + groupBeg + ix + 1;
            errlist.push(`${relPath}:L${lineNo}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(line)}`);
        }
    });
};

const checkFile = (filePath, errlist) => {
    const relPath = path.relative(repoRoot, filePath);
    const lines = fs.readFileSync(filePath, "utf8").split("\n");
    findCommandFences(lines).forEach(([beg, end]) => {
        const block = lines.slice(beg, end);
        splitGroups(block).forEach(([groupBeg, groupLines]) => {
            checkGroup(relPath, beg, groupBeg, groupLines, errlist);
        });
    });
};

const errlist = [];
collectMdFiles(repoRoot, []).forEach(filePath => {
    checkFile(filePath, errlist);
});
errlist.forEach(msg => assert(false, msg));

if (failed > 0) {
    console.error(`\n${failed} markdown inline-comment alignment check(s) failed`);
    process.exit(1);
}

console.log("OK   markdown inline-comment alignment (fenced command blocks)");
