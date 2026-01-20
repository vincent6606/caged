
const fs = require('fs');
global.window = {
    location: { href: '' },
    document: {
        createElement: (tag) => ({ style: {}, getContext: () => ({}), tagName: tag.toUpperCase() }),
        body: { appendChild: () => { } }
    },
    performance: { now: () => Date.now() },
    setTimeout: setTimeout, clearTimeout: clearTimeout
};
global.document = global.window.document;
global.navigator = { userAgent: 'node' };
global.Element = class { };
global.HTMLElement = class extends global.Element { constructor() { super(); this.style = {}; } };
global.HTMLDivElement = class extends global.HTMLElement { };
global.HTMLCanvasElement = class extends global.HTMLElement { getContext() { return {}; } };
global.Event = class { };
global.Document = class { };
global.DocumentFragment = class { };
global.Image = class { };

try {
    const alphaTab = require('@coderline/alphatab');
    const filePath = '/Users/zhitingchen/Desktop/dummygp.gp';

    console.log("Loading file:", filePath);
    const buffer = fs.readFileSync(filePath);
    const data = new Uint8Array(buffer);

    console.log("File loaded, size:", data.length);

    console.log("Attempting to parse with loadScoreFromBytes...");

    // Inspect if function exists first
    if (typeof alphaTab.importer.ScoreLoader.loadScoreFromBytes !== 'function') {
        console.error("loadScoreFromBytes not found on ScoreLoader!");
        console.log("Found:", Object.keys(alphaTab.importer.ScoreLoader));
    } else {
        const score = alphaTab.importer.ScoreLoader.loadScoreFromBytes(data);

        console.log("------------------------------------------");
        console.log("SCORE PARSED SUCCESSFULLY");
        console.log("------------------------------------------");
        console.log("Title:", score.title);
        console.log("Artist:", score.artist);
        console.log("Tracks:", score.tracks.length);
        if (score.masterBars.length > 0) {
            console.log("Key Signature (int):", score.masterBars[0].keySignature);
        }

        score.tracks.forEach((t, i) => {
            console.log(`Track ${i}: ${t.name}`);
            if (t.staves.length > 0) {
                console.log(`  Staves: ${t.staves.length}`);
                // Try to find tuning
                // console.log("  Tuning:", t.staves[0].stringTuning); 
                // AlphaTab: Stave has stringTuning usually? No, check Stave.ts
                // It might be implicitly defined or on track.
            }
        });

        // Debug first track notes (simulate extraction)
        if (score.tracks.length > 0) {
            const firstTrack = score.tracks[0];
            console.log("DEBUG: Extracting notes from Track 0...");

            const notesByString = Array(6).fill(null).map(() => new Set());

            firstTrack.staves.forEach(stave => {
                stave.bars.forEach(bar => {
                    bar.voices.forEach(voice => {
                        voice.beats.forEach(beat => {
                            if (beat.notes) {
                                beat.notes.forEach(note => {
                                    // User observed: AlphaTab note.string 6 = High E, 1 = Low E (or specific to this file?)
                                    // Our App Model: 0=Low E, 5=High E.
                                    // Therefore: stringIdx = note.string - 1.
                                    // 6 -> 5 (High E)
                                    // 1 -> 0 (Low E)

                                    const stringIdx = note.string - 1;
                                    if (stringIdx >= 0 && stringIdx < 6) {
                                        notesByString[stringIdx].add(note.fret);
                                    }
                                });
                            }
                        });
                    });
                });
            });

            console.log("\n--- Parsed Notes by String (Low E to High E) ---");
            const StringNames = ["E (Low)", "A", "D", "G", "B", "E (High)"];

            notesByString.forEach((frets, idx) => {
                const sortedFrets = Array.from(frets).sort((a, b) => a - b);
                console.log(`String ${idx} [${StringNames[idx]}]: ${sortedFrets.join(", ")}`);
            });
            console.log("----------------------------------------------\n");
        }
    }

} catch (e) {
    console.error("Script Error:", e);
}
