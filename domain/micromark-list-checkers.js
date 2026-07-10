"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListItemsChecker = void 0;
const regex_1 = require("../regex");
const list_item_body_end_1 = require("./list-item-body-end");
const micromark_lists_1 = require("./micromark-lists");
const outside_code_lines_1 = require("./outside-code-lines");
class ListItemsChecker {
    constructor(lineParser) {
        this.lineParser = lineParser;
    }
    findItemBodyEnd(lines, begIx) {
        return (0, list_item_body_end_1.findListItemBodyEnd)(lines, begIx, this.lineParser, {
            traverseFence: true,
            shouldBrk: (line) => {
                return this.lineParser.isLstItem(line);
            }
        });
    }
    getItemContent(lines, prefix) {
        const line = lines[prefix.startLine - 1] ?? "";
        const lineStart = this.lineParser.trimStart(line);
        return lineStart.replace(this.lineParser.lstItemRx, "").trim();
    }
    getLastProseIx(lines, begIx, bodyEnd) {
        let ix = bodyEnd;
        while (ix >= begIx) {
            const trim = (lines[ix] ?? "").trim();
            if (!trim) {
                ix--;
                continue;
            }
            if (regex_1.codeFenceRx.test(trim)) {
                ix = (0, outside_code_lines_1.skipFenceBlockBck)(lines, ix);
                continue;
            }
            return ix;
        }
        return begIx;
    }
    hasOpeningFenceAfterProse(openingFences, proseIx, bodyEnd) {
        for (let ix = proseIx + 1; ix <= bodyEnd; ix++) {
            if (openingFences.has(ix))
                return true;
        }
        return false;
    }
    getBodyEndContent(lines, prefix, proseIx, begIx) {
        if (proseIx === begIx) {
            return this.getItemContent(lines, prefix);
        }
        return (lines[proseIx] ?? "").trim();
    }
    checkMicromark(lines, tokens, onError, itemDets) {
        const openingFences = new Set();
        (0, outside_code_lines_1.eachOpeningCodeFenceLine)(lines, (fenceIx) => {
            openingFences.add(fenceIx);
        });
        (0, micromark_lists_1.eachListItemPrefix)(tokens, (prefix) => {
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
            const endsOk = needsColon ? regex_1.endsWithColonRx.test(cont) : regex_1.endsWithSemiRx.test(cont);
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
exports.ListItemsChecker = ListItemsChecker;
