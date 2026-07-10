import type { LinePredicate } from "../types";
import { codeFenceRx, headingRx } from "../regex";
import type { ListLineParser } from "./list-line-parser";
import { skipFenceBlockFwd } from "./outside-code-lines";

export type ListItemBodyEndOpts = {
    maxIx?: number;
    traverseFence: boolean;
    shouldBrk?: LinePredicate;
    breakOnAnyListItem?: boolean;
};

export const findListItemBodyEnd = (
    lines: readonly string[],
    begIx: number,
    lineParser: ListLineParser,
    opts: ListItemBodyEndOpts
): number => {
    const maxIx = opts.maxIx ?? lines.length;
    const ind = lineParser.getIndent(lines[begIx]);
    let end = begIx;
    let aftFence = false;
    for (let ix = begIx + 1; ix < maxIx; ix++) {
        const trim = lines[ix].trim();
        if (!trim) continue;
        if (headingRx.test(trim)) break;
        if (opts.shouldBrk?.(lines[ix])) break;
        if (codeFenceRx.test(trim)) {
            if (!opts.traverseFence) break;
            end = ix;
            const closeIx = skipFenceBlockFwd(lines, ix);
            if (closeIx < lines.length && codeFenceRx.test(lines[closeIx].trim())) end = closeIx;
            ix = closeIx;
            aftFence = true;
            continue;
        }
        if (opts.breakOnAnyListItem && lineParser.isLstItem(lines[ix])) break;
        const jInd = lineParser.getIndent(lines[ix]);
        if (opts.traverseFence) {
            if (jInd > ind || (aftFence && jInd >= ind)) end = ix;
            else break;
        } else if (jInd > ind) {
            end = ix;
        } else {
            break;
        }
    }
    return end;
};
