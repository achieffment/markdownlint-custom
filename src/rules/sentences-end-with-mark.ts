import type { RuleOnError } from "markdownlint";
import { BaseRule } from "../core/base-rule";
import { details } from "../details";
import { MarkdownDocument } from "../domain/markdown-document";
import type { CodeWalker } from "../domain/code-walker";
import type { ListLineParser } from "../domain/list-line-parser";
import { endsWithMarkRx } from "../regex";

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
        const doc = new MarkdownDocument(lines, this.codeWalker, this.lineParser);
        doc.eachLineOutsideCode((line, ix, trim) => {
            if (!trim) return;
            if (trim.startsWith("#") || this.lineParser.isLstItem(line)) return;
            if (!endsWithMarkRx.test(trim)) {
                onError({ lineNumber: ix + 1, detail: this.description, context: trim });
            }
        });
    }
}
