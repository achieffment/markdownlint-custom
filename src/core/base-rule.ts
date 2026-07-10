import type { MicromarkToken, Rule, RuleOnError, RuleParams } from "markdownlint";
import type { ICustomRule } from "./icustom-rule";

export abstract class BaseRule implements ICustomRule {
    abstract readonly names: readonly string[];
    abstract readonly description: string;
    abstract readonly tags: readonly string[];

    protected get parser(): "none" | "micromark" {
        return "none";
    }

    check(_params: RuleParams, _onError: RuleOnError): void {}

    checkMicromark(_params: RuleParams, _onError: RuleOnError): void {}

    protected getMicromarkTokens(params: RuleParams): MicromarkToken[] {
        return params.parsers.micromark?.tokens ?? [];
    }

    toRule(): Rule {
        const parser = this.parser;
        return {
            names: [...this.names],
            description: this.description,
            tags: [...this.tags],
            parser,
            function: (params, onError) => {
                if (parser === "micromark") {
                    this.checkMicromark(params, onError);
                } else {
                    this.check(params, onError);
                }
            }
        };
    }
}
