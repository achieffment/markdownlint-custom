"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentencesEndMarkChecker = void 0;
const outside_code_lines_1 = require("./outside-code-lines");
const regex_1 = require("../regex");
class SentencesEndMarkChecker {
    constructor(lineParser) {
        this.lineParser = lineParser;
    }
    checkLines(lines, onError, description) {
        let inQuote = false;
        (0, outside_code_lines_1.eachLineOutsideCode)(lines, (line, ix, trim) => {
            if (!trim) {
                inQuote = false;
                return;
            }
            if (regex_1.headingRx.test(trim) || trim.startsWith(">") || regex_1.hrRx.test(trim)) {
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
                onError({ lineNumber: ix + 1, detail: description, context: trim });
            }
        });
    }
}
exports.SentencesEndMarkChecker = SentencesEndMarkChecker;
