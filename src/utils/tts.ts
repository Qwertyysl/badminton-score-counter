/**
 * Free Client-Side Text-To-Speech (TTS) using Web Speech API in Bahasa Melayu
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
  private voicesLoaded: boolean = false;
  
  public options: TTSOptions = {
    mode: 'auto',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    announceButtons: true,
  };

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
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

    // Look for Malay (ms-MY) first, then Indonesian (id-ID) which is phonetically very close, or default
    const msVoice = voices.find(v => v.lang.toLowerCase().startsWith('ms') || v.lang.toLowerCase().replace('_', '-').startsWith('ms-my'));
    const idVoice = voices.find(v => v.lang.toLowerCase().startsWith('id') || v.lang.toLowerCase().replace('_', '-').startsWith('id-id'));
    
    this.malayVoice = msVoice || idVoice || voices.find(v => v.default) || voices[0] || null;
    this.voicesLoaded = true;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public speak(text: string, force: boolean = false) {
    if (!this.isSupported() || !this.synth) return;
    if (this.options.mode === 'off' && !force) return;

    try {
      this.initVoices();
      this.synth.cancel();
      if (this.synth.paused) {
        this.synth.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.malayVoice) {
        utterance.voice = this.malayVoice;
      }
      utterance.lang = this.malayVoice?.lang || 'ms-MY';
      utterance.rate = this.options.rate;
      utterance.pitch = this.options.pitch;
      utterance.volume = this.options.volume;

      // Chrome/Android workaround: small delay ensures cancel() completes before speak()
      setTimeout(() => {
        if (!this.synth) return;
        if (this.synth.paused) {
          this.synth.resume();
        }
        this.synth.speak(utterance);
      }, 15);
    } catch {
      // Speech synthesis fails gracefully if blocked by browser autoplay policies
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
