export type Role = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  /** AbortSignal forwarded to fetch */
  signal?: AbortSignal;
}

export type StreamChunk =
  | { type: 'text'; delta: string }
  | { type: 'usage'; usage: TokenUsage }
  | { type: 'done'; finishReason?: string }
  | { type: 'error'; code: ErrorCode; message: string };

export interface TokenUsage {
  prompt: number;
  completion: number;
}

export enum ErrorCode {
  INVALID_API_KEY = 'invalid_api_key',
  RATE_LIMIT = 'rate_limit',
  QUOTA_EXCEEDED = 'quota_exceeded',
  CONTEXT_TOO_LONG = 'context_too_long',
  MODEL_NOT_FOUND = 'model_not_found',
  NETWORK = 'network',
  ABORTED = 'aborted',
  UNKNOWN = 'unknown',
}

export type ProtocolId = 'openai' | 'anthropic' | 'gemini' | 'azure' | 'custom';

/**
 * How the API key is sent.
 *  - 'native'   — protocol's official scheme:
 *                   openai     → Authorization: Bearer
 *                   anthropic  → x-api-key
 *                   gemini     → ?key= query param
 *  - 'bearer'   — Authorization: Bearer (useful for gateways that proxy
 *                 Anthropic/Gemini bodies but accept OpenAI-style auth).
 */
export type AuthStyle = 'native' | 'bearer';

export interface ProviderConfig {
  id: string;
  name: string;
  protocol: ProtocolId;
  baseUrl: string;
  apiKey: string;
  authStyle?: AuthStyle;
  /** Extra headers merged into every request */
  extraHeaders?: Record<string, string>;
  /** Azure-specific: api-version query param */
  apiVersion?: string;
}

export interface BuiltRequest {
  url: string;
  method: 'POST';
  headers: Record<string, string>;
  body: string;
}

export interface ProviderAdapter {
  readonly id: ProtocolId;
  /** Build the HTTP request — pure function, no side effects */
  buildRequest(req: ChatRequest, cfg: ProviderConfig): BuiltRequest;
  /** Consume the HTTP response body stream and yield normalized chunks */
  parseStream(stream: ReadableStream<Uint8Array>): AsyncIterable<StreamChunk>;
  /** Map provider error response → normalized ErrorCode */
  mapError(status: number, body: string): { code: ErrorCode; message: string };
  /** Optional: fetch the model list from the provider */
  listModels?(cfg: ProviderConfig): Promise<string[]>;
}
