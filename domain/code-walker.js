"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeWalker = void 0;
class CodeWalker {
    walkOutsideCode(lines, fn) {
        let inCodeB = false;
        for (let ix = 0; ix < lines.length; ix++) {
            const trim = lines[ix].trim();
            if (trim.startsWith("```")) {
                inCodeB = !inCodeB;
                continue;
            }
            if (inCodeB)
                continue;
            const jump = fn(ix, trim);
            if (jump !== undefined)
                ix = jump;
        }
    }
    eachLineOutsideCode(lines, fn) {
        this.walkOutsideCode(lines, (ix, trim) => {
            fn(lines[ix], ix, trim);
            return undefined;
        });
    }
    walkCodeFenceAware(lines, handlers) {
        let inCodeB = false;
        for (let ix = 0; ix < lines.length; ix++) {
            const line = lines[ix];
            const trim = line.trim();
            if (trim.startsWith("```")) {
                handlers.onFence(line, ix, trim, !inCodeB);
                inCodeB = !inCodeB;
                continue;
            }
            if (inCodeB)
                continue;
            handlers.onOutside(line, ix, trim);
        }
    }
    eachOpeningCodeFence(lines, fn) {
        this.walkCodeFenceAware(lines, {
            onFence: (_line, ix, _trim, opening) => {
                if (opening)
                    fn(ix);
            },
            onOutside: () => { }
        });
    }
}
exports.CodeWalker = CodeWalker;
