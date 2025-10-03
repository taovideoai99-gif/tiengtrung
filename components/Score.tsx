
import React from 'react';
import { PronunciationScore } from '../types';

interface ScoreProps {
  scoreData: PronunciationScore | null;
  isLoading: boolean;
}

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
  const circumference = 2 * Math.PI * 45; // 2 * pi * r
  const offset = circumference - (score / 100) * circumference;
  
  let colorClass = 'stroke-green-500';
  if (score < 75) colorClass = 'stroke-yellow-500';
  if (score < 50) colorClass = 'stroke-red-500';

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          className="text-slate-700"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
        />
        {/* Progress circle */}
        <circle
          className={`${colorClass} transition-all duration-1000 ease-out`}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
      </div>
    </div>
  );
};

export const Score: React.FC<ScoreProps> = ({ scoreData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mt-6 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-slate-700 flex items-center justify-center min-h-[160px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <p className="ml-4 text-slate-300">Đang chấm điểm phát âm...</p>
      </div>
    );
  }

  if (!scoreData) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mt-6 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-slate-700 flex flex-col md:flex-row items-center gap-6">
      <div className="flex-shrink-0">
        <ScoreCircle score={scoreData.score} />
      </div>
      <div className="text-slate-200 text-center md:text-left">
        <h3 className="text-xl font-semibold mb-2">Phản hồi phát âm</h3>
        <p>{scoreData.feedback}</p>
      </div>
    </div>
  );
};
