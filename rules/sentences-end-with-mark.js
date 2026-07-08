"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentencesEndMarkRule = void 0;
const base_rule_1 = require("../core/base-rule");
const details_1 = require("../details");
const markdown_document_1 = require("../domain/markdown-document");
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
        const doc = new markdown_document_1.MarkdownDocument(lines, this.codeWalker, this.lineParser);
        doc.eachLineOutsideCode((line, ix, trim) => {
            if (!trim)
                return;
            if (trim.startsWith("#") || trim.startsWith(">") || regex_1.hrRx.test(trim))
                return;
            if (this.lineParser.isLstItem(line))
                return;
            if (!regex_1.endsWithMarkRx.test(trim)) {
                onError({ lineNumber: ix + 1, detail: this.description, context: trim });
            }
        });
    }
}
exports.SentencesEndMarkRule = SentencesEndMarkRule;
