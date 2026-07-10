"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListItemsChecker = void 0;
const regex_1 = require("../regex");
const micromark_lists_1 = require("./micromark-lists");
const outside_code_lines_1 = require("./outside-code-lines");
class ListItemsChecker {
    constructor(lineParser) {
        this.lineParser = lineParser;
    }
    getItemContent(lines, prefix) {
        const line = lines[prefix.startLine - 1] ?? "";
        const lineStart = this.lineParser.trimStart(line);
        return lineStart.replace(this.lineParser.lstItemRx, "").trim();
    }
    checkMicromark(lines, tokens, onError, itemDets) {
        (0, micromark_lists_1.eachListItemPrefix)(tokens, (prefix) => {
            const ix = prefix.startLine - 1;
            const line = lines[ix] ?? "";
            const trim = line.trim();
            const cont = this.getItemContent(lines, prefix);
            const next = this.lineParser.skipBlankFwd(lines, ix);
            const folcod = next < lines.length && (0, outside_code_lines_1.isOpeningCodeFenceAt)(lines, next);
            const folsub = next < lines.length && this.lineParser.isChildLstItem(line, lines[next]);
            const needsColon = folcod || folsub;
            const endsOk = needsColon ? regex_1.endsWithColonRx.test(cont) : regex_1.endsWithSemiRx.test(cont);
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
exports.ListItemsChecker = ListItemsChecker;
