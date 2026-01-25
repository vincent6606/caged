# State Machine

Application state architecture with independent dimensions for content source, view style, and musical context.

## Requirements

### Requirement: State Dimensions
The system SHALL maintain three independent state dimensions:

1. **Content Source** (mutually exclusive): `preset` | `shapes` | `custom` | `tab`
2. **View Style** (independent toggle): `box` | `horizontal`
3. **Musical Context** (always applicable): `root` (0-11), `tuning`, `anchor`

#### Scenario: User switches content source
- **WHEN** user clicks a different content source tab
- **THEN** content source changes while view style and musical context remain unchanged

#### Scenario: User toggles view style
- **WHEN** user toggles between Box and Horizontal view
- **THEN** same notes display in different visualization, content source unchanged

---

### Requirement: Content Source States
The system SHALL support four content source states:

| State | Description | Contextual Controls |
|-------|-------------|---------------------|
| `preset` | Built-in theory library (arpeggios, scales, patterns) | Category dropdown, Type dropdown |
| `shapes` | User's saved interval patterns | Shape selector |
| `custom` | Freehand session notes | None (direct manipulation) |
| `tab` | Notes from imported .gp file | Bar range selector, Track selector |

#### Scenario: User selects preset content
- **WHEN** user clicks "Preset" tab and selects "Arpeggios > Maj7"
- **THEN** Maj7 arpeggio notes display based on current root and view style

#### Scenario: User selects saved shape
- **WHEN** user clicks "Shapes" tab and selects a saved shape
- **THEN** shape displays anchored at current position, moveable via double-click

#### Scenario: User loads tab file
- **WHEN** user uploads a .gp file
- **THEN** content source switches to `tab` and notes from selected bar range display

---

### Requirement: View Style States
The system SHALL support two view styles:

| State | Description | Additional Control |
|-------|-------------|-------------------|
| `box` | Single CAGED position (4-5 fret span) | CAGED shape selector: C, A, G, E, D |
| `horizontal` | Full neck, all octaves visible | None |

#### Scenario: Box view shows CAGED selector
- **WHEN** view style is `box`
- **THEN** CAGED shape buttons (C, A, G, E, D) are visible and active

#### Scenario: Horizontal view hides CAGED selector
- **WHEN** view style is `horizontal`
- **THEN** CAGED shape selector is hidden (not applicable)

#### Scenario: User changes CAGED shape
- **WHEN** user clicks a different CAGED letter while in box view
- **THEN** notes reposition to that CAGED shape's fret range

---

### Requirement: Musical Context State
The system SHALL maintain musical context that applies to all content sources:

| Property | Values | Purpose |
|----------|--------|---------|
| `root` | 0-11 (C=0, C#=1, D=2 ... B=11) | Key center for all calculations |
| `tuning` | Array of 6 chromatic indices | Open string pitches |
| `anchor` | `{stringIdx, fret}` or null | Position reference for shapes |

#### Scenario: User changes root
- **WHEN** user selects a new root note
- **THEN** all displayed notes recalculate for new key, intervals remain same

#### Scenario: User changes tuning
- **WHEN** user selects an alternate tuning
- **THEN** fret positions recalculate to maintain correct intervals

---

### Requirement: State Transitions via User Actions
The system SHALL respond to user actions with these state changes:

| User Action | State Change |
|-------------|--------------|
| Click **Preset** tab | `contentSource = 'preset'` |
| Click **Shapes** tab | `contentSource = 'shapes'` |
| Click **Custom** tab | `contentSource = 'custom'` |
| Click **Tab** tab | `contentSource = 'tab'` |
| Toggle **Box ↔ Horizontal** | `viewStyle` toggles |
| Click **C/A/G/E/D** button | `contentSource = 'preset'`, `cagedShape` changes |
| Click **root note** selector | `root` changes |
| **Single-click** any fret | Copy to `custom`, toggle note, switch to `custom` |
| **Double-click** any note | Set `root` to clicked note, **stay in current mode** |
| Upload **.gp file** | Load tab, `contentSource = 'tab'` |
| Click **Save as Shape** | Save pattern to shapes library |

#### Scenario: Single-click switches to custom
- **WHEN** user single-clicks any fret while in preset mode
- **THEN** current preset notes are copied to custom, clicked note toggled, contentSource changes to `custom`

#### Scenario: Double-click sets root but stays in mode
- **WHEN** user double-clicks any note while in preset mode
- **THEN** `root` updates to clicked note's chromatic index
- **AND** mode remains `preset` (does NOT switch to custom)

#### Scenario: CAGED selector switches to preset mode
- **WHEN** user clicks a CAGED button (C, A, G, E, D) while in custom mode
- **THEN** `contentSource` changes to `preset`
- **AND** `cagedShape` changes to clicked shape
- **AND** `customNotes` are preserved in memory (not cleared)

---

### Requirement: State Validity Rules
The system SHALL enforce state validity:

- `cagedShape` is only applicable when `viewStyle = 'box'`
- `presetCategory` and `presetType` are only applicable when `contentSource = 'preset'`
- `selectedShapeId` is only applicable when `contentSource = 'shapes'`
- `tabBarRange` is only applicable when `contentSource = 'tab'`
- `anchor` is universal and applicable to all content sources

#### Scenario: CAGED hidden in horizontal view
- **WHEN** user switches to horizontal view
- **THEN** CAGED shape selector is hidden and `cagedShape` has no effect

---

### Requirement: State Persistence
The system SHALL maintain state according to these rules:

- `customNotes` persist until user clears or navigates away
- `anchor` persists until user sets a new anchor
- Changing `root` does NOT clear custom notes (they move with the root)
- Changing `tuning` recalculates all positions but preserves intervals
- Changing `contentSource` preserves `viewStyle`, `root`, and `tuning`

#### Scenario: View style persists across content source changes
- **WHEN** user switches from preset to shapes while in box view
- **THEN** box view remains active with CAGED selector visible

#### Scenario: Root change preserves custom notes
- **WHEN** user changes root from C to D while in custom mode
- **THEN** custom notes transpose up 2 semitones (intervals preserved)
