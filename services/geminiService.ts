import { GoogleGenAI, Chat } from "@google/genai";
import { MODELS, SYSTEM_INSTRUCTION } from '../constants';

export const createChatSession = (isThinkingMode: boolean): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = isThinkingMode ? MODELS.PRO : MODELS.FLASH;
  const config = isThinkingMode 
    ? { thinkingConfig: { thinkingBudget: 32768 } } 
    : {};
  
  return ai.chats.create({
    model,
    config: {
      ...config,
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });
};
