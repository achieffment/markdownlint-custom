import type { RuleOnError, RuleParams } from "markdownlint";
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

    protected override get parser(): "micromark" {
        return "micromark";
    }

    checkMicromark(params: RuleParams, onError: RuleOnError): void {
        const tokens = params.parsers.micromark?.tokens ?? [];
        this.spacingChecker.checkMicromark(params.lines, tokens, onError, {
            bef: details.listBlankBef,
            aft: details.listBlankAft,
            gap: details.listBlankGap
        });
    }
}
