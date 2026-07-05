/** @type {import("markdownlint").Rule[]} */

const {
    lstItemRx,
    isLstItem,
    getIndent,
    skipBlankFwd,
    eachLineOutsideCode,
    findPrevListInd,
    checkPrecededByColon,
    checkListBlankSpacing,
    checkListPrecededByColon
} = require("./markdownlint-hlprs");

const minimumH2Det = "Документ должен содержать минимум один заголовок второго уровня (##) вне блока кода";
const listItemsEndDet = "Пункт списка должен заканчиваться ;, а если после него идёт блок кода — :";
const listBlankSpacingDet = "Нумерованные списки: blank до/после и единообразно между пунктами; маркированные: blank до/после блока (между пунктами не проверяется)";
const listPrecededByColonDet = "Обычный текст (не пункт списка) перед первым пунктом блока верхнего уровня должен заканчиваться :, вложенные пункты не проверяются";
const codeblockColonDet = "Обычный текст (не пункт списка) перед блоком кода должен заканчиваться :";
const noLeadingSpacesDet = "Обычный текст, пункты списка верхнего уровня и обозначения блока кода (```) не должны иметь отступ в начале строки";
const sentencesEndMarkDet = "Обычный текст должен заканчиваться . ! ? : или ;";

module.exports = [
    {
        names: ["minimum-h2-heading"],
        description: minimumH2Det,
        tags: ["headings"],
        parser: "none",
        function: (params, onError) => {
            const lines = params.lines;
            let hasH2 = false;
            eachLineOutsideCode(lines, (line, ix, trim) => {
                if (/^##(?!\#)\s+\S/.test(trim)) {
                    hasH2 = true;
                }
            });
            if (!hasH2) {
                onError({ lineNumber: 1, detail: minimumH2Det });
            }
        }
    },

    {
        names: ["list-items-end-with-semicolon-or-colon"],
        description: listItemsEndDet,
        tags: ["lists"],
        parser: "none",
        function: (params, onError) => {
            const lines = params.lines;
            eachLineOutsideCode(lines, (line, ix, trim) => {
                if (!isLstItem(line)) return;
                let cont = trim.replace(lstItemRx, "");
                cont = cont.trim();
                const next = skipBlankFwd(lines, ix);
                const folcod = next < lines.length && /^```/.test(lines[next].trim());
                const endsOk = folcod ? /:$/.test(cont) : /;$/.test(cont);
                const lstDet = folcod ? "Пункт списка перед блоком кода должен заканчиваться :" : "Пункт списка должен заканчиваться ;";
                if (!cont || !endsOk) {
                    onError({ lineNumber: ix + 1, detail: lstDet, context: trim || "Пустой пункт списка" });
                }
            });
        }
    },

    {
        names: ["list-blank-line-spacing"],
        description: listBlankSpacingDet,
        tags: ["lists"],
        parser: "none",
        function: (params, onError) => {
            const lines = params.lines;
            checkListBlankSpacing(lines, onError);
        }
    },

    {
        names: ["list-preceded-by-colon"],
        description: listPrecededByColonDet,
        tags: ["lists"],
        parser: "none",
        function: (params, onError) => {
            const lines = params.lines;
            checkListPrecededByColon(lines, onError, listPrecededByColonDet);
        }
    },

    {
        names: ["codeblock-preceded-by-colon"],
        description: codeblockColonDet,
        tags: ["code"],
        parser: "none",
        function: (params, onError) => {
            const lines = params.lines;
            let inCodeB = false;
            for (let ix = 0; ix < lines.length; ix++) {
                const trim = lines[ix].trim();
                if (!trim.startsWith("```")) continue;
                if (!inCodeB) {
                    checkPrecededByColon(lines, ix, onError, codeblockColonDet);
                }
                inCodeB = !inCodeB;
            }
        }
    },

    {
        names: ["no-leading-spaces"],
        description: noLeadingSpacesDet,
        tags: ["formatting"],
        parser: "none",
        function: (params, onError) => {
            const lines = params.lines;
            let inCodeB = false;
            for (let ix = 0; ix < lines.length; ix++) {
                const line = lines[ix];
                const trim = line.trim();
                if (trim.startsWith("```")) {
                    const currInd = getIndent(line);
                    if (currInd > 0) {
                        onError({ lineNumber: ix + 1, detail: noLeadingSpacesDet, context: line });
                    }
                    inCodeB = !inCodeB;
                    continue;
                }
                if (inCodeB) continue;
                if (trim.startsWith("#")) continue;
                const currInd = getIndent(line);
                if (isLstItem(line)) {
                    if (currInd > 0) {
                        const prevInd = findPrevListInd(lines, ix);
                        if (prevInd < 0 || currInd <= prevInd) {
                            onError({ lineNumber: ix + 1, detail: noLeadingSpacesDet, context: line });
                        }
                    }
                    continue;
                }
                if (currInd > 0) {
                    onError({ lineNumber: ix + 1, detail: noLeadingSpacesDet, context: line });
                }
            }
        }
    },

    {
        names: ["sentences-end-with-mark"],
        description: sentencesEndMarkDet,
        tags: ["formatting"],
        parser: "none",
        function: (params, onError) => {
            const lines = params.lines;
            eachLineOutsideCode(lines, (line, ix, trim) => {
                if (!trim) return;
                if (trim.startsWith("#") || isLstItem(line)) return;
                if (!/[.!?:;]$/.test(trim)) {
                    onError({ lineNumber: ix + 1, detail: sentencesEndMarkDet, context: trim });
                }
            });
        }
    }
];
