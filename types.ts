
export enum Difficulty {
  Beginner = 'Sơ cấp',
  Intermediate = 'Trung cấp',
  Advanced = 'Cao cấp',
}

export enum Topic {
  Greetings = 'Chào hỏi',
  Restaurant = 'Nhà hàng',
  Shopping = 'Mua sắm',
  Travel = 'Du lịch',
  Weather = 'Thời tiết',
  Work = 'Công việc',
}

export interface ConversationTurn {
  speaker: 'user' | 'model';
  text: string;
}

export interface PronunciationScore {
  score: number;
  feedback: string;
}
