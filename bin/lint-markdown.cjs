const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { sendWebhook } = require("../notify.js");

const repoRoot = path.join(__dirname, "..");
const nodeModules = path.join(repoRoot, "node_modules");
const lockPath = path.join(repoRoot, "package-lock.json");
const rulesJs = path.join(repoRoot, "markdownlint-rules.js");
const hlprsJs = path.join(repoRoot, "markdownlint-hlprs.js");
const cli2Bin = path.join(
    nodeModules,
    ".bin",
    process.platform === "win32" ? "markdownlint-cli2.cmd" : "markdownlint-cli2"
);

const usage = () => {
    console.log("Usage: lint-markdown <targetPath> [-- extra cli2 args]");
    console.log("       lint-markdown -- <targetPath> [extra cli2 args]");
    console.log("  targetPath — обязательный: файл или папка с markdown");
    console.log("  --help, -h — справка");
};

const runNpm = (args) => {
    const res = spawnSync("npm", args, {
        cwd: repoRoot,
        shell: process.platform === "win32",
        stdio: "inherit"
    });
    if (res.error) {
        console.error(res.error.message);
        process.exit(1);
    }
    if (res.status !== 0) {
        process.exit(res.status ?? 1);
    }
};

const ensureNodeModules = () => {
    if (fs.existsSync(nodeModules)) return;
    if (fs.existsSync(lockPath)) {
        console.log("Installing dependencies (npm ci)…");
        runNpm(["ci"]);
        return;
    }
    console.log("Installing dependencies (npm install)…");
    runNpm(["install"]);
};

const srcDir = path.join(repoRoot, "src");

const newestMtime = (dir) => {
    let newest = 0;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const fp = path.join(dir, ent.name);
        if (ent.isDirectory()) {
            newest = Math.max(newest, newestMtime(fp));
            continue;
        }
        if (ent.name.endsWith(".ts")) {
            newest = Math.max(newest, fs.statSync(fp).mtimeMs);
        }
    }
    return newest;
};

const artifactDirs = ["domain", "rules", "core", "composition"];
const rootArtifacts = [
    rulesJs,
    hlprsJs,
    path.join(repoRoot, "details.js"),
    path.join(repoRoot, "regex.js"),
    path.join(repoRoot, "types.js"),
    path.join(repoRoot, "notify.js")
];

const oldestArtifactMtime = () => {
    let oldest = Infinity;
    const track = (fp) => {
        if (!fs.existsSync(fp)) {
            oldest = 0;
            return;
        }
        oldest = Math.min(oldest, fs.statSync(fp).mtimeMs);
    };
    rootArtifacts.forEach(track);
    artifactDirs.forEach((dirName) => {
        const dirPath = path.join(repoRoot, dirName);
        if (!fs.existsSync(dirPath)) {
            oldest = 0;
            return;
        }
        for (const ent of fs.readdirSync(dirPath, { withFileTypes: true })) {
            if (ent.isFile() && ent.name.endsWith(".js")) {
                track(path.join(dirPath, ent.name));
            }
        }
    });
    return oldest === Infinity ? 0 : oldest;
};

const artifactsStale = () => {
    if (!fs.existsSync(rulesJs) || !fs.existsSync(hlprsJs)) return true;
    const srcNewest = newestMtime(srcDir);
    return srcNewest > oldestArtifactMtime();
};

const ensureBuild = () => {
    if (!artifactsStale()) return;
    console.log("Building custom rules (npm run build)…");
    runNpm(["run", "build"]);
};

const parseArgs = (argv) => {
    const args = argv.slice(2);
    const rest = [];
    for (let ix = 0; ix < args.length; ix++) {
        const arg = args[ix];
        if (arg === "--help" || arg === "-h") {
            usage();
            process.exit(0);
        }
        if (arg === "--") {
            rest.push(...args.slice(ix + 1));
            break;
        }
        rest.push(...args.slice(ix));
        break;
    }
    let target;
    let passthrough = [];
    if (rest.length > 0 && !rest[0].startsWith("-")) {
        target = rest[0];
        passthrough = rest.slice(1);
    } else {
        passthrough = rest;
    }
    if (passthrough[0] === "--") {
        passthrough = passthrough.slice(1);
    }
    return { target, passthrough };
};

const isWinPathLike = (target) => /^[a-zA-Z]:[\\/]/.test(target) || target.startsWith("\\\\");
const isWslPathLike = (target) => target.startsWith("/");

const isWsl = () => {
    if (process.platform !== "linux") return false;
    try {
        return fs.readFileSync("/proc/version", "utf-8").toLowerCase().includes("microsoft");
    } catch {
        return Boolean(process.env.WSL_DISTRO_NAME);
    }
};

const convertPath = (cmd, args) => {
    const conv = spawnSync(cmd, args, { encoding: "utf-8" });
    if (conv.error || conv.status !== 0) return null;
    return conv.stdout.trim() || null;
};

// Путь в чужом для платформы формате конвертируется через wslpath (см. platform-scripts.md).
const crossPlatformPath = (target) => {
    if (process.platform === "win32" && isWslPathLike(target)) {
        return convertPath("wsl", ["wslpath", "-w", target]);
    }
    if (isWsl() && isWinPathLike(target)) {
        return convertPath("wslpath", ["-u", target]);
    }
    return null;
};

const targetToGlobs = (target) => {
    let abs = path.resolve(repoRoot, target);
    if (!fs.existsSync(abs)) {
        const converted = crossPlatformPath(target);
        if (converted) {
            abs = path.resolve(converted);
        }
    }
    if (!fs.existsSync(abs)) {
        console.error(`Path not found: ${target}`);
        process.exit(1);
    }
    const st = fs.statSync(abs);
    if (st.isFile()) {
        const rel = path.relative(repoRoot, abs).replace(/\\/g, "/");
        return [`:${rel}`];
    }
    const rel = path.relative(repoRoot, abs).replace(/\\/g, "/");
    const base = rel === "" ? "." : rel;
    return [
        `${base}/**/*.{md,markdown}`,
        "#node_modules",
        "#vendor"
    ];
};

const main = async () => {
    const { target, passthrough } = parseArgs(process.argv);
    if (!target) {
        usage();
        process.exit(1);
    }
    ensureNodeModules();
    ensureBuild();

    if (!fs.existsSync(cli2Bin)) {
        console.error("markdownlint-cli2 not found; run npm install");
        process.exit(1);
    }

    const globs = targetToGlobs(target);
    const cliArgs = ["--no-globs", ...globs, ...passthrough];
    const res = spawnSync(cli2Bin, cliArgs, {
        cwd: repoRoot,
        shell: process.platform === "win32",
        stdio: "inherit"
    });
    if (res.error) {
        console.error(res.error.message);
        process.exit(1);
    }
    if (res.status) {
        // Уведомление о нарушениях lint: fire-and-forget, ошибки/таймаут не влияют на код возврата.
        await sendWebhook("markdownlint-custom: ошибка lint");
    }
    process.exit(res.status ?? 0);
};

main();
