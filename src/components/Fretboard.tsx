import React, { useState, useEffect } from 'react';
import { FretboardNote } from '@/lib/engine/types';
import { NOTE_NAMES } from '@/lib/engine/constants';

interface FretboardProps {
    notes: FretboardNote[];
    tuning?: number[];
    onTuningChange?: (stringIdx: number, newPitch: number) => void;
    onNoteClick?: (stringIdx: number, fret: number) => void;
    onNoteDoubleClick?: (stringIdx: number, fret: number) => void;
    onNoteRightClick?: (stringIdx: number, fret: number, e: React.MouseEvent) => void;
    onNoteHover?: (stringIdx: number, fret: number) => void;
}

export function Fretboard({ notes, tuning = [4, 9, 14, 19, 23, 28], onTuningChange, onNoteClick, onNoteDoubleClick, onNoteRightClick, onNoteHover }: FretboardProps) {
    // Constants
    const S_H = 35;
    const F_W = 40; // Aggressively reduced to 40 to fit 24 frets
    const PAD_Y = 30;

    // Layout: [Labels] [Open Notes] [NUT] [Fret 1] ...
    const LBL_W = 40; // Increased for Input
    const OPEN_W = 35; // Compact Open Area
    const NUT_W = 6;   // Thinner Nut

    const NUT_X = LBL_W + OPEN_W;
    const BOARD_START_X = NUT_X + NUT_W;

    const END_FRET = 24;
    // Total Width: Board Start + Frets + Padding
    const WIDTH = BOARD_START_X + (END_FRET * F_W) + 20;
    const HEIGHT = PAD_Y * 2 + 5 * S_H + 30;

    // Helper to handle input change
    const handleInputChange = (stringIdx: number, val: string) => {
        const cleanVal = val.toUpperCase().trim();
        const noteIdx = NOTE_NAMES.indexOf(cleanVal as any);

        if (noteIdx !== -1 && onTuningChange) {
            // Logic to keep the octave roughly same? 
            // Current pitch: tuning[stringIdx]. 
            // We want new pitch P such that P % 12 == noteIdx, and P is close to current.
            // Simplified: Just keep current octave, unless wrapping?
            // Actually, let's just find the closest P.
            const currentPitch = tuning[stringIdx];
            const currentNoteIdx = currentPitch % 12;

            let diff = noteIdx - currentNoteIdx;
            // Minimal movement logic (e.g. going G -> A is +2, G -> F is -2)
            if (diff > 6) diff -= 12;
            if (diff < -6) diff += 12;

            onTuningChange(stringIdx, currentPitch + diff);
        }
    };

    return (
        <div id="fretboard-container" className="overflow-x-auto pb-4 scrollbar-thin bg-white">
            <svg width={WIDTH} height={HEIGHT} className="select-none min-w-[1000px]">

                {/* 0. Tuning Inputs (Far Left) */}
                {Array.from({ length: 6 }).map((_, s) => {
                    // s=0 is Logic Low E (Bottom of visual). But SVG y goes Top->Down.
                    // Visual Row 0 = Top = String 5.
                    // Visual Row 5 = Bottom = String 0.
                    // Loop is s=0..5. Let's map visual row i to stringIdx.
                    // stringIdx = 5 - i.
                    const i = s;
                    const stringIdx = 5 - i; // 5, 4, 3, 2, 1, 0

                    const y = PAD_Y + i * S_H;
                    const pitch = tuning[stringIdx];
                    const noteName = NOTE_NAMES[pitch % 12];

                    return (
                        <foreignObject key={`tuning-input-${stringIdx}`} x={0} y={y - 12} width={36} height={24}>
                            <input
                                className="w-full h-full text-center text-[10px] font-bold font-mono border border-gray-300 bg-gray-50 focus:border-blue-500 outline-none uppercase text-gray-700"
                                defaultValue={noteName}
                                key={noteName} // Force re-render on external change
                                onBlur={(e) => handleInputChange(stringIdx, e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.currentTarget.blur();
                                    }
                                }}
                            />
                        </foreignObject>
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
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    onNoteRightClick?.(s, 0, e);
                                }}
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
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            onNoteRightClick?.(s, f, e);
                                        }}
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
