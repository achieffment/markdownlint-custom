import type { CodeFenceHandlers, OutsideCodeCallback, OutsideCodeWalker } from "../types";
import { codeFenceRx } from "../regex";

const walkLines = (
    lines: readonly string[],
    onFence: (line: string, ix: number, trim: string, opening: boolean) => void,
    onOutside: (line: string, ix: number, trim: string) => number | undefined
): void => {
    let inCodeB = false;
    for (let ix = 0; ix < lines.length; ix++) {
        const line = lines[ix];
        const trim = line.trim();
        if (codeFenceRx.test(trim)) {
            onFence(line, ix, trim, !inCodeB);
            inCodeB = !inCodeB;
            continue;
        }
        if (inCodeB) continue;
        const jump = onOutside(line, ix, trim);
        if (jump !== undefined) ix = jump;
    }
};

export const eachLineOutsideCode = (lines: readonly string[], fn: OutsideCodeCallback): void => {
    walkLines(
        lines,
        () => {},
        (_line, ix, trim) => {
            fn(lines[ix], ix, trim);
            return undefined;
        }
    );
};

export const walkOutsideCode = (lines: readonly string[], fn: OutsideCodeWalker): void => {
    walkLines(
        lines,
        () => {},
        (_line, ix, trim) => fn(ix, trim)
    );
};

export const walkCodeFenceAware = (lines: readonly string[], handlers: CodeFenceHandlers): void => {
    walkLines(
        lines,
        (line, ix, trim, opening) => handlers.onFence(line, ix, trim, opening),
        (line, ix, trim) => {
            handlers.onOutside(line, ix, trim);
            return undefined;
        }
    );
};

export const eachOpeningCodeFenceLine = (lines: readonly string[], fn: (ix: number) => void): void => {
    walkCodeFenceAware(lines, {
        onFence: (_line, ix, _trim, opening) => {
            if (opening) fn(ix);
        },
        onOutside: () => {}
    });
};
