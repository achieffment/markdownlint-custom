import type { Rule, RuleOnError } from "markdownlint";
import type { ICustomRule } from "./icustom-rule";

export abstract class BaseRule implements ICustomRule {
    abstract readonly names: readonly string[];
    abstract readonly description: string;
    abstract readonly tags: readonly string[];

    abstract check(lines: readonly string[], onError: RuleOnError): void;

    toRule(): Rule {
        return {
            names: [...this.names],
            description: this.description,
            tags: [...this.tags],
            parser: "none",
            function: (params, onError) => {
                this.check(params.lines, onError);
            }
        };
    }
}
