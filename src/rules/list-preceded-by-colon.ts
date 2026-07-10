import type { RuleOnError, RuleParams } from "markdownlint";
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

    protected override get parser(): "micromark" {
        return "micromark";
    }

    checkMicromark(params: RuleParams, onError: RuleOnError): void {
        this.colonChecker.checkListPrecededByColon(params.lines, onError, this.description);
    }
}
