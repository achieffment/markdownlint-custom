"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListItemsEndRule = void 0;
const base_rule_1 = require("../core/base-rule");
const details_1 = require("../details");
class ListItemsEndRule extends base_rule_1.BaseRule {
    constructor(listItemsChecker) {
        super();
        this.listItemsChecker = listItemsChecker;
        this.names = ["list-items-end-with-semicolon-or-colon"];
        this.description = details_1.details.listItemsEnd;
        this.tags = ["lists"];
    }
    get parser() {
        return "micromark";
    }
    checkMicromark(params, onError) {
        const tokens = this.getMicromarkTokens(params);
        this.listItemsChecker.checkMicromark(params.lines, tokens, onError, {
            empty: details_1.details.listItemsEmpty,
            colon: details_1.details.listItemsColon,
            semi: details_1.details.listItemsSemi
        });
    }
}
exports.ListItemsEndRule = ListItemsEndRule;
