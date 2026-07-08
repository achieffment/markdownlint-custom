"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListItemsEndRule = void 0;
const base_rule_1 = require("../core/base-rule");
const details_1 = require("../details");
const regex_1 = require("../regex");
class ListItemsEndRule extends base_rule_1.BaseRule {
    constructor(codeWalker, lineParser) {
        super();
        this.codeWalker = codeWalker;
        this.lineParser = lineParser;
        this.names = ["list-items-end-with-semicolon-or-colon"];
        this.description = details_1.details.listItemsEnd;
        this.tags = ["lists"];
    }
    check(lines, onError) {
        this.codeWalker.eachLineOutsideCode(lines, (line, ix, trim) => {
            if (!this.lineParser.isLstItem(line))
                return;
            const lineStart = this.lineParser.trimStart(line);
            let cont = lineStart.replace(regex_1.lstItemRx, "");
            cont = cont.trim();
            const next = this.lineParser.skipBlankFwd(lines, ix);
            const folcod = next < lines.length && regex_1.codeFenceRx.test(lines[next].trim());
            const folsub = next < lines.length && this.lineParser.isChildLstItem(line, lines[next]);
            const needsColon = folcod || folsub;
            const endsOk = needsColon ? regex_1.endsWithColonRx.test(cont) : regex_1.endsWithSemiRx.test(cont);
            const lstDet = needsColon ? details_1.details.listItemsColon : details_1.details.listItemsSemi;
            if (!cont) {
                onError({ lineNumber: ix + 1, detail: details_1.details.listItemsEmpty, context: trim });
                return;
            }
            if (!endsOk) {
                onError({ lineNumber: ix + 1, detail: lstDet, context: trim });
            }
        });
    }
}
exports.ListItemsEndRule = ListItemsEndRule;
