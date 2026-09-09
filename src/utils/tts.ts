/**
 * Keyless neural Text-To-Speech (TTS) in Bahasa Melayu with native browser fallback.
 */

export type TTSMode = 'auto' | 'manual' | 'off';

export interface TTSOptions {
  mode: TTSMode;
  rate: number; // 0.8 - 1.2
  pitch: number; // 0.9 - 1.1
  volume: number; // 0 - 1
  announceButtons: boolean; // sebut tiap kali butang ditekan (masuk/keluar/tukar)
}

class MalayTTSManager {
  private synth: SpeechSynthesis | null = null;
  private malayVoice: SpeechSynthesisVoice | null = null;
  private nativeTimer: ReturnType<typeof setTimeout> | null = null;
  private audio: HTMLAudioElement | null = null;
  private audioUrl: string | null = null;
  private generation = 0;
  
  public options: TTSOptions = {
    mode: 'auto',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    announceButtons: true,
  };

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return;

    // Prefer a Malaysian Malay voice, then another Malay locale, then Indonesian.
    // Never explicitly select an English (or arbitrary default) voice for Malay text.
    const normalizedLang = (voice: SpeechSynthesisVoice) => voice.lang.toLowerCase().replace('_', '-');
    const msMyVoice = voices.find(v => normalizedLang(v) === 'ms-my');
    const msVoice = voices.find(v => normalizedLang(v) === 'ms' || normalizedLang(v).startsWith('ms-'));
    const idIdVoice = voices.find(v => normalizedLang(v) === 'id-id');
    const idVoice = voices.find(v => normalizedLang(v) === 'id' || normalizedLang(v).startsWith('id-'));

    this.malayVoice = msMyVoice || msVoice || idIdVoice || idVoice || null;
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const remoteSupported = typeof window.fetch === 'function' && typeof window.Audio === 'function';
    const nativeSupported = Boolean(window.speechSynthesis);
    return remoteSupported || nativeSupported;
  }

  public speak(text: string, force: boolean = false) {
    if (!this.isSupported()) return;
    if (this.options.mode === 'off' && !force) return;

    const generation = ++this.generation;
    this.cancelCurrentSpeech();
    void this.speakRemote(text, generation);
  }

  private isCurrent(generation: number): boolean {
    return generation === this.generation;
  }

  private cancelCurrentSpeech() {
    if (this.nativeTimer !== null) {
      clearTimeout(this.nativeTimer);
      this.nativeTimer = null;
    }

    try {
      this.synth?.cancel();
    } catch {
      // Native speech cancellation is best effort.
    }

    this.cleanupAudio();
  }

  private cleanupAudio() {
    const audio = this.audio;
    const audioUrl = this.audioUrl;
    this.audio = null;
    this.audioUrl = null;

    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.removeAttribute('src');
        audio.load();
      } catch {
        // Audio cleanup is best effort.
      }
    }

    if (audioUrl && typeof URL !== 'undefined') {
      try {
        URL.revokeObjectURL(audioUrl);
      } catch {
        // Object URL cleanup is best effort.
      }
    }
  }

  private async speakRemote(text: string, generation: number): Promise<void> {
    try {
      const response = await window.fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          rate: this.options.rate,
          pitch: this.options.pitch,
          volume: this.options.volume,
        }),
      });

      if (!this.isCurrent(generation)) return;
      if (!response.ok) throw new Error('TTS request failed');

      const blob = await response.blob();
      if (!this.isCurrent(generation)) return;
      if (!blob || blob.size === 0) throw new Error('TTS response was empty');

      this.playRemoteAudio(blob, text, generation);
    } catch {
      if (this.isCurrent(generation)) {
        this.speakNative(text, generation);
      }
    }
  }

  private playRemoteAudio(blob: Blob, text: string, generation: number) {
    if (!this.isCurrent(generation) || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      throw new Error('Audio playback is unavailable');
    }

    const audioUrl = URL.createObjectURL(blob);
    let audio: HTMLAudioElement;
    try {
      audio = new window.Audio();
    } catch (error) {
      URL.revokeObjectURL(audioUrl);
      throw error;
    }
    audio.src = audioUrl;
    audio.volume = Math.max(0, Math.min(1, Number.isFinite(this.options.volume) ? this.options.volume : 1));
    this.audio = audio;
    this.audioUrl = audioUrl;

    let finished = false;
    const finish = (fallback: boolean) => {
      if (finished) return;
      finished = true;
      const current = this.isCurrent(generation);
      if (this.audio === audio) this.cleanupAudio();
      if (fallback && current) this.speakNative(text, generation);
    };

    audio.onended = () => finish(false);
    audio.onerror = () => finish(true);

    try {
      const playResult = audio.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(() => finish(true));
      }
    } catch {
      finish(true);
    }
  }

  private speakNative(text: string, generation: number) {
    if (!this.isCurrent(generation) || !this.synth) return;

    try {
      this.initVoices();
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.malayVoice) utterance.voice = this.malayVoice;
      utterance.lang = this.malayVoice?.lang || 'ms-MY';
      utterance.rate = this.options.rate;
      utterance.pitch = this.options.pitch;
      utterance.volume = this.options.volume;

      // Chrome/Android workaround: small delay ensures cancel() completes before speak().
      this.nativeTimer = setTimeout(() => {
        this.nativeTimer = null;
        if (!this.isCurrent(generation) || !this.synth) return;
        try {
          if (this.synth.paused) this.synth.resume();
          this.synth.speak(utterance);
        } catch {
          // Speech synthesis fails gracefully if blocked by browser autoplay policies.
        }
      }, 15);
    } catch {
      // Speech synthesis fails gracefully if unavailable or blocked.
    }
  }

  // Convert numbers to clean Malay words up to 30 so all voices pronounce in Malay
  private formatNumber(n: number): string {
    const words: Record<number, string> = {
      0: 'kosong',
      1: 'satu',
      2: 'dua',
      3: 'tiga',
      4: 'empat',
      5: 'lima',
      6: 'enam',
      7: 'tujuh',
      8: 'lapan',
      9: 'sembilan',
      10: 'sepuluh',
      11: 'sebelas',
      12: 'dua belas',
      13: 'tiga belas',
      14: 'empat belas',
      15: 'lima belas',
      16: 'enam belas',
      17: 'tujuh belas',
      18: 'lapan belas',
      19: 'sembilan belas',
      20: 'dua puluh',
      21: 'dua puluh satu',
      22: 'dua puluh dua',
      23: 'dua puluh tiga',
      24: 'dua puluh empat',
      25: 'dua puluh lima',
      26: 'dua puluh enam',
      27: 'dua puluh tujuh',
      28: 'dua puluh lapan',
      29: 'dua puluh sembilan',
      30: 'tiga puluh',
    };
    return words[n] || n.toString();
  }

  /**
   * Announce badminton score in official referee Malay format
   */
  public announceScore(
    scoreA: number,
    scoreB: number,
    teamAName: string,
    teamBName: string,
    serverTeam: 'A' | 'B',
    isGamePoint: boolean = false,
    isMatchPoint: boolean = false,
    isDeuce: boolean = false,
    forceManual: boolean = false
  ) {
    if (this.options.mode === 'off' && !forceManual) return;
    if (this.options.mode === 'manual' && !forceManual) return;

    const serverName = serverTeam === 'A' ? teamAName : teamBName;
    let speech = '';

    if (isMatchPoint) {
      speech += `Mata akhir perlawanan untuk ${serverName}! `;
    } else if (isGamePoint) {
      speech += `Mata akhir set untuk ${serverName}! `;
    } else if (isDeuce) {
      speech += `Dua puluh sama, deuce! `;
    }

    if (scoreA === scoreB) {
      if (scoreA === 0) {
        speech += `Kosong sama. Servis ${serverName}.`;
      } else {
        speech += `${this.formatNumber(scoreA)} sama. Servis ${serverName}.`;
      }
    } else {
      // Announce server score first as per standard badminton umpiring
      if (serverTeam === 'A') {
        speech += `${teamAName} ${this.formatNumber(scoreA)}, ${teamBName} ${this.formatNumber(scoreB)}. Servis ${teamAName}.`;
      } else {
        speech += `${teamBName} ${this.formatNumber(scoreB)}, ${teamAName} ${this.formatNumber(scoreA)}. Servis ${teamBName}.`;
      }
    }

    this.speak(speech, forceManual);
  }

  /**
   * Announce button click or user action (masuk, keluar, tukar, reset)
   */
  public announceAction(actionText: string, forceManual: boolean = false) {
    if (this.options.mode === 'off' && !forceManual) return;
    if (!this.options.announceButtons && !forceManual) return;

    this.speak(actionText, forceManual);
  }
}

export const tts = new MalayTTSManager();
