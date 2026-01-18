import React from 'react';
import { NOTE_NAMES } from '@/lib/engine/constants';

interface InfoPanelProps {
    root: number;
    quality: string;
    bpm: number;
    description?: string;
}

export function InfoPanel({ root, quality, bpm, description = "Visualizing connection points across the fretboard.", children }: InfoPanelProps & { children: React.ReactNode }) {
    const rootName = NOTE_NAMES[root];

    return (
        <div className="flex items-center gap-4 py-2 px-2 h-full w-full bg-slate-50">
            {/* Left: Large Icon */}
            <div className="w-12 h-12 bg-white border border-gray-500 shadow-sm flex items-center justify-center shrink-0">
                <img src="/icons/directory_closed-4.png" alt="Task" className="w-8 h-8 pixelated" />
            </div>

            {/* Middle: Text Info */}
            <div className="flex flex-col justify-center items-center flex-1 text-center min-w-[300px]">
                <div className="text-[10px] uppercase font-bold text-[#64748b] mb-1">CURRENT TASK</div>
                <div className="text-5xl font-black text-black leading-none tracking-tight drop-shadow-sm">
                    {rootName} {quality}
                </div>
            </div>

            {/* Right: Controls (Children) */}
            <div className="flex-1 flex justify-end">
                {children}
            </div>
        </div>
    );
}
