import type { RuleOnError, RuleParams } from "markdownlint";
import { BaseRule } from "../core/base-rule";
import { details } from "../details";
import type { SentencesEndMarkChecker } from "../domain/sentences-end-mark-checker";

export class SentencesEndMarkRule extends BaseRule {
    readonly names = ["sentences-end-with-mark"];
    readonly description = details.sentencesEndMark;
    readonly tags = ["formatting"];

    constructor(private readonly proseChecker: SentencesEndMarkChecker) {
        super();
    }

    check(params: RuleParams, onError: RuleOnError): void {
        this.proseChecker.checkLines(params.lines, onError, this.description);
    }
}
