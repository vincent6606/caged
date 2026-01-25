# Design: State Architecture Refactor

## Context

The current `AppState` uses a flat `patternMode` enum that mixes two orthogonal concerns:
- **Content source**: Where notes come from (generated arpeggio, imported tab, user-drawn)
- **View style**: How notes are visualized (box position, full neck)

This design document captures decisions for separating these concerns.

## Goals / Non-Goals

**Goals:**
- Separate content source from view style as independent state dimensions
- Enable any content to be viewed in any style (e.g., tab notes in box view)
- Maintain backwards compatibility for existing interaction patterns
- Foundation for preset bank expansion (scales, voicings)

**Non-Goals:**
- Full preset bank implementation (separate change)
- User authentication or cloud save
- Mobile-specific optimizations

## Decisions

### Decision 1: Three-Dimensional State Model

The state will be organized into three independent dimensions:

```typescript
interface AppState {
  // Dimension 1: Content Source (what notes to show)
  contentSource: 'preset' | 'shapes' | 'custom' | 'tab';

  // Dimension 2: View Style (how to display)
  viewStyle: 'box' | 'horizontal';

  // Dimension 3: Musical Context (applies to all)
  root: number;           // 0-11
  tuning: number[];       // Open string pitches
  anchor: { stringIdx: number; fret: number } | null;

  // Content-specific state
  presetCategory: 'arpeggio' | 'scale' | 'voicing';
  presetType: string;     // e.g., 'Maj7', 'Ionian'
  cagedShape: ShapeName;  // Only applies when viewStyle === 'box'
  customNotes: NotePosition[];
  activeTabNotes: NotePosition[];
  tabBarRange: { start: number; end: number };
}
```

**Rationale**: This mirrors the spec's vision and allows independent control of each dimension.

### Decision 2: Defer Waterfall to Preset Bank

Current `waterfall` mode is NOT included in this refactor.

**Future approach**: Waterfall will become a preset pattern type in the preset bank (e.g., "Neo-Soul Waterfall" arpeggio pattern).

**Rationale**: Keeps this refactor focused on state architecture. Waterfall can be properly implemented as a preset with diagonal 2-1-2 interval logic.

### Decision 3: Rename "Edit" to "Custom"

Current `edit` mode → `contentSource: 'custom'`

**Rationale**: "Edit" implies modifying something else. "Custom" is a content source where notes are user-defined.

### Decision 4: Click Behavior

**Single-click** on any fret position:
1. If `contentSource !== 'custom'`, copy current visible notes to `customNotes`
2. Switch `contentSource` to `'custom'`
3. Toggle the clicked note

**Double-click** on any note:
1. Set the clicked note as the new `root`
2. **Stay in current mode** (do NOT switch to custom)
3. If in custom mode, transpose `customNotes` intervals

**Rationale**: Double-click sets key center without disrupting current view. Single-click is the entry point to custom editing.

### Decision 5: CAGED Selector Re-Entry

When user clicks a CAGED shape button (C, A, G, E, D):
1. Switch `contentSource` to `'preset'`
2. Set `cagedShape` to clicked shape
3. Do NOT clear `customNotes` (they persist in memory for later)

**Rationale**: User explicitly selecting a CAGED shape signals intent to view that shape, not edit. Custom notes remain available if user clicks back to custom or single-clicks to edit.

### Decision 6: View Style Controls

| View Style | Available Controls |
|------------|-------------------|
| `box` | CAGED shape selector (C, A, G, E, D) |
| `horizontal` | None (full neck, all positions) |

CAGED selector is hidden when `viewStyle === 'horizontal'`.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Breaking existing user workflows | Preserve click behaviors, only change internal model |
| Increased state complexity | Clear separation actually reduces cognitive load |
| Migration of saved state (if any) | Current app has no persistence, no migration needed |

## Migration Plan

1. Update `types.ts` with new state shape
2. Update `calculateFretboardState()` to branch on `contentSource` + `viewStyle`
3. Update `page.tsx` state initialization and handlers
4. Update UI controls (mode selector → content source tabs + view style toggle)
5. Remove deprecated `patternMode` references

**Rollback**: Revert to previous `patternMode` model if issues arise (git revert).

## Open Questions

None remaining.

---

## UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Active_Session.exe                                          [_][□][X]      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─ CONTENT SOURCE ──────────────────────────────────────────────────────┐  │
│  │  [▣ PRESET]  [ SHAPES ]  [ CUSTOM ]  [ TAB ]                          │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ CONTROLS ─────────────────────────────────────────────────────────────┐ │
│  │  Root: [C ▼]   Type: [Maj7 ▼]   View: [BOX│horz]   [RESET]            │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┬─────────────────────┐ │
│  │                                                  │   ACTIVE SHAPE      │ │
│  │                  FRETBOARD                       │   ┌───┐ ┌───┐      │ │
│  │                  (24 frets)                      │   │ C │ │ A │      │ │
│  │                                                  │   └───┘ └───┘      │ │
│  │   0   1   2   3   4   5   6   7   8   ...  24   │   ┌───┐ ┌───┐      │ │
│  │   ●───────────●─────────────────────────────    │   │ G │ │▣E │      │ │
│  │   ────────────────●─────────────────────────    │   └───┘ └───┘      │ │
│  │   ────────────────────●─────────────────────    │   ┌───┐            │ │
│  │   ────────────────●─────────────────────────    │   │ D │            │ │
│  │   ●───────────●─────────────────────────────    │   └───┘            │ │
│  └──────────────────────────────────────────────────┴─────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Control Visibility Rules

| Element | Visible When |
|---------|-------------|
| Type dropdown | `contentSource = 'preset'` |
| CAGED sidebar | `viewStyle = 'box'` |
| RESET button | `contentSource = 'custom'` |
| Bar range controls | `contentSource = 'tab'` |
