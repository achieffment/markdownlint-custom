export const subNumItemRx = /^\d+(?:\.\d+)+\s+/;

export const subNumPathRx = /^(\d+(?:\.\d+)+)\s+/;

export const bulItemRx = /^[-+*]\s/;

export const numItemRx = /^\d+(?:\.\d+)+\s+|\d+\.\s+/;

export const topNumPathRx = /^(\d+)\.\s+/;

export const lstItemRx = /^([-+*]\s|\d+(?:\.\d+)+\s|\d+\.\s)/;

export const h2Rx = /^##(?!\#)\s+\S/;

export const endsWithColonRx = /:$/;

export const endsWithSemiRx = /;$/;

export const endsWithMarkRx = /[.!?:;]$/;

export const hrRx = /^(-{3,}|\*{3,}|_{3,})$/;

export const tableRowRx = /^\|/;

export const codeFenceRx = /^```/;
