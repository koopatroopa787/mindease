import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Upload } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  maxDuration?: number; // in seconds, default 60
  screenshotId?: number;
}

export default function AudioRecorder({
  onRecordingComplete,
  maxDuration = 60,
  screenshotId,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onRecordingComplete(audioBlob, recordingTime);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please grant permission and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }
  };

  const playRecording = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setRecordingTime(0);
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      {!audioUrl && (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          {!isRecording ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <button
                  onClick={startRecording}
                  className="p-6 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                >
                  <Mic className="w-8 h-8 text-white" />
                </button>
              </div>
              <div>
                <p className="text-gray-700 font-medium">
                  {screenshotId ? 'Record a voice memo for this screenshot' : 'Record a voice memo'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Maximum duration: {maxDuration} seconds
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-4xl font-bold text-red-600">
                {formatTime(recordingTime)}
              </div>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={pauseRecording}
                  className="p-4 bg-yellow-500 hover:bg-yellow-600 rounded-full transition-colors"
                  title={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? (
                    <Play className="w-6 h-6 text-white" />
                  ) : (
                    <Pause className="w-6 h-6 text-white" />
                  )}
                </button>
                <button
                  onClick={stopRecording}
                  className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                  title="Stop"
                >
                  <Square className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600">
                  {isPaused ? 'Paused' : 'Recording...'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Playback Controls */}
      {audioUrl && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={playRecording}
                className="p-3 bg-green-600 hover:bg-green-700 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </button>
              <div>
                <p className="font-medium text-green-900">Recording Complete</p>
                <p className="text-sm text-green-700">Duration: {formatTime(recordingTime)}</p>
              </div>
            </div>
            <button
              onClick={deleteRecording}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete recording"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
