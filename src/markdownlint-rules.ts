import type { Rule } from "markdownlint";
import { appContext } from "./composition/app-context";
import { CodeblockPrecededByColonRule } from "./rules/codeblock-preceded-by-colon";
import { ListBlankSpacingRule } from "./rules/list-blank-line-spacing";
import { ListItemsEndRule } from "./rules/list-items-end-with-semicolon-or-colon";
import { ListPrecededByColonRule } from "./rules/list-preceded-by-colon";
import { MinimumH2Rule } from "./rules/minimum-h2-heading";
import { NoLeadingSpacesRule } from "./rules/no-leading-spaces";
import { SentencesEndMarkRule } from "./rules/sentences-end-with-mark";

const { lineParser, codeWalker, spacingChecker, colonChecker } = appContext;

const rules: Rule[] = [
    new MinimumH2Rule(codeWalker).toRule(),
    new ListItemsEndRule(codeWalker, lineParser).toRule(),
    new ListBlankSpacingRule(spacingChecker).toRule(),
    new ListPrecededByColonRule(colonChecker).toRule(),
    new CodeblockPrecededByColonRule(colonChecker, codeWalker).toRule(),
    new NoLeadingSpacesRule(codeWalker, lineParser).toRule(),
    new SentencesEndMarkRule(codeWalker, lineParser).toRule()
];

module.exports = rules;
