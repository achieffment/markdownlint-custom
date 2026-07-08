import type { RuleOnError } from "markdownlint";
import { BaseRule } from "../core/base-rule";
import { details } from "../details";
import type { ColonChecker } from "../domain/colon-checker";

export class ListPrecededByColonRule extends BaseRule {
    readonly names = ["list-preceded-by-colon"];
    readonly description = details.listPrecededByColon;
    readonly tags = ["lists"];

    constructor(private readonly colonChecker: ColonChecker) {
        super();
    }

    check(lines: readonly string[], onError: RuleOnError): void {
        this.colonChecker.checkListPrecededByColon(lines, onError, this.description);
    }
}
