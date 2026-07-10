"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eachOpeningCodeFenceLine = exports.walkCodeFenceAware = exports.walkOutsideCode = exports.eachLineOutsideCode = exports.isOpeningCodeFenceAt = void 0;
const regex_1 = require("../regex");
const walkLines = (lines, onFence, onOutside) => {
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
};
const isOpeningCodeFenceAt = (lines, ix) => {
    let inCodeB = false;
    for (let i = 0; i <= ix; i++) {
        const trim = lines[i].trim();
        if (regex_1.codeFenceRx.test(trim)) {
            if (i === ix) {
                return !inCodeB;
            }
            inCodeB = !inCodeB;
        }
    }
    return false;
};
exports.isOpeningCodeFenceAt = isOpeningCodeFenceAt;
const eachLineOutsideCode = (lines, fn) => {
    walkLines(lines, () => { }, (_line, ix, trim) => {
        fn(lines[ix], ix, trim);
        return undefined;
    });
};
exports.eachLineOutsideCode = eachLineOutsideCode;
const walkOutsideCode = (lines, fn) => {
    walkLines(lines, () => { }, (_line, ix, trim) => {
        return fn(ix, trim);
    });
};
exports.walkOutsideCode = walkOutsideCode;
const walkCodeFenceAware = (lines, handlers) => {
    walkLines(lines, (line, ix, trim, opening) => {
        handlers.onFence(line, ix, trim, opening);
    }, (line, ix, trim) => {
        handlers.onOutside(line, ix, trim);
        return undefined;
    });
};
exports.walkCodeFenceAware = walkCodeFenceAware;
const eachOpeningCodeFenceLine = (lines, fn) => {
    (0, exports.walkCodeFenceAware)(lines, {
        onFence: (_line, ix, _trim, opening) => {
            if (opening)
                fn(ix);
        },
        onOutside: () => { }
    });
};
exports.eachOpeningCodeFenceLine = eachOpeningCodeFenceLine;
