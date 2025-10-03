
import React, { useRef, useEffect } from 'react';
import { ConversationTurn } from '../types';

interface TranscriptProps {
  transcript: ConversationTurn[];
}

export const Transcript: React.FC<TranscriptProps> = ({ transcript }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-700 w-full max-w-4xl mt-6 h-96 overflow-y-auto flex flex-col space-y-4">
      {transcript.length === 0 && (
        <div className="flex-grow flex items-center justify-center text-slate-400">
          <p>Nhấn nút bắt đầu để luyện tập...</p>
        </div>
      )}
      {transcript.map((turn, index) => (
        <div key={index} className={`flex ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-xl px-4 py-2 rounded-lg ${turn.speaker === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
            <p className="font-bold text-sm mb-1">{turn.speaker === 'user' ? 'Bạn' : 'AI'}</p>
            <p>{turn.text}</p>
          </div>
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};
