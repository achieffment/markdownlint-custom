const fs = require("fs");
const path = require("path");

const repoRoot = path.join(__dirname, "..");
const skipDirs = new Set(["node_modules", ".git"]);
const sepCellRx = /^:?-+:?$/;

let failed = 0;

const assert = (ok, msg) => {
    if (!ok) {
        console.error("FAIL " + msg);
        failed++;
    }
};

const isRow = (line) => {
    const bare = line.trim();
    return bare.startsWith("|") && bare.endsWith("|") && bare.length >= 2;
};

const splitCells = (line) => {
    const bare = line.trim();
    let masked = bare.replace(/\\\|/g, "\x00");
    if (masked.startsWith("|")) {
        masked = masked.slice(1);
    }
    if (masked.endsWith("|")) {
        masked = masked.slice(0, -1);
    }
    return masked.split("|").map(cell => cell.replace(/\x00/g, "\\|").trim());
};

const isSeparatorRow = (line) => {
    const cells = splitCells(line);
    return cells.length > 0 && cells.every(cell => sepCellRx.test(cell));
};

const findTables = (lines) => {
    const tables = [];
    let ix = 0;
    while (ix < lines.length - 1) {
        if (isRow(lines[ix]) && isSeparatorRow(lines[ix + 1])) {
            const beg = ix;
            let end = ix + 2;
            while (end < lines.length && isRow(lines[end])) {
                end++;
            }
            tables.push([beg, end]);
            ix = end;
        } else {
            ix++;
        }
    }
    return tables;
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

const buildExpectedRow = (row, widths) => {
    const cells = row.map((cell, ix) => cell.padEnd(widths[ix]));
    return "| " + cells.join(" | ") + " |";
};

const buildExpectedSep = (widths) => {
    return "|" + widths.map(width => "-".repeat(width + 2)).join("|") + "|";
};

const checkTable = (relPath, lines, beg, end, errlist) => {
    const block = lines.slice(beg, end);
    const rows = block.map(line => splitCells(line));
    const ncol = rows[0].length;
    if (rows.some(row => row.length !== ncol)) return;
    const widths = new Array(ncol).fill(3);
    rows.forEach((row, rowIx) => {
        if (rowIx === 1) return;
        row.forEach((cell, colIx) => {
            widths[colIx] = Math.max(widths[colIx], cell.length);
        });
    });
    block.forEach((line, rowIx) => {
        const expected = rowIx === 1 ? buildExpectedSep(widths) : buildExpectedRow(rows[rowIx], widths);
        if (line !== expected) {
            errlist.push(`${relPath}:L${beg + rowIx + 1}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(line)}`);
        }
    });
};

const checkFile = (filePath, errlist) => {
    const relPath = path.relative(repoRoot, filePath);
    const lines = fs.readFileSync(filePath, "utf8").split("\n");
    findTables(lines).forEach(([beg, end]) => {
        checkTable(relPath, lines, beg, end, errlist);
    });
};

const errlist = [];
collectMdFiles(repoRoot, []).forEach(filePath => {
    checkFile(filePath, errlist);
});
errlist.forEach(msg => assert(false, msg));

if (failed > 0) {
    console.error(`\n${failed} markdown table alignment check(s) failed`);
    process.exit(1);
}

console.log("OK   markdown table alignment (column width padding)");
