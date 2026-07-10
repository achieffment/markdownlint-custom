import type { MicromarkToken } from "markdownlint";
import {
    filterByPredicate,
    filterByTypes,
    getParentOfType
} from "./micromark-token-utils";

const isList = (token: MicromarkToken): boolean =>
    token.type === "listOrdered" || token.type === "listUnordered";

const getListContainerForPrefix = (prefix: MicromarkToken): MicromarkToken | null =>
    getParentOfType(prefix, ["listOrdered", "listUnordered"]);

export const eachListItemPrefix = (
    tokens: readonly MicromarkToken[],
    fn: (prefix: MicromarkToken, list: MicromarkToken) => void
): void => {
    for (const prefix of filterByTypes(tokens, ["listItemPrefix"])) {
        const list = getListContainerForPrefix(prefix);
        if (list) fn(prefix, list);
    }
};

export const eachTopLevelList = (
    tokens: readonly MicromarkToken[],
    fn: (list: MicromarkToken) => void
): void => {
    for (const list of filterByPredicate(
        tokens,
        isList,
        (token) => (isList(token) || token.type === "htmlFlow") ? [] : token.children
    )) {
        fn(list);
    }
};

export const collectPrefixesInList = (list: MicromarkToken): MicromarkToken[] => {
    const result: MicromarkToken[] = [];
    const walk = (node: MicromarkToken): void => {
        if (node.type === "listItemPrefix") result.push(node);
        for (const child of node.children) walk(child);
    };
    walk(list);
    return result.sort((a, b) => a.startLine - b.startLine);
};
