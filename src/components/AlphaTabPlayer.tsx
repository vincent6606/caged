import React, { useEffect, useRef, useState } from 'react';
// import { AlphaTabApi } from '@coderline/alphatab'; // Typings only if possible, or direct import
// Since AlphaTab might not have perfect TS exports in all versions, we might use 'any' for the API instance or import specific types.
// We will import the CSS in layout or globals, or assume basic styling.

interface AlphaTabPlayerProps {
    fileData: ArrayBuffer | null;
    onNotesDecoded: (notes: any[]) => void; // TODO: Type this properly
    onPlayerReady: (api: any) => void;
    onKeyDetected?: (root: number, quality: string) => void;
}

export const AlphaTabPlayer: React.FC<AlphaTabPlayerProps> = ({ fileData, onNotesDecoded, onPlayerReady, onKeyDetected }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<any>(null); // AlphaTabApi

    const [isPlaying, setIsPlaying] = useState(false);
    const [tracks, setTracks] = useState<any[]>([]);
    const [activeTrackIndex, setActiveTrackIndex] = useState(0);
    const [startBar, setStartBar] = useState<string | number>(1);
    const [endBar, setEndBar] = useState<string | number>(10); // Default placeholder
    const [currentBar, setCurrentBar] = useState(1);
    const [totalBars, setTotalBars] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;

        // Dynamic import to ensure client-side execution
        import('@coderline/alphatab').then((alphaTab) => {
            const settings: any = {
                file: null, // explicit null to avoid default fallback
                player: {
                    enablePlayer: true,
                    soundFont: "https://cdn.jsdelivr.net/npm/@coderline/alphatab@latest/dist/soundfont/sonivox.sf2",
                    scrollElement: containerRef.current
                },
                display: {
                    layoutMode: alphaTab.LayoutMode.Horizontal,
                    staveProfile: alphaTab.StaveProfile.ScoreTab
                }
            };

            const api = new alphaTab.AlphaTabApi(containerRef.current!, settings);
            apiRef.current = api;
            onPlayerReady(api);

            // Listeners
            api.scoreLoaded.on((score: any) => {
                console.log("AlphaTab: Score Loaded", score);
                setTracks(score.tracks);
                const total = score.masterBars.length;
                console.log(`AlphaTab: Found ${score.tracks.length} tracks and ${total} masterBars`);
                setTotalBars(total);

                // Reset range to full song on load
                setStartBar(1);
                setEndBar(total);

                setActiveTrackIndex(0); // Reset to first track on load

                extractNotes(score.tracks[0], 1, total);
                detectKey(score);
            });

            api.playerReady.on(() => {
                console.log("AlphaTab Player Ready");
            });

            // Load initial file if present
            if (fileData) {
                console.log("AlphaTab: Loading initial file data...");
                try {
                    api.load(new Uint8Array(fileData));
                } catch (e) {
                    console.error("AlphaTab: Initial load failed", e);
                }
            }

            api.playerStateChanged.on((args: any) => {
                setIsPlaying(args.state === 1);
            });

            // Update bar number on beat played
            (api as any).beatPlayed.on((beat: any) => {
                // beat.voice.bar.index is 0-based
                setCurrentBar(beat.voice.bar.index + 1);
            });

            // Cleanup
            return () => {
                api.destroy();
            };
        });
    }, []);

    const extractNotes = (track: any, start: number, end: number) => {
        try {
            console.log(`AlphaTab: Extracting notes for track ${track?.name} (Index: ${track?.index}) in range ${start}-${end}`);
            if (!track || !track.staves) {
                console.warn("AlphaTab: Track or staves missing", track);
                return;
            }

            const noteSet = new Set<string>();
            const extractedNotes: { stringIdx: number; fret: number }[] = [];

            track.staves.forEach((stave: any, staveIdx: number) => {
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
                                // 6-string guitar assumption for visualization
                                // Corrected: alphaTab 'string' seems to be 1=Low, 6=High based on user feedback + debug.
                                // App expects 0=Low, 5=High.
                                const stringIdx = note.string - 1;
                                const key = `${stringIdx}-${note.fret}`;

                                // Debug log for first few notes
                                if (extractedNotes.length < 5) {
                                    console.log(`Found note: string=${note.string} fret=${note.fret} -> idx=${stringIdx}`);
                                }

                                if (!noteSet.has(key)) {
                                    noteSet.add(key);
                                    extractedNotes.push({ stringIdx, fret: note.fret });
                                }
                            });
                        });
                    });
                });
            });
            console.log(`AlphaTab: Extracted ${extractedNotes.length} unique note positions.`);
            onNotesDecoded(extractedNotes);
        } catch (err) {
            console.error("Error extracting tab notes:", err);
        }
    };

    const detectKey = (score: any) => {
        if (score.masterBars && score.masterBars.length > 0) {
            const keySig = score.masterBars[0].keySignature;
            let root = (keySig * 7) % 12;
            if (root < 0) root += 12;

            if (onKeyDetected) {
                onKeyDetected(root, 'Maj7');
            }
        }
    };

    // Load file when data changes
    useEffect(() => {
        if (apiRef.current && fileData) {
            console.log("AlphaTab: Loading new file data...");
            try {
                // Ensure data is Uint8Array for AlphaTab
                const data = new Uint8Array(fileData);
                apiRef.current.load(data);
            } catch (err) {
                console.error("AlphaTab: Load failed", err);
            }
        }
    }, [fileData]);

    const togglePlay = () => {
        if (apiRef.current) {
            apiRef.current.playPause();
        }
    };

    const handleTrackChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newIndex = parseInt(e.target.value);
        setActiveTrackIndex(newIndex);
        if (apiRef.current && tracks[newIndex]) {
            apiRef.current.renderTracks([tracks[newIndex]]);

            // Safe parse of range
            const s = typeof startBar === 'number' ? startBar : 1;
            const e = typeof endBar === 'number' ? endBar : totalBars;

            extractNotes(tracks[newIndex], s, e);
        }
        // Also reset bar?
        setCurrentBar(1);
    };

    const validateAndSetRange = (isStart: boolean, value: string | number) => {
        let val = parseInt(value.toString());
        if (isNaN(val)) val = isStart ? 1 : totalBars;

        // Clamp
        if (val < 1) val = 1;
        if (val > totalBars) val = totalBars;

        // Extra Logic: Start must be <= End
        let newStart = isStart ? val : (typeof startBar === 'number' ? startBar : 1);
        let newEnd = !isStart ? val : (typeof endBar === 'number' ? endBar : totalBars);

        if (newStart > newEnd) {
            if (isStart) newEnd = newStart;
            else newStart = newEnd;
        }

        setStartBar(newStart);
        setEndBar(newEnd);

        if (apiRef.current && tracks[activeTrackIndex]) {
            extractNotes(tracks[activeTrackIndex], newStart, newEnd);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Toolbar */}
            <div className="h-10 border-b border-[var(--border-dark)] flex items-center px-2 gap-2 bg-[#f0f0f0] justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={togglePlay} className="retro-btn px-2 py-0.5 text-xs w-16">
                        {isPlaying ? "HALT" : "PLAY"}
                    </button>

                    <div className="h-6 w-px bg-gray-400 mx-1"></div>

                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-gray-500 uppercase leading-none mb-1">Track</label>
                        <select
                            value={activeTrackIndex}
                            onChange={handleTrackChange}
                            className="bg-white border-2 border-gray-400 text-sm w-32 md:w-40 h-8 px-1"
                            disabled={tracks.length === 0}
                        >
                            {tracks.map((t, i) => (
                                <option key={i} value={i}>{t.name || `Track ${i + 1}`}</option>
                            ))}
                        </select>
                    </div>

                    <div className="h-8 w-px bg-gray-300 mx-2"></div>

                    {/* Bar Range Selector */}
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-gray-500 uppercase leading-none mb-1">Range</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={startBar}
                                onChange={(e) => setStartBar(e.target.value)}
                                onBlur={(e) => validateAndSetRange(true, e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && validateAndSetRange(true, (e.target as any).value)}
                                className="w-20 h-8 text-sm border-2 border-gray-400 text-center"
                            />
                            <span className="text-sm font-bold">-</span>
                            <input
                                type="text"
                                value={endBar}
                                onChange={(e) => setEndBar(e.target.value)}
                                onBlur={(e) => validateAndSetRange(false, e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && validateAndSetRange(false, (e.target as any).value)}
                                className="w-20 h-8 text-sm border-2 border-gray-400 text-center"
                            />
                            <button
                                onClick={() => validateAndSetRange(true, startBar)}
                                className="retro-btn px-3 h-8 text-xs font-bold"
                            >
                                GO
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-black text-[#00ff00] font-mono text-xs px-2 py-1 rounded border-2 border-gray-600 shadow-inner">
                        BAR: {currentBar.toString().padStart(3, '0')} / {totalBars.toString().padStart(3, '0')}
                    </div>
                </div>
            </div>

            {/* AlphaTab Container */}
            <div ref={containerRef} className="flex-1 overflow-auto alphaTab-wrapper relative" />
        </div>
    );
};
