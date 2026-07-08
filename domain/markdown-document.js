"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownDocument = void 0;
class MarkdownDocument {
    constructor(lines, codeWalker, lineParser) {
        this.lines = lines;
        this.codeWalker = codeWalker;
        this.lineParser = lineParser;
    }
    eachLineOutsideCode(fn) {
        this.codeWalker.eachLineOutsideCode(this.lines, fn);
    }
    walkCodeFenceAware(handlers) {
        this.codeWalker.walkCodeFenceAware(this.lines, handlers);
    }
    eachOpeningCodeFence(fn) {
        this.codeWalker.eachOpeningCodeFence(this.lines, fn);
    }
    skipBlankFwd(ix) {
        return this.lineParser.skipBlankFwd(this.lines, ix);
    }
    findPrevListInd(ix) {
        return this.lineParser.findPrevListInd(this.lines, ix);
    }
}
exports.MarkdownDocument = MarkdownDocument;
