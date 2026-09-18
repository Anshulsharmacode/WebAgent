export type ModelOption = {
  value: string;
  label: string;
  provider?: string;
};

export const AI_MODELS: ModelOption[] = [
  { value: 'gemini-2.5-flash', label: 'Google Gemini 2.5 Flash', provider: 'Google' },
  { value: 'gemini-1.5-pro', label: 'Google Gemini 1.5 Pro', provider: 'Google' },
  { value: 'gpt-4o', label: 'OpenAI GPT-4o', provider: 'OpenAI' },
  { value: 'gpt-4o-mini', label: 'OpenAI GPT-4o Mini', provider: 'OpenAI' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Anthropic Claude 3.5 Sonnet', provider: 'Anthropic' },
  { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat (V3)', provider: 'DeepSeek' },
  { value: 'groq/llama-3.3-70b-versatile', label: 'Groq Llama 3.3 70B', provider: 'Groq' },
];

export const DEFAULT_MODEL = 'gemini-2.5-flash';

export const PROJECT_TYPES = [
  { value: 'react', label: 'React (Vite)' },
  { value: 'classic_html', label: 'Classic HTML' },
] as const;
