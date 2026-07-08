"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appContext = exports.AppContext = void 0;
const colon_checker_1 = require("../domain/colon-checker");
const code_walker_1 = require("../domain/code-walker");
const list_block_analyzer_1 = require("../domain/list-block-analyzer");
const list_line_parser_1 = require("../domain/list-line-parser");
const list_spacing_checker_1 = require("../domain/list-spacing-checker");
class AppContext {
    constructor() {
        this.lineParser = new list_line_parser_1.ListLineParser();
        this.codeWalker = new code_walker_1.CodeWalker();
        this.listAnalyzer = new list_block_analyzer_1.ListBlockAnalyzer(this.lineParser, this.codeWalker);
        this.spacingChecker = new list_spacing_checker_1.ListSpacingChecker(this.listAnalyzer, this.lineParser);
        this.colonChecker = new colon_checker_1.ColonChecker(this.listAnalyzer, this.lineParser);
    }
}
exports.AppContext = AppContext;
exports.appContext = new AppContext();
