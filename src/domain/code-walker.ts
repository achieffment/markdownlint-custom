import type { CodeFenceHandlers, OutsideCodeCallback, OutsideCodeWalker } from "../types";
import { codeFenceRx } from "../regex";

export class CodeWalker {
    private walkLines(
        lines: readonly string[],
        onFence: (line: string, ix: number, trim: string, opening: boolean) => void,
        onOutside: (line: string, ix: number, trim: string) => number | undefined
    ): void {
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
    }

    walkOutsideCode(lines: readonly string[], fn: OutsideCodeWalker): void {
        this.walkLines(
            lines,
            () => {},
            (_line, ix, trim) => fn(ix, trim)
        );
    }

    eachLineOutsideCode(lines: readonly string[], fn: OutsideCodeCallback): void {
        this.walkOutsideCode(lines, (ix, trim) => {
            fn(lines[ix], ix, trim);
            return undefined;
        });
    }

    walkCodeFenceAware(lines: readonly string[], handlers: CodeFenceHandlers): void {
        this.walkLines(
            lines,
            (line, ix, trim, opening) => handlers.onFence(line, ix, trim, opening),
            (line, ix, trim) => {
                handlers.onOutside(line, ix, trim);
                return undefined;
            }
        );
    }

    eachOpeningCodeFence(lines: readonly string[], fn: (ix: number) => void): void {
        this.walkCodeFenceAware(lines, {
            onFence: (_line, ix, _trim, opening) => {
                if (opening) fn(ix);
            },
            onOutside: () => {}
        });
    }
}
