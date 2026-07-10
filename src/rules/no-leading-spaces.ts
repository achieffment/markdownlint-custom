import type { RuleOnError, RuleParams } from "markdownlint";
import { BaseRule } from "../core/base-rule";
import { details } from "../details";
import type { NoLeadingSpacesChecker } from "../domain/no-leading-spaces-checker";

export class NoLeadingSpacesRule extends BaseRule {
    readonly names = ["no-leading-spaces"];
    readonly description = details.noLeadingSpaces;
    readonly tags = ["formatting"];

    constructor(private readonly indentChecker: NoLeadingSpacesChecker) {
        super();
    }

    check(params: RuleParams, onError: RuleOnError): void {
        this.indentChecker.checkLines(params.lines, onError, this.description);
    }
}
