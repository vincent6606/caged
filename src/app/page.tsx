'use client';

import React, { useState, useEffect, useRef } from 'react';
import { InfoPanel } from '@/components/InfoPanel';
import { RetroWindow } from '@/components/RetroWindow';
import { Fretboard } from '@/components/Fretboard';
import { YouTubePlayer, YouTubePlayerRef } from '@/components/YouTubePlayer';
import { AppState, ShapeName, ChordQuality } from '@/lib/engine/types';
import { calculateFretboardState } from '@/lib/engine/caged';
import { NOTE_NAMES, STRING_TO_SHAPE_MAP } from '@/lib/engine/constants';
import { audio, getNoteFrequency } from '@/lib/audio/context';

const BACKING_TRACKS = [
  { id: '2b_4Zozqc3E', title: 'Neo Soul (Am) - 75 BPM', root: 9, quality: 'Min7' }, // A Min7
  { id: 'P2K7D-uP2II', title: 'Slow Blues (A) - 60 BPM', root: 9, quality: 'Dom7' }, // A Dom7
  { id: 'G9XogUbFp0Q', title: 'R&B Chords (C) - 90 BPM', root: 0, quality: 'Maj7' }, // C Maj7
];

export default function Home() {
  const playerRef = useRef<YouTubePlayerRef>(null);

  // Initialize state with customNotes for 'edit' mode
  const [state, setState] = useState<AppState>({
    root: 0, // C
    quality: 'Maj7',
    shape: 'C',
    patternMode: 'box',
    playbackSpeed: 1,
    isPlaying: false,
    customNotes: [],
    selectedNote: null
  });

  const [activeTrack, setActiveTrack] = useState(BACKING_TRACKS[2].id);

  const activeNotes = calculateFretboardState(state);

  const handleNoteClick = (stringIdx: number, fret: number) => {
    const freq = getNoteFrequency(stringIdx, fret);
    audio.playTone(freq);

    // Edit Mode Logic: Toggle Notes
    if (state.patternMode === 'edit') {
      setState(prev => {
        // Ensure customNotes is array
        const currentNotes = prev.customNotes || [];
        const exists = currentNotes.some(n => n.stringIdx === stringIdx && n.fret === fret);

        if (exists) {
          return {
            ...prev,
            customNotes: currentNotes.filter(n => !(n.stringIdx === stringIdx && n.fret === fret))
          };
        } else {
          return {
            ...prev,
            customNotes: [...currentNotes, { stringIdx, fret }]
          };
        }
      });
      return;
    }

    // Standard Logic: Set Root
    const TUNING = [4, 9, 14, 19, 23, 28];
    const chromaticIdx = (TUNING[stringIdx] + fret) % 12;

    setState(prev => ({
      ...prev,
      root: chromaticIdx,
      selectedNote: { stringIdx, fret }
    }));
  };

  const handleNoteDoubleClick = (stringIdx: number, fret: number) => {
    const freq = getNoteFrequency(stringIdx, fret);
    audio.playTone(freq);

    const TUNING = [4, 9, 14, 19, 23, 28];
    const chromaticIdx = (TUNING[stringIdx] + fret) % 12;

    const validShapes = STRING_TO_SHAPE_MAP[stringIdx];
    let newShape = state.shape;

    if (chromaticIdx === state.root && validShapes.includes(state.shape)) {
      if (validShapes) {
        const currentIdx = validShapes.indexOf(state.shape);
        newShape = validShapes[(currentIdx + 1) % validShapes.length];
      }
    } else {
      if (validShapes) newShape = validShapes[0];
    }

    setState(prev => ({
      ...prev,
      root: chromaticIdx,
      shape: newShape,
      selectedNote: { stringIdx, fret }
    }));
  };

  // Hover Handler for Audio Preview
  const handleNoteHover = (stringIdx: number, fret: number) => {
    // Only play if the note is currently active/visible
    const isActive = activeNotes.some(n => n.stringIdx === stringIdx && n.fret === fret);
    if (isActive) {
      const freq = getNoteFrequency(stringIdx, fret);
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
      // String 0 = Low E, String 5 = High E (Wait, earlier we determined String 0 is Low E? 
      // Let's RE-VERIFY string indices from constants.ts or previous verification.)
      // My verification script used: String 0 = Low E implies ascending pitch with index.
      // But let's look at `TUNING` in constants...
      // CONSTANTS: TUNING = [4, 9, 14, 19, 23, 28] -> E, A, D, G, B, E
      // So index 0 = Low E (pitch 4). index 5 = High E (pitch 28).
      // So HIGHER index = HIGHER pitch (mostly).
      // Pitch = TUNING[s] + fret.
      const TUNING = [4, 9, 14, 19, 23, 28];
      return TUNING[n.stringIdx] + n.fret;
    };

    // 1. Sort all available notes by pitch (Low -> High)
    const sortedAll = [...notes].sort((a, b) => getPitchScore(a) - getPitchScore(b));

    // 2. Find the Anchor: Lowest Root
    const rootNote = sortedAll.find(n => n.interval === 0);
    if (!rootNote) return; // Should not happen if shape is valid

    const sequence = [rootNote];
    let currentPitch = getPitchScore(rootNote);

    // 3. Find next intervals in strict ascending order
    // Targets: 3rd (3/4), 5th (6/7/8), 7th (9/10/11)
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
      const freq = getNoteFrequency(note.stringIdx, note.fret);
      setTimeout(() => {
        audio.playTone(freq, 0.6);
      }, delay);
    });
  };

  const handleExportPDF = async () => {
    // Dynamic import to avoid SSR issues
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const element = document.getElementById('fretboard-container');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`CAGED_Session_${NOTE_NAMES[state.root]}_${state.quality}_${state.shape}.pdf`);
    } catch (err) {
      console.error('PDF Export failed:', err);
    }
  };

  return (
    <main className="retro-desktop font-sans select-none flex flex-col items-center justify-center p-4">
      {/* Pixel Art Waves Background */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 32 C16 16 48 48 64 32' stroke='white' stroke-width='4' fill='none' /%3E%3C/svg%3E")`,
          backgroundSize: '128px 64px'
        }}
      />

      {/* Desktop Icons */}
      <div className="retro-icon" style={{ top: 20, left: 20 }}>
        <img src="/icons/computer_explorer-4.png" alt="My Computer" className="w-8 h-8 pixelated" />
        <span className="bg-[#000080] px-1">My Computer</span>
      </div>

      <div className="retro-icon" style={{ top: 100, left: 20 }}>
        <img src="/icons/recycle_bin_full-2.png" alt="Recycle Bin" className="w-8 h-8 pixelated" />
        <span className="bg-transparent px-1 border border-dotted border-white/0 hover:border-white/50">Recycle Bin</span>
      </div>

      <div className="retro-icon" style={{ top: 180, left: 20 }}>
        <img src="/icons/directory_closed-4.png" alt="My Documents" className="w-8 h-8 pixelated" />
        <span className="bg-transparent px-1 border border-dotted border-white/0 hover:border-white/50">My Documents</span>
      </div>

      <div className="retro-icon" style={{ top: 260, left: 20 }}>
        <img src="/icons/msie2-2.png" alt="Internet" className="w-8 h-8 pixelated" />
        <span className="bg-transparent px-1 border border-dotted border-white/0 hover:border-white/50">Internet</span>
      </div>

      {/* Main Layout Grid - Single Column Stack now */}
      <div className="w-full max-w-[1400px] h-full max-h-[900px] flex flex-col gap-4 z-10">

        {/* Window 1: Jam Station (Sidebar) - REMOVED FOR NOW per user request */}
        {/* 
        <RetroWindow title="Harmony Architect Station" className="h-full flex flex-col md:row-span-2 shadow-xl bg-white">
          <div className="w-full bg-[#f1f5f9] p-4 flex flex-col gap-4 h-full overflow-y-auto">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-light)] pb-1 mb-2">
              Start Menu / Jam Station
            </div>

            <YouTubePlayer
              ref={playerRef}
              videoId={activeTrack}
              className="shadow-sm w-full aspect-video"
            />

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold">Backing Track</label>
              <select
                value={activeTrack}
                onChange={(e) => handleTrackChange(e.target.value)}
                className="retro-btn bg-white w-full border-2 border-[var(--border-dark)] text-xs text-left"
              >
                {BACKING_TRACKS.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => playerRef.current?.setPlaybackRate(0.5)} className="retro-btn bg-white">0.5x</button>
              <button onClick={() => playerRef.current?.setPlaybackRate(0.75)} className="retro-btn bg-white">0.75x</button>
              <button onClick={() => playerRef.current?.setPlaybackRate(1)} className="retro-btn bg-white col-span-2">Normal Speed</button>
            </div>

            <div className="mt-auto border-t border-[var(--border-light)] pt-4 hidden md:block">
              <div className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                <strong>Instructions:</strong><br />
                1. Select a track.<br />
                2. Click 'Play' above.<br />
                3. Follow the lighted notes.<br />
                4. Double-click a note to navigate.
              </div>
            </div>
          </div>
        </RetroWindow> 
        */}

        {/* Window 2: Active Quest (Top Info Panel) */}
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
                    className={getBtnClass(state.patternMode === 'box')}
                    onClick={() => setState(prev => ({ ...prev, patternMode: 'box' }))}
                  >
                    Box
                  </button>
                  <button
                    className={getBtnClass(state.patternMode === 'waterfall')}
                    onClick={() => setState(prev => ({ ...prev, patternMode: 'waterfall' }))}
                  >
                    Waterfall
                  </button>
                  <button
                    className={getBtnClass(state.patternMode === 'edit')}
                    onClick={() => {
                      if (state.patternMode !== 'edit') {
                        const currentNotes = calculateFretboardState(state);
                        setState(prev => ({ ...prev, patternMode: 'edit', customNotes: currentNotes }));
                      } else {
                        setState(prev => ({ ...prev, patternMode: 'edit' }));
                      }
                    }}
                  >
                    Edit
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

        {/* Window 3: Fretboard Visualizer (Main Bottom) */}
        <RetroWindow title="Fretboard_Visualizer - [24 Fret]" className="flex-1 flex flex-col shadow-xl bg-white min-h-0 w-full">
          <div className="flex-1 overflow-auto p-2 md:p-4 flex flex-col gap-4 relative bg-dot-pattern h-full">

            {/* Info Bar */}
            <div className="w-full flex justify-between items-center text-xs font-mono mb-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-white border-2 border-[var(--border-dark)]">
                <div className={`w-3 h-3 rounded-full ${state.isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></div>
                <span className="font-bold hidden md:inline">STATUS: {state.isPlaying ? 'JAMMING' : 'READY'}</span>
                <span className="font-bold md:hidden">{state.isPlaying ? 'ON' : 'OFF'}</span>
              </div>
              <span className="text-[var(--text-secondary)] font-bold">{NOTE_NAMES[state.root]} {state.quality}</span>
            </div>

            {/* Fretboard Frame */}
            <div className="w-full max-w-[98%] overflow-hidden border-4 border-[var(--border-dark)] bg-white shadow-[4px_4px_0px_rgba(0,0,0,0.1)] relative shrink-0">
              <div className="h-6 bg-[var(--border-light)] border-b border-[var(--border-dark)] flex items-center justify-between px-2 text-[10px] font-mono text-[var(--text-secondary)] select-none">
                <span>Interactive Fretboard Visualization</span>
                <button
                  onClick={handleExportPDF}
                  className="hover:bg-blue-100 px-2 border-l border-[var(--border-dark)] h-full flex items-center gap-1 active:bg-blue-200"
                  title="Download as PDF"
                >
                  <img src="/icons/directory_open-4.png" className="w-3 h-3" />
                  EXPORT PDF
                </button>
              </div>

              <div className="flex flex-row">
                <div className="p-2 md:p-4 overflow-x-auto flex justify-start md:justify-center bg-slate-50 flex-1">
                  {/* Enforce min-width so SVG doesn't crush */}
                  <div className="min-w-fit">
                    <Fretboard
                      notes={activeNotes}
                      onNoteClick={handleNoteClick}
                      onNoteDoubleClick={handleNoteDoubleClick}
                      onNoteHover={handleNoteHover}
                    />
                  </div>
                </div>

                {/* 5. C.A.G.E.D Selector (Right Side) */}
                <div className="flex flex-col gap-4 items-center justify-center p-4 border-l-2 border-[var(--border-light)] bg-slate-100 min-w-[200px]">
                  <h3 className="text-xl font-bold font-silkscreen text-[var(--text-secondary)]">ACTIVE SHAPE</h3>

                  <div className="flex flex-row gap-4">
                    {(['C', 'A', 'G', 'E', 'D'] as ShapeName[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setState(prev => ({ ...prev, shape: s }))}
                        className={`
                            w-32 h-32 flex items-center justify-center 
                            font-[family-name:var(--font-silkscreen)] text-8xl pb-4
                            border-4 shadow-[4px_4px_0_rgba(0,0,0,0.2)] transition-all
                            ${state.shape === s
                            ? 'bg-[var(--background)] text-[var(--foreground)] border-[var(--foreground)] scale-105 shadow-[6px_6px_0_rgba(0,0,0,0.3)]'
                            : 'bg-[#e2e8f0] text-[#94a3b8] border-[#cbd5e1] hover:scale-105 hover:bg-white hover:text-black hover:border-black'
                          }
                          `}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RetroWindow>

      </div>
    </main>
  );
}
