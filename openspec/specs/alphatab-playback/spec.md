# AlphaTab Playback

Guitar Pro file playback with synchronized fretboard visualization using AlphaTab.

## Requirements

### Requirement: File Import
The system SHALL support importing Guitar Pro files:

- Supported formats: `.gp`, `.gp3`, `.gp4`, `.gp5`, `.gpx`, `.gp`
- Dynamic import (no SSR) to avoid Next.js hydration issues
- Show loading indicator during file parsing

#### Scenario: User uploads Guitar Pro file
- **WHEN** user selects a .gp file via file picker
- **THEN** file is parsed and score displays in Tab content source

#### Scenario: Invalid file handling
- **WHEN** user uploads a non-Guitar Pro file
- **THEN** error message displays: "Please upload a valid Guitar Pro file"

---

### Requirement: Score and Tab Rendering
The system SHALL render imported files with:

- Standard music notation (treble clef)
- Guitar tablature below notation
- Current bar highlighted during playback
- Clickable notes (Pro feature)

#### Scenario: Score renders with tab
- **WHEN** file loads successfully
- **THEN** both standard notation and tablature display in split view

#### Scenario: Current bar highlights during playback
- **WHEN** playback is active
- **THEN** current bar has visual highlight that moves with playhead

---

### Requirement: Basic Playback Controls
The system SHALL provide playback controls:

| Control | Function | Tier |
|---------|----------|------|
| Play/Pause | Toggle playback | Free |
| Stop | Stop and return to start | Free |
| Previous | Jump to previous bar | Free |
| Next | Jump to next bar | Free |

#### Scenario: User plays tab
- **WHEN** user clicks Play button
- **THEN** audio playback begins from current position with soundfont synthesis

#### Scenario: User pauses playback
- **WHEN** user clicks Pause during playback
- **THEN** playback stops at current position, can resume

#### Scenario: User stops playback
- **WHEN** user clicks Stop button
- **THEN** playback stops and position resets to bar range start

---

### Requirement: Advanced Playback Controls (Pro)
The system SHALL provide advanced controls for Pro users:

| Control | Function | Default |
|---------|----------|---------|
| Speed | Playback tempo percentage | 100% |
| Loop | Repeat selected bar range | Off |
| Metronome | Click track overlay | Off |
| Count-in | N beats before playback starts | Off (1 bar when on) |

#### Scenario: User adjusts playback speed
- **WHEN** pro user sets speed to 75%
- **THEN** playback tempo is 75% of original BPM

#### Scenario: User enables loop
- **WHEN** pro user enables loop toggle
- **THEN** playback repeats bar range continuously until stopped

#### Scenario: User enables metronome
- **WHEN** pro user enables metronome
- **THEN** audible click plays on each beat during playback

#### Scenario: User enables count-in
- **WHEN** pro user enables count-in and presses play
- **THEN** one bar of metronome clicks plays before music begins

#### Scenario: Free user tries advanced control
- **WHEN** free user clicks speed/loop/metronome control
- **THEN** upgrade modal displays with Pro benefits

---

### Requirement: Bar Range Selection
The system SHALL allow constraining playback to a bar range:

- Start bar selector (minimum: 1)
- End bar selector (maximum: total bars)
- Window size option (show N bars at a time)
- Visual indicator of selected range

#### Scenario: User sets bar range
- **WHEN** user sets start bar to 5 and end bar to 8
- **THEN** only bars 5-8 are visible in score and playback loops within range

#### Scenario: Free user bar limit
- **WHEN** free user loads a file with more than 16 bars
- **THEN** only first 16 bars are accessible, message shows "Upgrade to Pro for full song access"

---

### Requirement: Track Selection
The system SHALL support multi-track files:

- Track dropdown showing all available tracks
- Track name and instrument displayed
- Only one track active for fretboard sync at a time
- Mute/Solo options (Pro)

#### Scenario: User selects different track
- **WHEN** user selects "Lead Guitar" from track dropdown
- **THEN** fretboard displays notes from Lead Guitar track only

#### Scenario: User mutes track (Pro)
- **WHEN** pro user clicks mute on rhythm guitar track
- **THEN** rhythm guitar audio is silent but still visible in score

---

### Requirement: Seek and Progress
The system SHALL allow seeking within the bar range:

- Progress bar showing current position
- Click-to-seek on progress bar
- Current time / total time display
- Current bar / total bars display

#### Scenario: User seeks via progress bar
- **WHEN** user clicks on progress bar at 50% position
- **THEN** playback jumps to middle of selected bar range

---

### Requirement: Volume Control
The system SHALL provide volume control:

- Master volume slider
- Volume level persists across sessions (local storage)
- Mute button for quick silence

#### Scenario: User adjusts volume
- **WHEN** user drags volume slider to 50%
- **THEN** playback volume is reduced to 50%

---

### Requirement: Fretboard Synchronization
The system SHALL synchronize fretboard with playback:

- Notes from current bar display on fretboard
- Notes highlight as they are played
- Fretboard updates in real-time during playback
- View style (Box/Horizontal) applies to tab notes

#### Scenario: Fretboard shows current bar notes
- **WHEN** playback reaches bar 5
- **THEN** fretboard displays all notes from bar 5

#### Scenario: Notes highlight during playback
- **WHEN** a note sounds during playback
- **THEN** corresponding fret position briefly highlights

---

### Requirement: Note Selection (Pro)
The system SHALL allow Pro users to select specific notes:

- Click on note in score to select/deselect
- Selected notes filter what displays on fretboard
- Multi-select with Shift+click
- "Select All" and "Clear Selection" buttons

#### Scenario: User selects notes in score
- **WHEN** pro user clicks on specific notes in tablature
- **THEN** only selected notes display on fretboard

#### Scenario: Free user tries note selection
- **WHEN** free user clicks on a note in score
- **THEN** upgrade modal displays with Pro benefits

---

### Requirement: AlphaTab Technical Requirements
The system SHALL handle AlphaTab initialization properly:

- Dynamic import to avoid SSR issues
- Call `api.destroy()` on component unmount
- Use `isCancelled` flag to prevent race conditions
- Soundfont loaded from CDN
- Option to disable web workers for debugging (`core.useWorkers: false`)

#### Scenario: Component unmounts cleanly
- **WHEN** user navigates away from Tab view
- **THEN** AlphaTab instance is destroyed, no memory leaks

#### Scenario: Soundfont loads from CDN
- **WHEN** playback is first initiated
- **THEN** soundfont downloads from CDN if not cached
