# Screen Architecture

The 7 core screens organized around a retro OS desktop metaphor.

## Requirements

### Requirement: Screen Inventory
The system SHALL provide 7 core screens:

| # | Screen | Purpose | Access Level |
|---|--------|---------|--------------|
| 1 | Landing / Onboarding | First impression, value prop, signup CTA | All |
| 2 | Desktop (Main Canvas) | OS-style workspace with app icons | All |
| 3 | Fretboard Studio | CAGED visualization (Box, Waterfall, Edit) | All |
| 4 | Tab Player | Score + Tab + Fretboard sync | Free: Limited, Pro: Full |
| 5 | Library / My Sessions | Saved diagrams, imported tabs, history | Registered |
| 6 | Settings / Account | Preferences, subscription, profile | Registered |
| 7 | Upgrade Modal | Conversion touchpoint at gates | Free users |

#### Scenario: User navigates to each screen
- **WHEN** user clicks on respective icon or navigation element
- **THEN** the corresponding screen renders with appropriate content

---

### Requirement: Landing Page
The system SHALL display a landing page with:
- Hero section with animated fretboard demo
- "Try it Free" CTA (no signup required)
- Social proof and testimonials
- Sign in / Create account links
- Features, Pricing, About navigation

#### Scenario: New visitor lands on home page
- **WHEN** visitor navigates to root URL
- **THEN** landing page displays with animated fretboard and "Try it Free" button

---

### Requirement: Desktop (Main Canvas)
The system SHALL display a Windows 95-style desktop with:
- App icons: Active Session, Tab Importer, Export PDF, Library, Settings
- Window title bar: "Guitar Architect v27"
- Taskbar with user info, notifications, and clock

#### Scenario: User opens desktop
- **WHEN** user enters the main application
- **THEN** desktop displays with clickable app icons

#### Scenario: User clicks Active Session icon
- **WHEN** user double-clicks "Active Session" icon
- **THEN** Fretboard Studio window opens in Box mode

---

### Requirement: Fretboard Studio
The system SHALL display the Fretboard Studio with:
- Control panel: Root, Quality, Shape, Mode, Tuning selectors
- 24-fret interactive fretboard visualizer
- CAGED shape selector (C, A, G, E, D buttons)
- Legend showing root and chord tone colors

#### Scenario: User interacts with fretboard studio
- **WHEN** user opens Fretboard Studio
- **THEN** control panel and fretboard render with default CMaj7 E-shape

---

### Requirement: Tab Player (Split View)
The system SHALL display the Tab Player with:
- Playback controls: play/pause, prev/next, speed, loop, metronome, volume
- Bar range selector: start bar, end bar, window size
- Track selector dropdown
- Score + Tab notation (top 50% of window)
- Synchronized fretboard (bottom 50% of window)

#### Scenario: User loads Guitar Pro file
- **WHEN** user uploads a .gp file via Tab Importer
- **THEN** Tab Player opens with score, tablature, and synced fretboard

---

### Requirement: Library / My Sessions
The system SHALL display the Library with:
- "My Saved Sessions" list with last edited timestamps
- "Imported Tabs" list with import dates
- "+ New Session" button
- "Upload New" button for tabs
- Free tier limitation notice for tabs

#### Scenario: Registered user views library
- **WHEN** registered user opens Library
- **THEN** saved sessions and imported tabs are listed

---

### Requirement: Settings / Account
The system SHALL display Settings with:
- Account section: email, plan, upgrade CTA
- Preferences: default tuning, default quality, audio feedback, theme
- Export settings: PDF quality, watermark toggle

#### Scenario: User views settings
- **WHEN** user opens Settings
- **THEN** account info and preferences are displayed with current values

---

### Requirement: Upgrade Modal
The system SHALL display the Upgrade Modal with:
- Contextual headline based on trigger
- Feature benefit list (checkmarks)
- Two pricing options: Monthly and Annual (with "Best Value" badge)
- "Start Free Trial" CTAs
- "Maybe Later" dismiss option

#### Scenario: Upgrade modal triggered
- **WHEN** free user hits a conversion gate
- **THEN** upgrade modal displays with relevant messaging and pricing options
