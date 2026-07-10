import type { RuleOnError, RuleParams } from "markdownlint";
import { BaseRule } from "../core/base-rule";
import { details } from "../details";
import type { ColonChecker } from "../domain/colon-checker";

export class CodeblockPrecededByColonRule extends BaseRule {
    readonly names = ["codeblock-preceded-by-colon"];
    readonly description = details.codeblockColon;
    readonly tags = ["code"];

    constructor(private readonly colonChecker: ColonChecker) {
        super();
    }

    check(params: RuleParams, onError: RuleOnError): void {
        this.colonChecker.checkOpeningCodeFences(params.lines, onError, this.description);
    }
}
