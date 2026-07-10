import type { MicromarkToken } from "markdownlint";
import { filterByTypes, getHeadingLevel, getHeadingText } from "./micromark-token-utils";

const isH2Heading = (token: MicromarkToken): boolean => {
    if (token.type !== "atxHeading" && token.type !== "setextHeading") return false;
    return getHeadingLevel(token) === 2 && getHeadingText(token).length > 0;
};

export const hasMinimumH2 = (tokens: readonly MicromarkToken[]): boolean =>
    filterByTypes(tokens, ["atxHeading", "setextHeading"]).some(isH2Heading);
