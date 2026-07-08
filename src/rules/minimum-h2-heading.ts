import type { RuleOnError } from "markdownlint";
import { BaseRule } from "../core/base-rule";
import { details } from "../details";
import type { CodeWalker } from "../domain/code-walker";
import { h2Rx } from "../regex";

export class MinimumH2Rule extends BaseRule {
    readonly names = ["minimum-h2-heading"];
    readonly description = details.minimumH2;
    readonly tags = ["headings"];

    constructor(private readonly codeWalker: CodeWalker) {
        super();
    }

    check(lines: readonly string[], onError: RuleOnError): void {
        let hasH2 = false;
        this.codeWalker.walkOutsideCode(lines, (_ix, trim) => {
            if (h2Rx.test(trim)) {
                hasH2 = true;
                return lines.length;
            }
            return undefined;
        });
        if (!hasH2) {
            onError({ lineNumber: 1, detail: this.description });
        }
    }
}
