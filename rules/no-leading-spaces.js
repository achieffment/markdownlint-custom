"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoLeadingSpacesRule = void 0;
const base_rule_1 = require("../core/base-rule");
const details_1 = require("../details");
class NoLeadingSpacesRule extends base_rule_1.BaseRule {
    constructor(indentChecker) {
        super();
        this.indentChecker = indentChecker;
        this.names = ["no-leading-spaces"];
        this.description = details_1.details.noLeadingSpaces;
        this.tags = ["formatting"];
    }
    check(params, onError) {
        this.indentChecker.checkLines(params.lines, onError, this.description);
    }
}
exports.NoLeadingSpacesRule = NoLeadingSpacesRule;
