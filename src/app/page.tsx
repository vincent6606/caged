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
    customNotes: []
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
      root: chromaticIdx
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
      shape: newShape
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

  const getShapeBtnClass = (isActive: boolean) =>
    `w-12 h-12 flex items-center justify-center font-bold text-xl border-2 border-[var(--border-dark)] transition-all ${isActive
      ? 'bg-[#2563eb] text-white shadow-inner translate-y-[2px]'
      : 'bg-white hover:bg-slate-100 shadow-[2px_2px_0_black] hover:shadow-[1px_1px_0_black] hover:translate-y-[1px]'
    }`;

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
                      onClick={() => setState(prev => ({ ...prev, quality: q, patternMode: 'box' }))}
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
          <div className="flex-1 overflow-auto p-2 md:p-4 flex flex-col items-center gap-4 relative bg-dot-pattern h-full">

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
              {/* Fretboard Header */}
              <div className="h-6 bg-[var(--border-light)] border-b border-[var(--border-dark)] flex items-center px-2 text-[10px] font-mono text-[var(--text-secondary)] select-none">
                Interactive Fretboard Visualization
              </div>
              <div className="p-2 md:p-4 overflow-x-auto flex justify-start md:justify-center bg-slate-50">
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
            </div>

            {/* Shape Icons Bar (Bottom) */}
            <div className="w-full max-w-[98%] flex flex-col gap-2 mt-auto pb-4">
              <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] text-center">Active C.A.G.E.D Shape</label>
              <div className="flex justify-center items-center gap-2 md:gap-4 scale-90 md:scale-100 origin-bottom">

                {/* Previous Shape */}
                <button
                  onClick={() => {
                    const shapes = ['C', 'A', 'G', 'E', 'D'] as ShapeName[];
                    const currentIndex = shapes.indexOf(state.shape);
                    const prevIndex = (currentIndex - 1 + shapes.length) % shapes.length;
                    setState(prev => ({ ...prev, shape: shapes[prevIndex] }));
                  }}
                  className="retro-btn w-10 h-10 flex items-center justify-center font-bold text-xl bg-white active:translate-y-[2px]"
                >
                  &lt;
                </button>

                <div className="flex gap-1 md:gap-2">
                  {(['C', 'A', 'G', 'E', 'D'] as ShapeName[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setState(prev => ({ ...prev, shape: s }))}
                      className={getShapeBtnClass(state.shape === s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Next Shape */}
                <button
                  onClick={() => {
                    const shapes = ['C', 'A', 'G', 'E', 'D'] as ShapeName[];
                    const currentIndex = shapes.indexOf(state.shape);
                    const nextIndex = (currentIndex + 1) % shapes.length;
                    setState(prev => ({ ...prev, shape: shapes[nextIndex] }));
                  }}
                  className="retro-btn w-10 h-10 flex items-center justify-center font-bold text-xl bg-white active:translate-y-[2px]"
                >
                  &gt;
                </button>

              </div>
            </div>
          </div>
        </RetroWindow>

      </div>
    </main>
  );
}
