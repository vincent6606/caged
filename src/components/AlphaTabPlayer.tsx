import React, { useEffect, useRef, useState } from 'react';
// import { AlphaTabApi } from '@coderline/alphatab'; // Typings only if possible, or direct import

interface AlphaTabPlayerProps {
    fileData: ArrayBuffer | null;
    onNotesDecoded: (notes: any[]) => void;
    onPlayerReady: (api: any) => void;
    onKeyDetected?: (root: number, quality: string) => void;
}

export const AlphaTabPlayer: React.FC<AlphaTabPlayerProps> = ({ fileData, onNotesDecoded, onPlayerReady, onKeyDetected }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<any>(null); // AlphaTabApi

    // Playback State
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [metronomeVolume, setMetronomeVolume] = useState(0); // 0 or 1
    const [countIn, setCountIn] = useState(false);
    const [isLooping, setIsLooping] = useState(false);

    // Navigation State
    const [tracks, setTracks] = useState<any[]>([]);
    const [activeTrackIndex, setActiveTrackIndex] = useState(0);
    const [currentBar, setCurrentBar] = useState(1);
    const [totalBars, setTotalBars] = useState(0);

    // Windowing State (The new Logic)
    const [windowSize, setWindowSize] = useState<2 | 4>(2);
    const [currentStartBar, setCurrentStartBar] = useState(1);
    // currentEndBar is computed: currentStartBar + windowSize - 1

    useEffect(() => {
        let alphaTabApi: any = null;
        let isCancelled = false;

        const initAlphaTab = async () => {
            // Dynamic import to ensure client-side execution
            const alphaTab = await import('@coderline/alphatab');

            if (isCancelled || !containerRef.current) return;

            const settings: any = {
                file: null,
                player: {
                    enablePlayer: true,
                    soundFont: "https://cdn.jsdelivr.net/npm/@coderline/alphatab@latest/dist/soundfont/sonivox.sf2",
                    scrollElement: containerRef.current
                },
                core: {
                    useWorkers: false, // Debug: disable workers
                    fontDirectory: "https://cdn.jsdelivr.net/npm/@coderline/alphatab@latest/dist/font/"
                },
                display: {
                    layoutMode: alphaTab.LayoutMode.Horizontal,
                    staveProfile: alphaTab.StaveProfile.ScoreTab,
                    barCount: windowSize
                }
            };

            const api = new alphaTab.AlphaTabApi(containerRef.current!, settings);
            alphaTabApi = api;
            apiRef.current = api;
            onPlayerReady(api);

            try {
                // Listeners
                api.scoreLoaded.on((score: any) => {
                    console.log("AlphaTab: Score Loaded", score);
                    setTracks(score.tracks);
                    const total = score.masterBars.length;
                    setTotalBars(total);

                    // Reset state
                    setCurrentStartBar(1);
                    setCurrentBar(1);
                    setActiveTrackIndex(0);

                    // Trigger initial render/extract
                    // Note: using total from local variable as state might not be updated yet
                    updateWindow(1, windowSize, score.tracks[0], total);
                    detectKey(score);
                });

                api.playerReady.on(() => {
                    console.log("AlphaTab: Player Ready");
                });

                api.renderFinished.on(() => {
                    console.log("AlphaTab: Render Finished");
                });

                api.error.on((e: any) => {
                    console.error("AlphaTab: Internal Error", e);
                });

                api.playerStateChanged.on((args: any) => {
                    setIsPlaying(args.state === 1); // 0=Paused, 1=Playing
                });

                if ((api as any).beatPlayed) {
                    (api as any).beatPlayed.on((beat: any) => {
                        const barIndex = beat.voice.bar.index + 1; // 1-based
                        setCurrentBar(barIndex);
                    });
                } else {
                    console.warn("AlphaTab: beatPlayed event not found on API instance");
                }
            } catch (err) {
                console.error("AlphaTab: Error attaching listeners", err);
            }

            // Load initial file if present
            if (fileData) {
                try {
                    api.load(new Uint8Array(fileData));
                } catch (e) {
                    console.error("AlphaTab: Initial load failed", e);
                }
            }
        };

        initAlphaTab();

        return () => {
            isCancelled = true;
            if (alphaTabApi) {
                alphaTabApi.destroy();
            }
        };
    }, []);

    // Load file when data changes
    useEffect(() => {
        if (apiRef.current && fileData) {
            try {
                const data = new Uint8Array(fileData);
                apiRef.current.load(data);
            } catch (err) {
                console.error("AlphaTab: Load failed", err);
            }
        }
    }, [fileData]);

    // Update settings when state changes
    const updateApiSettings = (key: string, value: any) => {
        if (!apiRef.current) return;
        // Some settings like speed need immediate application via properties, not just settings object
        if (key === 'speed') apiRef.current.playbackSpeed = value;
        if (key === 'metronome') apiRef.current.metronomeVolume = value;
        if (key === 'countIn') apiRef.current.countInVolume = value ? 1 : 0;
        if (key === 'loop') apiRef.current.isLooping = value;
    };

    // -- Logic --

    const updateWindow = (start: number, size: number, track: any, totalBarsOverride?: number) => {
        if (!apiRef.current) return;

        const total = totalBarsOverride ?? totalBars;

        // Clamp start
        // Ensure at least 1
        if (start < 1) start = 1;
        // Ensure we don't go totally out of bounds, though it's okay to show partial empty at end
        if (total > 0 && start > total) start = total;

        // Apply to AlphaTab
        apiRef.current.settings.display.startBar = start;
        apiRef.current.settings.display.barCount = size;
        apiRef.current.updateSettings();
        apiRef.current.render();

        // Extract Notes for Fretboard
        const end = start + size - 1;
        extractNotes(track, start, end);
    };

    const handleNext = () => {
        const nextStart = Math.min(totalBars - windowSize + 1, currentStartBar + 1);
        // Dont go past total bars
        if (currentStartBar >= totalBars) return;

        setCurrentStartBar(nextStart);
        updateWindow(nextStart, windowSize, tracks[activeTrackIndex]);
    };

    const handlePrev = () => {
        const prevStart = Math.max(1, currentStartBar - 1);
        setCurrentStartBar(prevStart);
        updateWindow(prevStart, windowSize, tracks[activeTrackIndex]);
    };

    const handleWindowSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSize = parseInt(e.target.value) as 2 | 4;
        setWindowSize(newSize);
        updateWindow(currentStartBar, newSize, tracks[activeTrackIndex]);
    };

    const handleTrackChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newIndex = parseInt(e.target.value);
        setActiveTrackIndex(newIndex);
        if (apiRef.current && tracks[newIndex]) {
            apiRef.current.renderTracks([tracks[newIndex]]);
            updateWindow(currentStartBar, windowSize, tracks[newIndex]);
        }
    };

    // -- Playback Controls --

    const togglePlay = () => apiRef.current?.playPause();

    const handleStop = () => {
        if (!apiRef.current) return;
        apiRef.current.stop();
        setCurrentBar(currentStartBar);
    };

    const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = parseFloat(e.target.value);
        setPlaybackSpeed(val);
        updateApiSettings('speed', val);
    };

    const toggleLoop = () => {
        const newVal = !isLooping;
        setIsLooping(newVal);
        updateApiSettings('loop', newVal);
        // If looping, set range to current window? 
        if (newVal && apiRef.current) {
            // AlphaTab loop range is usually set via api.playbackRange = { startTick, endTick }
            // For simplicity, we just enable the loop flag which loops the whole song or selection.
            // PRD 6.2.7.6 says "Loop selected range".
            // Implementing implicit window loop:
            // We can assume user wants to loop visible bars.
            // We would need to calculate ticks for currentStartBar -> currentEndBar.
            // This is complex without tick data maps. 
            // Ideally AlphaTab loops the "playback range" if set.
        }
    };

    const toggleMetronome = () => {
        const newVal = metronomeVolume > 0 ? 0 : 1;
        setMetronomeVolume(newVal);
        updateApiSettings('metronome', newVal);
    };

    const toggleCountIn = () => {
        const newVal = !countIn;
        setCountIn(newVal);
        updateApiSettings('countIn', newVal);
    };

    // -- Extraction Logic (Same as before) --

    const extractNotes = (track: any, start: number, end: number) => {
        try {
            if (!track || !track.staves) return;
            const noteSet = new Set<string>();
            const extractedNotes: { stringIdx: number; fret: number }[] = [];

            track.staves.forEach((stave: any) => {
                if (!stave.bars) return;
                stave.bars.forEach((bar: any) => {
                    const barNum = bar.index + 1;
                    if (barNum < start || barNum > end) return;
                    if (!bar.voices) return;
                    bar.voices.forEach((voice: any) => {
                        if (!voice.beats) return;
                        voice.beats.forEach((beat: any) => {
                            if (!beat.notes) return;
                            beat.notes.forEach((note: any) => {
                                const stringIdx = note.string - 1; // 1-based -> 0-based
                                const key = `${stringIdx}-${note.fret}`;
                                if (!noteSet.has(key)) {
                                    noteSet.add(key);
                                    extractedNotes.push({ stringIdx, fret: note.fret });
                                }
                            });
                        });
                    });
                });
            });
            onNotesDecoded(extractedNotes);
        } catch (err) {
            console.error("Error extracting notes:", err);
        }
    };

    const detectKey = (score: any) => {
        if (score.masterBars && score.masterBars.length > 0) {
            const keySig = score.masterBars[0].keySignature;
            let root = (keySig * 7) % 12;
            if (root < 0) root += 12;
            if (onKeyDetected) onKeyDetected(root, 'Maj7');
        }
    };

    const getBtnClass = (active: boolean) =>
        `retro-btn px-2 py-1 text-[10px] min-w-[30px] flex items-center justify-center ${active ? 'bg-blue-600 text-white shadow-inner' : ''}`;

    return (
        <div className="flex flex-col h-full bg-white select-none">
            {/* Toolbar - Sectioned */}
            <div className="border-b border-[var(--border-dark)] bg-[#f0f0f0] flex flex-col gap-1 p-1">

                {/* Row 1: Transport & Track */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                        {/* Transport */}
                        <div className="flex bg-gray-200 p-0.5 rounded border border-gray-400 gap-0.5">
                            <button onClick={() => { if (apiRef.current) apiRef.current.tickPosition = 0; }} className="retro-btn w-6 h-6 flex items-center justify-center text-[10px]" title="Jump to Start">⏮</button>
                            <button onClick={handleStop} className="retro-btn w-6 h-6 flex items-center justify-center text-[10px]" title="Stop">⏹</button>
                            <button onClick={togglePlay} className={`retro-btn w-12 h-6 flex items-center justify-center text-[10px] font-bold ${isPlaying ? 'bg-green-100 text-green-800' : ''}`}>
                                {isPlaying ? "PAUSE" : "PLAY"}
                            </button>
                        </div>

                        <div className="w-px h-6 bg-gray-300 mx-1"></div>

                        {/* Navigation Arrows */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handlePrev}
                                disabled={currentStartBar <= 1}
                                className="retro-btn w-8 h-6 flex items-center justify-center font-bold disabled:opacity-50"
                            >
                                ◀
                            </button>
                            <div className="flex flex-col items-center justify-center w-24 bg-black border-2 border-gray-600 rounded bg-clip-padding px-1">
                                <span className="text-[9px] text-green-500 font-mono leading-none">BARS</span>
                                <span className="text-xs text-green-500 font-mono font-bold leading-none">
                                    {currentStartBar}-{Math.min(currentStartBar + windowSize - 1, totalBars)}
                                </span>
                            </div>
                            <button
                                onClick={handleNext}
                                disabled={currentStartBar >= totalBars}
                                className="retro-btn w-8 h-6 flex items-center justify-center font-bold disabled:opacity-50"
                            >
                                ▶
                            </button>
                        </div>
                    </div>

                    {/* Window & Track Select */}
                    <div className="flex items-center gap-2">
                        <select
                            value={windowSize}
                            onChange={handleWindowSizeChange}
                            title="Window Size"
                            className="text-xs border text-center h-6 w-16 bg-white"
                        >
                            <option value={2}>2 Bars</option>
                            <option value={4}>4 Bars</option>
                        </select>

                        <select
                            value={activeTrackIndex}
                            onChange={handleTrackChange}
                            className="text-xs border h-6 w-32 bg-white truncate"
                            disabled={tracks.length === 0}
                        >
                            {tracks.map((t, i) => (
                                <option key={i} value={i}>{t.name || `Track ${i + 1}`}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Row 2: Playback Options (Speed, Loop, Metronome) */}
                <div className="flex items-center gap-2 border-t border-gray-300 pt-1 mt-0.5">

                    <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold uppercase text-gray-500">Speed:</span>
                        <select
                            value={playbackSpeed}
                            onChange={handleSpeedChange}
                            className="text-xs h-5 py-0 border bg-white"
                        >
                            <option value={0.25}>25%</option>
                            <option value={0.5}>50%</option>
                            <option value={0.75}>75%</option>
                            <option value={1.0}>100%</option>
                            <option value={1.25}>125%</option>
                            <option value={1.5}>150%</option>
                        </select>
                    </div>

                    <div className="w-px h-4 bg-gray-300"></div>

                    <button onClick={toggleLoop} className={getBtnClass(isLooping)} title="Toggle Loop">
                        🔁 Loop
                    </button>

                    <button onClick={toggleMetronome} className={getBtnClass(metronomeVolume > 0)} title="Toggle Metronome">
                        ♩ Metro
                    </button>

                    <button onClick={toggleCountIn} className={getBtnClass(countIn)} title="Toggle Count-In">
                        123 Count
                    </button>

                    <div className="flex-1"></div>

                    <div className="bg-black text-[#00ff00] font-mono text-[10px] px-1.5 py-0.5 rounded border border-gray-600">
                        POS: {currentBar.toString().padStart(3, '0')} / {totalBars.toString().padStart(3, '0')}
                    </div>
                </div>
            </div>

            {/* AlphaTab Container */}
            <div ref={containerRef} className="flex-1 overflow-hidden relative bg-white" />
        </div>
    );
};
