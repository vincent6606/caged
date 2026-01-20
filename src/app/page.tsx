'use client';

import React, { useState, useEffect, useRef } from 'react';
import { InfoPanel } from '@/components/InfoPanel';
import { RetroWindow } from '@/components/RetroWindow';
import { Fretboard } from '@/components/Fretboard';
import { YouTubePlayer, YouTubePlayerRef } from '@/components/YouTubePlayer';
import { AppState, ShapeName, ChordQuality, TuningName } from '@/lib/engine/types';
import { calculateFretboardState } from '@/lib/engine/caged';
import { NOTE_NAMES, STRING_TO_SHAPE_MAP, TUNINGS } from '@/lib/engine/constants';
import { audio, getNoteFrequency } from '@/lib/audio/context';

const BACKING_TRACKS = [
  { id: '2b_4Zozqc3E', title: 'Neo Soul (Am) - 75 BPM', root: 9, quality: 'Min7' }, // A Min7
  { id: 'P2K7D-uP2II', title: 'Slow Blues (A) - 60 BPM', root: 9, quality: 'Dom7' }, // A Dom7
  { id: 'G9XogUbFp0Q', title: 'R&B Chords (C) - 90 BPM', root: 0, quality: 'Maj7' }, // C Maj7
];

import { DesktopIcon } from '@/components/DesktopIcon';
import { AlphaTabPlayer } from '@/components/AlphaTabPlayer';

export default function Home() {
  const playerRef = useRef<YouTubePlayerRef>(null);

  // Initialize state with customNotes for 'edit'  // State
  const [state, setState] = useState<AppState>({
    root: 0, // C
    quality: 'Maj7',
    shape: 'C', // Default start
    patternMode: 'box',
    tuningName: 'Standard',
    tuning: TUNINGS['Standard'],
    playbackSpeed: 1,
    isPlaying: false,
    customNotes: [], // For Edit Mode
    selectedNote: null,
    activeTabNotes: []
  });

  const [activeTrack, setActiveTrack] = useState(BACKING_TRACKS[2].id);
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);

  const activeNotes = calculateFretboardState(state);

  // Load samples on mount
  useEffect(() => {
    audio.resume();
  }, []);

  // Handlers
  const handleRootChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(prev => ({ ...prev, root: parseInt(e.target.value) }));
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(prev => ({ ...prev, quality: e.target.value as ChordQuality }));
  };

  const handleShapeChange = (shape: ShapeName) => {
    setState(prev => ({ ...prev, shape }));
  };

  const handlePatternModeChange = (mode: string) => {
    setState(prev => ({ ...prev, patternMode: mode as any }));
  };

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
          setState(prev => ({ ...prev, patternMode: 'tab' }));
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleNoteClick = (stringIdx: number, fret: number) => {
    const freq = getNoteFrequency(stringIdx, fret, state.tuning);
    audio.playTone(freq);

    // FIX PREVENT EDIT IN TAB MODE
    if (state.patternMode === 'tab') return;

    setState(prev => {
      // 1. Determine the base notes we are editing
      let currentNotes = prev.customNotes || [];
      let nextMode = prev.patternMode;
      let prevModeToStore = prev.previousPatternMode;

      // If we are NOT in edit mode, snapshot the current view into customNotes
      if (prev.patternMode !== 'edit') {
        const visibleNotes = calculateFretboardState(prev);
        currentNotes = visibleNotes.map(n => ({ stringIdx: n.stringIdx, fret: n.fret }));

        // FIX: If note is already selected/visible in a non-edit mode, do NOT remove it.
        // Just keep the current state (audio already played).
        const alreadyExists = currentNotes.some(n => n.stringIdx === stringIdx && n.fret === fret);
        if (alreadyExists) {
          return prev;
        }

        nextMode = 'edit';
        prevModeToStore = prev.patternMode; // Store ONLY when entering edit mode
      }

      // 2. Toggle the specific note clicked
      const exists = currentNotes.some(n => n.stringIdx === stringIdx && n.fret === fret);
      let nextNotes;

      if (exists) {
        nextNotes = currentNotes.filter(n => !(n.stringIdx === stringIdx && n.fret === fret));
      } else {
        nextNotes = [...currentNotes, { stringIdx, fret }];
      }

      return {
        ...prev,
        patternMode: nextMode as any, // Cast to ensure TS is happy if needed, though AppState should allow 'edit'
        customNotes: nextNotes,
        previousPatternMode: prevModeToStore // Store previous mode for recovery
      };
    });
  };

  const handleNoteDoubleClick = (stringIdx: number, fret: number) => {
    const freq = getNoteFrequency(stringIdx, fret, state.tuning);
    audio.playTone(freq);

    // Calc Root based on current Tuning
    const chromaticIdx = (state.tuning[stringIdx] + fret) % 12;

    let newShape = state.shape;

    // Auto-Shape Logic only applies to Standard Tuning
    if (state.tuningName === 'Standard') {
      const validShapes = STRING_TO_SHAPE_MAP[stringIdx];
      const sameRoot = chromaticIdx === state.root;

      // Resolve effective mode
      const originMode = state.patternMode === 'edit' ? state.previousPatternMode : state.patternMode;

      // CYCLE LOGIC: If same root AND in box/waterfall mode, cycle through valid shapes
      if (sameRoot && validShapes && (originMode === 'box' || originMode === 'waterfall')) {
        const currentIndex = validShapes.indexOf(state.shape);
        // If current shape is valid, pick next; otherwise start at 0
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % validShapes.length;
        newShape = validShapes[nextIndex];
      }
      // DEFAULT LOGIC: If new root or current shape invalid, pick first valid
      else if (validShapes && !validShapes.includes(state.shape)) {
        newShape = validShapes[0];
      }
    }

    setState(prev => {
      // Determine next mode using fresh 'prev' state
      // If we are in 'edit' (triggered by single click), check if we came from 'tab'
      const originMode = prev.patternMode === 'edit' ? prev.previousPatternMode : prev.patternMode;
      const nextMode = originMode === 'tab' ? 'tab' : 'box';

      return {
        ...prev,
        patternMode: nextMode,
        root: chromaticIdx,
        shape: newShape,
        selectedNote: { stringIdx, fret },
        customNotes: nextMode === 'tab' ? prev.customNotes : [] // Only clear custom notes if leaving Edit mode (effectively resetting to box)
      };
    });
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

  const handleTrackChange = (videoId: string) => {
    const track = BACKING_TRACKS.find(t => t.id === videoId);
    setActiveTrack(videoId);
    if (track) {
      setState(prev => ({
        ...prev,
        root: track.root,
        quality: track.quality as ChordQuality,
        shape: 'C'
      }));
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
    setState(prev => ({ ...prev, activeTabNotes: notes }));
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
            quality={state.quality}
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
                        const nextState = { ...state, quality: q, patternMode: 'box' as const };
                        setState(nextState);

                        // Audio Preview
                        const notes = calculateFretboardState(nextState);
                        playChordNotes(notes);
                      }}
                      className={getBtnClass(state.quality === q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-8 w-[2px] bg-[var(--border-light)] mx-2 hidden md:block"></div>

              {/* View/Mode Buttons */}
              <div className="flex flex-col gap-1 items-center">
                <label className="text-[9px] uppercase font-bold text-[var(--text-secondary)]">View Mode</label>
                <div className="flex gap-1 items-center">
                  <button
                    className={`${getBtnClass(state.patternMode === 'box')} ${state.tuningName !== 'Standard' ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : ''}`}
                    onClick={() => state.tuningName === 'Standard' && setState(prev => ({ ...prev, patternMode: 'box' }))}
                    disabled={state.tuningName !== 'Standard'}
                    title={state.tuningName !== 'Standard' ? "Only available in Standard Tuning" : ""}
                  >
                    Box
                  </button>
                  <button
                    className={`${getBtnClass(state.patternMode === 'waterfall')} ${state.tuningName !== 'Standard' ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : ''}`}
                    onClick={() => state.tuningName === 'Standard' && setState(prev => ({ ...prev, patternMode: 'waterfall' }))}
                    disabled={state.tuningName !== 'Standard'}
                    title={state.tuningName !== 'Standard' ? "Only available in Standard Tuning" : ""}
                  >
                    Waterfall
                  </button>
                  <button
                    className={getBtnClass(state.patternMode === 'edit')}
                    onClick={() => {
                      if (state.patternMode !== 'edit') {
                        const visibleNotes = calculateFretboardState(state);
                        const existingNotes = visibleNotes.map(n => ({ stringIdx: n.stringIdx, fret: n.fret }));

                        setState(prev => ({
                          ...prev,
                          patternMode: 'edit',
                          customNotes: existingNotes,
                          previousPatternMode: prev.patternMode
                        }));
                      } else {
                        setState(prev => ({ ...prev, patternMode: 'edit' }));
                      }
                    }}
                  >
                    Edit
                  </button>

                  <button
                    className={getBtnClass(state.patternMode === 'tab')}
                    onClick={() => {
                      if (!fileData) {
                        fileInputRef.current?.click();
                      } else {
                        setState(prev => ({ ...prev, patternMode: 'tab' }));
                      }
                    }}
                  >
                    Tab
                  </button>

                  {/* Reset Button */}
                  <button
                    onClick={() => setState(prev => ({ ...prev, customNotes: [] }))}
                    className={`retro-btn text-[10px] py-1 px-2 border-2 border-[var(--border-dark)] ml-2 transition-all active:translate-y-px active:shadow-none shadow-[2px_2px_0_black] ${state.patternMode === 'edit'
                      ? 'bg-red-100 hover:bg-red-200 opacity-100'
                      : 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'
                      }`}
                    disabled={state.patternMode !== 'edit'}
                    title="Clear all notes (Edit Mode only)"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </InfoPanel>
        </RetroWindow>

        {/* Optional Window: Tab Player (Only visible in Tab Mode or Edit Mode from Tab) */}
        {(state.patternMode === 'tab' || (state.patternMode === 'edit' && state.previousPatternMode === 'tab')) && fileData && (
          <RetroWindow title="Tab_Viewer.exe" className="h-[250px] shadow-xl bg-white w-full shrink-0">
            <AlphaTabPlayer
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
        <RetroWindow title="Fretboard_Visualizer - [24 Fret]" className="flex-1 flex flex-col shadow-xl bg-white min-h-0 w-full">
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
                      onNoteHover={handleNoteHover}
                    />
                  </div>
                </div>

                {/* 5. Sidebar (Right Side) */}
                <div className="flex flex-col gap-3 items-center justify-center p-2 border-l-2 border-[var(--border-light)] bg-slate-100 w-44 shrink-0">
                  {state.patternMode === 'tab' ? (
                    <>
                      <h3 className="text-lg font-bold font-silkscreen text-[var(--text-secondary)] text-center">ROOT NOTE</h3>
                      <div className="w-32 h-32 flex items-center justify-center font-[family-name:var(--font-silkscreen)] text-7xl pb-4 text-[var(--text-primary)] bg-white border-4 border-[var(--border-dark)] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]">
                        {NOTE_NAMES[state.root]}
                      </div>
                    </>
                  ) : state.tuningName !== 'Standard' ? (
                    <>
                      <h3 className="text-lg font-bold font-silkscreen text-[var(--text-secondary)] text-center">TUNING</h3>
                      <div className="w-32 h-12 flex items-center justify-center font-[family-name:var(--font-silkscreen)] text-base text-[var(--text-primary)] bg-white border-4 border-[var(--border-dark)] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] uppercase">
                        {state.tuningName}
                      </div>
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
                              onClick={() => handleShapeChange(shape)}
                              className={`
                                w-10 h-10 flex items-center justify-center 
                                font-[family-name:var(--font-silkscreen)] text-xl font-bold 
                                border-2 border-black shadow-[2px_2px_0_black]
                                transition-all active:translate-y-1 active:shadow-none
                                ${state.shape === shape
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
    </main>
  );
}
