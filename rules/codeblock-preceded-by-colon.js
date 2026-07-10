"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeblockPrecededByColonRule = void 0;
const base_rule_1 = require("../core/base-rule");
const details_1 = require("../details");
class CodeblockPrecededByColonRule extends base_rule_1.BaseRule {
    constructor(colonChecker) {
        super();
        this.colonChecker = colonChecker;
        this.names = ["codeblock-preceded-by-colon"];
        this.description = details_1.details.codeblockColon;
        this.tags = ["code"];
    }
    get parser() {
        return "micromark";
    }
    checkMicromark(params, onError) {
        this.colonChecker.checkOpeningCodeFences(params.lines, onError, this.description);
    }
}
exports.CodeblockPrecededByColonRule = CodeblockPrecededByColonRule;
