declare module "markdownlint" {
    export type RuleOnErrorInfo = {
        lineNumber: number;
        detail?: string;
        context?: string;
    };

    export type RuleOnError = (onErrorInfo: RuleOnErrorInfo) => void;

    export type MicromarkToken = {
        type: string;
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
        text: string;
        children: MicromarkToken[];
        parent: MicromarkToken | null;
    };

    export type ParserMicromark = {
        tokens: MicromarkToken[];
    };

    export type MarkdownParsers = {
        micromark?: ParserMicromark;
        markdownit?: { tokens: unknown[] };
    };

    export type RuleParams = {
        name: string;
        lines: readonly string[];
        frontMatterLines: readonly string[];
        config: Record<string, unknown>;
        version: string;
        parsers: MarkdownParsers;
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
