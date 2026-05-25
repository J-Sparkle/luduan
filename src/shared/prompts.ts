import type { ChatMessage } from './providers/types';

export interface TranslateTask {
  kind: 'translate';
  text: string;
  targetLang: string;
  style?: 'literal' | 'natural' | 'academic' | 'casual';
}

const STYLE_HINTS: Record<NonNullable<TranslateTask['style']>, string> = {
  literal: '保持直译，结构贴近原文。',
  natural: '采用自然意译，语序符合目标语言习惯。',
  academic: '使用学术语体，术语严谨。',
  casual: '使用口语化表达，自然流畅。',
};

export function buildPrompt(task: TranslateTask): ChatMessage[] {
  if (task.kind !== 'translate') throw new Error(`Unsupported task: ${(task as any).kind}`);
  const styleHint = task.style ? STYLE_HINTS[task.style] : STYLE_HINTS.natural;
  const system = [
    `你是一位精通多语言的翻译专家。`,
    `任务：将用户提供的文本翻译为${task.targetLang}。`,
    styleHint,
    `输出要求：`,
    `- 仅输出译文，不要任何解释、不要重复原文、不要使用 Markdown 包裹。`,
    `- 保留原文的换行结构。`,
    `- 如原文中含有专有名词、代码或公式，原样保留。`,
  ].join('\n');
  return [
    { role: 'system', content: system },
    { role: 'user', content: task.text },
  ];
}
