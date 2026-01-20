
class AudioEngine {
    private ctx: AudioContext | null = null;
    private gainNode: GainNode | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.gainNode = this.ctx.createGain();
            this.gainNode.connect(this.ctx.destination);
        }
    }

    public resume() {
        if (this.ctx?.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public playTone(freq: number, duration: number = 0.8) {
        if (!this.ctx || !this.gainNode) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.connect(this.ctx.destination);
        osc.connect(gain);

        osc.start();

        // Envelope
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + duration);

        osc.stop(this.ctx.currentTime + duration);

        // Cleanup
        setTimeout(() => {
            osc.disconnect();
            gain.disconnect();
        }, duration * 1000 + 100);
    }
}

// Singleton instance
export const audio = new AudioEngine();

// Frequency Map Helper
const BASE_A4 = 440;

// Calculate frequency from Pitch Index (where 0 = C2, 4 = E2, etc.)
export function getFrequency(pitchIndex: number): number {
    // C2 is approx 65.41 Hz
    const baseC = 65.406;
    return baseC * Math.pow(2, pitchIndex / 12);
}

// Legacy helper, now using the generic calculation if needed, but page.tsx should use getFrequency(pitch)
export function getNoteFrequency(stringIdx: number, fret: number, tuning: number[] = [4, 9, 14, 19, 23, 28]): number {
    const pitch = tuning[stringIdx] + fret;
    return getFrequency(pitch);
}
