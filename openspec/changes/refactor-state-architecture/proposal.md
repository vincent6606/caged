# Change: Refactor State Architecture to Separate Content Source and View Style

## Why

The current `patternMode` conflates two independent concerns: **what notes to show** (content source) and **how to display them** (view style). This coupling prevents users from viewing any content in any style - for example, you cannot view tab notes in horizontal mode or preset arpeggios in a different CAGED position without switching modes entirely.

Separating these concerns enables:
1. Any content source viewable in any view style
2. Cleaner state transitions without side effects
3. Foundation for the preset bank system (arpeggios, scales, voicings)
4. Proper "horizontal" mode that works with all content

## What Changes

- **BREAKING**: Replace `patternMode: 'box' | 'waterfall' | 'edit' | 'tab'` with:
  - `contentSource: 'preset' | 'shapes' | 'custom' | 'tab'`
  - `viewStyle: 'box' | 'horizontal'`
- Remove `waterfall` as a mode (becomes a preset pattern or view variant)
- Rename `edit` mode to `custom` content source
- Add `presetCategory` and `presetType` for preset selection
- Update `calculateFretboardState()` to use new state shape
- Update UI controls to reflect new model

## Impact

- **Affected specs**: `state-machine`, `fretboard-interaction`, `preset-bank`
- **Affected code**:
  - `src/lib/engine/types.ts` - New state types
  - `src/lib/engine/caged.ts` - Calculation logic refactor
  - `src/app/page.tsx` - State management and UI controls
  - `src/components/Fretboard.tsx` - May need prop updates
