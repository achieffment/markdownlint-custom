"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoLeadingSpacesChecker = void 0;
const regex_1 = require("../regex");
const outside_code_lines_1 = require("./outside-code-lines");
class NoLeadingSpacesChecker {
    constructor(lineParser) {
        this.lineParser = lineParser;
    }
    checkLines(lines, onError, description) {
        (0, outside_code_lines_1.walkCodeFenceAware)(lines, {
            onFence: (line, ix) => {
                const currInd = this.lineParser.getIndent(line);
                if (currInd > 0) {
                    onError({ lineNumber: ix + 1, detail: description, context: line });
                }
            },
            onOutside: (line, ix, trim) => {
                if (regex_1.headingRx.test(trim))
                    return;
                const currInd = this.lineParser.getIndent(line);
                if (this.lineParser.isLstItem(line)) {
                    if (currInd > 0) {
                        const prevInd = this.lineParser.findPrevListInd(lines, ix);
                        if (prevInd < 0 || currInd < prevInd) {
                            onError({ lineNumber: ix + 1, detail: description, context: line });
                        }
                    }
                    return;
                }
                if (currInd > 0) {
                    onError({ lineNumber: ix + 1, detail: description, context: line });
                }
            }
        });
    }
}
exports.NoLeadingSpacesChecker = NoLeadingSpacesChecker;
