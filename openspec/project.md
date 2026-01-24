# Project Context

## Purpose
Interactive guitar learning web application focused on the C.A.G.E.D system. Helps guitarists visualize chord shapes, understand fretboard patterns, and practice with Guitar Pro file playback. Features a retro Windows 95-inspired UI aesthetic.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Music Notation**: AlphaTab (@coderline/alphatab) for Guitar Pro file rendering
- **Audio**: Web Audio API (custom singleton AudioEngine)
- **PDF Export**: jsPDF + html2canvas (dynamic imports)
- **Analytics**: Vercel Analytics
- **Deployment**: Vercel

## Project Conventions

### Code Style
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use `@/` path alias for imports from `src/`
- Dynamic imports for heavy libraries (AlphaTab, jsPDF) to avoid SSR issues
- Single-file components when possible

### Architecture Patterns
- **State Management**: React `useState` only - no external state libraries
- **Single Source of Truth**: All app state defined in `AppState` type and lives in `page.tsx`
- **Pure Calculation Functions**: Core logic in `src/lib/engine/` returns data, doesn't mutate state
- **Singleton Audio**: Web Audio API managed through single `AudioEngine` instance
- **Component Props**: Data flows down, events bubble up via callbacks

### Testing Strategy
- No formal test suite currently implemented
- Manual testing via development server
- Sample Guitar Pro file in `public/test.gp` for AlphaTab testing

### Git Workflow
- Main branch: `main`
- Conventional commit messages preferred
- Deploy on merge to main via Vercel

## Domain Context

### CAGED System
The C.A.G.E.D system is a guitar learning method based on 5 open chord shapes (C, A, G, E, D) that can be moved up the neck with barre chords. Each shape has:
- An **anchor string** where the root note sits
- A **fret range** (offset low/high from root) defining the box position

### Music Theory Concepts
- **Root note**: Base note of a chord (0-11 where C=0, C#=1, D=2...)
- **Chord quality**: The type of chord (Maj7, Dom7, Min7, Min7b5, Dim7)
- **Intervals**: Distance from root (R=0, 3=major third, 5=perfect fifth, 7=major seventh)
- **Tuning**: Array of 6 chromatic pitch indices representing open string notes

### View Modes
- **Box**: Traditional CAGED positions (Standard tuning only)
- **Waterfall**: Diagonal 2-1-2 patterns for Neo-Soul runs (Standard tuning only)
- **Edit**: User can toggle any fret on/off
- **Tab**: Notes extracted from Guitar Pro files

## Important Constraints

### AlphaTab
- Must be dynamically imported to avoid SSR crashes
- Requires cleanup in useEffect (call `api.destroy()` on unmount)
- Use `isCancelled` flag for race condition handling
- Workers may need to be disabled for debugging (`core.useWorkers: false`)

### Audio
- Web Audio context may be suspended on page load - always call `resume()` before playback
- Audio previews should be short duration (0.4s for hover)

### Tuning System
- Standard tuning array: `[4, 9, 14, 19, 23, 28]` (E2, A2, D3, G3, B3, E4)
- Custom tuning triggers "Free mode" - CAGED shapes unavailable
- Chromatic index 0 = C, wraps at 12

## External Dependencies

### Key Libraries
- `@coderline/alphatab`: Guitar Pro file parsing and playback with soundfont synthesis
- `jspdf` + `html2canvas`: Client-side PDF generation
- `@vercel/analytics`: Usage tracking

### CDN Resources
- AlphaTab soundfont loaded from CDN during playback initialization
