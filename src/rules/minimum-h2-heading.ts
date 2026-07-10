import type { RuleOnError, RuleParams } from "markdownlint";
import { BaseRule } from "../core/base-rule";
import { details } from "../details";
import { hasMinimumH2 } from "../domain/micromark-heading";

export class MinimumH2Rule extends BaseRule {
    readonly names = ["minimum-h2-heading"];
    readonly description = details.minimumH2;
    readonly tags = ["headings"];

    protected override get parser(): "micromark" {
        return "micromark";
    }

    checkMicromark(params: RuleParams, onError: RuleOnError): void {
        const tokens = this.getMicromarkTokens(params);
        if (!hasMinimumH2(tokens)) {
            onError({ lineNumber: 1, detail: this.description });
        }
    }
}
