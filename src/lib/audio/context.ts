
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
export function getFrequency(noteIndex: number): number {
    // Distance from A4. Let's assume Middle C (C4) is noteIndex... wait.
    // Our noteIndex is 0-11 (C-B). We need octaves.
    // For the prototype, let's just use a simple relative calc from a low C.
    // Low E string open is E2 (approx 82Hz).
    // Let's assume note 0 (C) is C3 (130.81Hz).
    const baseC = 130.81;
    return baseC * Math.pow(2, noteIndex / 12);
}

// Need a way to convert (string, fret) to absolute pitch index for frequency
// E2 = 4 (E) but in lower octave.
// Let's map String Open Frequencies directly.
const STRING_FREQUENCIES = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63]; // E2, A2, D3, G3, B3, E4

export function getNoteFrequency(stringIdx: number, fret: number): number {
    const openFreq = STRING_FREQUENCIES[stringIdx];
    return openFreq * Math.pow(2, fret / 12);
}
