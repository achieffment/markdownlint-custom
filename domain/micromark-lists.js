"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectPrefixesInList = exports.eachTopLevelList = exports.eachListItemPrefix = void 0;
const micromark_token_utils_1 = require("./micromark-token-utils");
const isList = (token) => {
    return token.type === "listOrdered" || token.type === "listUnordered";
};
const getListContainerForPrefix = (prefix) => {
    return (0, micromark_token_utils_1.getParentOfType)(prefix, ["listOrdered", "listUnordered"]);
};
const eachListItemPrefix = (tokens, fn) => {
    for (const prefix of (0, micromark_token_utils_1.filterByTypes)(tokens, ["listItemPrefix"])) {
        const list = getListContainerForPrefix(prefix);
        if (list)
            fn(prefix, list);
    }
};
exports.eachListItemPrefix = eachListItemPrefix;
const eachTopLevelList = (tokens, fn) => {
    for (const list of (0, micromark_token_utils_1.filterByPredicate)(tokens, isList, (token) => {
        return (isList(token) || token.type === "htmlFlow") ? [] : token.children;
    })) {
        fn(list);
    }
};
exports.eachTopLevelList = eachTopLevelList;
const collectPrefixesInList = (list) => {
    const result = [];
    const walk = (node) => {
        if (node.type === "listItemPrefix")
            result.push(node);
        for (const child of node.children)
            walk(child);
    };
    walk(list);
    return result.sort((a, b) => {
        return a.startLine - b.startLine;
    });
};
exports.collectPrefixesInList = collectPrefixesInList;
