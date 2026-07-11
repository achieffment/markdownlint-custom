const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = __dirname;

let failed = 0;

const assert = (ok, msg) => {
    if (!ok) {
        console.error("FAIL " + msg);
        failed++;
    }
};

const cli2Bin = path.join(
    repoRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "markdownlint-cli2.cmd" : "markdownlint-cli2"
);

const testNativeGitignoreRelative = () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "markdownlint-ignore-native-"));
    fs.mkdirSync(path.join(tmp, "ignored"));
    fs.writeFileSync(path.join(tmp, "ignored", "bad.md"), "no heading\n");
    fs.writeFileSync(path.join(tmp, "ok.md"), "# Heading\n");
    fs.writeFileSync(path.join(tmp, ".markdownlint-ignore"), "ignored/\n");
    fs.writeFileSync(
        path.join(tmp, ".markdownlint-cli2.jsonc"),
        JSON.stringify({ gitignore: ".markdownlint-ignore", globs: ["**/*.md"] })
    );

    const withIgnore = spawnSync(cli2Bin, [], {
        cwd: tmp,
        shell: process.platform === "win32",
        encoding: "utf8"
    });
    assert(withIgnore.status === 0,
        `native "gitignore" config excludes ignored/bad.md: ${withIgnore.stdout}${withIgnore.stderr}`);

    fs.rmSync(path.join(tmp, ".markdownlint-ignore"));
    const withoutIgnore = spawnSync(cli2Bin, [], {
        cwd: tmp,
        shell: process.platform === "win32",
        encoding: "utf8"
    });
    assert(withoutIgnore.status !== 0,
        "without the ignore file, ignored/bad.md is linted and fails (control case)");

    fs.rmSync(tmp, { recursive: true, force: true });
};

testNativeGitignoreRelative();

if (failed > 0) {
    console.error(`\n${failed} markdownlint-ignore check(s) failed`);
    process.exit(1);
}

console.log("OK   markdownlint-ignore (relative paths via cli2 native gitignore)");
