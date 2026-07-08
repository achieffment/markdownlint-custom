import type { CodeFenceHandlers, OutsideCodeCallback, OutsideCodeWalker } from "../types";

export class CodeWalker {
    walkOutsideCode(lines: readonly string[], fn: OutsideCodeWalker): void {
        let inCodeB = false;
        for (let ix = 0; ix < lines.length; ix++) {
            const trim = lines[ix].trim();
            if (trim.startsWith("```")) {
                inCodeB = !inCodeB;
                continue;
            }
            if (inCodeB) continue;
            const jump = fn(ix, trim);
            if (jump !== undefined) ix = jump;
        }
    }

    eachLineOutsideCode(lines: readonly string[], fn: OutsideCodeCallback): void {
        this.walkOutsideCode(lines, (ix, trim) => {
            fn(lines[ix], ix, trim);
            return undefined;
        });
    }

    walkCodeFenceAware(lines: readonly string[], handlers: CodeFenceHandlers): void {
        let inCodeB = false;
        for (let ix = 0; ix < lines.length; ix++) {
            const line = lines[ix];
            const trim = line.trim();
            if (trim.startsWith("```")) {
                handlers.onFence(line, ix, trim, !inCodeB);
                inCodeB = !inCodeB;
                continue;
            }
            if (inCodeB) continue;
            handlers.onOutside(line, ix, trim);
        }
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
