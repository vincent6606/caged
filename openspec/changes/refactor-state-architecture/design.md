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

### Decision 2: Remove Waterfall as Top-Level Mode

Current `waterfall` mode becomes either:
- A preset pattern in the preset bank (e.g., "Neo-Soul Waterfall" arpeggio pattern)
- A view style variant (checkbox: "Show waterfall pattern")

**Chosen approach**: Waterfall becomes a toggle/checkbox within box view, not a separate content source.

**Rationale**: Waterfall is a *way of viewing* an arpeggio, not a separate content source.

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
2. Switch `contentSource` to `'custom'`
3. Do NOT clear existing `customNotes` (they transpose with new root)

This preserves current "snapshot and edit" behavior while enabling root changes.

### Decision 5: CAGED Selector Re-Entry

When user clicks a CAGED shape button (C, A, G, E, D):
1. Switch `contentSource` to `'preset'`
2. Set `cagedShape` to clicked shape
3. Do NOT clear `customNotes` (they persist in memory for later)

**Rationale**: User explicitly selecting a CAGED shape signals intent to view that shape, not edit. Custom notes remain available if user clicks back to custom or single-clicks to edit.

### Decision 6: View Style Controls

| View Style | Available Controls |
|------------|-------------------|
| `box` | CAGED shape selector (C, A, G, E, D), Waterfall toggle |
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

1. Should "Waterfall" be a toggle within box view, or a separate view style alongside box/horizontal?
   - **Proposed**: Toggle within box view
2. How should presets be organized in the UI?
   - **Deferred**: Preset bank UI is a separate change
