"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findListItemBodyEnd = void 0;
const regex_1 = require("../regex");
const outside_code_lines_1 = require("./outside-code-lines");
const findListItemBodyEnd = (lines, begIx, lineParser, opts) => {
    const maxIx = opts.maxIx ?? lines.length;
    const ind = lineParser.getIndent(lines[begIx]);
    let end = begIx;
    let aftFence = false;
    for (let ix = begIx + 1; ix < maxIx; ix++) {
        const trim = lines[ix].trim();
        if (!trim) {
            aftFence = false;
            continue;
        }
        if (regex_1.headingRx.test(trim))
            break;
        if (opts.shouldBrk?.(lines[ix]))
            break;
        if (regex_1.codeFenceRx.test(trim)) {
            if (!opts.traverseFence)
                break;
            end = ix;
            const closeIx = (0, outside_code_lines_1.skipFenceBlockFwd)(lines, ix);
            if (closeIx < lines.length && regex_1.codeFenceRx.test(lines[closeIx].trim()))
                end = closeIx;
            ix = closeIx;
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
            aftFence = false;
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
