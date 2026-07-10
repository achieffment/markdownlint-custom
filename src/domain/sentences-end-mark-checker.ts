import type { RuleOnError } from "markdownlint";
import { eachLineOutsideCode } from "./outside-code-lines";
import type { ListLineParser } from "./list-line-parser";
import { endsWithMarkRx, headingRx, hrRx, tableRowRx } from "../regex";

export class SentencesEndMarkChecker {
    constructor(private readonly lineParser: ListLineParser) {}

    checkLines(lines: readonly string[], onError: RuleOnError, description: string): void {
        let inQuote = false;
        eachLineOutsideCode(lines, (line, ix, trim) => {
            if (!trim) {
                inQuote = false;
                return;
            }
            if (headingRx.test(trim) || trim.startsWith(">") || hrRx.test(trim)) {
                inQuote = trim.startsWith(">");
                return;
            }
            if (inQuote) return;
            if (this.lineParser.isLstItem(line)) return;
            if (tableRowRx.test(trim)) return;
            if (!endsWithMarkRx.test(trim)) {
                onError({ lineNumber: ix + 1, detail: description, context: trim });
            }
        });
    }
}
