# State Machine

Mode transitions and application state management for the fretboard visualizer.

## Requirements

### Requirement: Application Modes
The system SHALL support four primary visualization modes:
- **Box**: CAGED position-based view (4-5 fret span)
- **Waterfall**: Diagonal 2-1-2 pattern for Neo-Soul runs
- **Edit**: User-customized note selection
- **Tab**: Notes extracted from Guitar Pro files

#### Scenario: User views available modes
- **WHEN** user opens mode selector
- **THEN** Box, Waterfall, Edit, and Tab options are displayed

---

### Requirement: Mode Transition Rules
The system SHALL enforce the following mode transitions:

```
DESKTOP
    │
    ├───► BOX ◄──────────────────────┐
    │      │                          │
    │      │ (mode toggle)            │ (click Box mode button)
    │      ▼                          │
    │   WATERFALL                     │
    │      │                          │
    │      │ (click empty fret)       │
    │      ▼                          │
    │   EDIT ─────────────────────────┘
    │
    └───► TAB
           │
           │ (Edit button)
           ▼
         EDIT (snapshots tab notes)
```

#### Scenario: Transition from Box to Waterfall
- **WHEN** user clicks mode toggle while in Box mode
- **THEN** view switches to Waterfall mode showing diagonal pattern

#### Scenario: Transition from Box to Edit
- **WHEN** user clicks any fret (empty or occupied) while in Box mode
- **THEN** current notes are snapshotted to customNotes and mode changes to Edit

#### Scenario: Transition from Edit to Box
- **WHEN** user clicks "Box" mode button while in Edit mode
- **THEN** mode changes to Box and displays preset pattern (customNotes preserved until reset)

#### Scenario: Transition from Tab to Edit
- **WHEN** user clicks "Edit" button while in Tab mode
- **THEN** active tab notes are snapshotted to customNotes and mode changes to Edit

---

### Requirement: State Persistence
The system SHALL maintain state according to these rules:
- `customNotes` persist across mode changes until explicitly reset or preset changed
- `selectedNote` (anchor) persists until user selects a new anchor
- `activeTabNotes` persist while tab file is loaded
- Changing `root`, `quality`, or `shape` clears `customNotes` and resets to preset

#### Scenario: User returns to Box after editing
- **WHEN** user clicks Box mode after editing notes
- **THEN** Box mode preset displays (customNotes still available if user re-enters Edit)

#### Scenario: User changes root note
- **WHEN** user selects a new root (e.g., C to D)
- **THEN** customNotes are cleared and preset regenerates for new root

---

### Requirement: Snapshot Behavior
The system SHALL snapshot notes when transitioning from preset modes to Edit:
- Capture all currently visible notes as the starting point for editing
- Single click on visible note: remove it from snapshot
- Single click on empty fret: add it to snapshot

#### Scenario: Snapshot on first edit click
- **WHEN** user clicks a note in Box mode
- **THEN** all preset notes except clicked one are copied to customNotes

---

### Requirement: Reset Functionality
The system SHALL provide a reset button in Edit mode that:
- Clears all `customNotes`
- Returns fretboard to empty state (no notes displayed)
- User must select a preset mode (Box/Waterfall) to see notes again

#### Scenario: User resets custom notes
- **WHEN** user clicks "Reset" button in Edit mode
- **THEN** fretboard displays no notes and customNotes array is empty
