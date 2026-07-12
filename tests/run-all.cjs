const { getFailed } = require("./helpers.cjs");

require("./examples.test.cjs");

require("./hlprs.test.cjs");
require("./rules/minimum-h2-heading.test.cjs");
require("./rules/list-items-end-with-semicolon-or-colon.test.cjs");
require("./rules/list-blank-line-spacing.test.cjs");
require("./rules/list-preceded-by-colon.test.cjs");
require("./rules/codeblock-preceded-by-colon.test.cjs");
require("./rules/no-leading-spaces.test.cjs");
require("./rules/sentences-end-with-mark.test.cjs");

if (getFailed() > 0) {
    console.error(`\n${getFailed()} check(s) failed`);
    process.exit(1);
}
console.log("\nAll checks passed");
