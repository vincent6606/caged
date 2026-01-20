
export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type IntervalLabel = 'R' | 'b2' | '2' | 'b3' | '3' | '4' | 'b5' | '5' | '#5' | '6' | 'b7' | '7';
export type ShapeName = 'C' | 'A' | 'G' | 'E' | 'D';
export type ChordQuality = 'Maj7' | 'Dom7' | 'Min7' | 'Min7b5' | 'Dim7';
export type PatternMode = 'box' | 'waterfall' | 'edit' | 'tab';
export type TuningName = 'Standard' | 'DADGAD' | 'Open D' | 'Drop D' | 'Custom';

export interface FretboardNote {
    stringIdx: number;
    fret: number;
    noteName: NoteName;
    interval: number; // 0-11
    label: IntervalLabel;
    isRoot: boolean;
    isInShape: boolean;
    isInWaterfall: boolean;
}

export interface AppState {
    root: number; // 0-11 (C=0)
    quality: ChordQuality;
    shape: ShapeName;
    patternMode: PatternMode;
    tuningName: TuningName;
    tuning: number[];
    playbackSpeed: number;
    isPlaying: boolean;
    customNotes: Array<{ stringIdx: number; fret: number }>;
    selectedNote: { stringIdx: number; fret: number } | null;
    activeTabNotes: Array<{ stringIdx: number; fret: number }>;
}
