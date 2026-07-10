"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findListItemBodyEnd = void 0;
const regex_1 = require("../regex");
const findListItemBodyEnd = (lines, begIx, lineParser, opts) => {
    const maxIx = opts.maxIx ?? lines.length;
    const ind = lineParser.getIndent(lines[begIx]);
    let end = begIx;
    let aftFence = false;
    for (let ix = begIx + 1; ix < maxIx; ix++) {
        const trim = lines[ix].trim();
        if (!trim)
            continue;
        if (regex_1.headingRx.test(trim))
            break;
        if (opts.shouldBrk?.(lines[ix]))
            break;
        if (regex_1.codeFenceRx.test(trim)) {
            if (!opts.traverseFence)
                break;
            end = ix;
            ix++;
            while (ix < lines.length && !regex_1.codeFenceRx.test(lines[ix].trim()))
                ix++;
            if (ix < lines.length)
                end = ix;
            aftFence = true;
            continue;
        }
        if (opts.breakOnAnyListItem && lineParser.isLstItem(lines[ix]))
            break;
        const jInd = lineParser.getIndent(lines[ix]);
        if (opts.traverseFence) {
            if (jInd > ind || (aftFence && jInd >= ind))
                end = ix;
            else
                break;
        }
        else if (jInd > ind) {
            end = ix;
        }
        else {
            break;
        }
    }
    return end;
};
exports.findListItemBodyEnd = findListItemBodyEnd;
