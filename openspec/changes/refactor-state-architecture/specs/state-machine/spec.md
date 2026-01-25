## MODIFIED Requirements

### Requirement: State Dimensions
The system SHALL maintain three independent state dimensions:

1. **Content Source** (mutually exclusive): `preset` | `shapes` | `custom` | `tab`
2. **View Style** (independent toggle): `box` | `horizontal`
3. **Musical Context** (always applicable): `root` (0-11), `tuning`, `anchor`

**Implementation Note**: This replaces the current `patternMode: 'box' | 'waterfall' | 'edit' | 'tab'` which conflates content source with view style.

#### Scenario: User switches content source
- **WHEN** user clicks a different content source tab
- **THEN** content source changes while view style and musical context remain unchanged

#### Scenario: User toggles view style
- **WHEN** user toggles between Box and Horizontal view
- **THEN** same notes display in different visualization, content source unchanged

#### Scenario: Migration from patternMode
- **WHEN** the application initializes
- **THEN** default state is `contentSource: 'preset'`, `viewStyle: 'box'`

---

### Requirement: View Style States
The system SHALL support two view styles:

| State | Description | Additional Controls |
|-------|-------------|---------------------|
| `box` | Single CAGED position (4-5 fret span) | CAGED shape selector (C, A, G, E, D) |
| `horizontal` | Full neck, all octaves visible | None |

**Implementation Note**: The current `waterfall` mode will become a preset pattern type in the preset bank (e.g., "Neo-Soul Waterfall"). It is NOT included in this refactor.

#### Scenario: Box view shows CAGED selector
- **WHEN** view style is `box`
- **THEN** CAGED shape buttons (C, A, G, E, D) are visible and active

#### Scenario: Horizontal view hides CAGED selector
- **WHEN** view style is `horizontal`
- **THEN** CAGED shape selector is hidden (not applicable)

---

## ADDED Requirements

### Requirement: TypeScript State Interface
The system SHALL define state using the following TypeScript interface:

```typescript
type ContentSource = 'preset' | 'shapes' | 'custom' | 'tab';
type ViewStyle = 'box' | 'horizontal';
type PresetCategory = 'arpeggio' | 'scale' | 'voicing';

interface AppState {
  // Core dimensions
  contentSource: ContentSource;
  viewStyle: ViewStyle;

  // Musical context
  root: number;
  tuning: number[];
  tuningName: TuningName;
  anchor: { stringIdx: number; fret: number } | null;

  // View-specific (box only)
  cagedShape: ShapeName;

  // Content-specific: preset
  presetCategory: PresetCategory;
  presetType: string;

  // Content-specific: custom
  customNotes: NotePosition[];

  // Content-specific: tab
  activeTabNotes: NotePosition[];
  tabBarRange: { start: number; end: number };

  // Playback
  isPlaying: boolean;
  playbackSpeed: number;
}
```

#### Scenario: State initializes with defaults
- **WHEN** application loads
- **THEN** state initializes with `contentSource: 'preset'`, `viewStyle: 'box'`, `presetCategory: 'arpeggio'`, `presetType: 'Maj7'`

---

### Requirement: Calculate Fretboard State Function
The system SHALL provide a `calculateFretboardState(state: AppState)` function that:

1. Selects note source based on `contentSource`
2. Applies view style filtering based on `viewStyle`
3. Uses `cagedShape` only when `viewStyle === 'box'`

#### Scenario: Preset content in box view
- **WHEN** `contentSource === 'preset'` and `viewStyle === 'box'`
- **THEN** notes are calculated from preset formula and filtered to CAGED shape range

#### Scenario: Tab content in horizontal view
- **WHEN** `contentSource === 'tab'` and `viewStyle === 'horizontal'`
- **THEN** all notes from `activeTabNotes` display across full fretboard

#### Scenario: Custom content in box view
- **WHEN** `contentSource === 'custom'` and `viewStyle === 'box'`
- **THEN** notes from `customNotes` display, filtered to current CAGED shape range

---

### Requirement: Fretboard Click Interactions
The system SHALL respond to fretboard clicks as follows:

| Action | Behavior |
|--------|----------|
| **Single-click** any fret | Snapshot visible notes to `customNotes`, toggle clicked note, switch to `custom` |
| **Double-click** any note | Set `root` to clicked note, **stay in current mode** |
| **Hover** active note | Play audio preview |

**Key Invariant**: `customNotes` are NEVER cleared by click interactions. They persist until user explicitly clicks Reset.

#### Scenario: Single-click in preset mode enters custom
- **WHEN** user single-clicks a fret while `contentSource === 'preset'`
- **THEN** current preset notes are copied to `customNotes`
- **AND** clicked note is toggled (added if missing, removed if present)
- **AND** `contentSource` changes to `'custom'`

#### Scenario: Single-click in custom mode toggles note
- **WHEN** user single-clicks a fret while `contentSource === 'custom'`
- **THEN** clicked note is toggled in `customNotes`
- **AND** `contentSource` remains `'custom'`

#### Scenario: Double-click sets root but stays in mode
- **WHEN** user double-clicks any note while in preset mode
- **THEN** `root` updates to the chromatic index of clicked note
- **AND** `contentSource` remains `'preset'` (does NOT switch to custom)
- **AND** preset recalculates to show shape for new root

#### Scenario: Double-click in custom mode transposes
- **WHEN** user double-clicks any note while in custom mode
- **THEN** `root` updates to the chromatic index of clicked note
- **AND** `contentSource` remains `'custom'`
- **AND** existing `customNotes` transpose with the new root (intervals preserved)

---

### Requirement: CAGED Selector Re-Entry
The system SHALL allow users to re-enter preset mode via CAGED selector:

When user clicks a CAGED shape button (C, A, G, E, D):
1. Switch `contentSource` to `'preset'`
2. Set `cagedShape` to the clicked shape
3. Preserve `customNotes` in memory (do NOT clear)

**Rationale**: Clicking a CAGED shape signals intent to view that shape. Custom notes remain available for later editing.

#### Scenario: Click CAGED button enters preset mode
- **WHEN** user clicks "E" button while `contentSource === 'custom'`
- **THEN** `contentSource` changes to `'preset'`
- **AND** `cagedShape` changes to `'E'`
- **AND** `customNotes` remain unchanged in state

#### Scenario: Custom notes persist across mode switches
- **WHEN** user has custom notes, switches to preset via CAGED selector, then single-clicks
- **THEN** the new snapshot includes preset notes, but old custom notes are replaced (not merged)

---

### Requirement: Custom Notes Persistence
The system SHALL preserve `customNotes` according to these rules:

| Action | Effect on customNotes |
|--------|-----------------------|
| Single-click (from preset) | Overwritten with snapshot + toggle |
| Single-click (in custom) | Toggle only, rest preserved |
| Double-click | Preserved (transpose with root) |
| Click CAGED selector | Preserved (hidden, not cleared) |
| Change root (in custom) | Transpose intervals |
| Change tuning | Recalculate positions |
| Click **Reset** button | Cleared to empty array |

#### Scenario: Reset clears custom notes
- **WHEN** user clicks Reset button while `contentSource === 'custom'`
- **THEN** `customNotes` becomes empty array
- **AND** fretboard shows no notes
