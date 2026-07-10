"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListPrecededByColonRule = void 0;
const base_rule_1 = require("../core/base-rule");
const details_1 = require("../details");
class ListPrecededByColonRule extends base_rule_1.BaseRule {
    constructor(colonChecker) {
        super();
        this.colonChecker = colonChecker;
        this.names = ["list-preceded-by-colon"];
        this.description = details_1.details.listPrecededByColon;
        this.tags = ["lists"];
    }
    get parser() {
        return "micromark";
    }
    checkMicromark(params, onError) {
        this.colonChecker.checkListPrecededByColon(params.lines, onError, this.description);
    }
}
exports.ListPrecededByColonRule = ListPrecededByColonRule;
