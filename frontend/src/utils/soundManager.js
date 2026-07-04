/**
 * soundManager.js
 * Lightweight Web Audio API sound manager.
 * No external dependencies – generates sounds programmatically.
 * Respects the `soundEnabled` flag from settingsStore.
 */

let ctx = null;

const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
};

const isSoundEnabled = () => {
    try {
        const raw = localStorage.getItem('studylabs-settings');
        if (!raw) return true;
        const parsed = JSON.parse(raw);
        return parsed?.state?.soundEnabled !== false;
    } catch {
        return true;
    }
};

/**
 * Play a synthesized tone.
 * @param {number} frequency - Hz
 * @param {number} duration - seconds
 * @param {'sine'|'square'|'triangle'|'sawtooth'} type
 * @param {number} volume - 0 to 1
 * @param {number} startDelay - seconds offset
 */
const playTone = (frequency, duration, type = 'sine', volume = 0.3, startDelay = 0) => {
    try {
        const ac = getCtx();
        const osc = ac.createOscillator();
        const gain = ac.createGain();

        osc.connect(gain);
        gain.connect(ac.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ac.currentTime + startDelay);

        gain.gain.setValueAtTime(0, ac.currentTime + startDelay);
        gain.gain.linearRampToValueAtTime(volume, ac.currentTime + startDelay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startDelay + duration);

        osc.start(ac.currentTime + startDelay);
        osc.stop(ac.currentTime + startDelay + duration);
    } catch {
        // Silently fail if AudioContext blocked
    }
};

const sounds = {
    /** Correct answer – upbeat ding */
    correct: () => {
        if (!isSoundEnabled()) return;
        playTone(523, 0.12, 'sine', 0.35); // C5
        playTone(659, 0.18, 'sine', 0.3, 0.1); // E5
        playTone(784, 0.25, 'sine', 0.25, 0.22); // G5
    },

    /** Wrong answer – low buzz */
    wrong: () => {
        if (!isSoundEnabled()) return;
        playTone(200, 0.08, 'square', 0.2);
        playTone(160, 0.25, 'square', 0.15, 0.08);
    },

    /** Level up – triumphant fanfare */
    levelUp: () => {
        if (!isSoundEnabled()) return;
        const notes = [392, 523, 659, 784, 1047];
        notes.forEach((freq, i) => playTone(freq, 0.18, 'sine', 0.3, i * 0.12));
    },

    /** Badge unlock – sparkle jingle */
    badge: () => {
        if (!isSoundEnabled()) return;
        const notes = [784, 988, 1175, 1319, 1568];
        notes.forEach((freq, i) => playTone(freq, 0.14, 'triangle', 0.25, i * 0.08));
    },

    /** Quiz complete – short success chord */
    quizComplete: () => {
        if (!isSoundEnabled()) return;
        playTone(523, 0.3, 'sine', 0.3);
        playTone(659, 0.3, 'sine', 0.25, 0.05);
        playTone(784, 0.4, 'sine', 0.2, 0.1);
    },

    /** Perfect score – extra celebration */
    perfectScore: () => {
        if (!isSoundEnabled()) return;
        const notes = [523, 659, 784, 1047, 1319];
        notes.forEach((freq, i) => playTone(freq, 0.2, 'sine', 0.28, i * 0.1));
    },

    /** Click / UI interaction */
    click: () => {
        if (!isSoundEnabled()) return;
        playTone(800, 0.05, 'sine', 0.1);
    },

    /** Streak milestone */
    streak: () => {
        if (!isSoundEnabled()) return;
        playTone(440, 0.1, 'triangle', 0.2);
        playTone(550, 0.1, 'triangle', 0.2, 0.1);
        playTone(660, 0.2, 'triangle', 0.25, 0.2);
    },

    /** Time warning – tick */
    timeLow: () => {
        if (!isSoundEnabled()) return;
        playTone(880, 0.06, 'square', 0.12);
    },

    /** Time expired */
    timeUp: () => {
        if (!isSoundEnabled()) return;
        playTone(300, 0.05, 'square', 0.2);
        playTone(250, 0.3, 'square', 0.15, 0.06);
    },
};

export default sounds;
