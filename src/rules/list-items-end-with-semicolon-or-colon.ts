import type { RuleOnError } from "markdownlint";
import { BaseRule } from "../core/base-rule";
import { details } from "../details";
import { MarkdownDocument } from "../domain/markdown-document";
import type { CodeWalker } from "../domain/code-walker";
import type { ListLineParser } from "../domain/list-line-parser";
import { codeFenceRx, endsWithColonRx, endsWithSemiRx } from "../regex";

export class ListItemsEndRule extends BaseRule {
    readonly names = ["list-items-end-with-semicolon-or-colon"];
    readonly description = details.listItemsEnd;
    readonly tags = ["lists"];

    constructor(
        private readonly codeWalker: CodeWalker,
        private readonly lineParser: ListLineParser
    ) {
        super();
    }

    check(lines: readonly string[], onError: RuleOnError): void {
        const doc = new MarkdownDocument(lines, this.codeWalker, this.lineParser);
        doc.eachLineOutsideCode((line, ix, trim) => {
            if (!this.lineParser.isLstItem(line)) return;
            let cont = trim.replace(this.lineParser.lstItemRx, "");
            cont = cont.trim();
            const next = doc.skipBlankFwd(ix);
            const folcod = next < lines.length && codeFenceRx.test(lines[next].trim());
            const folsub = next < lines.length && this.lineParser.isChildLstItem(line, lines[next]);
            const needsColon = folcod || folsub;
            const endsOk = needsColon ? endsWithColonRx.test(cont) : endsWithSemiRx.test(cont);
            const lstDet = needsColon ? details.listItemsColon : details.listItemsSemi;
            if (!cont || !endsOk) {
                onError({ lineNumber: ix + 1, detail: lstDet, context: trim || details.listItemsEmpty });
            }
        });
    }
}
