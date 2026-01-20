import { AppState, FretboardNote } from "./types";
import { TUNING, CHORD_FORMULAS, SHAPE_DEFINITIONS, NOTE_NAMES, INTERVAL_LABELS } from "./constants";

/* --- Helpers --- */

/* --- Helpers --- */

// Modified to accept tuning context
export function getNoteIndex(stringIdx: number, fret: number, tuning: number[] = TUNING): number {
    return (tuning[stringIdx] + fret) % 12;
}

export function getInterval(rootIdx: number, noteIdx: number): number {
    return (noteIdx - rootIdx + 12) % 12;
}

/* --- Waterfall Logic --- */
// Determines if a note belongs to the "2-1-2" diagonal pattern for Neo-Soul runs
function isNoteInWaterfall(stringIdx: number, interval: number, shape: string): boolean {
    // 1. Define valid root strings for each shape
    // C-Shape reduced to String 1 (A) only for 2-1-2 Logic
    const ROOTS_PER_SHAPE: Record<string, number[]> = {
        'C': [1], // Only A-String root starts pattern
        'A': [1, 3],
        'G': [0, 3, 5],
        'E': [0, 2, 5],
        'D': [2, 4]
    };

    const activeRoots = ROOTS_PER_SHAPE[shape];
    if (!activeRoots) return false;

    for (let startStr = 0; startStr < 6; startStr++) {
        if (activeRoots.includes(startStr)) {
            const rel = stringIdx - startStr;
            // The 2-1-2 Pattern Relative to Root String:
            if (rel === 0 && [0, 3, 4].includes(interval)) return true;
            if (rel === 1 && [7].includes(interval)) return true;
            if (rel === 2 && [10, 11, 0].includes(interval)) return true;
        }
    }
    return false;
}

/* --- Main Calculator --- */

export function calculateFretboardState(state: AppState): FretboardNote[] {
    const { root, quality, shape, patternMode, customNotes, activeTabNotes, tuningName, tuning } = state;

    // Use default Standard Tuning if tuning is missing (legacy safety)
    const currentTuning = tuning || TUNING;

    // --- FREESTYLE / NON-STANDARD TUNING LOGIC ---
    // If not standard tuning, show all notes matching the chord formula (Root + Intervals)
    // OR if we want to bypass CAGED manually? (Currently implied by "new tunings")
    const isStandard = tuningName === 'Standard' || !tuningName;

    // --- EDIT MODE LOGIC ---
    if (patternMode === 'edit' || patternMode === 'tab') {
        const sourceNotes = patternMode === 'tab' ? activeTabNotes : customNotes;
        if (!sourceNotes) return [];
        return sourceNotes.map(n => {
            const noteIdx = getNoteIndex(n.stringIdx, n.fret, currentTuning);
            const interval = getInterval(root, noteIdx);
            return {
                stringIdx: n.stringIdx,
                fret: n.fret,
                noteName: NOTE_NAMES[noteIdx],
                interval: interval,
                label: INTERVAL_LABELS[interval],
                isRoot: interval === 0,
                isInShape: false,
                isInWaterfall: false
            };
        });
    }

    const formula = CHORD_FORMULAS[quality];
    if (!formula) return [];

    // --- STANDARD TUNING (CAGED) LOGIC ---
    if (isStandard) {
        const def = SHAPE_DEFINITIONS[shape];
        if (!def) return [];

        const stringOpenPitch = currentTuning[def.anchorString];
        const baseRootFret = (root - stringOpenPitch % 12 + 12) % 12;
        let rootFret = baseRootFret;

        // Smart Octave Selection
        if (state.selectedNote) {
            const { stringIdx, fret } = state.selectedNote;
            const candidates = [baseRootFret, baseRootFret + 12, baseRootFret + 24].filter(c => c <= 24);
            const bestCandidate = candidates.find(candidateRoot => {
                const minFret = candidateRoot - def.offsetLow;
                const maxFret = candidateRoot + def.offsetHigh;
                return fret >= minFret && fret <= maxFret;
            });

            if (bestCandidate !== undefined) {
                rootFret = bestCandidate;
            } else {
                if (rootFret - def.offsetLow < 0) rootFret += 12;
            }
        } else {
            if (rootFret - def.offsetLow < 0) rootFret += 12;
        }

        const shapeMin = rootFret - def.offsetLow;
        const shapeMax = rootFret + def.offsetHigh;
        const activeNotes: FretboardNote[] = [];

        for (let s = 0; s < 6; s++) {
            for (let f = 0; f <= 24; f++) {
                const inBoxRange = f >= shapeMin && f <= shapeMax;
                const noteIdx = getNoteIndex(s, f, currentTuning);
                const interval = getInterval(root, noteIdx);

                if (formula.includes(interval)) {
                    let shouldRender = false;
                    if (patternMode === 'box') shouldRender = inBoxRange;
                    else if (patternMode === 'waterfall') shouldRender = isNoteInWaterfall(s, interval, shape);

                    if (shouldRender) {
                        activeNotes.push({
                            stringIdx: s,
                            fret: f,
                            noteName: NOTE_NAMES[noteIdx],
                            interval: interval,
                            label: INTERVAL_LABELS[interval],
                            isRoot: interval === 0,
                            isInShape: inBoxRange,
                            isInWaterfall: isNoteInWaterfall(s, interval, shape)
                        });
                    }
                }
            }
        }
        return activeNotes;
    }

    // --- NON-STANDARD TUNING (FREE MODE) ---
    // Just display Root and Intervals across the board
    const activeNotes: FretboardNote[] = [];
    for (let s = 0; s < 6; s++) {
        for (let f = 0; f <= 24; f++) {
            const noteIdx = getNoteIndex(s, f, currentTuning);
            const interval = getInterval(root, noteIdx);

            if (formula.includes(interval)) {
                activeNotes.push({
                    stringIdx: s,
                    fret: f,
                    noteName: NOTE_NAMES[noteIdx],
                    interval: interval,
                    label: INTERVAL_LABELS[interval],
                    isRoot: interval === 0,
                    isInShape: true, // Render as 'in shape' to get visual styling
                    isInWaterfall: false
                });
            }
        }
    }
    return activeNotes;
}
