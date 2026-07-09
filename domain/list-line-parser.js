"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLineParser = void 0;
const regex_1 = require("../regex");
class ListLineParser {
    get lstItemRx() {
        return regex_1.lstItemRx;
    }
    trimStart(line) {
        return line.replace(/^\s*/, "");
    }
    getIndent(line) {
        return line.match(/^(\s*)/)?.[1]?.length ?? 0;
    }
    isLstItem(line) {
        return regex_1.lstItemRx.test(this.trimStart(line));
    }
    isNumItem(line) {
        return regex_1.numItemRx.test(this.trimStart(line));
    }
    isBulItem(line) {
        return regex_1.bulItemRx.test(this.trimStart(line));
    }
    isNestedLstItem(line) {
        if (this.getIndent(line) > 0)
            return true;
        return regex_1.subNumItemRx.test(this.trimStart(line));
    }
    getNumPath(line) {
        if (!this.isNumItem(line))
            return null;
        const t = this.trimStart(line);
        const top = t.match(regex_1.topNumPathRx);
        if (top)
            return top[1];
        const sub = t.match(regex_1.subNumPathRx);
        return sub ? sub[1] : null;
    }
    isChildLstItem(parentLine, childLine) {
        if (!this.isLstItem(parentLine) || !this.isLstItem(childLine))
            return false;
        if (this.getIndent(childLine) > this.getIndent(parentLine))
            return true;
        const parentPath = this.getNumPath(parentLine);
        const childPath = this.getNumPath(childLine);
        return Boolean(parentPath && childPath && childPath.startsWith(parentPath + "."));
    }
    skipBlankFwd(lines, ix) {
        let next = ix + 1;
        while (next < lines.length && lines[next].trim() === "")
            next++;
        return next;
    }
    skipBlankBck(lines, ix) {
        let prev = ix - 1;
        while (prev >= 0 && lines[prev].trim() === "")
            prev--;
        return prev;
    }
    findPrevListInd(lines, ix) {
        const currInd = this.getIndent(lines[ix]);
        let prev = ix - 1;
        let prevInd = -1;
        while (prev >= 0) {
            const prevTrim = lines[prev].trim();
            if (!prevTrim) {
                prev--;
                continue;
            }
            if (regex_1.codeFenceRx.test(prevTrim)) {
                prev--;
                while (prev >= 0 && !regex_1.codeFenceRx.test(lines[prev].trim()))
                    prev--;
                if (prev >= 0)
                    prev--;
                continue;
            }
            if (this.isLstItem(lines[prev])) {
                prevInd = this.getIndent(lines[prev]);
                break;
            }
            const lineInd = this.getIndent(lines[prev]);
            if (lineInd >= currInd && !regex_1.headingRx.test(prevTrim)) {
                prev--;
                continue;
            }
            break;
        }
        return prevInd;
    }
}
exports.ListLineParser = ListLineParser;
