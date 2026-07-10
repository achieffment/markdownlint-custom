import type { MicromarkToken } from "markdownlint";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { lint } = require("markdownlint/sync") as {
    lint: (
        options: { strings: Record<string, string> },
        config: { customRules: unknown[]; config: Record<string, boolean> }
    ) => void;
};

export const parseMicromarkTokens = (lines: readonly string[]): MicromarkToken[] => {
    let tokens: MicromarkToken[] = [];
    const rule = {
        names: ["micromark-parse-internal"],
        description: "internal",
        tags: [] as string[],
        parser: "micromark" as const,
        function: (params: { parsers: { micromark?: { tokens: MicromarkToken[] } } }) => {
            tokens = params.parsers.micromark?.tokens ?? [];
        }
    };
    lint(
        { strings: { content: lines.join("\n") } },
        { customRules: [rule], config: { default: false, "micromark-parse-internal": true } }
    );
    return tokens;
};
