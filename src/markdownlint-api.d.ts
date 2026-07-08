declare module "markdownlint" {
    export type RuleOnErrorInfo = {
        lineNumber: number;
        detail?: string;
        context?: string;
    };

    export type RuleOnError = (onErrorInfo: RuleOnErrorInfo) => void;

    export type RuleParams = {
        name: string;
        lines: readonly string[];
        frontMatterLines: readonly string[];
        config: Record<string, unknown>;
        version: string;
    };

    export type RuleFunction = (params: RuleParams, onError: RuleOnError) => void;

    export type Rule = {
        names: string[];
        description: string;
        tags: string[];
        parser: "none" | "markdownit" | "micromark";
        function: RuleFunction;
    };
}
