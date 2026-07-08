import { bulItemRx, lstItemRx, numItemRx, subNumItemRx } from "../regex";

export class ListLineParser {
    get lstItemRx(): RegExp {
        return lstItemRx;
    }

    trimStart(line: string): string {
        return line.replace(/^\s*/, "");
    }

    getIndent(line: string): number {
        return line.match(/^(\s*)/)?.[1]?.length ?? 0;
    }

    isLstItem(line: string): boolean {
        return lstItemRx.test(this.trimStart(line));
    }

    isNumItem(line: string): boolean {
        return numItemRx.test(this.trimStart(line));
    }

    isBulItem(line: string): boolean {
        return bulItemRx.test(this.trimStart(line));
    }

    isNestedLstItem(line: string): boolean {
        if (this.getIndent(line) > 0) return true;
        return subNumItemRx.test(this.trimStart(line));
    }

    private getNumPath(line: string): string | null {
        if (!this.isNumItem(line)) return null;
        const t = this.trimStart(line);
        const top = t.match(/^(\d+)\.\s+/);
        if (top) return top[1];
        const sub = t.match(/^(\d+(?:\.\d+)+)\s+/);
        return sub ? sub[1] : null;
    }

    isChildLstItem(parentLine: string, childLine: string): boolean {
        if (!this.isLstItem(parentLine) || !this.isLstItem(childLine)) return false;
        if (this.getIndent(childLine) > this.getIndent(parentLine)) return true;
        const parentPath = this.getNumPath(parentLine);
        const childPath = this.getNumPath(childLine);
        return Boolean(parentPath && childPath && childPath.startsWith(parentPath + "."));
    }

    skipBlankFwd(lines: readonly string[], ix: number): number {
        let next = ix + 1;
        while (next < lines.length && lines[next].trim() === "") next++;
        return next;
    }

    skipBlankBck(lines: readonly string[], ix: number): number {
        let prev = ix - 1;
        while (prev >= 0 && lines[prev].trim() === "") prev--;
        return prev;
    }

    findPrevListInd(lines: readonly string[], ix: number): number {
        const currInd = this.getIndent(lines[ix]);
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
            if (this.isLstItem(lines[prev])) {
                prevInd = this.getIndent(lines[prev]);
                break;
            }
            const lineInd = this.getIndent(lines[prev]);
            if (lineInd >= currInd && !prevTrim.startsWith("#")) {
                prev--;
                continue;
            }
            break;
        }
        return prevInd;
    }
}
