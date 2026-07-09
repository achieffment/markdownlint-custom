import type { RuleOnError } from "markdownlint";
import { BaseRule } from "../core/base-rule";
import { details } from "../details";
import type { CodeWalker } from "../domain/code-walker";
import type { ListLineParser } from "../domain/list-line-parser";
import { endsWithMarkRx, headingRx, hrRx, tableRowRx } from "../regex";

export class SentencesEndMarkRule extends BaseRule {
    readonly names = ["sentences-end-with-mark"];
    readonly description = details.sentencesEndMark;
    readonly tags = ["formatting"];

    constructor(
        private readonly codeWalker: CodeWalker,
        private readonly lineParser: ListLineParser
    ) {
        super();
    }

    check(lines: readonly string[], onError: RuleOnError): void {
        let inQuote = false;
        this.codeWalker.eachLineOutsideCode(lines, (line, ix, trim) => {
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
                onError({ lineNumber: ix + 1, detail: this.description, context: trim });
            }
        });
    }
}
