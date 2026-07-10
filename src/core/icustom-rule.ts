import type { Rule, RuleOnError, RuleParams } from "markdownlint";

export interface ICustomRule {
    readonly names: readonly string[];
    readonly description: string;
    readonly tags: readonly string[];
    check(params: RuleParams, onError: RuleOnError): void;
    checkMicromark(params: RuleParams, onError: RuleOnError): void;
    toRule(): Rule;
}
