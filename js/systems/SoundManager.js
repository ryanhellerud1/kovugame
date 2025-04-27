export class SoundManager {
    constructor() {
        this.soundsReady = false;
        this.synths = {};
    }

    async initialize() {
        try {
            // Initialize synths
            this.synths.dash = new Tone.Synth({
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 }
            }).toDestination();

            this.synths.collect = new Tone.Synth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.2 }
            }).toDestination();

            this.synths.win = new Tone.Synth({
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.05, decay: 0.2, sustain: 0.3, release: 0.5 }
            }).toDestination();

            this.synths.feedbackPositive = new Tone.PluckSynth().toDestination();

            this.synths.feedbackNegative = new Tone.NoiseSynth({
                noise: { type: 'pink' },
                envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
            }).toDestination();

            this.synths.hazardWarn = new Tone.Synth({
                oscillator: { type: 'pulse', width: 0.3 },
                envelope: { attack: 0.01, decay: 0.05, sustain: 0.1, release: 0.1 }
            }).toDestination();

            this.synths.laserFire = new Tone.Synth({
                oscillator: { type: 'pwm', modulationFrequency: 0.2 },
                envelope: { attack: 0.005, decay: 0.2, sustain: 0.01, release: 0.1 }
            }).toDestination();

            this.synths.rivalDestroyed = new Tone.MetalSynth({
                frequency: 100,
                envelope: { attack: 0.01, decay: 0.4, release: 0.2 },
                harmonicity: 5.1,
                modulationIndex: 32,
                resonance: 4000,
                octaves: 1.5
            }).toDestination();

            this.synths.playerHit = new Tone.Synth({
                oscillator: { type: 'square' },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 }
            }).toDestination();

            this.synths.gameOver = new Tone.Synth({
                oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
                envelope: { attack: 0.1, decay: 0.5, sustain: 0.1, release: 0.8 }
            }).toDestination();

            this.soundsReady = true;
            console.log("Tone.js Synths Initialized");

            // Start audio context
            if (Tone.context.state !== 'running') {
                await Tone.start();
                console.log("AudioContext started!");
            }

            return true;
        } catch (error) {
            console.error("Error initializing Tone.js:", error);
            return false;
        }
    }

    playSound(type, note = null, duration = '8n') {
        if (!this.soundsReady || !this.synths[type]) return;

        try {
            switch (type) {
                case 'feedbackNegative':
                    this.synths[type].triggerAttackRelease(duration);
                    break;

                case 'dash':
                    this.synths[type].triggerAttackRelease('C4', duration);
                    break;

                case 'hazardWarn':
                    this.synths[type].triggerAttackRelease('A4', '16n');
                    break;

                case 'laserFire':
                    this.synths[type].triggerAttackRelease('G5', '16n');
                    break;

                case 'rivalDestroyed':
                    this.synths[type].triggerAttackRelease();
                    break;

                case 'playerHit':
                    this.synths[type].triggerAttackRelease('C3', '8n');
                    break;

                case 'gameOver':
                    this.synths[type].triggerAttackRelease('C2', '1n');
                    break;

                default:
                    if (note) {
                        this.synths[type].triggerAttackRelease(note, duration);
                    }
                    break;
            }
        } catch (error) {
            console.error(`Error playing sound ${type}:`, error);
        }
    }

    // Cleanup method to dispose of synths when needed
    dispose() {
        Object.values(this.synths).forEach(synth => {
            if (synth && typeof synth.dispose === 'function') {
                synth.dispose();
            }
        });
        this.synths = {};
        this.soundsReady = false;
    }
}