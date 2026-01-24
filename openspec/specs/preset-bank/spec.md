# Preset Bank

Comprehensive preset system for arpeggios, scales, and chord voicings with Box and Horizontal visualization modes.

## Requirements

### Requirement: Visualization Modes
The system SHALL support two visualization modes for all presets:
- **Box Mode**: Notes confined within a single CAGED position (4-5 fret span)
- **Horizontal Mode**: Notes displayed linearly across the entire fretboard

#### Scenario: User switches from Box to Horizontal mode
- **WHEN** user selects "Horizontal" mode while viewing CMaj7 arpeggio
- **THEN** the same notes display across the full neck rather than confined to one position

---

### Requirement: Arpeggio Presets
The system SHALL provide arpeggio presets organized by subcategory:

| Subcategory | Presets | Tier |
|-------------|---------|------|
| 7th Chords | Maj7, Dom7, Min7, Min7b5, Dim7 | Free |
| 9th Chords | Maj9, Dom9, Min9, 9sus4 | Pro |
| 11th Chords | Maj11, Dom11, Min11 | Pro |
| 13th Chords | Maj13, Dom13, Min13 | Pro |
| Altered | Dom7#5, Dom7b5, Dom7#9, Dom7b9, Alt (7#5#9) | Pro |
| Add Chords | Add9, Add11, 6/9 | Pro |
| Sus Chords | Sus2, Sus4, 7sus2, 7sus4 | Pro |

#### Scenario: User selects 7th chord arpeggio
- **WHEN** user selects "Min7" from arpeggio list
- **THEN** the minor 7th arpeggio displays with intervals R, b3, 5, b7

#### Scenario: Free user attempts 9th chord
- **WHEN** free user selects "Maj9" from arpeggio list
- **THEN** upgrade modal is displayed

---

### Requirement: Scale Presets
The system SHALL provide scale presets organized by subcategory:

| Subcategory | Presets | Tier |
|-------------|---------|------|
| Diatonic Modes | Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian | Free: Ionian only, Pro: All 7 |
| Harmonic Minor Modes | Harmonic Minor, Locrian ♮6, Ionian #5, Dorian #4, Phrygian Dominant, Lydian #2, Super Locrian bb7 | Pro |
| Melodic Minor Modes | Melodic Minor, Dorian b2, Lydian Augmented, Lydian Dominant, Mixolydian b6, Locrian ♮2, Altered | Pro |
| Pentatonic | Major Pentatonic, Minor Pentatonic | Free: Minor Pent, Pro: Major Pent |
| Blues | Blues Scale (6-note), Blues Scale + Major 3rd | Pro |
| Symmetric | Whole Tone, Diminished (HW), Diminished (WH), Chromatic | Pro |
| Exotic | Hungarian Minor, Phrygian Dominant, Japanese (In-Sen), Hirajoshi | Pro |

#### Scenario: User selects Ionian mode
- **WHEN** any user selects "Ionian (Major)" scale
- **THEN** the major scale displays with all 7 scale degrees

#### Scenario: Free user selects Dorian mode
- **WHEN** free user selects "Dorian" from scale list
- **THEN** upgrade modal is displayed with mode messaging

---

### Requirement: Chord Voicings (Future)
The system SHALL provide chord voicing presets:

| Subcategory | Description | Tier |
|-------------|-------------|------|
| Drop 2 | Common jazz voicings | Pro |
| Drop 3 | Extended range voicings | Pro |
| Shell Voicings | 3-note essential voicings | Pro |
| Triads | Inversions across string sets | Free basic, Pro all inversions |

#### Scenario: User selects Drop 2 voicing
- **WHEN** pro user selects "Drop 2" voicing for CMaj7
- **THEN** Drop 2 voicing shapes display on fretboard

---

### Requirement: Preset Selection UI
The system SHALL display preset selection with:
- Category tabs (Arpeggios, Scales, Voicings)
- Subcategory dropdown within each tab
- Visual lock icon on Pro-only presets for free users

#### Scenario: Free user views preset list
- **WHEN** free user opens arpeggio category
- **THEN** 7th chords show as available, 9th/11th/13th show with lock icons
