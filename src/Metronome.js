import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import './Metronome.css';

const Metronome = ({ onBpmChange }) => {
    const [bpm, setBpm] = useState(90);
    const [isPlaying, setIsPlaying] = useState(false);
    const [timeSig, setTimeSig] = useState(4);
    const beatRef = useRef(0);
    const loopRef = useRef(null);
    const strongSynthRef = useRef(null);
    const weakSynthRef = useRef(null);

    useEffect(() => {
        strongSynthRef.current = new Tone.Synth({
            oscillator: { type: 'square' },
            envelope: { attack: 0.001, decay: 0.01, sustain: 0, release: 0.01 }
        }).toDestination();

        weakSynthRef.current = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.02 }
        }).toDestination();

        return () => {
            Tone.Transport.stop();
            Tone.Transport.cancel();
        };
    }, []);

    useEffect(() => {
        if (onBpmChange) onBpmChange(bpm);
        Tone.Transport.bpm.value = bpm;
    }, [bpm, onBpmChange]);

    const start = async () => {
        await Tone.start();
        Tone.Transport.bpm.value = bpm;
        beatRef.current = 0;

        loopRef.current = new Tone.Loop((time) => {
            const beat = beatRef.current;
            const isStrong = beat % timeSig === 0;

            if (isStrong) {
                strongSynthRef.current.triggerAttackRelease("C6", "8n", time);
            } else {
                weakSynthRef.current.triggerAttackRelease("A5", "8n", time);
            }

            beatRef.current = (beat + 1) % timeSig;
        }, "4n");

        loopRef.current.start(0);
        Tone.Transport.start();
        setIsPlaying(true);
    };

    const stop = () => {
        loopRef.current.stop();
        Tone.Transport.stop();
        setIsPlaying(false);
    };

    const toggle = () => {
        isPlaying ? stop() : start();
    };

    const handleBpmChange = (e) => {
        const val = e.target.value;

        if (val === "") {
            setBpm("");
            onBpmChange?.("");
            return;
        }

        const num = Number(val);
        if (!Number.isNaN(num)) {
            const clamped = Math.min(300, Math.max(30, num));
            setBpm(clamped);
            onBpmChange?.(clamped);
        }
    };

    const calculateProgress = () => {
        const min = 30;
        const max = 300;
        const percent = (bpm - min) / (max - min);
        return `${percent * 100}%`;
    };

    return (
        <div className="metronome-container">
            <h3 className="metronome-title">🎵 节拍器</h3>
            <div className="metronome-row">
                <label htmlFor="bpm">BPM:</label>
                <input
                    type="range"
                    min="30"
                    max="300"
                    step="5"
                    value={bpm || 30}
                    onChange={handleBpmChange}
                    className="metronome-slider"
                    style={{
                        background: `linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ${calculateProgress()}, var(--divider-color) ${calculateProgress()}, var(--divider-color) 100%)`,
                    }}
                />
                <input
                    type="number"
                    min="30"
                    max="300"
                    step="5"
                    value={bpm}
                    onChange={handleBpmChange}
                    className="metronome-input"
                />
            </div>
            <div className="metronome-row">
                <label>拍号:</label>
                <select value={timeSig} onChange={(e) => setTimeSig(+e.target.value)} className="metronome-select">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                        <option key={n} value={n}>{n}/4</option>
                    ))}
                </select>
                <button className="metronome-button" onClick={toggle}>
                    {isPlaying ? "停止" : "开始"}
                </button>
            </div>
        </div>
    );
};

export default Metronome;   