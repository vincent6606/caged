import { NoteName, IntervalLabel, ChordQuality, ShapeName, TuningName } from "./types";

export const NOTE_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Standard E Tuning (Low E to High E)
// E, A, D, G, B, E (indices in a continuous chromatic scale where C=0)
export const TUNINGS: Record<TuningName, number[]> = {
    'Standard': [4, 9, 14, 19, 23, 28],
    'DADGAD': [2, 9, 14, 19, 21, 26],
    'Open D': [2, 9, 14, 18, 21, 26], // D A D F# A D
    'Drop D': [2, 9, 14, 19, 23, 28]
};

export const TUNING = TUNINGS['Standard']; // Default Legacy

export const INTERVAL_LABELS: IntervalLabel[] = ['R', 'b2', '2', 'b3', '3', '4', 'b5', '5', '#5', '6', 'b7', '7'];

export const CHORD_FORMULAS: Record<ChordQuality, number[]> = {
    'Maj7': [0, 4, 7, 11],
    'Dom7': [0, 4, 7, 10],
    'Min7': [0, 3, 7, 10],
    'Min7b5': [0, 3, 6, 10],
    'Dim7': [0, 3, 6, 9]
};

// Which shape connects to which string (Navigation Logic)
// If you click String X, which shapes are valid starting points?
export const STRING_TO_SHAPE_MAP: Record<number, ShapeName[]> = {
    0: ['E', 'G'],
    1: ['A', 'C'],
    2: ['D', 'E'],
    3: ['G', 'A'],
    4: ['D'],      // B-String now exclusively triggers D-Shape
    5: ['E', 'G']
};

export const SHAPE_DEFINITIONS: Record<ShapeName, { anchorString: number; offsetLow: number; offsetHigh: number }> = {
    'C': { anchorString: 1, offsetLow: 3, offsetHigh: 2 },
    'A': { anchorString: 1, offsetLow: 0, offsetHigh: 4 },
    'G': { anchorString: 0, offsetLow: 3, offsetHigh: 2 },
    'E': { anchorString: 0, offsetLow: 0, offsetHigh: 4 },
    'D': { anchorString: 2, offsetLow: 0, offsetHigh: 4 }
};
