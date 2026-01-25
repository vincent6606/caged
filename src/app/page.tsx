'use client';

import React, { useState, useEffect, useRef } from 'react';
import { InfoPanel } from '@/components/InfoPanel';
import { RetroWindow } from '@/components/RetroWindow';
import { Fretboard } from '@/components/Fretboard';
import { AppState, ShapeName, ChordQuality, TuningName } from '@/lib/engine/types';
import { calculateFretboardState } from '@/lib/engine/caged';
import { NOTE_NAMES, STRING_TO_SHAPE_MAP, TUNINGS } from '@/lib/engine/constants';
import { audio, getNoteFrequency } from '@/lib/audio/context';
import { DesktopIcon } from '@/components/DesktopIcon';
import { AlphaTabPlayer } from '@/components/AlphaTabPlayer';

export default function Home() {
  // Initialize state with new architecture
  const [state, setState] = useState<AppState>({
    // === NEW STATE ARCHITECTURE ===
    contentSource: 'preset',
    viewStyle: 'box',
    root: 0, // C
    tuning: TUNINGS['Standard'],
    tuningName: 'Standard',
    anchor: null,
    cagedShape: 'E',
    presetCategory: 'arpeggio',
    presetType: 'Maj7',
    customNotes: [],
    activeTabNotes: [],
    tabBarRange: { start: 1, end: 16 },
    isPlaying: false,
    playbackSpeed: 1,
    // === DEPRECATED (for backward compatibility) ===
    quality: 'Maj7',
    shape: 'E',
    patternMode: 'box',
    selectedNote: null,
  });



  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);

  const activeNotes = calculateFretboardState(state);

  // Load samples on mount
  useEffect(() => {
    audio.resume();
  }, []);

  // Handlers
  const handleTuningChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newName = e.target.value as TuningName;
    if (newName === 'Custom') return; // Do not apply preset tuning if Custom is selected

    setState(prev => ({
      ...prev,
      tuningName: newName,
      tuning: TUNINGS[newName],
      // Reset custom notes on tuning change to avoid confusion?
      customNotes: []
    }));
  };

  const handleManualTuningChange = (stringIdx: number, newPitch: number) => {
    const newTuning = [...state.tuning];
    newTuning[stringIdx] = newPitch;
    setState(prev => ({
      ...prev,
      tuning: newTuning,
      tuningName: 'Custom' as TuningName,
      customNotes: []
    }));
  };

  const handleTabUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setFileData(evt.target.result as ArrayBuffer);
          setState(prev => ({ ...prev, contentSource: 'tab', patternMode: 'tab' }));
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleNoteClick = (stringIdx: number, fret: number) => {
    const freq = getNoteFrequency(stringIdx, fret, state.tuning);
    audio.playTone(freq);

    // TAB MODE: Toggle notes in activeTabNotes
    if (state.contentSource === 'tab') {
      setState(prev => {
        const currentNotes = prev.activeTabNotes || [];
        const exists = currentNotes.some(n => n.stringIdx === stringIdx && n.fret === fret);
        const nextNotes = exists
          ? currentNotes.filter(n => !(n.stringIdx === stringIdx && n.fret === fret))
          : [...currentNotes, { stringIdx, fret }];
        return { ...prev, activeTabNotes: nextNotes };
      });
      return;
    }

    // Use delayed execution to allow double-click to cancel
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    clickTimeoutRef.current = setTimeout(() => {
      console.log('[CLICK] Single-click → switching to custom mode');
      setState(prev => {
        let currentNotes = prev.customNotes || [];

        // If NOT in custom mode, snapshot current visible notes first
        if (prev.contentSource !== 'custom') {
          const visibleNotes = calculateFretboardState(prev);
          currentNotes = visibleNotes.map(n => ({ stringIdx: n.stringIdx, fret: n.fret }));
        }

        // Toggle the clicked note
        const exists = currentNotes.some(n => n.stringIdx === stringIdx && n.fret === fret);
        const nextNotes = exists
          ? currentNotes.filter(n => !(n.stringIdx === stringIdx && n.fret === fret))
          : [...currentNotes, { stringIdx, fret }];

        return {
          ...prev,
          contentSource: 'custom',
          customNotes: nextNotes,
          // Keep deprecated fields in sync
          patternMode: 'edit',
        };
      });
    }, 150); // 150ms delay - fast enough for UX, long enough for double-click detection
  };

  // Ref to track click timeout for single/double-click disambiguation
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; stringIdx: number; fret: number } | null>(null);

  // Close context menu on any other click
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleNoteDoubleClick = (stringIdx: number, fret: number) => {
    // CANCEL the pending single-click
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    const freq = getNoteFrequency(stringIdx, fret, state.tuning);
    audio.playTone(freq);

    // Calculate root based on current tuning
    const chromaticIdx = (state.tuning[stringIdx] + fret) % 12;

    console.log('[CLICK] Double-click → setting root to', NOTE_NAMES[chromaticIdx], ', staying in mode:', state.contentSource);

    // Set root and anchor, STAY in current mode (do not switch to custom)
    setState(prev => ({
      ...prev,
      root: chromaticIdx,
      anchor: { stringIdx, fret },
      // Keep deprecated field in sync
      selectedNote: { stringIdx, fret }
    }));
  };

  // NEW: CAGED selector handler - switches to preset mode
  const handleCagedShapeClick = (shape: ShapeName) => {
    console.log('[CLICK] CAGED shape:', shape, '→ contentSource: preset, cagedShape:', shape);
    setState(prev => ({
      ...prev,
      contentSource: 'preset',
      cagedShape: shape,
      // Keep deprecated fields in sync
      shape: shape,
      patternMode: 'box',
      // NOTE: customNotes are PRESERVED, not cleared
    }));
  };

  const handleNoteRightClick = (stringIdx: number, fret: number, e: React.MouseEvent) => {
    // Prevent default context menu already handled in Fretboard, but just in case
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, stringIdx, fret });
  };

  // Hover Handler for Audio Preview
  const handleNoteHover = (stringIdx: number, fret: number) => {
    // Only play if the note is currently active/visible
    const active = calculateFretboardState(state);
    const isActive = active.some(n => n.stringIdx === stringIdx && n.fret === fret);
    if (isActive) {
      const freq = getNoteFrequency(stringIdx, fret, state.tuning);
      audio.playTone(freq, 0.4); // Short duration for hover
    }
  };


  // Helper for active button style (High Contrast - Bright Blue)
  const getBtnClass = (isActive: boolean) =>
    `retro-btn py-1 px-2 text-[10px] border-2 transition-all ${isActive
      ? 'bg-[#2563eb] text-white font-bold shadow-inner'
      : 'bg-white hover:bg-slate-100 shadow-[2px_2px_0_black]'
    }`;


  // Helper to play notes as a strum (Restricted to 4 notes: R, 3, 5, 7)
  const playChordNotes = (notes: ReturnType<typeof calculateFretboardState>) => {
    // 0. Helper to get Pitch Score
    const getPitchScore = (n: typeof notes[0]) => {
      // Use current dynamic tuning to calculate absolute pitch
      return state.tuning[n.stringIdx] + n.fret;
    };

    // 1. Sort all available notes by pitch (Low -> High)
    const sortedAll = [...notes].sort((a, b) => getPitchScore(a) - getPitchScore(b));

    // 2. Find the Anchor: Lowest Root
    const rootNote = sortedAll.find(n => n.interval === 0);
    if (!rootNote) return; // Should not happen if shape is valid

    const sequence = [rootNote];
    let currentPitch = getPitchScore(rootNote);

    // 3. Find next intervals in strict ascending order
    const targets = [
      [3, 4],       // Thirds
      [6, 7, 8],    // Fifths
      [9, 10, 11]   // Sevenths
    ];

    targets.forEach(targetIntervals => {
      // Find the first note in sorted list that creates this interval AND is higher than current pitch
      const nextNote = sortedAll.find(n =>
        targetIntervals.includes(n.interval) && getPitchScore(n) > currentPitch
      );

      if (nextNote) {
        sequence.push(nextNote);
        currentPitch = getPitchScore(nextNote);
      }
    });

    // 4. Play
    sequence.forEach((note, i) => {
      const delay = i * 150; // Slower arpeggio for clarity
      const freq = getNoteFrequency(note.stringIdx, note.fret, state.tuning);
      setTimeout(() => {
        audio.playTone(freq, 0.6);
      }, delay);
    });
  };

  const handleExportPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;

      const jsPDFModule = await import('jspdf');

      // Robust import: try default, then named, to handle various ESM/CJS interop scenarios
      const jsPDF = (jsPDFModule as any).default || (jsPDFModule as any).jsPDF || jsPDFModule;

      const element = document.getElementById('fretboard-container');
      if (!element) {
        console.error("PDF Export: Element 'fretboard-container' not found");
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      const safeRoot = NOTE_NAMES[state.root].replace('#', 's');
      const filename = `CAGED_Session_${safeRoot}_${state.quality}_${state.shape}.pdf`;

      pdf.save(filename);

    } catch (err) {
      console.error('PDF Export failed:', err);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNotesDecoded = (notes: { stringIdx: number; fret: number }[]) => {
    console.log("Notes Decoded:", notes.length);
    setState(prev => ({ ...prev, activeTabNotes: notes, contentSource: 'tab', patternMode: 'tab' }));
  };

  return (
    <main className="retro-desktop font-sans select-none flex flex-row items-center justify-start p-4 gap-8 overflow-auto">
      {/* Pixel Art Waves Background */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 32 C16 16 48 48 64 32' stroke='white' stroke-width='4' fill='none' /%3E%3C/svg%3E")`,
          backgroundSize: '128px 64px'
        }}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleTabUpload}
        className="hidden"
        accept=".gp,.gp3,.gp4,.gp5,.gpx"
      />

      {/* Desktop Icons Sidebar */}
      <div className="flex flex-col gap-8 w-32 shrink-0 z-10 pt-10 h-full justify-start items-center">
        <DesktopIcon
          label="My Computer"
          iconSrc="/icons/computer_explorer-4.png"
          onClick={() => { }}
        />

        <DesktopIcon
          label="Tab_Importer.exe"
          iconSrc="/icons/upload_gp.png"
          onClick={() => {
            fileInputRef.current?.click();
          }}
        />

        <DesktopIcon
          label="Export_PDF.exe"
          iconSrc="/icons/printer_diskette-2.png"
          onClick={handleExportPDF}
        />
      </div>

      {/* Main Layout Grid - Windowed Mode */}
      <div className="flex flex-col gap-4 z-10 flex-1 max-w-[1280px] h-[85vh] shadow-2xl min-w-0 pr-4">

        {/* Window 2: Active Quest (Top Info Panel) - Always Visible for Controls */}
        <RetroWindow title="Active_Session.exe" className="md:h-auto shadow-xl bg-white w-full">
          <InfoPanel
            root={state.root}
            quality={state.presetType}
            bpm={90}
            description="Connecting C.A.G.E.D positions across the fretboard."
          >
            {/* INJECTED CONTROLS */}
            <div className="flex flex-wrap md:flex-nowrap gap-4 items-center">

              {/* Root Selector */}
              <div className="flex flex-col gap-1 items-center">
                <label className="text-[9px] uppercase font-bold text-[var(--text-secondary)]">Root</label>
                <select
                  value={state.root}
                  onChange={(e) => setState(prev => ({ ...prev, root: parseInt(e.target.value) }))}
                  className="retro-btn bg-white w-16 border-2 border-[var(--border-dark)] py-1 text-xs"
                >
                  {NOTE_NAMES.map((n, i) => <option key={n} value={i}>{n}</option>)}
                </select>
              </div>

              {/* Tuning Selector */}
              <div className="flex flex-col gap-1 items-center">
                <label className="text-[9px] uppercase font-bold text-[var(--text-secondary)]">Tuning</label>
                <select
                  value={state.tuningName === 'Custom' ? '' : state.tuningName} // Show Custom as blank or 'Custom' if added
                  onChange={handleTuningChange}
                  className="retro-btn bg-white w-24 border-2 border-[var(--border-dark)] py-1 text-xs"
                >
                  {Object.keys(TUNINGS).map(t => <option key={t} value={t}>{t}</option>)}
                  {state.tuningName === 'Custom' && <option value="Custom">Custom</option>}
                </select>
              </div>

              {/* Quality Buttons */}
              <div className="flex flex-col gap-1 items-center">
                <label className="text-[9px] uppercase font-bold text-[var(--text-secondary)]">Quality</label>
                <div className="flex gap-1">
                  {(['Maj7', 'Dom7', 'Min7', 'Min7b5', 'Dim7'] as ChordQuality[]).map(q => (
                    <button
                      key={q}
                      onClick={() => {
                        const nextState = {
                          ...state,
                          presetType: q,
                          quality: q, // Keep deprecated field in sync
                          contentSource: 'preset' as const,
                          patternMode: 'box' as const
                        };
                        console.log('[CLICK] Quality:', q, '→ contentSource: preset, presetType:', q);
                        setState(nextState);

                        // Audio Preview
                        const notes = calculateFretboardState(nextState);
                        playChordNotes(notes);
                      }}
                      className={getBtnClass(state.presetType === q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-8 w-[2px] bg-[var(--border-light)] mx-2 hidden md:block"></div>

              {/* Content Source Tabs */}
              <div className="flex flex-col gap-1 items-center">
                <label className="text-[9px] uppercase font-bold text-[var(--text-secondary)]">Content</label>
                <div className="flex gap-1 items-center">
                  <button
                    className={getBtnClass(state.contentSource === 'preset')}
                    onClick={() => {
                      console.log('[CLICK] Preset button → contentSource: preset');
                      setState(prev => ({ ...prev, contentSource: 'preset', patternMode: 'box' }));
                    }}
                  >
                    Preset
                  </button>
                  <button
                    className={getBtnClass(state.contentSource === 'custom')}
                    onClick={() => {
                      if (state.contentSource !== 'custom') {
                        const visibleNotes = calculateFretboardState(state);
                        const existingNotes = visibleNotes.map(n => ({ stringIdx: n.stringIdx, fret: n.fret }));
                        console.log('[CLICK] Custom button → contentSource: custom, snapshotted', existingNotes.length, 'notes');
                        setState(prev => ({
                          ...prev,
                          contentSource: 'custom',
                          customNotes: existingNotes,
                          patternMode: 'edit',
                        }));
                      } else {
                        console.log('[CLICK] Custom button → already in custom mode');
                      }
                    }}
                  >
                    Custom
                  </button>
                  <button
                    className={getBtnClass(state.contentSource === 'tab')}
                    onClick={() => {
                      if (!fileData) {
                        fileInputRef.current?.click();
                      } else {
                        setState(prev => ({ ...prev, contentSource: 'tab', patternMode: 'tab' }));
                      }
                    }}
                  >
                    Tab
                  </button>
                </div>
              </div>

              {/* View Style Toggle */}
              <div className="flex flex-col gap-1 items-center">
                <label className="text-[9px] uppercase font-bold text-[var(--text-secondary)]">View</label>
                <div className="flex gap-1 items-center">
                  <button
                    className={`${getBtnClass(state.viewStyle === 'box')} ${state.tuningName !== 'Standard' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => {
                      console.log('[CLICK] Box view → viewStyle: box');
                      state.tuningName === 'Standard' && setState(prev => ({ ...prev, viewStyle: 'box' }));
                    }}
                    disabled={state.tuningName !== 'Standard'}
                    title={state.tuningName !== 'Standard' ? "CAGED box view only available in Standard Tuning" : ""}
                  >
                    Box
                  </button>
                  <button
                    className={getBtnClass(state.viewStyle === 'horizontal')}
                    onClick={() => {
                      console.log('[CLICK] Horizontal view → viewStyle: horizontal');
                      setState(prev => ({ ...prev, viewStyle: 'horizontal' }));
                    }}
                  >
                    Horizontal
                  </button>
                </div>
              </div>

              {/* Reset Button (only enabled in Custom mode) */}
              <button
                onClick={() => setState(prev => ({ ...prev, customNotes: [] }))}
                className={`retro-btn text-[10px] py-1 px-2 border-2 border-[var(--border-dark)] ml-2 transition-all active:translate-y-px active:shadow-none shadow-[2px_2px_0_black] ${state.contentSource === 'custom'
                  ? 'bg-red-100 hover:bg-red-200 opacity-100'
                  : 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'
                  }`}
                disabled={state.contentSource !== 'custom'}
                title="Clear all notes (Custom mode only)"
              >
                Reset
              </button>
            </div>
          </InfoPanel>
        </RetroWindow>

        {/* Optional Window: Tab Player (Only visible in Tab Mode) */}
        {state.contentSource === 'tab' && fileData && (
          <RetroWindow
            title="Tab_Viewer.exe"
            className="flex-1 min-h-0 shadow-xl bg-white w-full flex flex-col"
          >
            <AlphaTabPlayer
              key={fileData ? fileData.byteLength : 'empty'}
              fileData={fileData}
              onNotesDecoded={handleNotesDecoded}
              onPlayerReady={(api) => { console.log('Player ready', api); }}
              onKeyDetected={(root, quality) => {
                setState(prev => ({ ...prev, root, quality: quality as any }));
              }}
            />
          </RetroWindow>
        )}

        {/* Window 3: Fretboard Visualizer (Main Bottom) */}
        <RetroWindow
          title="Fretboard_Visualizer - [24 Fret]"
          className="flex-1 min-h-0 flex flex-col shadow-xl bg-white w-full"
        >
          <div className="flex-1 overflow-auto p-2 md:p-4 flex flex-col gap-4 relative bg-dot-pattern h-full">

            {/* Fretboard Frame */}
            <div className="w-full max-w-[98%] overflow-hidden border-4 border-[var(--border-dark)] bg-white shadow-[4px_4px_0px_rgba(0,0,0,0.1)] relative shrink-0">
              <div className="h-6 bg-[var(--border-light)] border-b border-[var(--border-dark)] flex items-center justify-end px-2 text-[10px] font-mono text-[var(--text-secondary)] select-none">
                <button
                  onClick={handleExportPDF}
                  className="hover:bg-blue-100 px-2 border-l border-[var(--border-dark)] h-full flex items-center gap-1 active:bg-blue-200"
                  title="Download as PDF"
                >
                  <img src="/icons/printer_diskette-2.png" className="w-4 h-4" />
                  <span className="font-bold">EXPORT PDF</span>
                </button>
              </div>

              <div className="flex flex-row">
                <div className="p-2 md:p-4 overflow-x-auto flex justify-start md:justify-center bg-slate-50 flex-1">
                  {/* Enforce min-width so SVG doesn't crush */}
                  <div className="min-w-fit">
                    <Fretboard
                      notes={activeNotes}
                      tuning={state.tuning}
                      onTuningChange={handleManualTuningChange}
                      onNoteClick={handleNoteClick}
                      onNoteDoubleClick={handleNoteDoubleClick}
                      onNoteRightClick={handleNoteRightClick}
                      onNoteHover={handleNoteHover}
                    />
                  </div>
                </div>

                {/* 5. Sidebar (Right Side) */}
                <div className="flex flex-col gap-3 items-center justify-center p-2 border-l-2 border-[var(--border-light)] bg-slate-100 w-44 shrink-0">
                  {state.contentSource === 'tab' ? (
                    <>
                      <h3 className="text-lg font-bold font-silkscreen text-[var(--text-secondary)] text-center">ROOT NOTE</h3>
                      <div className="w-32 h-32 flex items-center justify-center font-[family-name:var(--font-silkscreen)] text-7xl pb-4 text-[var(--text-primary)] bg-white border-4 border-[var(--border-dark)] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]">
                        {NOTE_NAMES[state.root]}
                      </div>
                    </>
                  ) : state.tuningName !== 'Standard' || state.viewStyle === 'horizontal' ? (
                    <>
                      {/* Show ROOT for horizontal view or non-standard tuning (CAGED doesn't apply) */}
                      {state.tuningName !== 'Standard' && (
                        <>
                          <h3 className="text-lg font-bold font-silkscreen text-[var(--text-secondary)] text-center">TUNING</h3>
                          <div className="w-32 h-12 flex items-center justify-center font-[family-name:var(--font-silkscreen)] text-base text-[var(--text-primary)] bg-white border-4 border-[var(--border-dark)] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] uppercase">
                            {state.tuningName}
                          </div>
                        </>
                      )}
                      <h3 className="text-lg font-bold font-silkscreen text-[var(--text-secondary)] mt-4 text-center">ROOT</h3>
                      <div className="w-32 h-32 flex items-center justify-center font-[family-name:var(--font-silkscreen)] text-7xl pb-4 text-[var(--text-primary)] bg-white border-4 border-[var(--border-dark)] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]">
                        {NOTE_NAMES[state.root]}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold font-silkscreen text-[var(--text-secondary)] text-center leading-tight">ACTIVE<br />SHAPE</h3>
                      <div className="flex flex-row gap-4">
                        <div className="flex flex-wrap gap-2 w-32 justify-center">
                          {(['C', 'A', 'G', 'E', 'D'] as const).map(shape => (
                            <button
                              key={shape}
                              onClick={() => handleCagedShapeClick(shape)}
                              className={`
                                w-10 h-10 flex items-center justify-center 
                                font-[family-name:var(--font-silkscreen)] text-xl font-bold 
                                border-2 border-black shadow-[2px_2px_0_black]
                                transition-all active:translate-y-1 active:shadow-none
                                ${state.cagedShape === shape && state.contentSource === 'preset'
                                  ? 'bg-[var(--accent-red)] text-white scale-110 z-10'
                                  : 'bg-white text-black hover:bg-gray-100'}
                              `}
                            >
                              {shape}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </RetroWindow>

      </div>

      {/* Context Menu */}
      {
        contextMenu && (
          <div
            className="fixed z-50 bg-[#c0c0c0] border-2 border-white shadow-[2px_2px_0_black] p-1 flex flex-col gap-1 min-w-[150px] select-none"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-blue-800 text-white px-2 py-0.5 text-[10px] font-bold mb-1">
              NOTE OPTIONS
            </div>

            <button
              className="text-left px-2 py-1 hover:bg-blue-700 hover:text-white text-xs font-bold font-sans border border-transparent hover:border-dotted hover:border-white"
              onClick={() => {
                const chromaticIdx = (state.tuning[contextMenu.stringIdx] + contextMenu.fret) % 12;
                setState(prev => ({
                  ...prev,
                  root: chromaticIdx,
                  anchor: { stringIdx: contextMenu.stringIdx, fret: contextMenu.fret },
                  // Keep deprecated field in sync
                  selectedNote: { stringIdx: contextMenu.stringIdx, fret: contextMenu.fret }
                }));
                setContextMenu(null);
              }}
            >
              Set as Root
            </button>

            {state.tuningName === 'Standard' && (
              <button
                className="text-left px-2 py-1 hover:bg-blue-700 hover:text-white text-xs font-bold font-sans border border-transparent hover:border-dotted hover:border-white"
                onClick={() => {
                  const { stringIdx, fret } = contextMenu;
                  const chromaticIdx = (state.tuning[stringIdx] + fret) % 12;
                  const validShapes = STRING_TO_SHAPE_MAP[stringIdx];

                  if (validShapes && validShapes.length > 0) {
                    setState(prev => ({
                      ...prev,
                      root: chromaticIdx,
                      contentSource: 'preset',
                      viewStyle: 'box',
                      cagedShape: validShapes[0],
                      anchor: { stringIdx, fret },
                      // Keep deprecated fields in sync
                      shape: validShapes[0],
                      patternMode: 'box',
                      selectedNote: { stringIdx, fret }
                    }));
                  }
                  setContextMenu(null);
                }}
              >
                Jump to Shape
              </button>
            )}

            <div className="h-px bg-gray-400 my-0.5"></div>

            <button
              className="text-left px-2 py-1 hover:bg-blue-700 hover:text-white text-xs font-bold font-sans border border-transparent hover:border-dotted hover:border-white text-gray-500"
              onClick={() => setContextMenu(null)}
            >
              Cancel
            </button>
          </div>
        )
      }

    </main >
  );
}
