import React from 'react';
import { FretboardNote } from '@/lib/engine/types';

interface FretboardProps {
    notes: FretboardNote[];
    onNoteClick?: (stringIdx: number, fret: number) => void;
    onNoteDoubleClick?: (stringIdx: number, fret: number) => void;
    onNoteHover?: (stringIdx: number, fret: number) => void;
}

export function Fretboard({ notes, onNoteClick, onNoteDoubleClick, onNoteHover }: FretboardProps) {
    // Constants
    const S_H = 35;
    const F_W = 40; // Aggressively reduced to 40 to fit 24 frets
    const PAD_Y = 30;

    // Layout: [Labels] [Open Notes] [NUT] [Fret 1] ...
    const LBL_W = 20; // Ultra compact Labels
    const OPEN_W = 35; // Compact Open Area
    const NUT_W = 6;   // Thinner Nut

    const NUT_X = LBL_W + OPEN_W;
    const BOARD_START_X = NUT_X + NUT_W;

    const END_FRET = 24;
    // Total Width: Board Start + Frets + Padding
    const WIDTH = BOARD_START_X + (END_FRET * F_W) + 20;
    const HEIGHT = PAD_Y * 2 + 5 * S_H + 30;

    // Labels for Tuning
    // Reference: Top=High E, Bottom=Low E.
    // Our Logic: s=0 (Low E)..s=5 (High E).
    // So Visual Row 0 (Top) corresponds to Logic String 5.
    // Visual Row 5 (Bottom) corresponds to Logic String 0.
    const STRING_LABELS = ['E', 'B', 'G', 'D', 'A', 'E'];

    return (
        <div id="fretboard-container" className="overflow-x-auto pb-4 scrollbar-thin bg-white">
            <svg width={WIDTH} height={HEIGHT} className="select-none min-w-[1000px]">

                {/* 0. String Labels (Far Left) */}
                {STRING_LABELS.map((lbl, i) => {
                    // i=0 is Top.
                    const y = PAD_Y + i * S_H;
                    return (
                        <text key={`lbl-${i}`} x={6} y={y + 4} fontFamily="sans-serif" fontSize={11} fontWeight="bold" fill="#64748b">
                            {lbl}
                        </text>
                    );
                })}

                {/* 1. Nut (Thick Bar) */}
                <rect
                    x={NUT_X}
                    y={PAD_Y}
                    width={NUT_W}
                    height={5 * S_H}
                    fill="#1e293b"
                />

                {/* 2. Frets Lines (Fret 1 to End) */}
                {Array.from({ length: END_FRET }).map((_, i) => {
                    const fretNum = i + 1; // 1, 2, 3...
                    const x = BOARD_START_X + i * F_W + F_W; // Vertical line at the END of the fret box

                    return (
                        <g key={`fret-line-${fretNum}`}>
                            <line
                                x1={x}
                                y1={PAD_Y}
                                x2={x}
                                y2={PAD_Y + 5 * S_H}
                                stroke="#cbd5e1"
                                strokeWidth={2}
                            />

                            {/* Fret Markers (Dots) */}
                            {[3, 5, 7, 9, 15, 17, 19, 21].includes(fretNum) && (
                                <circle cx={BOARD_START_X + i * F_W + F_W / 2} cy={PAD_Y + 2.5 * S_H} r={5} fill="#f1f5f9" />
                            )}
                            {(fretNum === 12 || fretNum === 24) && (
                                <>
                                    <circle cx={BOARD_START_X + i * F_W + F_W / 2} cy={PAD_Y + 1.5 * S_H} r={5} fill="#f1f5f9" />
                                    <circle cx={BOARD_START_X + i * F_W + F_W / 2} cy={PAD_Y + 3.5 * S_H} r={5} fill="#f1f5f9" />
                                </>
                            )}

                            {/* Fret Numbers */}
                            <text
                                x={BOARD_START_X + i * F_W + F_W / 2}
                                y={PAD_Y + 5 * S_H + 20}
                                textAnchor="middle"
                                fill="#94a3b8"
                                fontSize={10}
                                fontFamily="sans-serif"
                                fontWeight="bold"
                            >
                                {fretNum}
                            </text>
                        </g>
                    );
                })}

                {/* 0 Number for Open Section */}
                <text x={LBL_W + OPEN_W / 2} y={PAD_Y + 5 * S_H + 20} textAnchor="middle" fill="#94a3b8" fontSize={10} fontFamily="sans-serif" fontWeight="bold">0</text>


                {/* 3. Strings & Hitboxes */}
                {Array.from({ length: 6 }).map((_, s) => {
                    const y = PAD_Y + (5 - s) * S_H;
                    const strokeW = s === 0 ? 3 : s < 3 ? 2 : 1;

                    return (
                        <g key={`string-${s}`}>
                            {/* String Line */}
                            <line x1={LBL_W} y1={y} x2={WIDTH - 10} y2={y} stroke="#334155" strokeWidth={strokeW} />

                            {/* Hitbox Fret 0 */}
                            <rect
                                key={`hitbox-${s}-0`}
                                x={LBL_W}
                                y={y - 15}
                                width={OPEN_W}
                                height={30}
                                fill="transparent"
                                className="cursor-pointer hover:fill-blue-500/10"
                                onClick={() => onNoteClick?.(s, 0)}
                                onDoubleClick={() => onNoteDoubleClick?.(s, 0)}
                                onMouseEnter={() => onNoteHover?.(s, 0)}
                            />

                            {/* Hitboxes Fret 1+ */}
                            {Array.from({ length: END_FRET }).map((_, i) => {
                                const f = i + 1;
                                return (
                                    <rect
                                        key={`hitbox-${s}-${f}`}
                                        x={BOARD_START_X + i * F_W}
                                        y={y - 15}
                                        width={F_W}
                                        height={30}
                                        fill="transparent"
                                        className="cursor-pointer hover:fill-blue-500/10"
                                        onClick={() => onNoteClick?.(s, f)}
                                        // double click logic preserved
                                        onDoubleClick={() => onNoteDoubleClick?.(s, f)}
                                        onMouseEnter={() => onNoteHover?.(s, f)}
                                    />
                                );
                            })}
                        </g>
                    )
                })}

                {/* 4. Active Notes */}
                {notes.map((n, i) => {
                    let cx;
                    if (n.fret === 0) {
                        cx = LBL_W + OPEN_W / 2;
                    } else {
                        cx = BOARD_START_X + (n.fret - 1) * F_W + F_W / 2;
                    }

                    const cy = PAD_Y + (5 - n.stringIdx) * S_H;

                    let color = '#94a3b8'; // Default grey
                    if (n.interval === 0) color = '#ef4444';
                    else if (n.interval === 7) color = '#3b82f6';
                    else if ([3, 4].includes(n.interval)) color = '#fbbf24';
                    else if ([10, 11].includes(n.interval)) color = '#10b981';

                    return (
                        <g key={`note-${i}`} style={{ pointerEvents: 'none' }}>
                            <circle cx={cx} cy={cy} r={18} fill={color} stroke="white" strokeWidth={2} />
                            <text
                                x={cx} y={cy + 5}
                                textAnchor="middle"
                                fill={['R', '5'].includes(n.label) ? 'white' : 'black'}
                                fontSize={14}
                                fontWeight={900}
                                fontFamily="sans-serif"
                            >
                                {n.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
