const lstItemRx = /^([-+*]\s|\d+(?:\.\d+)+\s|\d+\.\s)/;

const trimStart = (line) => line.replace(/^\s*/, "");
const getIndent = (line) => line.match(/^(\s*)/)[1].length;
const isLstItem = (line) => lstItemRx.test(trimStart(line));
const isNumItem = (line) => /^\s*\d+(?:\.\d+)+\s+/.test(line) || /^\s*\d+\.\s+/.test(line);
const isBulItem = (line) => /^\s*[-*+]\s+/.test(line);
const isNestedLstItem = (line) => {
    if (getIndent(line) > 0) return true;
    return /^\s*\d+(?:\.\d+)+\s+/.test(line);
};

const getNumPath = (line) => {
    if (!isNumItem(line)) return null;
    const t = trimStart(line);
    const top = t.match(/^(\d+)\.\s+/);
    if (top) return top[1];
    const sub = t.match(/^(\d+(?:\.\d+)+)\s+/);
    return sub ? sub[1] : null;
};

const isChildLstItem = (parentLine, childLine) => {
    if (!isLstItem(parentLine) || !isLstItem(childLine)) return false;
    if (getIndent(childLine) > getIndent(parentLine)) return true;
    const parentPath = getNumPath(parentLine);
    const childPath = getNumPath(childLine);
    return Boolean(parentPath && childPath && childPath.startsWith(parentPath + "."));
};

const skipBlankFwd = (lines, ix) => {
    let next = ix + 1;
    while (next < lines.length && lines[next].trim() === "") next++;
    return next;
};

const skipBlankBck = (lines, ix) => {
    let prev = ix - 1;
    while (prev >= 0 && lines[prev].trim() === "") prev--;
    return prev;
};

const hasBlankGap = (lines, beg, end) => {
    if (beg > end) return false;
    for (let ix = beg; ix <= end; ix++) {
        if (lines[ix].trim() === "") return true;
    }
    return false;
};

const boundBefIdx = (lines, fstBeg, isSameKind) => {
    const prev = skipBlankBck(lines, fstBeg);
    if (prev < 0) return -1;
    if (isSameKind(lines[prev])) return -1;
    if (hasBlankGap(lines, prev + 1, fstBeg - 1)) return -1;
    return fstBeg;
};

const boundAftIdx = (lines, lstEnd, isSameKind) => {
    const next = skipBlankFwd(lines, lstEnd);
    if (next >= lines.length) return -1;
    if (isSameKind(lines[next])) return -1;
    if (hasBlankGap(lines, lstEnd + 1, next - 1)) return -1;
    return next;
};

const walkOutsideCode = (lines, fn) => {
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
};

const eachLineOutsideCode = (lines, fn) => {
    walkOutsideCode(lines, (ix, trim) => {
        fn(lines[ix], ix, trim);
    });
};

const findPrevListInd = (lines, ix) => {
    const currInd = getIndent(lines[ix]);
    let prev = ix - 1;
    let prevInd = -1;
    while (prev >= 0) {
        const prevTrim = lines[prev].trim();
        if (!prevTrim) {
            prev--;
            continue;
        }
        if (prevTrim.startsWith("```")) {
            prev--;
            while (prev >= 0 && !lines[prev].trim().startsWith("```")) prev--;
            if (prev >= 0) prev--;
            continue;
        }
        if (isLstItem(lines[prev])) {
            prevInd = getIndent(lines[prev]);
            break;
        }
        const lineInd = getIndent(lines[prev]);
        if (lineInd >= currInd && !prevTrim.startsWith("#")) {
            prev--;
            continue;
        }
        break;
    }
    return prevInd;
};

const checkPrecededByColon = (lines, ix, onError, colDet) => {
    const prev = skipBlankBck(lines, ix);
    if (prev < 0) return;
    const prevTrim = lines[prev].trim();
    if (!prevTrim || prevTrim.startsWith("#") || prevTrim.startsWith("```") || isLstItem(lines[prev])) return;
    if (!/:$/.test(prevTrim)) {
        onError({ lineNumber: prev + 1, detail: colDet, context: lines[prev] });
    }
};

const createListBlockHelpers = (lines) => {
    const findItemEnd = (beg, shouldBrk) => {
        const ind = getIndent(lines[beg]);
        let end = beg;
        for (let ix = beg + 1; ix < lines.length; ix++) {
            const trim = lines[ix].trim();
            if (!trim) continue;
            if (trim.startsWith("#")) break;
            if (shouldBrk(lines[ix])) break;
            const jInd = getIndent(lines[ix]);
            if (trim.startsWith("```")) {
                end = ix;
                ix++;
                while (ix < lines.length && !lines[ix].trim().startsWith("```")) ix++;
                if (ix < lines.length) end = ix;
                break;
            }
            if (jInd > ind) end = ix;
            else break;
        }
        return end;
    };
    const findNumItemEnd = (beg) => findItemEnd(beg, isNumItem);
    const findBulItemEnd = (beg) => findItemEnd(beg, (line) => isBulItem(line) || isNumItem(line));
    const collectBlock = (fstBeg, isItem, shouldBrk, findEnd) => {
        const baseInd = getIndent(lines[fstBeg]);
        const items = [];
        let idx = fstBeg;
        while (idx < lines.length) {
            while (idx < lines.length && lines[idx].trim() === "") idx++;
            if (idx >= lines.length) break;
            const trim = lines[idx].trim();
            if (trim.startsWith("#") || trim.startsWith("```")) break;
            if (shouldBrk(lines[idx])) break;
            if (!isItem(lines[idx])) {
                if (items.length === 0) break;
                const lineInd = getIndent(lines[idx]);
                if (lineInd <= baseInd) break;
                idx++;
                continue;
            }
            items.push(idx);
            idx = findEnd(idx) + 1;
        }
        return items;
    };
    const collectNumBlock = (fstBeg) => collectBlock(fstBeg, isNumItem, () => false, findNumItemEnd);
    const collectBulBlock = (fstBeg) => collectBlock(fstBeg, isBulItem, isNumItem, findBulItemEnd);
    return { findNumItemEnd, findBulItemEnd, collectNumBlock, collectBulBlock };
};

const walkListBlocks = (lines, onBlock) => {
    const { findNumItemEnd, findBulItemEnd, collectNumBlock, collectBulBlock } = createListBlockHelpers(lines);
    walkOutsideCode(lines, (ix) => {
        if (isNumItem(lines[ix])) {
            const items = collectNumBlock(ix);
            if (items.length === 0) return ix;
            onBlock(items, findNumItemEnd, isNumItem, true);
            return findNumItemEnd(items[items.length - 1]);
        }
        if (isBulItem(lines[ix])) {
            const items = collectBulBlock(ix);
            if (items.length === 0) return ix;
            onBlock(items, findBulItemEnd, isBulItem, false);
            return findBulItemEnd(items[items.length - 1]);
        }
    });
};

const checkListBlankSpacing = (lines, onError) => {
    const befDet = "Перед первым пунктом списка должна быть пустая строка";
    const aftDet = "После последнего пункта списка должна быть пустая строка";
    const gapDet = "Между пунктами списка должна быть пустая строка";
    const checkBlockBounds = (items, findEnd, isSameKind) => {
        if (items.length === 0) return;
        const fstBeg = items[0];
        const befIdx = boundBefIdx(lines, fstBeg, isSameKind);
        if (befIdx >= 0) {
            onError({ lineNumber: befIdx + 1, detail: befDet, context: lines[fstBeg].trim() });
        }
        const lstEnd = findEnd(items[items.length - 1]);
        const aftIdx = boundAftIdx(lines, lstEnd, isSameKind);
        if (aftIdx >= 0) {
            onError({ lineNumber: aftIdx + 1, detail: aftDet, context: lines[lstEnd].trim() });
        }
    };
    const checkBlockGaps = (items, findEnd) => {
        if (items.length < 2) return;
        const gaps = items.slice(0, -1).map((beg, i) => {
            const end = findEnd(beg);
            const nxtBeg = items[i + 1];
            return { nxtBeg, hasBlank: hasBlankGap(lines, end + 1, nxtBeg - 1) };
        });
        const anyBlank = gaps.some(gap => gap.hasBlank);
        if (!anyBlank) return;
        gaps.forEach(gap => {
            if (!gap.hasBlank) {
                onError({ lineNumber: gap.nxtBeg + 1, detail: gapDet, context: lines[gap.nxtBeg].trim() });
            }
        });
    };
    walkListBlocks(lines, (items, findEnd, isSameKind, isNum) => {
        checkBlockBounds(items, findEnd, isSameKind);
        if (isNum) {
            checkBlockGaps(items, findEnd);
        }
    });
};

const checkListPrecededByColon = (lines, onError, colDet) => {
    walkListBlocks(lines, (items) => {
        if (isNestedLstItem(lines[items[0]])) return;
        checkPrecededByColon(lines, items[0], onError, colDet);
    });
};

module.exports = {
    lstItemRx,
    getIndent,
    isLstItem,
    isChildLstItem,
    skipBlankFwd,
    eachLineOutsideCode,
    findPrevListInd,
    checkPrecededByColon,
    checkListBlankSpacing,
    checkListPrecededByColon
};
