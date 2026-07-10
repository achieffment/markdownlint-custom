import type { RuleOnError, RuleParams } from "markdownlint";
import { BaseRule } from "../core/base-rule";
import { details } from "../details";
import type { ListItemsChecker } from "../domain/micromark-list-checkers";

export class ListItemsEndRule extends BaseRule {
    readonly names = ["list-items-end-with-semicolon-or-colon"];
    readonly description = details.listItemsEnd;
    readonly tags = ["lists"];

    constructor(private readonly listItemsChecker: ListItemsChecker) {
        super();
    }

    protected override get parser(): "micromark" {
        return "micromark";
    }

    checkMicromark(params: RuleParams, onError: RuleOnError): void {
        const tokens = params.parsers.micromark?.tokens ?? [];
        this.listItemsChecker.checkMicromark(params.lines, tokens, onError, {
            empty: details.listItemsEmpty,
            colon: details.listItemsColon,
            semi: details.listItemsSemi
        });
    }
}
