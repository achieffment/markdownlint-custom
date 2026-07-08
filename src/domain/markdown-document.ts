import type { CodeFenceHandlers, OutsideCodeCallback } from "../types";
import type { CodeWalker } from "./code-walker";
import type { ListLineParser } from "./list-line-parser";

export class MarkdownDocument {
    constructor(
        readonly lines: readonly string[],
        private readonly codeWalker: CodeWalker,
        private readonly lineParser: ListLineParser
    ) {}

    eachLineOutsideCode(fn: OutsideCodeCallback): void {
        this.codeWalker.eachLineOutsideCode(this.lines, fn);
    }

    walkCodeFenceAware(handlers: CodeFenceHandlers): void {
        this.codeWalker.walkCodeFenceAware(this.lines, handlers);
    }

    eachOpeningCodeFence(fn: (ix: number) => void): void {
        this.codeWalker.eachOpeningCodeFence(this.lines, fn);
    }

    skipBlankFwd(ix: number): number {
        return this.lineParser.skipBlankFwd(this.lines, ix);
    }

    findPrevListInd(ix: number): number {
        return this.lineParser.findPrevListInd(this.lines, ix);
    }
}
