"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMicromarkTokens = void 0;
const path_1 = __importDefault(require("path"));
const mmRoot = path_1.default.join(path_1.default.dirname(require.resolve("markdownlint/helpers")), "..");
// Только для hlprs API (checkListBlankSpacing в test-rules); production rules получают tokens от markdownlint.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { parse } = require(path_1.default.join(mmRoot, "lib/micromark-parse.mjs"));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { flatTokensSymbol } = require(path_1.default.join(mmRoot, "helpers/shared.cjs"));
const parseMicromarkTokens = (lines) => {
    const doc = parse(lines.join("\n"));
    return doc[flatTokensSymbol] ?? [];
};
exports.parseMicromarkTokens = parseMicromarkTokens;
