# Tasks: Refactor State Architecture

## 1. Update Type Definitions

- [ ] 1.1 Add new types to `src/lib/engine/types.ts`:
  - `ContentSource = 'preset' | 'shapes' | 'custom' | 'tab'`
  - `ViewStyle = 'box' | 'horizontal'`
  - `PresetCategory = 'arpeggio' | 'scale' | 'voicing'`
- [ ] 1.2 Update `AppState` interface with new structure (see design.md)
- [ ] 1.3 Mark `PatternMode` type as deprecated with `@deprecated` JSDoc

## 2. Update Calculation Engine

- [ ] 2.1 Refactor `calculateFretboardState()` in `src/lib/engine/caged.ts`:
  - Branch on `contentSource` to select note source
  - Branch on `viewStyle` to apply box/horizontal filtering
  - Apply `showWaterfall` filter when `viewStyle === 'box'`
- [ ] 2.2 Extract waterfall logic into separate helper function `filterWaterfallPattern()`
- [ ] 2.3 Ensure backward compatibility: function handles both old and new state shapes during transition

## 3. Update State Management in page.tsx

- [ ] 3.1 Update initial state with new structure:
  ```typescript
  const [state, setState] = useState<AppState>({
    contentSource: 'preset',
    viewStyle: 'box',
    presetCategory: 'arpeggio',
    presetType: 'Maj7',
    cagedShape: 'E',
    showWaterfall: false,
    // ... rest
  });
  ```
- [ ] 3.2 Create handler `handleContentSourceChange(source: ContentSource)`
- [ ] 3.3 Create handler `handleViewStyleChange(style: ViewStyle)`
- [ ] 3.4 Update `handleNoteClick` (single-click):
  - If `contentSource !== 'custom'`, snapshot visible notes to `customNotes`
  - Toggle clicked note
  - Switch `contentSource` to `'custom'`
- [ ] 3.5 Update `handleNoteDoubleClick`:
  - Set `root` to clicked note's chromatic index
  - Switch `contentSource` to `'custom'`
  - Preserve existing `customNotes` (transpose with new root)
- [ ] 3.6 Create handler `handleCagedShapeClick(shape: ShapeName)`:
  - Switch `contentSource` to `'preset'`
  - Set `cagedShape` to clicked shape
  - Do NOT clear `customNotes`
- [ ] 3.7 Remove `patternMode` references from all handlers

## 4. Update UI Controls

- [ ] 4.1 Replace mode buttons (Box/Waterfall/Edit/Tab) with:
  - Content source tabs: Preset | Shapes | Custom | Tab
  - View style toggle: Box | Horizontal
- [ ] 4.2 Add waterfall checkbox within box view controls
- [ ] 4.3 Conditionally show CAGED selector only when `viewStyle === 'box'`
- [ ] 4.4 Update CAGED buttons to call `handleCagedShapeClick()` (re-enters preset mode)
- [ ] 4.5 Update "Reset" button to work with `contentSource: 'custom'`

## 5. Update AlphaTabPlayer Integration

- [ ] 5.1 Update `handleNotesDecoded` to set `contentSource: 'tab'` when tab loads
- [ ] 5.2 Ensure tab notes display correctly in both `box` and `horizontal` view styles
- [ ] 5.3 Test bar range selection with new state structure

## 6. Validation & Testing

- [ ] 6.1 Manual test: Switch between all content sources, verify notes persist correctly
- [ ] 6.2 Manual test: Toggle view style in each content source
- [ ] 6.3 Manual test: Single-click in preset mode → should copy to custom and switch
- [ ] 6.4 Manual test: Double-click sets anchor without changing content source
- [ ] 6.5 Manual test: Import tab file → contentSource switches to 'tab'
- [ ] 6.6 Verify PDF export works with new state structure
- [ ] 6.7 Run `npm run build` to check for TypeScript errors

## 7. Cleanup

- [ ] 7.1 Remove deprecated `PatternMode` type after all references removed
- [ ] 7.2 Remove `previousPatternMode` field (no longer needed with clear separation)
- [ ] 7.3 Update any comments referencing old `patternMode` terminology

## Dependencies

- Task 2 depends on Task 1 (types must exist first)
- Task 3 depends on Task 1 and 2 (state and calculations must work)
- Task 4 depends on Task 3 (handlers must exist for UI to call)
- Task 5 depends on Task 3 (state structure must be finalized)
- Task 6 and 7 can run after all others

## Parallelizable Work

- Tasks 1.1, 1.2, 1.3 can be done together
- Tasks 4.1, 4.2, 4.3, 4.4 can be done together once Task 3 is complete
