"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListBlankSpacingRule = void 0;
const base_rule_1 = require("../core/base-rule");
const details_1 = require("../details");
class ListBlankSpacingRule extends base_rule_1.BaseRule {
    constructor(spacingChecker) {
        super();
        this.spacingChecker = spacingChecker;
        this.names = ["list-blank-line-spacing"];
        this.description = details_1.details.listBlankSpacing;
        this.tags = ["lists"];
    }
    get parser() {
        return "micromark";
    }
    checkMicromark(params, onError) {
        const tokens = params.parsers.micromark?.tokens ?? [];
        this.spacingChecker.checkMicromark(params.lines, tokens, onError, {
            bef: details_1.details.listBlankBef,
            aft: details_1.details.listBlankAft,
            gap: details_1.details.listBlankGap
        });
    }
}
exports.ListBlankSpacingRule = ListBlankSpacingRule;
