import path from "path";
import type { MicromarkToken } from "markdownlint";

const mmRoot = path.join(__dirname, "..", "node_modules", "markdownlint");

// Только для hlprs API (checkListBlankSpacing в test-rules); production rules получают tokens от markdownlint.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { parse } = require(path.join(mmRoot, "lib/micromark-parse.mjs")) as {
    parse: (markdown: string) => Record<symbol, MicromarkToken[]>;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { flatTokensSymbol } = require(path.join(mmRoot, "helpers/shared.cjs")) as {
    flatTokensSymbol: symbol;
};

export const parseMicromarkTokens = (lines: readonly string[]): MicromarkToken[] => {
    const doc = parse(lines.join("\n"));
    return doc[flatTokensSymbol] ?? [];
};
