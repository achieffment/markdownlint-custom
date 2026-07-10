"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBlankLine = exports.getHeadingText = exports.getHeadingLevel = exports.getParentOfType = exports.filterByPredicate = exports.filterByTypes = void 0;
const path_1 = __importDefault(require("path"));
const helpersDir = path_1.default.dirname(require.resolve("markdownlint/helpers"));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mm = require(path_1.default.join(helpersDir, "micromark-helpers.cjs"));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { isBlankLine } = require("markdownlint/helpers");
exports.isBlankLine = isBlankLine;
exports.filterByTypes = mm.filterByTypes, exports.filterByPredicate = mm.filterByPredicate, exports.getParentOfType = mm.getParentOfType, exports.getHeadingLevel = mm.getHeadingLevel, exports.getHeadingText = mm.getHeadingText;
