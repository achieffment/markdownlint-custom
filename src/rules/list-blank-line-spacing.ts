import type { RuleOnError } from "markdownlint";
import { BaseRule } from "../core/base-rule";
import { details } from "../details";
import type { ListSpacingChecker } from "../domain/list-spacing-checker";

export class ListBlankSpacingRule extends BaseRule {
    readonly names = ["list-blank-line-spacing"];
    readonly description = details.listBlankSpacing;
    readonly tags = ["lists"];

    constructor(private readonly spacingChecker: ListSpacingChecker) {
        super();
    }

    check(lines: readonly string[], onError: RuleOnError): void {
        this.spacingChecker.checkLines(lines, onError, {
            bef: details.listBlankBef,
            aft: details.listBlankAft,
            gap: details.listBlankGap
        });
    }
}
