"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeblockPrecededByColonRule = void 0;
const base_rule_1 = require("../core/base-rule");
const details_1 = require("../details");
class CodeblockPrecededByColonRule extends base_rule_1.BaseRule {
    constructor(colonChecker, codeWalker) {
        super();
        this.colonChecker = colonChecker;
        this.codeWalker = codeWalker;
        this.names = ["codeblock-preceded-by-colon"];
        this.description = details_1.details.codeblockColon;
        this.tags = ["code"];
    }
    check(lines, onError) {
        this.codeWalker.eachOpeningCodeFence(lines, (ix) => {
            this.colonChecker.checkPrecededByColon(lines, ix, onError, this.description);
        });
    }
}
exports.CodeblockPrecededByColonRule = CodeblockPrecededByColonRule;
