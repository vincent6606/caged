# Commercialization

Monetization model, pricing tiers, and feature gating for Guitar Architect.

## Requirements

### Requirement: Pricing Tiers
The system SHALL support four subscription tiers:
- **Free**: $0 (casual learners, discovery)
- **Pro Monthly**: $9.99/mo (serious hobbyists, students)
- **Pro Annual**: $79.99/yr (~$6.67/mo, best value)
- **Lifetime**: $199 (limited availability, early adopters)

#### Scenario: User views pricing page
- **WHEN** user navigates to upgrade modal
- **THEN** all four pricing options are displayed with clear value propositions

---

### Requirement: Free Tier Feature Access
The system SHALL provide Free tier users access to:
- Full fretboard visualizer (24 frets)
- All 5 CAGED shapes (C, A, G, E, D)
- Box and Horizontal visualization modes
- All 12 root notes
- Basic arpeggios: Maj7, Dom7, Min7, Min7b5, Dim7
- Basic scales: Major scale (Ionian), Minor Pentatonic only
- Edit mode: Limited to 8 notes maximum
- Tab import: 1 file total, first 16 bars only
- Playback: Play/Pause only
- PDF export: Watermarked
- Tuning: Standard only

#### Scenario: Free user accesses basic arpeggio
- **WHEN** free user selects "Maj7" from arpeggio list
- **THEN** the arpeggio is displayed on the fretboard without restriction

#### Scenario: Free user hits edit mode limit
- **WHEN** free user attempts to add a 9th note in Edit mode
- **THEN** upgrade modal is displayed with message about Pro unlimited notes

---

### Requirement: Pro Tier Feature Access
The system SHALL provide Pro tier users access to all Free features plus:
- Extended arpeggios: 9ths, 11ths, 13ths, Altered, Add, Sus chords
- All scales: All 7 diatonic modes, Harmonic/Melodic minor modes, Pentatonics, Blues, Symmetric, Exotic
- Edit mode: Unlimited notes
- Tab import: Unlimited files, full song access
- Playback controls: Speed, Loop, Metronome, Count-in
- Note selection in Tab mode
- Alternative tunings: DADGAD, Drop D, Open D, Custom
- PDF export: Clean (no watermark)
- Cloud save: Sync across devices
- Practice statistics: Track progress
- Offline mode: PWA download

#### Scenario: Pro user selects extended arpeggio
- **WHEN** pro user selects "Dom9" arpeggio
- **THEN** the 9th chord arpeggio is displayed without restriction

#### Scenario: Pro user imports unlimited tabs
- **WHEN** pro user uploads a 5th Guitar Pro file
- **THEN** the file is processed and displayed normally

---

### Requirement: Conversion Touchpoints
The system SHALL display contextual upgrade prompts at these gates:

| Trigger | Message |
|---------|---------|
| 2nd tab import attempt | "You've used your free import. Upgrade to Pro for unlimited tabs." |
| Try alternative tuning | "Drop D is a Pro feature. Unlock all tunings with Pro." |
| Select extended arpeggio | "Extended arpeggios are a Pro feature. Upgrade to unlock!" |
| Select non-Ionian mode | "Dorian mode is a Pro feature. Unlock all 7 modes with Pro." |
| Export PDF | "Your export will include a watermark. Go Pro for clean exports." |
| 9+ notes in Edit mode | "Free tier supports 8 notes. Go Pro for unlimited." |
| Try speed/loop control | "Practice controls are a Pro feature. Perfect for learning!" |
| After 7 return visits | "You're getting serious! Here's 20% off your first year." |
| Select notes in Tab mode | "Note selection is a Pro feature. Upgrade to filter what you practice." |

#### Scenario: User triggers tab import gate
- **WHEN** free user attempts to import a second Guitar Pro file
- **THEN** upgrade modal displays with tab import messaging

#### Scenario: User triggers arpeggio gate
- **WHEN** free user clicks on "Maj9" arpeggio option
- **THEN** upgrade modal displays with extended arpeggio messaging
