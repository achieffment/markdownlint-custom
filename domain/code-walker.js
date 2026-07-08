"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeWalker = void 0;
const regex_1 = require("../regex");
class CodeWalker {
    walkLines(lines, onFence, onOutside) {
        let inCodeB = false;
        for (let ix = 0; ix < lines.length; ix++) {
            const line = lines[ix];
            const trim = line.trim();
            if (regex_1.codeFenceRx.test(trim)) {
                onFence(line, ix, trim, !inCodeB);
                inCodeB = !inCodeB;
                continue;
            }
            if (inCodeB)
                continue;
            const jump = onOutside(line, ix, trim);
            if (jump !== undefined)
                ix = jump;
        }
    }
    walkOutsideCode(lines, fn) {
        this.walkLines(lines, () => { }, (_line, ix, trim) => fn(ix, trim));
    }
    eachLineOutsideCode(lines, fn) {
        this.walkOutsideCode(lines, (ix, trim) => {
            fn(lines[ix], ix, trim);
            return undefined;
        });
    }
    walkCodeFenceAware(lines, handlers) {
        this.walkLines(lines, (line, ix, trim, opening) => handlers.onFence(line, ix, trim, opening), (line, ix, trim) => {
            handlers.onOutside(line, ix, trim);
            return undefined;
        });
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
