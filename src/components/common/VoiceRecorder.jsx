import { useEffect, useRef, useState } from 'react';

// Big tap-to-record button for field staff who don't want to type a form.
// Records mic audio via MediaRecorder, lets the user play it back or re-record,
// then hands the finished Blob/File up to the parent via onRecorded.
export default function VoiceRecorder({ onRecorded, onClear, disabled }) {
  const [state, setState] = useState('idle'); // idle | recording | recorded
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const ext = (recorder.mimeType || 'audio/webm').includes('mp4') ? 'm4a' : 'webm';
        const file = new File([blob], `voice-note-${Date.now()}.${ext}`, { type: blob.type });
        setAudioUrl(URL.createObjectURL(blob));
        onRecorded?.(file, seconds);
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setState('recording');
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Couldn't access the microphone. Check browser/site permissions.");
    }
  };

  const stop = () => {
    clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setState('recorded');
  };

  const reRecord = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setSeconds(0);
    setState('idle');
    onClear?.();
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="voice-recorder">
      {state === 'idle' && (
        <button type="button" className="voice-rec-btn" onClick={start} disabled={disabled}>
          <i className="ti ti-microphone" />
          <span>Tap to record</span>
        </button>
      )}

      {state === 'recording' && (
        <button type="button" className="voice-rec-btn recording" onClick={stop}>
          <span className="voice-pulse" />
          <i className="ti ti-player-stop" />
          <span>Recording… {fmt(seconds)} — tap to stop</span>
        </button>
      )}

      {state === 'recorded' && (
        <div className="voice-recorded-row">
          <i className="ti ti-microphone" style={{ color: 'var(--gold)' }} />
          <audio controls src={audioUrl} style={{ height: 34, flex: 1 }} />
          <span style={{ fontSize: 11.5, color: 'var(--text4)' }}>{fmt(seconds)}</span>
          <button type="button" className="btn" onClick={reRecord} title="Re-record">
            <i className="ti ti-refresh" />
          </button>
        </div>
      )}

      {error && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 6 }}>{error}</p>}
    </div>
  );
}
