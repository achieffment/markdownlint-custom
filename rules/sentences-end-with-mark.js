"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentencesEndMarkRule = void 0;
const base_rule_1 = require("../core/base-rule");
const details_1 = require("../details");
const regex_1 = require("../regex");
class SentencesEndMarkRule extends base_rule_1.BaseRule {
    constructor(codeWalker, lineParser) {
        super();
        this.codeWalker = codeWalker;
        this.lineParser = lineParser;
        this.names = ["sentences-end-with-mark"];
        this.description = details_1.details.sentencesEndMark;
        this.tags = ["formatting"];
    }
    check(lines, onError) {
        let inQuote = false;
        this.codeWalker.eachLineOutsideCode(lines, (line, ix, trim) => {
            if (!trim) {
                inQuote = false;
                return;
            }
            if (trim.startsWith("#") || trim.startsWith(">") || regex_1.hrRx.test(trim)) {
                inQuote = trim.startsWith(">");
                return;
            }
            if (inQuote)
                return;
            if (this.lineParser.isLstItem(line))
                return;
            if (regex_1.tableRowRx.test(trim))
                return;
            if (!regex_1.endsWithMarkRx.test(trim)) {
                onError({ lineNumber: ix + 1, detail: this.description, context: trim });
            }
        });
    }
}
exports.SentencesEndMarkRule = SentencesEndMarkRule;
