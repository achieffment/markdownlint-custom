import type { RuleOnError } from "markdownlint";
import { BaseRule } from "../core/base-rule";
import { details } from "../details";
import type { ColonChecker } from "../domain/colon-checker";
import type { CodeWalker } from "../domain/code-walker";

export class CodeblockPrecededByColonRule extends BaseRule {
    readonly names = ["codeblock-preceded-by-colon"];
    readonly description = details.codeblockColon;
    readonly tags = ["code"];

    constructor(
        private readonly colonChecker: ColonChecker,
        private readonly codeWalker: CodeWalker
    ) {
        super();
    }

    check(lines: readonly string[], onError: RuleOnError): void {
        this.codeWalker.eachOpeningCodeFence(lines, (ix) => {
            this.colonChecker.checkPrecededByColon(lines, ix, onError, this.description);
        });
    }
}
