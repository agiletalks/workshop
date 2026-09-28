import { useState, useEffect, useCallback } from 'react';
import { voiceRecorder } from '../services/voiceRecorder';

export function useVoiceNote(onAppendText?: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isSupported = voiceRecorder.isSupported();

  // 即時同步最新回呼至 voiceRecorder，防止閉包陳舊與唯讀/換頁洩漏
  const syncCallbacks = useCallback((cb?: (text: string) => void) => {
    voiceRecorder.setCallbacks({
      onInterim: (interim) => {
        setInterimText(interim);
      },
      onFinal: (finalChunk) => {
        if (cb && finalChunk.trim()) {
          cb(finalChunk);
        }
      },
      onError: (err) => {
        setErrorMessage(err);
        setIsRecording(false);
        setInterimText('');
      }
    });
  }, []);

  // 每次 render 期間與 useEffect 時均同步最新回呼
  syncCallbacks(onAppendText);

  useEffect(() => {
    syncCallbacks(onAppendText);
  }, [onAppendText, syncCallbacks]);

  const handleStop = useCallback(() => {
    if (!isRecording) return;
    voiceRecorder.stop();
    setIsRecording(false);
    setInterimText('');
  }, [isRecording]);

  const handleStart = useCallback(() => {
    setErrorMessage(null);
    setInterimText('');

    const started = voiceRecorder.start({
      onInterim: (interim) => {
        setInterimText(interim);
      },
      onFinal: (finalChunk) => {
        if (onAppendText && finalChunk.trim()) {
          onAppendText(finalChunk);
        }
      },
      onError: (err) => {
        setErrorMessage(err);
        setIsRecording(false);
        setInterimText('');
      }
    });

    if (started) {
      setIsRecording(true);
    } else {
      setIsRecording(false);
    }
  }, [onAppendText]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      handleStop();
    } else {
      handleStart();
    }
  }, [isRecording, handleStart, handleStop]);

  // 元件卸載時自動關閉錄音
  useEffect(() => {
    return () => {
      if (isRecording) {
        voiceRecorder.stop();
      }
    };
  }, [isRecording]);

  return {
    isRecording,
    interimText,
    isSupported,
    errorMessage,
    startRecording: handleStart,
    stopRecording: handleStop,
    toggleRecording
  };
}
