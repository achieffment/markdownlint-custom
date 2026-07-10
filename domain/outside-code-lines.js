"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eachOpeningCodeFenceLine = exports.isOpeningCodeFenceAt = exports.walkCodeFenceAware = exports.walkOutsideCode = exports.eachLineOutsideCode = exports.skipFenceBlockBck = exports.skipFenceBlockFwd = void 0;
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
const skipFenceBlockFwd = (lines, ix) => {
    if (ix < 0 || ix >= lines.length)
        return ix;
    if (!regex_1.codeFenceRx.test(lines[ix].trim()))
        return ix;
    let next = ix + 1;
    while (next < lines.length && !regex_1.codeFenceRx.test(lines[next].trim()))
        next++;
    return next;
};
exports.skipFenceBlockFwd = skipFenceBlockFwd;
const skipFenceBlockBck = (lines, ix) => {
    if (ix < 0 || ix >= lines.length)
        return ix;
    if (!regex_1.codeFenceRx.test(lines[ix].trim()))
        return ix;
    let prev = ix - 1;
    while (prev >= 0 && !regex_1.codeFenceRx.test(lines[prev].trim()))
        prev--;
    if (prev >= 0)
        return prev - 1;
    return prev;
};
exports.skipFenceBlockBck = skipFenceBlockBck;
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
const isOpeningCodeFenceAt = (lines, ix) => {
    if (ix < 0 || ix >= lines.length)
        return false;
    if (!regex_1.codeFenceRx.test(lines[ix].trim()))
        return false;
    let opening = false;
    let found = false;
    (0, exports.walkCodeFenceAware)(lines, {
        onFence: (_line, fenceIx, _trim, isOpening) => {
            if (fenceIx === ix) {
                opening = isOpening;
                found = true;
            }
        },
        onOutside: () => { }
    });
    return found && opening;
};
exports.isOpeningCodeFenceAt = isOpeningCodeFenceAt;
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
