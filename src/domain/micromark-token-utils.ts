import path from "path";
import type { MicromarkToken } from "markdownlint";

type MicromarkHelpers = {
    filterByTypes: (
        tokens: readonly MicromarkToken[],
        types: readonly string[],
        htmlFlow?: boolean
    ) => MicromarkToken[];
    filterByPredicate: (
        tokens: readonly MicromarkToken[],
        allowed: (token: MicromarkToken) => boolean,
        transformChildren?: (token: MicromarkToken) => MicromarkToken[]
    ) => MicromarkToken[];
    getParentOfType: (token: MicromarkToken, types: readonly string[]) => MicromarkToken | null;
    getHeadingLevel: (heading: MicromarkToken) => number;
    getHeadingText: (heading: MicromarkToken) => string;
};

const helpersDir = path.dirname(require.resolve("markdownlint/helpers"));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mm = require(path.join(helpersDir, "micromark-helpers.cjs")) as MicromarkHelpers;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { isBlankLine } = require("markdownlint/helpers") as {
    isBlankLine: (line: string | undefined) => boolean;
};

export const {
    filterByTypes,
    filterByPredicate,
    getParentOfType,
    getHeadingLevel,
    getHeadingText
} = mm;

export { isBlankLine };
