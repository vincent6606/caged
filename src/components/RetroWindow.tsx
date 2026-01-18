import React from 'react';

interface RetroWindowProps {
    title: string;
    children: React.ReactNode;
    className?: string;
    onClose?: () => void;
    icon?: string;
}

export function RetroWindow({ title, children, className = '', onClose, icon = 'G' }: RetroWindowProps) {
    return (
        <div className={`retro-window flex flex-col ${className} p-[3px] bg-[#c0c0c0] shadow-[1px_1px_0_black]`}>
            {/* Outer Bevel: Light Top/Left, Dark Bottom/Right */}
            <div className="flex flex-col h-full border-t border-l border-white border-b border-r border-[#848484] shadow-[1px_1px_0_0_black_inset,-1px_-1px_0_0_#dfdfdf_inset]">

                {/* Title Bar - Gradient Blue as requested */}
                <div className="h-[24px] bg-gradient-to-r from-[#000080] to-[#1084d0] flex items-center justify-between px-1 pl-2 pr-2 select-none m-[2px] mb-0">
                    <div
                        className="font-bold text-xs flex items-center gap-2 font-[family-name:var(--font-silkscreen)]"
                        style={{ color: '#FFFFFF', textShadow: 'none' }}
                    >
                        {/* Icon */}
                        <div className="w-4 h-4 bg-transparent text-white flex items-center justify-center font-bold text-[9px]">
                            {icon === 'G' ? <div className="w-3 h-3 bg-white border border-gray-500"></div> : icon}
                        </div>
                        <span className="mt-[1px] tracking-wide font-sans font-bold">{title}</span>
                    </div>
                    <div className="flex gap-[2px]">
                        {/* Minimize */}
                        <button className="w-[16px] h-[14px] bg-[#c0c0c0] flex items-center justify-center border-t border-l border-white border-b border-r border-black shadow-[1px_1px_0_0_black_inset] active:border-t-black active:border-l-black active:border-b-white active:border-r-white p-0">
                            <div className="w-[6px] h-[2px] bg-black self-end mb-[2px]"></div>
                        </button>
                        {/* Maximize */}
                        <button className="w-[16px] h-[14px] bg-[#c0c0c0] flex items-center justify-center border-t border-l border-white border-b border-r border-black shadow-[1px_1px_0_0_black_inset] active:border-t-black active:border-l-black active:border-b-white active:border-r-white p-0">
                            <div className="w-[9px] h-[9px] border-t border-black border-l border-black border-r border-black border-b border-black">
                                <div className="w-full h-[2px] border-t border-black mt-[1px]"></div>
                            </div>
                        </button>
                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="w-[16px] h-[14px] bg-[#c0c0c0] flex items-center justify-center border-t border-l border-white border-b border-r border-black shadow-[1px_1px_0_0_black_inset] active:border-t-black active:border-l-black active:border-b-white active:border-r-white ml-[2px] p-0"
                        >
                            <span className="text-black font-bold text-[10px] leading-none mb-[2px] ml-[1px]">×</span>
                        </button>
                    </div>
                </div>

                {/* Menu Bar (Browser style) */}
                <div className="flex gap-4 px-2 py-1 text-[11px] font-sans text-black m-[2px] mt-0">
                    <span className="underline cursor-pointer">F</span>ile
                    <span className="underline cursor-pointer">E</span>dit
                    <span className="underline cursor-pointer">V</span>iew
                </div>

                {/* Content Frame */}
                <div className="flex-1 bg-white border-t border-l border-[#848484] border-b border-r border-white shadow-[1px_1px_0_0_white_inset] m-[2px] relative overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    );
}
