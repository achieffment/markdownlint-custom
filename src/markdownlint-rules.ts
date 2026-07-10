import { appContext } from "./composition/app-context";
import { CodeblockPrecededByColonRule } from "./rules/codeblock-preceded-by-colon";
import { ListBlankSpacingRule } from "./rules/list-blank-line-spacing";
import { ListItemsEndRule } from "./rules/list-items-end-with-semicolon-or-colon";
import { ListPrecededByColonRule } from "./rules/list-preceded-by-colon";
import { MinimumH2Rule } from "./rules/minimum-h2-heading";
import { NoLeadingSpacesRule } from "./rules/no-leading-spaces";
import { SentencesEndMarkRule } from "./rules/sentences-end-with-mark";

const { colonChecker, spacingChecker, listItemsChecker, indentChecker, proseChecker } = appContext;

const rules = [
    new MinimumH2Rule().toRule(),
    new ListItemsEndRule(listItemsChecker).toRule(),
    new ListBlankSpacingRule(spacingChecker).toRule(),
    new ListPrecededByColonRule(colonChecker).toRule(),
    new CodeblockPrecededByColonRule(colonChecker).toRule(),
    new NoLeadingSpacesRule(indentChecker).toRule(),
    new SentencesEndMarkRule(proseChecker).toRule()
];

module.exports = rules;
