"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentencesEndMarkRule = void 0;
const base_rule_1 = require("../core/base-rule");
const details_1 = require("../details");
class SentencesEndMarkRule extends base_rule_1.BaseRule {
    constructor(proseChecker) {
        super();
        this.proseChecker = proseChecker;
        this.names = ["sentences-end-with-mark"];
        this.description = details_1.details.sentencesEndMark;
        this.tags = ["formatting"];
    }
    get parser() {
        return "micromark";
    }
    checkMicromark(params, onError) {
        this.proseChecker.checkLines(params.lines, onError, this.description);
    }
}
exports.SentencesEndMarkRule = SentencesEndMarkRule;
