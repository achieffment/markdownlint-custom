export type BlankDets = {
    bef: string;
    aft: string;
    gap: string;
};

export type OutsideCodeCallback = (line: string, ix: number, trim: string) => void;

export type OutsideCodeWalker = (ix: number, trim: string) => number | undefined;

export type LinePredicate = (line: string) => boolean;

export type ListBlockHandler = (items: number[]) => void;

export type CodeFenceHandlers = {
    onFence: (line: string, ix: number, trim: string, opening: boolean) => void;
    onOutside: (line: string, ix: number, trim: string) => void;
};
