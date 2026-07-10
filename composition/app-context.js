"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appContext = exports.AppContext = void 0;
const colon_checker_1 = require("../domain/colon-checker");
const micromark_list_checkers_1 = require("../domain/micromark-list-checkers");
const no_leading_spaces_checker_1 = require("../domain/no-leading-spaces-checker");
const list_line_parser_1 = require("../domain/list-line-parser");
const list_spacing_checker_1 = require("../domain/list-spacing-checker");
const sentences_end_mark_checker_1 = require("../domain/sentences-end-mark-checker");
class AppContext {
    constructor() {
        this.lineParser = new list_line_parser_1.ListLineParser();
        this.spacingChecker = new list_spacing_checker_1.ListSpacingChecker(this.lineParser);
        this.colonChecker = new colon_checker_1.ColonChecker(this.lineParser);
        this.listItemsChecker = new micromark_list_checkers_1.ListItemsChecker(this.lineParser);
        this.indentChecker = new no_leading_spaces_checker_1.NoLeadingSpacesChecker(this.lineParser);
        this.proseChecker = new sentences_end_mark_checker_1.SentencesEndMarkChecker(this.lineParser);
    }
}
exports.AppContext = AppContext;
exports.appContext = new AppContext();
