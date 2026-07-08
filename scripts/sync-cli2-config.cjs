const fs = require("fs");
const path = require("path");

const repoRoot = path.join(__dirname, "..");
const schemaPath = process.argv[2] || path.join(repoRoot, "schema", ".markdownlint.jsonc");
const outPath = process.argv[3] || path.join(repoRoot, ".markdownlint-cli2.jsonc");

let body = fs.readFileSync(schemaPath, "utf8");
body = body.replace(/^\/\/ Example[^\n]*\n{\n\n/, "");
body = body.replace(/  \/\/ Path to configuration[^\n]*\n  "extends": null,\n\n/, "");
body = body.replace(
    /  \/\/ MD013[^\n]*\n  "MD013": \{[\s\S]*?\n  \},/,
    `  // MD013/line-length — дефолт vscode-markdownlint: отключено (line-length)
  "MD013": false,`
);
body = body.replace(
    /  \/\/ MD029[^\n]*\n  "MD029": \{[\s\S]*?\n  \},/,
    `  // MD029/ol-prefix — дефолт: { "style": "one_or_ordered" }
  // Намеренно отключено: поднумерация 1.1 / 1.1.1 в custom rules
  "MD029": false,`
);
body = body.replace(
    /  \/\/ MD046[^\n]*\n  "MD046": \{[\s\S]*?\n  \},/,
    `  // MD046/code-block-style — дефолт: { "style": "consistent" }
  // Намеренно отключено: политика fenced code в examples / custom rules
  "MD046": false,`
);
body = body.replace(
    /  \/\/ MD007[^\n]*\n  "MD007": \{[\s\S]*?\n  \},/,
    `  // MD007/ul-indent — пересекается с custom no-leading-spaces
  "MD007": false,`
);
body = body.replace(
    /  \/\/ MD032[^\n]*\n  "MD032": true,/,
    `  // MD032/blanks-around-lists — заменено custom list-blank-line-spacing
  "MD032": false,`
);
body = body.replace(
    /  \/\/ MD043[^\n]*\n  "MD043": \{[\s\S]*?\n  \},/,
    `  // MD043/required-headings — дефолт schema с "headings": [] некорректно срабатывает; отключено
  "MD043": false,`
);
body = body.replace(/\n\}$/, `,

  // Custom rules (markdownlint-custom)
  "minimum-h2-heading": true,
  "list-items-end-with-semicolon-or-colon": true,
  "list-blank-line-spacing": true,
  "list-preceded-by-colon": true,
  "codeblock-preceded-by-colon": true,
  "no-leading-spaces": true,
  "sentences-end-with-mark": true`);
const indented = body.split("\n").map(line => line ? "  " + line : line).join("\n");
const out = `// markdownlint-cli2 — единый конфиг для IDE, CLI и bin-скриптов
// Scope: правила для пользовательских папок с документацией; meta-файлы репозитория — в ignores
{
  "customRules": ["./markdownlint-rules.js"],
  "ignores": [
    "README.md",
    "AGENTS.md",
    ".cursor/**"
  ],
  "config": {
${indented}
  },
  "globs": ["**/*.{md,markdown}", "!node_modules"]
}
`;
fs.writeFileSync(outPath, out);
console.log("written", outPath);
