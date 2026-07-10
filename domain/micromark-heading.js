"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasMinimumH2 = void 0;
const micromark_token_utils_1 = require("./micromark-token-utils");
const isH2Heading = (token) => {
    if (token.type !== "atxHeading" && token.type !== "setextHeading")
        return false;
    return (0, micromark_token_utils_1.getHeadingLevel)(token) === 2 && (0, micromark_token_utils_1.getHeadingText)(token).length > 0;
};
const hasMinimumH2 = (tokens) => {
    return (0, micromark_token_utils_1.filterByTypes)(tokens, ["atxHeading", "setextHeading"]).some(isH2Heading);
};
exports.hasMinimumH2 = hasMinimumH2;
