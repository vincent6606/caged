import { AppState, FretboardNote } from "./types";
import { TUNING, CHORD_FORMULAS, SHAPE_DEFINITIONS, NOTE_NAMES, INTERVAL_LABELS } from "./constants";

/* --- Helpers --- */

export function getNoteIndex(stringIdx: number, fret: number): number {
    return (TUNING[stringIdx] + fret) % 12;
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
    const { root, quality, shape, patternMode, customNotes } = state;

    // --- EDIT MODE LOGIC ---
    if (patternMode === 'edit') {
        if (!customNotes) return [];
        return customNotes.map(n => {
            const noteIdx = getNoteIndex(n.stringIdx, n.fret);
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

    // --- STANDARD LOGIC ---
    const def = SHAPE_DEFINITIONS[shape];
    const formula = CHORD_FORMULAS[quality];

    if (!def || !formula) return [];

    // Calculate where the "Root" fret is for this shape
    // Calculate where the "Root" fret is for this shape
    const stringOpenPitch = TUNING[def.anchorString];

    // Base Root Fret on the anchor string (lowest positive fret)
    const baseRootFret = (root - stringOpenPitch % 12 + 12) % 12;

    let rootFret = baseRootFret;

    // Smart Octave Selection
    // If we have a clicked note, we want the shape that *contains* that note.
    if (state.selectedNote) {
        const { stringIdx, fret } = state.selectedNote;

        // Candidates: Low, Mid, High octaves
        // A shape covers roughly [root - offsetLow, root + offsetHigh]
        // We want to find a candidate Root Fret R such that the clicked note falls in range.
        // NOTE: This is complex because "Horizontal" shapes might overlap.
        // Let's try candidates: base, base + 12, base + 24

        const candidates = [baseRootFret, baseRootFret + 12, baseRootFret + 24].filter(c => c <= 24); // Cap at 24? Actually root can be anywhere if strings allow.

        const bestCandidate = candidates.find(candidateRoot => {
            const minFret = candidateRoot - def.offsetLow;
            const maxFret = candidateRoot + def.offsetHigh;
            // Does the clicked note fall roughly in this fret range?
            // Allow some wiggle room or strict logic?
            return fret >= minFret && fret <= maxFret;
        });

        if (bestCandidate !== undefined) {
            rootFret = bestCandidate;
        } else {
            // Fallback: If clicked note is far, default to standard logic (lowest valid)
            if (rootFret - def.offsetLow < 0) rootFret += 12;
        }

    } else {
        // Standard Logic: lowest valid position
        if (rootFret - def.offsetLow < 0) rootFret += 12;
    }

    const shapeMin = rootFret - def.offsetLow;
    const shapeMax = rootFret + def.offsetHigh;
    const activeNotes: FretboardNote[] = [];

    // Iterate all strings and relevant frets
    for (let s = 0; s < 6; s++) {
        for (let f = 0; f <= 24; f++) { // Fixed Viewport 0-24
            // Optimization: Only check frets within the shape's "Box" if in Box Mode
            // Use extended range for Waterfall to allow runs to flow out
            const inBoxRange = f >= shapeMin && f <= shapeMax;

            // Calculate Note Info
            const noteIdx = getNoteIndex(s, f);
            const interval = getInterval(root, noteIdx);

            if (formula.includes(interval)) {
                let shouldRender = false;

                if (patternMode === 'box') {
                    shouldRender = inBoxRange;
                } else if (patternMode === 'waterfall') {
                    shouldRender = isNoteInWaterfall(s, interval, shape);
                }

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
