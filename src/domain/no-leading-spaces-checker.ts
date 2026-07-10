import type { RuleOnError } from "markdownlint";
import { headingRx } from "../regex";
import type { ListLineParser } from "./list-line-parser";
import { walkCodeFenceAware } from "./outside-code-lines";

export class NoLeadingSpacesChecker {
    constructor(private readonly lineParser: ListLineParser) {}

    checkLines(lines: readonly string[], onError: RuleOnError, description: string): void {
        walkCodeFenceAware(lines, {
            onFence: (line, ix) => {
                const currInd = this.lineParser.getIndent(line);
                if (currInd > 0) {
                    onError({ lineNumber: ix + 1, detail: description, context: line });
                }
            },
            onOutside: (line, ix, trim) => {
                if (headingRx.test(trim)) return;
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
