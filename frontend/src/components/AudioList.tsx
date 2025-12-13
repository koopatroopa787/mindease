import { useState, useRef } from 'react';
import { Play, Pause, Trash2, FileAudio, Clock, MessageSquare } from 'lucide-react';
import type { AudioRecording } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface AudioListProps {
  recordings: AudioRecording[];
  onDelete?: (id: number) => void;
}

export default function AudioList({ recordings, onDelete }: AudioListProps) {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement }>({});

  const getAudioUrl = (filePath: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${baseUrl}/${filePath}`;
  };

  const togglePlay = (id: number, filePath: string) => {
    const audio = audioRefs.current[id];

    if (playingId === id) {
      // Pause current
      audio?.pause();
      setPlayingId(null);
    } else {
      // Pause any currently playing audio
      if (playingId !== null) {
        audioRefs.current[playingId]?.pause();
      }

      // Play new audio
      if (!audio) {
        const newAudio = new Audio(getAudioUrl(filePath));
        audioRefs.current[id] = newAudio;
        newAudio.onended = () => setPlayingId(null);
        newAudio.play();
      } else {
        audio.play();
      }
      setPlayingId(id);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (recordings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileAudio className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>No voice memos yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recordings.map((recording) => (
        <div
          key={recording.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {/* Play Button */}
              <button
                onClick={() => togglePlay(recording.id, recording.file_path)}
                className="p-2 bg-primary-100 hover:bg-primary-200 rounded-full transition-colors flex-shrink-0"
              >
                {playingId === recording.id ? (
                  <Pause className="w-5 h-5 text-primary-700" />
                ) : (
                  <Play className="w-5 h-5 text-primary-700" />
                )}
              </button>

              {/* Recording Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <FileAudio className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {recording.file_name}
                  </span>
                  {recording.is_processed && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      Processed
                    </span>
                  )}
                </div>

                {/* Duration and Time */}
                <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                  {recording.duration && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(recording.duration)}</span>
                    </div>
                  )}
                  <span>
                    {formatDistanceToNow(new Date(recording.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                {/* Transcription */}
                {recording.transcription && (
                  <div className="bg-gray-50 rounded p-3 mt-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">
                        Transcription
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {recording.transcription}
                    </p>
                  </div>
                )}

                {/* Summary */}
                {recording.summary && (
                  <div className="mt-2 text-sm text-gray-600 italic">
                    Summary: {recording.summary}
                  </div>
                )}

                {/* Processing status */}
                {!recording.is_processed && (
                  <div className="mt-2 flex items-center space-x-2 text-xs text-yellow-600">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    <span>Processing transcription...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delete Button */}
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('Delete this voice memo?')) {
                    onDelete(recording.id);
                  }
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                title="Delete recording"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
