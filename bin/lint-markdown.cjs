const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

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

const ensureBuild = () => {
    if (fs.existsSync(rulesJs) && fs.existsSync(hlprsJs)) return;
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
    return { target, passthrough };
};

const targetToGlobs = (target) => {
    const abs = path.resolve(repoRoot, target);
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
        "#node_modules"
    ];
};

const hasExplicitTarget = (argv) => {
    const args = argv.slice(2);
    for (let ix = 0; ix < args.length; ix++) {
        const arg = args[ix];
        if (arg === "--help" || arg === "-h") return false;
        if (arg === "--") {
            return args.slice(ix + 1).some(a => !a.startsWith("-"));
        }
        if (!arg.startsWith("-")) return true;
    }
    return false;
};

const main = () => {
    const { target, passthrough } = parseArgs(process.argv);
    if (!hasExplicitTarget(process.argv)) {
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
    process.exit(res.status ?? 0);
};

main();
