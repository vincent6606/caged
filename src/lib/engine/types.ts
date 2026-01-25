
export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type IntervalLabel = 'R' | 'b2' | '2' | 'b3' | '3' | '4' | 'b5' | '5' | '#5' | '6' | 'b7' | '7';
export type ShapeName = 'C' | 'A' | 'G' | 'E' | 'D';
export type ChordQuality = 'Maj7' | 'Dom7' | 'Min7' | 'Min7b5' | 'Dim7';
export type TuningName = 'Standard' | 'DADGAD' | 'Open D' | 'Drop D' | 'Custom';

/**
 * @deprecated Use ContentSource and ViewStyle instead.
 * Kept for backward compatibility during migration.
 */
export type PatternMode = 'box' | 'waterfall' | 'edit' | 'tab';

// New state architecture types
export type ContentSource = 'preset' | 'shapes' | 'custom' | 'tab';
export type ViewStyle = 'box' | 'horizontal';
export type PresetCategory = 'arpeggio' | 'scale' | 'voicing';

export interface NotePosition {
    stringIdx: number;
    fret: number;
}

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
    // === NEW STATE ARCHITECTURE ===
    // Dimension 1: Content Source (what notes to show)
    contentSource: ContentSource;

    // Dimension 2: View Style (how to display)
    viewStyle: ViewStyle;

    // Dimension 3: Musical Context (always applicable)
    root: number; // 0-11 (C=0)
    tuning: number[];
    tuningName: TuningName;
    anchor: NotePosition | null;

    // View-specific (box only)
    cagedShape: ShapeName;

    // Content-specific: preset
    presetCategory: PresetCategory;
    presetType: string; // e.g., 'Maj7', 'Ionian'

    // Content-specific: custom
    customNotes: NotePosition[];

    // Content-specific: tab
    activeTabNotes: NotePosition[];
    tabBarRange: { start: number; end: number };

    // Playback
    isPlaying: boolean;
    playbackSpeed: number;

    // === DEPRECATED (for backward compatibility) ===
    /** @deprecated Use contentSource and viewStyle instead */
    quality: ChordQuality;
    /** @deprecated Use cagedShape instead */
    shape: ShapeName;
    /** @deprecated Use contentSource and viewStyle instead */
    patternMode: PatternMode;
    /** @deprecated No longer needed with new architecture */
    selectedNote: NotePosition | null;
    /** @deprecated No longer needed with new architecture */
    previousPatternMode?: PatternMode;
}
