import { AppState, FretboardNote } from "./types";
import { TUNING, CHORD_FORMULAS, SHAPE_DEFINITIONS, NOTE_NAMES, INTERVAL_LABELS } from "./constants";

/* --- Helpers --- */

// Modified to accept tuning context
export function getNoteIndex(stringIdx: number, fret: number, tuning: number[] = TUNING): number {
    return (tuning[stringIdx] + fret) % 12;
}

export function getInterval(rootIdx: number, noteIdx: number): number {
    return (noteIdx - rootIdx + 12) % 12;
}

/* --- Waterfall Logic (for future preset pattern) --- */
// Determines if a note belongs to the "2-1-2" diagonal pattern for Neo-Soul runs
function isNoteInWaterfall(stringIdx: number, interval: number, shape: string): boolean {
    const ROOTS_PER_SHAPE: Record<string, number[]> = {
        'C': [1],
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
            if (rel === 0 && [0, 3, 4].includes(interval)) return true;
            if (rel === 1 && [7].includes(interval)) return true;
            if (rel === 2 && [10, 11, 0].includes(interval)) return true;
        }
    }
    return false;
}

/* --- State Migration Helper --- */
// Maps old patternMode to new contentSource/viewStyle
function getEffectiveState(state: AppState): { contentSource: string; viewStyle: string; cagedShape: string } {
    // Use new fields if available
    if (state.contentSource) {
        return {
            contentSource: state.contentSource,
            viewStyle: state.viewStyle || 'box',
            cagedShape: state.cagedShape || state.shape || 'E'
        };
    }

    // Fallback to legacy patternMode
    const patternMode = state.patternMode || 'box';
    switch (patternMode) {
        case 'edit':
            return { contentSource: 'custom', viewStyle: 'box', cagedShape: state.shape || 'E' };
        case 'tab':
            return { contentSource: 'tab', viewStyle: 'box', cagedShape: state.shape || 'E' };
        case 'waterfall':
            return { contentSource: 'preset', viewStyle: 'box', cagedShape: state.shape || 'E' };
        case 'box':
        default:
            return { contentSource: 'preset', viewStyle: 'box', cagedShape: state.shape || 'E' };
    }
}

/* --- Main Calculator --- */

export function calculateFretboardState(state: AppState): FretboardNote[] {
    const { root, customNotes, activeTabNotes, tuningName, tuning } = state;

    // Migration: get effective state from old or new fields
    const effective = getEffectiveState(state);
    const contentSource = effective.contentSource;
    const viewStyle = effective.viewStyle;
    const cagedShape = effective.cagedShape;

    // Get quality/formula - use presetType if available, fallback to quality
    const quality = state.presetType || state.quality || 'Maj7';

    // Use default Standard Tuning if tuning is missing
    const currentTuning = tuning || TUNING;
    const isStandard = tuningName === 'Standard' || !tuningName;

    // === CONTENT SOURCE: CUSTOM ===
    if (contentSource === 'custom') {
        if (!customNotes || customNotes.length === 0) return [];
        return customNotes.map(n => {
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

    // === CONTENT SOURCE: TAB ===
    if (contentSource === 'tab') {
        if (!activeTabNotes || activeTabNotes.length === 0) return [];
        return activeTabNotes.map(n => {
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

    // === CONTENT SOURCE: PRESET (arpeggios, scales, etc.) ===
    const formula = CHORD_FORMULAS[quality as keyof typeof CHORD_FORMULAS];
    if (!formula) return [];

    // === VIEW STYLE: HORIZONTAL (full neck) ===
    if (viewStyle === 'horizontal' || !isStandard) {
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
                        isInShape: true,
                        isInWaterfall: false
                    });
                }
            }
        }
        return activeNotes;
    }

    // === VIEW STYLE: BOX (CAGED position) ===
    const def = SHAPE_DEFINITIONS[cagedShape as keyof typeof SHAPE_DEFINITIONS];
    if (!def) return [];

    const stringOpenPitch = currentTuning[def.anchorString];
    const baseRootFret = (root - stringOpenPitch % 12 + 12) % 12;
    let rootFret = baseRootFret;

    // Smart Octave Selection (using anchor or selectedNote)
    const anchorNote = state.anchor || state.selectedNote;
    if (anchorNote) {
        const { fret } = anchorNote;
        const candidates = [baseRootFret, baseRootFret + 12, baseRootFret + 24].filter(c => c <= 24);
        const bestCandidate = candidates.find(candidateRoot => {
            const minFret = candidateRoot - def.offsetLow;
            const maxFret = candidateRoot + def.offsetHigh;
            return fret >= minFret && fret <= maxFret;
        });
        if (bestCandidate !== undefined) {
            rootFret = bestCandidate;
        } else if (rootFret - def.offsetLow < 0) {
            rootFret += 12;
        }
    } else if (rootFret - def.offsetLow < 0) {
        rootFret += 12;
    }

    const shapeMin = rootFret - def.offsetLow;
    const shapeMax = rootFret + def.offsetHigh;
    const activeNotes: FretboardNote[] = [];

    for (let s = 0; s < 6; s++) {
        for (let f = 0; f <= 24; f++) {
            const inBoxRange = f >= shapeMin && f <= shapeMax;
            const noteIdx = getNoteIndex(s, f, currentTuning);
            const interval = getInterval(root, noteIdx);

            if (formula.includes(interval) && inBoxRange) {
                activeNotes.push({
                    stringIdx: s,
                    fret: f,
                    noteName: NOTE_NAMES[noteIdx],
                    interval: interval,
                    label: INTERVAL_LABELS[interval],
                    isRoot: interval === 0,
                    isInShape: inBoxRange,
                    isInWaterfall: isNoteInWaterfall(s, interval, cagedShape)
                });
            }
        }
    }
    return activeNotes;
}
