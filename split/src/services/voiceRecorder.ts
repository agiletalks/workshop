/**
 * Web Speech API 零金鑰原生語音辨識服務 (VoiceNoteRecorder)
 * 比照 AI-ARM 原廠實作，具備 15 秒心跳熱重啟防護
 */

// 宣告 SpeechRecognition 型別相容
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export type VoiceInterimCallback = (interim: string) => void;
export type VoiceFinalCallback = (finalChunk: string) => void;
export type VoiceErrorCallback = (error: string) => void;

export class VoiceNoteRecorder {
  private _recognition: any = null;
  private _finalText = '';
  private _interimText = '';
  private _onInterim: VoiceInterimCallback | null = null;
  private _onFinal: VoiceFinalCallback | null = null;
  private _onError: VoiceErrorCallback | null = null;
  private _stopped = true;
  private _restartTimer: any = null;
  private _restartCount = 0;

  constructor() {
    this._finalText = '';
    this._interimText = '';
    this._stopped = true;
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public start(options: {
    onInterim?: VoiceInterimCallback;
    onFinal?: VoiceFinalCallback;
    onError?: VoiceErrorCallback;
  }): boolean {
    if (!this.isSupported()) {
      if (options.onError) options.onError('SpeechRecognition not supported in this browser');
      return false;
    }

    this._stopped = false;
    this._finalText = '';
    this._interimText = '';
    this._onInterim = options.onInterim || null;
    this._onFinal = options.onFinal || null;
    this._onError = options.onError || null;
    this._restartCount = 0;

    try {
      this._recognition = this._createRecognition();
      this._recognition.start();
      return true;
    } catch (err: any) {
      console.warn('[VoiceNote] 啟動辨識失敗:', err);
      if (this._onError) this._onError(err.message || '啟動失敗');
      return false;
    }
  }

  public setCallbacks(options: {
    onInterim?: VoiceInterimCallback;
    onFinal?: VoiceFinalCallback;
    onError?: VoiceErrorCallback;
  }): void {
    if (options.onInterim !== undefined) this._onInterim = options.onInterim;
    if (options.onFinal !== undefined) this._onFinal = options.onFinal;
    if (options.onError !== undefined) this._onError = options.onError;
  }

  public stop(): string {
    this._stopped = true;
    if (this._restartTimer) {
      clearTimeout(this._restartTimer);
      this._restartTimer = null;
    }

    if (this._recognition) {
      try {
        this._recognition.stop();
      } catch (e) {
        try { this._recognition.abort(); } catch (_) {}
      }
      this._recognition = null;
    }

    const recorded = this._finalText + (this._interimText ? ' ' + this._interimText : '');
    this._finalText = '';
    this._interimText = '';
    if (this._onInterim) this._onInterim('');
    return recorded.trim();
  }

  private _createRecognition(): any {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SpeechRecognition();
    r.lang = 'zh-TW';
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this._finalText += transcript;
          interim = '';
          if (this._onFinal) this._onFinal(transcript);
        } else {
          interim += transcript;
        }
      }
      this._interimText = interim;
      if (this._onInterim) this._onInterim(this._interimText);
    };

    r.onerror = (event: any) => {
      const retriable = ['no-speech', 'audio-capture', 'network'];
      if (retriable.includes(event.error)) {
        if (this._restartTimer) clearTimeout(this._restartTimer);
        this._restartTimer = setTimeout(() => {
          if (this._stopped) return;
          this._restartCount++;
          try {
            if (this._recognition) {
              try { this._recognition.abort(); } catch (_) {}
              this._recognition = null;
            }
            this._recognition = this._createRecognition();
            this._recognition.start();
          } catch (e) {
            console.warn('[VoiceNote] 心跳熱重啟失敗:', e);
          }
        }, 500);
        return;
      }

      console.warn('[VoiceNote] 辨識錯誤:', event.error);
      if (this._onError) this._onError(event.error);
    };

    r.onend = () => {
      if (this._stopped) return;

      // Chrome 靜音自動斷線時自動重啟聽寫 (Heartbeat Restart)
      if (this._restartTimer) clearTimeout(this._restartTimer);
      this._restartTimer = setTimeout(() => {
        if (this._stopped) return;
        this._restartCount++;
        try {
          if (this._recognition) {
            try { this._recognition.abort(); } catch (_) {}
            this._recognition = null;
          }
          this._recognition = this._createRecognition();
          this._recognition.start();
        } catch (e) {
          console.warn('[VoiceNote] onend 自動重啟失敗:', e);
        }
      }, 300);
    };

    return r;
  }
}

export const voiceRecorder = new VoiceNoteRecorder();
