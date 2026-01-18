'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

interface YouTubePlayerProps {
    videoId: string;
    className?: string;
    onReady?: () => void;
}

export interface YouTubePlayerRef {
    play: () => void;
    pause: () => void;
    seekTo: (seconds: number) => void;
    setVolume: (vol: number) => void;
    setPlaybackRate: (rate: number) => void;
    getCurrentTime: () => number;
    getDuration: () => number;
}

export const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(({ videoId, className, onReady }, ref) => {
    const playerRef = useRef<any>(null);
    const containerId = useRef(`yt-player-${Math.random().toString(36).substr(2, 9)}`);

    useImperativeHandle(ref, () => ({
        play: () => playerRef.current?.playVideo(),
        pause: () => playerRef.current?.pauseVideo(),
        seekTo: (s) => playerRef.current?.seekTo(s, true),
        setVolume: (v) => playerRef.current?.setVolume(v),
        setPlaybackRate: (r) => playerRef.current?.setPlaybackRate(r),
        getCurrentTime: () => playerRef.current?.getCurrentTime() || 0,
        getDuration: () => playerRef.current?.getDuration() || 0,
    }));

    useEffect(() => {
        // Load API
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        const initPlayer = () => {
            // @ts-ignore
            playerRef.current = new window.YT.Player(containerId.current, {
                videoId: videoId,
                playerVars: {
                    'playsinline': 1,
                    'controls': 1, // Show native controls for fallback
                    'rel': 0,
                    'modestbranding': 1
                },
                events: {
                    'onReady': () => {
                        onReady?.();
                    }
                }
            });
        };

        if (window.YT && window.YT.Player) {
            initPlayer();
        } else {
            window.onYouTubeIframeAPIReady = () => {
                initPlayer();
            };
        }

        return () => {
            if (playerRef.current) {
                // playerRef.current.destroy(); // Strict React Double-Effect issues often make this crash. Keeping instance is safer for dev.
            }
        };
    }, []);

    // Sync Video ID changes
    useEffect(() => {
        if (playerRef.current && playerRef.current.loadVideoById) {
            playerRef.current.loadVideoById(videoId);
        }
    }, [videoId]);

    return (
        <div className={`relative w-full aspect-video bg-black rounded overflow-hidden border-2 border-[var(--border-dark)] ${className}`}>
            <div id={containerId.current} className="w-full h-full"></div>
        </div>
    );
});

YouTubePlayer.displayName = 'YouTubePlayer';
