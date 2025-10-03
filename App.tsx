
import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Type } from '@google/genai';
import { Difficulty, Topic, ConversationTurn, PronunciationScore } from './types';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { Transcript } from './components/Transcript';
import { Score } from './components/Score';

// Helper: Decode base64 audio data to a format AudioContext can use
async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000); // Mono, 24kHz sample rate for model output
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

// Helper: Decode base64 string to Uint8Array
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const App: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Beginner);
  const [topic, setTopic] = useState<Topic>(Topic.Greetings);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Nhấn để bắt đầu');
  const [transcript, setTranscript] = useState<ConversationTurn[]>([]);
  const [scoreData, setScoreData] = useState<PronunciationScore | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(false);

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  const nextAudioStartTimeRef = useRef(0);
  const audioPlaybackQueueRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const aiRef = useRef<GoogleGenAI | null>(null);
  if (!aiRef.current) {
    if (!process.env.API_KEY) {
      alert("API key not found. Please set the API_KEY environment variable.");
    }
    aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  }
  const ai = aiRef.current;

  const evaluatePronunciation = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsLoadingScore(true);
    setScoreData(null);
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Với vai trò là một giáo viên dạy phát âm tiếng Trung, hãy đánh giá phiên âm Pinyin sau: "${text}". Chấm điểm trên thang 100 và đưa ra một nhận xét ngắn gọn, mang tính xây dựng bằng tiếng Việt về cách cải thiện.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER, description: 'Điểm phát âm từ 1 đến 100.' },
              feedback: { type: Type.STRING, description: 'Nhận xét bằng tiếng Việt.' }
            }
          }
        }
      });
      const result = JSON.parse(response.text);
      setScoreData(result as PronunciationScore);
    } catch (error) {
      console.error('Error evaluating pronunciation:', error);
      setScoreData({ score: 0, feedback: 'Không thể chấm điểm. Vui lòng thử lại.' });
    } finally {
      setIsLoadingScore(false);
    }
  }, [ai]);

  const handleStopSession = useCallback(() => {
    setStatusMessage('Đang dừng...');
    sessionPromiseRef.current?.then(session => session.close());
    
    microphoneStreamRef.current?.getTracks().forEach(track => track.stop());
    scriptProcessorRef.current?.disconnect();
    mediaStreamSourceRef.current?.disconnect();
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();

    audioPlaybackQueueRef.current.forEach(source => source.stop());
    audioPlaybackQueueRef.current.clear();
    
    setIsSessionActive(false);
    sessionPromiseRef.current = null;
    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    microphoneStreamRef.current = null;
    setStatusMessage('Nhấn để bắt đầu');
  }, []);

  const handleStartSession = useCallback(async () => {
    if (isSessionActive) return;

    setStatusMessage('Đang kết nối...');
    setIsSessionActive(true);
    setTranscript([]);
    setScoreData(null);
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';
    nextAudioStartTimeRef.current = 0;

    try {
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      microphoneStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `You are a Chinese conversation partner. The user is a ${difficulty} level learner. Converse with them about ${topic}. Keep your responses concise and appropriate for their level. Speak standard Mandarin.`,
        },
        callbacks: {
          onopen: () => {
              if(!inputAudioContextRef.current || !microphoneStreamRef.current) return;
              setStatusMessage('Đang lắng nghe...');
              mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(microphoneStreamRef.current);
              scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
              
              scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                  const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                  const l = inputData.length;
                  const int16 = new Int16Array(l);
                  for (let i = 0; i < l; i++) {
                      int16[i] = inputData[i] * 32768;
                  }
                  
                  let binary = '';
                  const len = int16.buffer.byteLength;
                  const bytes = new Uint8Array(int16.buffer);
                  for (let i = 0; i < len; i++) {
                      binary += String.fromCharCode(bytes[i]);
                  }
                  const data = btoa(binary);

                  sessionPromiseRef.current?.then((session) => {
                      session.sendRealtimeInput({ media: { data, mimeType: 'audio/pcm;rate=16000' } });
                  });
              };
              
              mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
              scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
            }
            if (message.serverContent?.inputTranscription) {
              currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.turnComplete) {
              const userInput = currentInputTranscriptionRef.current.trim();
              const modelOutput = currentOutputTranscriptionRef.current.trim();
              
              if (userInput) {
                setTranscript(prev => [...prev, { speaker: 'user', text: userInput }]);
                evaluatePronunciation(userInput);
              }
              if (modelOutput) {
                 setTranscript(prev => [...prev, { speaker: 'model', text: modelOutput }]);
              }
              
              currentInputTranscriptionRef.current = '';
              currentOutputTranscriptionRef.current = '';
            }
            
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              const audioBytes = decodeBase64(audioData);
              const audioBuffer = await decodeAudioData(audioBytes, outputAudioContextRef.current);
              
              const source = outputAudioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContextRef.current.destination);
              
              const currentTime = outputAudioContextRef.current.currentTime;
              const startTime = Math.max(currentTime, nextAudioStartTimeRef.current);
              source.start(startTime);
              
              nextAudioStartTimeRef.current = startTime + audioBuffer.duration;
              audioPlaybackQueueRef.current.add(source);
              source.onended = () => {
                audioPlaybackQueueRef.current.delete(source);
              }
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Session error:', e);
            setStatusMessage('Lỗi kết nối');
            handleStopSession();
          },
          onclose: () => {
            // This is called when the session is closed, either by us or the server
          },
        },
      });
    } catch (error) {
      console.error('Failed to start session:', error);
      setStatusMessage('Lỗi khi bắt đầu');
      setIsSessionActive(false);
    }
  }, [ai, difficulty, topic, isSessionActive, evaluatePronunciation, handleStopSession]);

  const handleStartStopClick = () => {
    if (isSessionActive) {
      handleStopSession();
    } else {
      handleStartSession();
    }
  };

  return (
    <div className="min-h-screen bg-slate-800 text-white font-sans flex flex-col items-center">
      <Header />
      <main className="flex flex-col items-center w-full p-4 md:p-6 flex-grow">
        <Controls
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          topic={topic}
          setTopic={setTopic}
          isSessionActive={isSessionActive}
          onStartStop={handleStartStopClick}
          statusMessage={statusMessage}
        />
        <Transcript transcript={transcript} />
        <Score scoreData={scoreData} isLoading={isLoadingScore} />
      </main>
      <footer className="text-center py-4 text-slate-500 text-sm">
        <p>Powered by Gemini API</p>
      </footer>
    </div>
  );
};

export default App;
