"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRule = void 0;
class BaseRule {
    get parser() {
        return "none";
    }
    check(_params, _onError) { }
    checkMicromark(_params, _onError) { }
    toRule() {
        const parser = this.parser;
        return {
            names: [...this.names],
            description: this.description,
            tags: [...this.tags],
            parser,
            function: (params, onError) => {
                if (parser === "micromark") {
                    this.checkMicromark(params, onError);
                }
                else {
                    this.check(params, onError);
                }
            }
        };
    }
}
exports.BaseRule = BaseRule;
