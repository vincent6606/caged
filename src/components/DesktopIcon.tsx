import React from 'react';

interface DesktopIconProps {
    label: string;
    iconSrc: string; // Path to image
    onClick: () => void;
    top?: number;
    left?: number;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({ label, iconSrc, onClick, top, left }) => {
    return (
        <div
            onClick={onClick}
            className="retro-icon absolute flex flex-col items-center gap-1 cursor-pointer w-28 text-center group z-50"
            style={{ top, left }}
        >
            <img
                src={iconSrc}
                alt={label}
                className="w-10 h-10 pixelated group-active:translate-y-px"
            />
            <span className="bg-transparent px-1 border border-dotted border-white/0 group-hover:border-white/50 text-white text-shadow-sm text-base font-bold leading-tight">
                {label}
            </span>
        </div>
    );
};
