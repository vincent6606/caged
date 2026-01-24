<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive guitar learning web application focused on the C.A.G.E.D system. Features fretboard visualization, Guitar Pro file import/playback, multiple tuning support, and PDF export. Built with Next.js 16 (App Router), TypeScript, Tailwind CSS, and AlphaTab.

## Development Commands

```bash
npm run dev    # Start development server (http://localhost:3000)
npm run build  # Create production build
npm start      # Start production server
npm run lint   # Run ESLint
```

## Architecture

### State Management

The application uses React's `useState` with no external state library. The entire application state is defined by the `AppState` type in [src/lib/engine/types.ts](src/lib/engine/types.ts) and lives in [src/app/page.tsx](src/app/page.tsx).

**Key state properties:**
- `root`: Current root note (0-11, where C=0)
- `quality`: Chord quality (Maj7, Dom7, Min7, Min7b5, Dim7)
- `shape`: Active CAGED shape (C, A, G, E, D)
- `patternMode`: View mode (box, waterfall, edit, tab)
- `tuning` / `tuningName`: Current guitar tuning
- `customNotes`: User-edited notes in Edit mode
- `activeTabNotes`: Notes extracted from Guitar Pro files in Tab mode

### Core Engine (`src/lib/engine/`)

**[caged.ts](src/lib/engine/caged.ts)** - Core calculation algorithm:
- `calculateFretboardState(state: AppState)`: Returns which notes should appear on the fretboard
- Logic branches based on:
  - **Standard tuning** (CAGED mode): Uses shape definitions with anchor strings and offset ranges
  - **Custom tuning** (Free mode): Shows all notes matching chord formula across entire fretboard
  - **Edit mode**: Displays user's custom note selection
  - **Tab mode**: Displays notes extracted from Guitar Pro file
- Smart octave selection: When user double-clicks a note, the algorithm finds the best octave of the current shape that contains that fret position

**[constants.ts](src/lib/engine/constants.ts)** - Configuration data:
- `CHORD_FORMULAS`: Maps chord qualities to interval arrays (e.g., Maj7 = [0, 4, 7, 11])
- `SHAPE_DEFINITIONS`: Defines each CAGED shape's anchor string and fret range offsets
- `TUNINGS`: Preset tunings as chromatic pitch arrays (Standard = [4, 9, 14, 19, 23, 28])
- `STRING_TO_SHAPE_MAP`: Determines which shapes are valid when jumping from a specific string

**[types.ts](src/lib/engine/types.ts)** - Type definitions for the entire application

### Audio System (`src/lib/audio/context.ts`)

Singleton `AudioEngine` class using Web Audio API:
- `playTone(freq, duration)`: Generates tones with triangle wave oscillators
- `getNoteFrequency(stringIdx, fret, tuning)`: Converts fret position to frequency
- Uses exponential envelope for natural decay

### View Modes

1. **Box Mode** (Standard tuning only): Shows traditional CAGED box positions with 4-5 fret spans
2. **Waterfall Mode** (Standard tuning only): Shows diagonal "2-1-2" patterns for Neo-Soul runs
3. **Edit Mode**: Users can click to toggle any note on/off. When entering Edit mode from another mode, it snapshots the current visible notes as the starting point
4. **Tab Mode**: Displays notes from imported Guitar Pro files (.gp, .gp3, .gp4, .gp5, .gpx)

### AlphaTab Integration (`src/components/AlphaTabPlayer.tsx`)

**Key features:**
- Dynamic import to ensure client-side execution (`import('@coderline/alphatab')`)
- Windowed bar display (2 or 4 bars at a time) with prev/next navigation
- Playback controls: play/pause, stop, speed adjustment (25%-150%), loop, metronome, count-in
- Note extraction: Reads beats from selected bars and converts to `{stringIdx, fret}` format
- Key detection: Analyzes first master bar's key signature to auto-detect root note

**Settings structure:**
- `display.startBar` and `display.barCount`: Control windowed view
- Must call `api.updateSettings()` and `api.render()` after changing settings
- `api.scoreLoaded`: Triggered when file is parsed
- `api.playerStateChanged`: Tracks play/pause state
- `api.playerPositionChanged` / `api.playedBeatChanged`: Used for current bar tracking

### Fretboard Component (`src/components/Fretboard.tsx`)

SVG-based 24-fret guitar visualization:
- Interactive tuning inputs (left edge) - users can type note names to change tuning
- Click handlers: single click (play + toggle), double click (set root), right click (context menu)
- Hover handler: Plays audio preview if note is currently active
- Visual rendering shows interval labels (R, 3, 5, 7, etc.) on active notes

### Interaction Model

**Click behavior:**
- **Single click**: Plays note audio + toggles note in Edit/Tab modes
- **Double click**: Sets clicked note as new root, triggers smart octave selection
- **Right click**: Opens context menu with "Set as Root" and "Jump to Shape" (Standard tuning only)
- **Hover** (over active notes): Audio preview with shorter duration

**Mode transitions:**
- Entering Edit mode: Snapshots current visible notes into `customNotes`
- Switching quality: Previews chord by playing notes as ascending arpeggio (R → 3 → 5 → 7)
- Changing tuning: Resets custom notes to avoid confusion

## Important Implementation Details

### AlphaTab Loading

AlphaTab must be imported dynamically to avoid SSR issues:
```typescript
const alphaTab = await import('@coderline/alphatab');
```

The library requires specific initialization in a `useEffect` with cleanup:
- Set `isCancelled` flag to handle race conditions
- Call `api.destroy()` on unmount
- Use `core.useWorkers: false` for debugging if needed

### PDF Export

Uses dynamic imports for `html2canvas` and `jspdf` to reduce initial bundle size:
```typescript
const html2canvas = (await import('html2canvas')).default;
const jsPDFModule = await import('jspdf');
const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF || jsPDFModule;
```

Captures the element with id `fretboard-container` and generates a landscape PDF.

### Tuning System

Tunings are stored as chromatic pitch indices where:
- 0 = C (lowest C reference)
- 4 = E, 9 = A, 14 = D, etc.
- Standard tuning: `[4, 9, 14, 19, 23, 28]` (E2, A2, D3, G3, B3, E4)

Custom tuning is created when user manually edits string pitches via fretboard inputs.

### Audio Context Initialization

The Web Audio API context may be suspended on page load. Always call `audio.resume()` before playing tones (handled automatically in the AudioEngine).

## File Organization

```
src/
├── app/
│   ├── layout.tsx          # Root layout with fonts and analytics
│   └── page.tsx            # Main application (all UI and state)
├── components/
│   ├── AlphaTabPlayer.tsx  # Guitar Pro file player
│   ├── Fretboard.tsx       # Interactive fretboard SVG
│   ├── RetroWindow.tsx     # Windows 95-style window chrome
│   ├── InfoPanel.tsx       # Session info display
│   ├── YouTubePlayer.tsx   # Backing track player
│   └── DesktopIcon.tsx     # Retro desktop icons
└── lib/
    ├── engine/
    │   ├── types.ts        # TypeScript type definitions
    │   ├── constants.ts    # Chord formulas, tunings, shape defs
    │   └── caged.ts        # Core CAGED calculation logic
    └── audio/
        └── context.ts      # Web Audio API singleton

public/
├── icons/                  # Windows 95-style icon assets
└── test.gp                 # Sample Guitar Pro file
```

## Common Patterns

### Adding a New Chord Quality

1. Add type to `ChordQuality` union in [types.ts](src/lib/engine/types.ts:5)
2. Add formula to `CHORD_FORMULAS` in [constants.ts](src/lib/engine/constants.ts:18) (e.g., `'Sus4': [0, 5, 7]`)
3. Add button to quality selector in [page.tsx](src/app/page.tsx:405) around line 405

### Adding a New Tuning

1. Add type to `TuningName` union in [types.ts](src/lib/engine/types.ts:7)
2. Add pitch array to `TUNINGS` in [constants.ts](src/lib/engine/constants.ts:7)
3. Tuning will automatically appear in dropdown

### Modifying CAGED Shape Definitions

Edit `SHAPE_DEFINITIONS` in [constants.ts](src/lib/engine/constants.ts:37):
- `anchorString`: Which string (0-5) the root is anchored to
- `offsetLow`: How many frets below the root the shape extends
- `offsetHigh`: How many frets above the root the shape extends

### Debugging AlphaTab Issues

1. Check browser console for AlphaTab errors
2. Verify file data is ArrayBuffer (not null/undefined)
3. Ensure `api.scoreLoaded` event fires (add console.log)
4. Try disabling workers: `core.useWorkers: false` in settings
5. Check that soundfont URL is accessible

## Deployment

Project is configured for Vercel deployment (Vercel Analytics integrated). Standard Next.js deployment process applies.

## Available Skills

This repository has Claude Code skills installed in `.agent/skills/`. These can be invoked using the Skill tool:

- **algorithmic-art** - Create generative art using p5.js with seeded randomness
- **brand-guidelines** - Apply Anthropic's official brand colors and typography
- **canvas-design** - Create visual art in .png and .pdf using design philosophy
- **doc-coauthoring** - Collaborative document creation
- **docx** - Create Microsoft Word documents
- **frontend-design** - Frontend design assistance
- **internal-comms** - Internal communications tools
- **mcp-builder** - MCP (Model Context Protocol) builder
- **pdf** - PDF generation and manipulation
- **pptx** - Create Microsoft PowerPoint presentations
- **skill-creator** - Create new Claude Code skills
- **slack-gif-creator** - Create GIFs for Slack
- **theme-factory** - Generate design themes
- **web-artifacts-builder** - Build web artifacts
- **webapp-testing** - Web application testing tools
- **xlsx** - Create Microsoft Excel spreadsheets
