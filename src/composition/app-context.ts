import { ColonChecker } from "../domain/colon-checker";
import { CodeWalker } from "../domain/code-walker";
import { ListBlockAnalyzer } from "../domain/list-block-analyzer";
import { ListLineParser } from "../domain/list-line-parser";
import { ListSpacingChecker } from "../domain/list-spacing-checker";

export class AppContext {
    readonly lineParser = new ListLineParser();
    readonly codeWalker = new CodeWalker();
    readonly listAnalyzer = new ListBlockAnalyzer(this.lineParser, this.codeWalker);
    readonly spacingChecker = new ListSpacingChecker(this.listAnalyzer, this.lineParser);
    readonly colonChecker = new ColonChecker(this.listAnalyzer, this.lineParser);
}

export const appContext = new AppContext();
