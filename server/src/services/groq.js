import OpenAI from 'openai';

export const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';

export function getGroqModel() {
  return process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
}

export function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('AI is not configured. Add GROQ_API_KEY to .env.');
  }
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1'
  });
}

export function isGroqConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}
