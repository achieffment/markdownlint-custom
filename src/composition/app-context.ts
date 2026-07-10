import { ColonChecker } from "../domain/colon-checker";
import { ListItemsChecker } from "../domain/micromark-list-checkers";
import { NoLeadingSpacesChecker } from "../domain/no-leading-spaces-checker";
import { ListLineParser } from "../domain/list-line-parser";
import { ListSpacingChecker } from "../domain/list-spacing-checker";
import { SentencesEndMarkChecker } from "../domain/sentences-end-mark-checker";

export class AppContext {
    readonly lineParser = new ListLineParser();
    readonly spacingChecker = new ListSpacingChecker(this.lineParser);
    readonly colonChecker = new ColonChecker(this.lineParser);
    readonly listItemsChecker = new ListItemsChecker(this.lineParser);
    readonly indentChecker = new NoLeadingSpacesChecker(this.lineParser);
    readonly proseChecker = new SentencesEndMarkChecker(this.lineParser);
}

export const appContext = new AppContext();
