const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const rootDir = __dirname;
const srcDir = path.join(rootDir, "src");
const testsDir = path.join(rootDir, "tests");

const collectTsFiles = (dir, out) => {
    fs.readdirSync(dir).forEach(name => {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) {
            collectTsFiles(full, out);
            return;
        }
        if (name.endsWith(".ts")) out.push(full);
    });
};

const collectCjsFiles = (dir, out) => {
    fs.readdirSync(dir).forEach(name => {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) {
            collectCjsFiles(full, out);
            return;
        }
        if (name.endsWith(".cjs")) out.push(full);
    });
};

const files = [];
collectTsFiles(srcDir, files);
collectCjsFiles(testsDir, files);

const isFnInit = (node) => ts.isArrowFunction(node) || ts.isFunctionExpression(node);

const getMemberBody = (node) => {
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isConstructorDeclaration(node)) {
        return node.body ?? null;
    }
    if (ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) {
        return node.body ?? null;
    }
    if (ts.isVariableDeclaration(node) && node.initializer && isFnInit(node.initializer)) {
        return node.initializer.body ?? null;
    }
    return null;
};

const getMemberName = (node) => {
    if (ts.isConstructorDeclaration(node)) return "constructor";
    if (node.name && ts.isIdentifier(node.name)) return node.name.text;
    return null;
};

const getLine = (source, node) => source.getLineAndCharacterOfPosition(node.getStart()).line + 1;

const collectScopeMembers = (source, nodes) => {
    const members = [];
    nodes.forEach(node => {
        if (ts.isFunctionDeclaration(node) && node.name) {
            members.push({ name: node.name.text, line: getLine(source, node), node, body: node.body });
            return;
        }
        if (ts.isMethodDeclaration(node) || ts.isConstructorDeclaration(node)
            || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) {
            const name = getMemberName(node);
            if (!name) return;
            members.push({ name, line: getLine(source, node), node, body: getMemberBody(node) });
            return;
        }
        if (ts.isVariableStatement(node)) {
            node.declarationList.declarations.forEach(decl => {
                if (!ts.isIdentifier(decl.name) || !decl.initializer || !isFnInit(decl.initializer)) return;
                members.push({
                    name: decl.name.text,
                    line: getLine(source, decl),
                    node: decl,
                    body: getMemberBody(decl)
                });
            });
        }
    });
    return members;
};

const collectCalleeNames = (bodyNode, siblingNames, inClass) => {
    const refs = new Set();
    if (!bodyNode) return refs;

    const visit = (node) => {
        if (ts.isCallExpression(node)) {
            const expr = node.expression;
            if (ts.isIdentifier(expr) && siblingNames.has(expr.text)) {
                refs.add(expr.text);
            } else if (inClass && ts.isPropertyAccessExpression(expr)
                && expr.expression.kind === ts.SyntaxKind.ThisKeyword
                && ts.isIdentifier(expr.name) && siblingNames.has(expr.name.text)) {
                refs.add(expr.name.text);
            }
        }
        ts.forEachChild(node, visit);
    };

    visit(bodyNode);
    return refs;
};

const findCycles = (names, edges) => {
    const cycles = [];
    const visited = new Set();
    const stack = new Set();
    const path = [];

    const dfs = (name) => {
        if (stack.has(name)) {
            const start = path.indexOf(name);
            if (start >= 0) cycles.push(path.slice(start).concat(name));
            return;
        }
        if (visited.has(name)) return;
        visited.add(name);
        stack.add(name);
        path.push(name);
        (edges.get(name) || []).forEach(dep => dfs(dep));
        path.pop();
        stack.delete(name);
    };

    names.forEach(name => dfs(name));
    return cycles;
};

const checkScope = (source, relPath, nodes, inClass, violations, cycles) => {
    const members = collectScopeMembers(source, nodes);
    if (members.length >= 2) {
        const siblingNames = new Set(members.map(m => m.name));
        const nameToIdx = new Map(members.map((m, i) => [m.name, i]));
        const nameToLine = new Map(members.map(m => [m.name, m.line]));
        const edges = new Map();

        members.forEach(member => {
            const refs = collectCalleeNames(member.body, siblingNames, inClass);
            edges.set(member.name, [...refs]);
            refs.forEach(callee => {
                const callerIdx = nameToIdx.get(member.name);
                const calleeIdx = nameToIdx.get(callee);
                if (callerIdx === undefined || calleeIdx === undefined) return;
                if (calleeIdx >= callerIdx) {
                    violations.push({
                        relPath,
                        line: member.line,
                        caller: member.name,
                        callee,
                        calleeLine: nameToLine.get(callee)
                    });
                }
            });
        });

        findCycles(members.map(m => m.name), edges).forEach(cycle => {
            const key = [...new Set(cycle)].sort().join("|");
            if (cycles.has(key)) return;
            cycles.add(key);
            violations.push({
                relPath,
                line: nameToLine.get(cycle[0]) ?? members[0].line,
                cycle: [...new Set(cycle)]
            });
        });
    }

    members.forEach(member => {
        const body = member.body;
        if (!body || !ts.isBlock(body)) return;
        checkScope(source, relPath, body.statements, false, violations, cycles);
    });
};

const processSourceFile = (filePath, violations, cycles) => {
    const content = fs.readFileSync(filePath, "utf8");
    const kind = filePath.endsWith(".cjs") ? ts.ScriptKind.JS : ts.ScriptKind.TS;
    const source = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, kind);
    const relPath = path.relative(rootDir, filePath);

    checkScope(source, relPath, source.statements, false, violations, cycles);

    source.statements.forEach(stmt => {
        if (ts.isClassDeclaration(stmt) && stmt.name) {
            checkScope(source, relPath, stmt.members, true, violations, cycles);
        }
    });
};

const violations = [];
const cycles = new Set();
files.forEach(filePath => processSourceFile(filePath, violations, cycles));

const orderViolations = violations.filter(v => v.caller);
const cycleViolations = violations.filter(v => v.cycle);

let failed = 0;

orderViolations.forEach(v => {
    console.error(
        `FAIL ${v.relPath}:${v.line}: caller "${v.caller}" uses "${v.callee}" defined later (line ${v.calleeLine})`
    );
    failed++;
});

cycleViolations.forEach(v => {
    console.error(
        `FAIL ${v.relPath}:${v.line}: circular dependency between ${v.cycle.map(n => `"${n}"`).join(" ↔ ")}`
    );
    failed++;
});

if (failed === 0) {
    console.log(`OK   function order (${files.length} files)`);
    process.exit(0);
}

console.error(`\n${failed} function order violation(s)`);
process.exit(1);
