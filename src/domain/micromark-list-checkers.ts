import type { MicromarkToken, RuleOnError } from "markdownlint";
import { endsWithColonRx, endsWithSemiRx } from "../regex";
import type { ListLineParser } from "./list-line-parser";
import { eachListItemPrefix } from "./micromark-lists";
import { eachOpeningCodeFenceLine } from "./outside-code-lines";

export class ListItemsChecker {
    constructor(private readonly lineParser: ListLineParser) {}

    private getItemContent(lines: readonly string[], prefix: MicromarkToken): string {
        const line = lines[prefix.startLine - 1] ?? "";
        const lineStart = this.lineParser.trimStart(line);
        return lineStart.replace(this.lineParser.lstItemRx, "").trim();
    }

    checkMicromark(
        lines: readonly string[],
        tokens: readonly MicromarkToken[],
        onError: RuleOnError,
        itemDets: {
            empty: string;
            colon: string;
            semi: string;
        }
    ): void {
        const openingFences = new Set<number>();
        eachOpeningCodeFenceLine(lines, (fenceIx) => {
            openingFences.add(fenceIx);
        });
        eachListItemPrefix(tokens, (prefix) => {
            const ix = prefix.startLine - 1;
            const line = lines[ix] ?? "";
            const trim = line.trim();
            const cont = this.getItemContent(lines, prefix);
            const next = this.lineParser.skipBlankFwd(lines, ix);
            const folcod = next < lines.length && openingFences.has(next);
            const folsub = next < lines.length && this.lineParser.isChildLstItem(line, lines[next]);
            const needsColon = folcod || folsub;
            const endsOk = needsColon ? endsWithColonRx.test(cont) : endsWithSemiRx.test(cont);
            const lstDet = needsColon ? itemDets.colon : itemDets.semi;
            if (!cont) {
                onError({ lineNumber: prefix.startLine, detail: itemDets.empty, context: trim });
                return;
            }
            if (!endsOk) {
                onError({ lineNumber: prefix.startLine, detail: lstDet, context: trim });
            }
        });
    }
}
