"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMicromarkTokens = void 0;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { lint } = require("markdownlint/sync");
const parseMicromarkTokens = (lines) => {
    let tokens = [];
    const rule = {
        names: ["micromark-parse-internal"],
        description: "internal",
        tags: [],
        parser: "micromark",
        function: (params) => {
            tokens = params.parsers.micromark?.tokens ?? [];
        }
    };
    lint({ strings: { content: lines.join("\n") } }, { customRules: [rule], config: { default: false, "micromark-parse-internal": true } });
    return tokens;
};
exports.parseMicromarkTokens = parseMicromarkTokens;
