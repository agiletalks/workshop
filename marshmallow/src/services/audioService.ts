class SynthMusic {
  private ctx: AudioContext | null = null;
  private bgmInterval: any = null;
  private isBgmPlaying: boolean = false;
  private tempo: number = 110; // BPM

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a simple synthesized arpeggio loop for background music
  public startBGM() {
    if (this.isBgmPlaying) return;
    this.initCtx();
    this.isBgmPlaying = true;

    // Upbeat pentatonic/major arpeggios that sound light and pleasant
    const chords = [
      [60, 64, 67, 72], // C Major (C4, E4, G4, C5)
      [64, 67, 71, 76], // E Minor (E4, G4, B4, E5)
      [65, 69, 72, 77], // F Major (F4, A4, C5, F5)
      [67, 71, 74, 79]  // G Major (G4, B4, D5, G5)
    ];
    let chordIdx = 0;
    let step = 0;

    const playStep = () => {
      if (!this.isBgmPlaying || !this.ctx) return;

      const chord = chords[chordIdx];
      const midiNote = chord[step % chord.length];
      const freq = 440 * Math.pow(2, (midiNote - 69) / 12);

      // Synthesize note
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      // Use triangle or sine wave for a soft, pleasant digital instrument sound
      osc.type = 'triangle'; 
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Soft envelope (prevent clicks and sound pleasant)
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.05); // low volume
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);

      step++;
      // Switch chords every 4 beats (8 steps at eighth notes)
      if (step % 8 === 0) {
        chordIdx = (chordIdx + 1) % chords.length;
      }
    };

    // Calculate duration of eighth notes in ms
    const stepDuration = (60 / this.tempo) / 2 * 1000;
    this.bgmInterval = setInterval(playStep, stepDuration);
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  // Play a pleasant end bell chime sound
  public playEndChime() {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Play an ascending major chime arpeggio
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    frequencies.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'sine'; // pure bell tone
      osc.frequency.setValueAtTime(freq, now + idx * 0.08); // arpeggiate
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8 + idx * 0.1);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + 2.5);
    });
  }
}

export const synthMusic = new SynthMusic();
