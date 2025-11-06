
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface TranscriptEntry {
  id: number;
  userInput: string;
  modelOutput: string;
}
