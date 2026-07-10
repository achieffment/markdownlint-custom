"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_context_1 = require("./composition/app-context");
const codeblock_preceded_by_colon_1 = require("./rules/codeblock-preceded-by-colon");
const list_blank_line_spacing_1 = require("./rules/list-blank-line-spacing");
const list_items_end_with_semicolon_or_colon_1 = require("./rules/list-items-end-with-semicolon-or-colon");
const list_preceded_by_colon_1 = require("./rules/list-preceded-by-colon");
const minimum_h2_heading_1 = require("./rules/minimum-h2-heading");
const no_leading_spaces_1 = require("./rules/no-leading-spaces");
const sentences_end_with_mark_1 = require("./rules/sentences-end-with-mark");
const { colonChecker, spacingChecker, listItemsChecker, indentChecker, proseChecker } = app_context_1.appContext;
const rules = [
    new minimum_h2_heading_1.MinimumH2Rule().toRule(),
    new list_items_end_with_semicolon_or_colon_1.ListItemsEndRule(listItemsChecker).toRule(),
    new list_blank_line_spacing_1.ListBlankSpacingRule(spacingChecker).toRule(),
    new list_preceded_by_colon_1.ListPrecededByColonRule(colonChecker).toRule(),
    new codeblock_preceded_by_colon_1.CodeblockPrecededByColonRule(colonChecker).toRule(),
    new no_leading_spaces_1.NoLeadingSpacesRule(indentChecker).toRule(),
    new sentences_end_with_mark_1.SentencesEndMarkRule(proseChecker).toRule()
];
module.exports = rules;
