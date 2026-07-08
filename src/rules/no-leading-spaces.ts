import type { RuleOnError } from "markdownlint";
import { BaseRule } from "../core/base-rule";
import { details } from "../details";
import type { CodeWalker } from "../domain/code-walker";
import type { ListLineParser } from "../domain/list-line-parser";

export class NoLeadingSpacesRule extends BaseRule {
    readonly names = ["no-leading-spaces"];
    readonly description = details.noLeadingSpaces;
    readonly tags = ["formatting"];

    constructor(
        private readonly codeWalker: CodeWalker,
        private readonly lineParser: ListLineParser
    ) {
        super();
    }

    check(lines: readonly string[], onError: RuleOnError): void {
        this.codeWalker.walkCodeFenceAware(lines, {
            onFence: (line, ix) => {
                const currInd = this.lineParser.getIndent(line);
                if (currInd > 0) {
                    onError({ lineNumber: ix + 1, detail: this.description, context: line });
                }
            },
            onOutside: (line, ix, trim) => {
                if (trim.startsWith("#")) return;
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
