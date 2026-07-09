"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoLeadingSpacesRule = void 0;
const base_rule_1 = require("../core/base-rule");
const details_1 = require("../details");
const regex_1 = require("../regex");
class NoLeadingSpacesRule extends base_rule_1.BaseRule {
    constructor(codeWalker, lineParser) {
        super();
        this.codeWalker = codeWalker;
        this.lineParser = lineParser;
        this.names = ["no-leading-spaces"];
        this.description = details_1.details.noLeadingSpaces;
        this.tags = ["formatting"];
    }
    check(lines, onError) {
        this.codeWalker.walkCodeFenceAware(lines, {
            onFence: (line, ix) => {
                const currInd = this.lineParser.getIndent(line);
                if (currInd > 0) {
                    onError({ lineNumber: ix + 1, detail: this.description, context: line });
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
                            onError({ lineNumber: ix + 1, detail: this.description, context: line });
                        }
                    }
                    return;
                }
                if (currInd > 0) {
                    onError({ lineNumber: ix + 1, detail: this.description, context: line });
                }
            }
        });
    }
}
exports.NoLeadingSpacesRule = NoLeadingSpacesRule;
