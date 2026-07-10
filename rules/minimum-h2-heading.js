"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinimumH2Rule = void 0;
const base_rule_1 = require("../core/base-rule");
const details_1 = require("../details");
const micromark_heading_1 = require("../domain/micromark-heading");
class MinimumH2Rule extends base_rule_1.BaseRule {
    constructor() {
        super(...arguments);
        this.names = ["minimum-h2-heading"];
        this.description = details_1.details.minimumH2;
        this.tags = ["headings"];
    }
    get parser() {
        return "micromark";
    }
    checkMicromark(params, onError) {
        const tokens = params.parsers.micromark?.tokens ?? [];
        if (!(0, micromark_heading_1.hasMinimumH2)(tokens)) {
            onError({ lineNumber: 1, detail: this.description });
        }
    }
}
exports.MinimumH2Rule = MinimumH2Rule;
