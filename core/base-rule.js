"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRule = void 0;
class BaseRule {
    toRule() {
        return {
            names: [...this.names],
            description: this.description,
            tags: [...this.tags],
            parser: "none",
            function: (params, onError) => {
                this.check(params.lines, onError);
            }
        };
    }
}
exports.BaseRule = BaseRule;
