import type { MicromarkToken, RuleOnError } from "markdownlint";
import { endsWithColonRx, endsWithSemiRx, codeFenceRx } from "../regex";
import { findListItemBodyEnd } from "./list-item-body-end";
import type { ListLineParser } from "./list-line-parser";
import { eachListItemPrefix } from "./micromark-lists";
import { eachOpeningCodeFenceLine, skipFenceBlockBck } from "./outside-code-lines";

export class ListItemsChecker {
    constructor(private readonly lineParser: ListLineParser) {}

    private findItemBodyEnd(lines: readonly string[], begIx: number): number {
        return findListItemBodyEnd(lines, begIx, this.lineParser, {
            traverseFence: true,
            shouldBrk: (line) => {
                return this.lineParser.isLstItem(line);
            }
        });
    }

    private getItemContent(lines: readonly string[], prefix: MicromarkToken): string {
        const line = lines[prefix.startLine - 1] ?? "";
        const lineStart = this.lineParser.trimStart(line);
        return lineStart.replace(this.lineParser.lstItemRx, "").trim();
    }

    private getLastProseIx(lines: readonly string[], begIx: number, bodyEnd: number): number {
        let ix = bodyEnd;
        while (ix >= begIx) {
            const trim = (lines[ix] ?? "").trim();
            if (!trim) {
                ix--;
                continue;
            }
            if (codeFenceRx.test(trim)) {
                ix = skipFenceBlockBck(lines, ix);
                continue;
            }
            return ix;
        }
        return begIx;
    }

    private hasOpeningFenceAfterProse(
        openingFences: Set<number>,
        proseIx: number,
        bodyEnd: number
    ): boolean {
        for (let ix = proseIx + 1; ix <= bodyEnd; ix++) {
            if (openingFences.has(ix)) return true;
        }
        return false;
    }

    private getBodyEndContent(
        lines: readonly string[],
        prefix: MicromarkToken,
        proseIx: number,
        begIx: number
    ): string {
        if (proseIx === begIx) {
            return this.getItemContent(lines, prefix);
        }
        return (lines[proseIx] ?? "").trim();
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
            const bodyEnd = this.findItemBodyEnd(lines, ix);
            const proseIx = this.getLastProseIx(lines, ix, bodyEnd);
            const cont = this.getBodyEndContent(lines, prefix, proseIx, ix);
            const ctxTrim = (lines[proseIx] ?? "").trim();
            const next = this.lineParser.skipBlankFwd(lines, bodyEnd);
            const folcod = this.hasOpeningFenceAfterProse(openingFences, proseIx, bodyEnd)
                || (next < lines.length && openingFences.has(next));
            const folsub = next < lines.length && this.lineParser.isChildLstItem(line, lines[next]);
            const needsColon = folcod || folsub;
            const endsOk = needsColon ? endsWithColonRx.test(cont) : endsWithSemiRx.test(cont);
            const lstDet = needsColon ? itemDets.colon : itemDets.semi;
            const errLine = proseIx + 1;
            if (!cont) {
                onError({ lineNumber: errLine, detail: itemDets.empty, context: ctxTrim });
                return;
            }
            if (!endsOk) {
                onError({ lineNumber: errLine, detail: lstDet, context: ctxTrim });
            }
        });
    }
}
