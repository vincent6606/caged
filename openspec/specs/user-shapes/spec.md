# User Shapes

User-defined interval patterns that can be saved, recalled, and repositioned anywhere on the fretboard.

## Requirements

### Requirement: Shape Definition
The system SHALL store user shapes as interval-based patterns with these properties:

| Property | Type | Purpose |
|----------|------|---------|
| `id` | string | Unique identifier |
| `name` | string | User-provided name |
| `notes` | Array | Interval positions relative to anchor |
| `createdInTuning` | number[] | Tuning context when created |
| `stringSet` | 'high' \| 'mid' \| 'low' \| 'all' | String range hint |
| `tags` | string[] | User-defined categories |

Each note in the shape contains:
- `stringOffset`: Relative string position (0 = anchor string)
- `fretOffset`: Relative fret position (0 = anchor fret)
- `interval`: Musical interval ('R', 'b3', '3', '5', 'b7', '7', '9', etc.)

#### Scenario: Shape stores intervals not absolute positions
- **WHEN** user saves a shape with root on fret 5
- **THEN** shape stores `fretOffset: 0` for root, not `fret: 5`

---

### Requirement: Create Shape from Custom Notes
The system SHALL allow users to save custom notes as a shape:

1. User clicks notes on fretboard (in Custom mode)
2. User clicks "Save as Shape" button
3. Modal appears with name input, tag input, and shape preview
4. System calculates intervals from the designated root note
5. Shape saves to user's library

#### Scenario: User creates shape from custom notes
- **WHEN** user has 3 notes selected and clicks "Save as Shape"
- **THEN** modal displays with name field, tags field, and visual preview of the pattern

#### Scenario: Root note determines interval calculation
- **WHEN** user saves shape with notes C, E, G and C marked as root
- **THEN** shape stores intervals R, 3, 5 (not absolute note names)

---

### Requirement: Shape Library UI
The system SHALL display user shapes in a dedicated "Shapes" content source tab:

- List of saved shapes with name and preview icon
- Search/filter by tags
- Edit and delete options
- "Create New" button

#### Scenario: User views shape library
- **WHEN** user clicks "Shapes" tab
- **THEN** list of saved shapes displays with names and small visual previews

#### Scenario: User filters shapes by tag
- **WHEN** user enters "triad" in search
- **THEN** only shapes tagged with "triad" are shown

---

### Requirement: Load and Display Shape
The system SHALL display a loaded shape anchored at the current position:

1. User selects a shape from library
2. Shape displays on fretboard centered on current anchor or default position
3. Intervals render based on current root and tuning

#### Scenario: Shape loads at current anchor
- **WHEN** user selects "Major Triad Triangle" shape with anchor at fret 5
- **THEN** shape displays with root at fret 5, intervals calculated from there

#### Scenario: Shape adapts to alternate tuning
- **WHEN** user loads shape in Drop D tuning
- **THEN** fret positions recalculate to maintain correct intervals for that tuning

---

### Requirement: Reposition Shape
The system SHALL allow users to move shapes to any position:

- **Double-click** any fret: Set new anchor, shape moves to center on that position
- Shape automatically recalculates fret positions for new root
- Visual feedback during repositioning

#### Scenario: User repositions shape via double-click
- **WHEN** user double-clicks fret 8 on string 2
- **THEN** shape anchor moves to that position and notes recalculate

#### Scenario: Shape shows invalid position warning
- **WHEN** shape would extend past fret 0 (nut)
- **THEN** affected notes display in gray with warning indicator

---

### Requirement: Shape in Box vs Horizontal View
The system SHALL display shapes differently based on view style:

| View | Behavior |
|------|----------|
| Box | Shape displays once at anchor position |
| Horizontal | Shape repeats at all octave positions across the neck |

#### Scenario: Shape in horizontal view shows octaves
- **WHEN** user loads a triad shape in horizontal view
- **THEN** the triad pattern repeats at each octave position on the neck

---

### Requirement: Edit Existing Shape
The system SHALL allow users to modify saved shapes:

1. User selects shape and clicks "Edit"
2. Shape loads into Custom mode for modification
3. User adjusts notes
4. User clicks "Update Shape" or "Save as New"

#### Scenario: User edits existing shape
- **WHEN** user clicks edit on "Major Triad Triangle"
- **THEN** shape notes load into Custom mode, original shape unchanged until saved

---

### Requirement: Delete Shape
The system SHALL allow users to delete shapes with confirmation:

1. User clicks delete icon on shape
2. Confirmation dialog appears
3. User confirms deletion
4. Shape removed from library

#### Scenario: User deletes shape
- **WHEN** user clicks delete and confirms
- **THEN** shape is permanently removed from library

---

### Requirement: Shape Storage Limits (Free/Pro)
The system SHALL enforce shape limits based on subscription tier:

| Tier | Limit |
|------|-------|
| Free | Up to 3 saved shapes |
| Pro | Unlimited shapes |

#### Scenario: Free user hits shape limit
- **WHEN** free user attempts to save a 4th shape
- **THEN** upgrade modal displays with Pro benefits for unlimited shapes

---

### Requirement: Shape Data Persistence
The system SHALL persist shapes:

- **Free tier**: Local storage only
- **Pro tier**: Cloud sync across devices

#### Scenario: Pro user accesses shapes on new device
- **WHEN** pro user logs in on a different device
- **THEN** all saved shapes are available from cloud sync
