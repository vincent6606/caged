# Fretboard Interaction

Click and gesture behaviors for the interactive fretboard visualizer.

## Requirements

### Requirement: Single Click on Visible Note
The system SHALL handle single-click on a visible note as follows:
1. Play audio feedback (triangle wave at note frequency)
2. If in Box/Waterfall mode: snapshot preset notes into customNotes, remove clicked note, switch to Edit mode
3. If in Edit mode: toggle the note OFF (remove from customNotes)

#### Scenario: Single click note in Box mode
- **WHEN** user single-clicks a visible note while in Box mode
- **THEN** audio plays, mode changes to Edit, and clicked note is removed from display

#### Scenario: Single click note in Edit mode
- **WHEN** user single-clicks a visible note while in Edit mode
- **THEN** audio plays and note is removed from customNotes

---

### Requirement: Single Click on Empty Fret
The system SHALL handle single-click on an empty fret position as follows:
1. Play audio feedback (triangle wave at note frequency)
2. If in Box/Waterfall mode: snapshot preset notes into customNotes, add new note, switch to Edit mode
3. If in Edit mode: toggle the note ON (add to customNotes)

#### Scenario: Single click empty fret in Box mode
- **WHEN** user single-clicks an empty fret while in Box mode
- **THEN** audio plays, mode changes to Edit, and new note is added to display

#### Scenario: Single click empty fret in Edit mode
- **WHEN** user single-clicks an empty fret while in Edit mode
- **THEN** audio plays and note is added to customNotes

---

### Requirement: Double Click Behavior
The system SHALL handle double-click on any note as follows:
1. Play audio feedback
2. Set the clicked note as the new root/anchor position
3. Stay in current mode (no mode change)
4. Update `selectedNote` for octave positioning
5. **Do not** cycle CAGED shapes (previous behavior removed)

#### Scenario: Double click sets anchor
- **WHEN** user double-clicks any note on the fretboard
- **THEN** audio plays, that note becomes the anchor, and the display updates to center on that position

---

### Requirement: Right Click Context Menu
The system SHALL handle right-click on any fret position as follows:
1. Prevent browser default context menu
2. Display custom context menu with options:
   - "Load Shape Here" - loads current preset centered at this position
   - "Set as Key" - sets this note as the root for the current chord/scale
   - "Copy Position" - copies string/fret to clipboard

#### Scenario: Right click opens context menu
- **WHEN** user right-clicks any fret position
- **THEN** custom context menu displays with guitar-specific options

#### Scenario: User selects "Load Shape Here"
- **WHEN** user selects "Load Shape Here" from context menu
- **THEN** current CAGED shape re-renders centered at the clicked position

---

### Requirement: Hover Audio Preview
The system SHALL play a short audio preview on note hover:
- Duration: 0.4 seconds
- Waveform: Triangle wave
- Volume: Lower than click audio (background preview level)

#### Scenario: User hovers over fret
- **WHEN** user hovers over any fret position for 200ms
- **THEN** a quiet audio preview of that note plays for 0.4 seconds

---

### Requirement: Note Labels
The system SHALL display note labels according to interval from root:
- Root notes: "R" label, colored #00ff00 (neon green)
- Chord tones: Interval label (3, 5, 7, 9, 11, 13)
- Alterations shown with symbols: b3, #5, b7, etc.

#### Scenario: Root note displays correctly
- **WHEN** fretboard renders with CMaj7
- **THEN** all C notes display "R" label with neon green color

#### Scenario: Chord tones display correctly
- **WHEN** fretboard renders with CMaj7
- **THEN** E notes show "3", G notes show "5", B notes show "7"
