"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinimumH2Rule = void 0;
const base_rule_1 = require("../core/base-rule");
const details_1 = require("../details");
const regex_1 = require("../regex");
class MinimumH2Rule extends base_rule_1.BaseRule {
    constructor(codeWalker) {
        super();
        this.codeWalker = codeWalker;
        this.names = ["minimum-h2-heading"];
        this.description = details_1.details.minimumH2;
        this.tags = ["headings"];
    }
    check(lines, onError) {
        let hasH2 = false;
        this.codeWalker.eachLineOutsideCode(lines, (_line, _ix, trim) => {
            if (regex_1.h2Rx.test(trim))
                hasH2 = true;
        });
        if (!hasH2) {
            onError({ lineNumber: 1, detail: this.description });
        }
    }
}
exports.MinimumH2Rule = MinimumH2Rule;
