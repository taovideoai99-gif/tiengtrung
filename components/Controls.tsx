
import React from 'react';
import { Difficulty, Topic } from '../types';
import { DIFFICULTIES, TOPICS } from '../constants';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';

interface ControlsProps {
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  topic: Topic;
  setTopic: (t: Topic) => void;
  isSessionActive: boolean;
  onStartStop: () => void;
  statusMessage: string;
}

export const Controls: React.FC<ControlsProps> = ({
  difficulty,
  setDifficulty,
  topic,
  setTopic,
  isSessionActive,
  onStartStop,
  statusMessage,
}) => {
  const isButtonDisabled = (isSessionActive && statusMessage === 'Đang kết nối...') || (!isSessionActive && statusMessage === 'Đang dừng...');

  return (
    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-700 w-full max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Settings */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-slate-300 mb-1">Cấp độ</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              disabled={isSessionActive}
              className="w-full bg-slate-700 text-white border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
            >
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-slate-300 mb-1">Chủ đề</label>
            <select
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value as Topic)}
              disabled={isSessionActive}
              className="w-full bg-slate-700 text-white border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
            >
              {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Start/Stop Button */}
        <div className="flex flex-col items-center justify-center">
            <button
                onClick={onStartStop}
                disabled={isButtonDisabled}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-300 ease-in-out shadow-lg focus:outline-none focus:ring-4 focus:ring-opacity-50
                    ${isSessionActive ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400' : 'bg-green-600 hover:bg-green-700 focus:ring-green-400'}
                    ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {isSessionActive ? <StopIcon className="w-8 h-8"/> : <MicrophoneIcon className="w-8 h-8"/>}
            </button>
            <p className="text-slate-300 mt-2 text-sm text-center min-h-[20px]">{statusMessage}</p>
        </div>
      </div>
    </div>
  );
};
