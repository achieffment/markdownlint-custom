import type { Rule, RuleOnError } from "markdownlint";

export interface ICustomRule {
    readonly names: readonly string[];
    readonly description: string;
    readonly tags: readonly string[];
    check(lines: readonly string[], onError: RuleOnError): void;
    toRule(): Rule;
}
