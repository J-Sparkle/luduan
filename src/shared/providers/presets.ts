import type { ProtocolId } from './types';

export interface ProviderPreset {
  key: string;
  name: string;
  protocol: ProtocolId;
  baseUrl: string;
  docsUrl?: string;
  signupUrl?: string;
  /** Suggested default models — users can edit freely */
  suggestedModels: string[];
  /** Free-tier hint shown in onboarding */
  freeTier?: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    key: 'openai',
    name: 'OpenAI',
    protocol: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    docsUrl: 'https://platform.openai.com/docs',
    signupUrl: 'https://platform.openai.com/api-keys',
    suggestedModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini'],
  },
  {
    key: 'anthropic',
    name: 'Claude (Anthropic)',
    protocol: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    docsUrl: 'https://docs.anthropic.com',
    signupUrl: 'https://console.anthropic.com/settings/keys',
    suggestedModels: [
      'claude-opus-4-7',
      'claude-sonnet-4-6',
      'claude-haiku-4-5-20251001',
    ],
  },
  {
    key: 'gemini',
    name: 'Google Gemini',
    protocol: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    docsUrl: 'https://ai.google.dev/gemini-api/docs',
    signupUrl: 'https://aistudio.google.com/apikey',
    freeTier: '每分钟 15 次免费请求',
    suggestedModels: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
  },
  {
    key: 'deepseek',
    name: 'DeepSeek',
    protocol: 'openai',
    baseUrl: 'https://api.deepseek.com/v1',
    docsUrl: 'https://api-docs.deepseek.com',
    signupUrl: 'https://platform.deepseek.com/api_keys',
    freeTier: '低至 ¥1/百万 token',
    suggestedModels: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    key: 'moonshot',
    name: 'Kimi (Moonshot)',
    protocol: 'openai',
    baseUrl: 'https://api.moonshot.cn/v1',
    docsUrl: 'https://platform.moonshot.cn/docs',
    signupUrl: 'https://platform.moonshot.cn/console/api-keys',
    suggestedModels: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  },
  {
    key: 'zhipu',
    name: '智谱 GLM',
    protocol: 'openai',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    docsUrl: 'https://open.bigmodel.cn/dev/api',
    signupUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    freeTier: 'GLM-4-Flash 免费',
    suggestedModels: ['glm-4-plus', 'glm-4-flash'],
  },
  {
    key: 'siliconflow',
    name: 'SiliconFlow',
    protocol: 'openai',
    baseUrl: 'https://api.siliconflow.cn/v1',
    docsUrl: 'https://docs.siliconflow.cn',
    signupUrl: 'https://cloud.siliconflow.cn/account/ak',
    suggestedModels: ['deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-72B-Instruct'],
  },
  {
    key: 'groq',
    name: 'Groq',
    protocol: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1',
    docsUrl: 'https://console.groq.com/docs',
    signupUrl: 'https://console.groq.com/keys',
    freeTier: '免费快速推理',
    suggestedModels: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
  },
  {
    key: 'openrouter',
    name: 'OpenRouter',
    protocol: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    docsUrl: 'https://openrouter.ai/docs',
    signupUrl: 'https://openrouter.ai/keys',
    suggestedModels: [
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'google/gemini-2.0-flash-exp:free',
    ],
  },
  {
    key: 'ollama',
    name: 'Ollama (本地)',
    protocol: 'openai',
    baseUrl: 'http://localhost:11434/v1',
    docsUrl: 'https://github.com/ollama/ollama',
    suggestedModels: ['llama3.2', 'qwen2.5', 'mistral'],
  },
  {
    key: 'custom',
    name: '自定义 / 其他',
    protocol: 'openai',
    baseUrl: '',
    suggestedModels: [],
  },
];

export function findPreset(key: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((p) => p.key === key);
}
