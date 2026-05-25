# 添加新的 AI Provider

甪端通过 **Provider Adapter** 模式适配不同厂商的 API 协议。新增厂商有两种情况：

## 场景 A：厂商支持 OpenAI 协议（最常见）

只需要在 `src/shared/providers/presets.ts` 增加一项 preset：

```ts
{
  key: 'mistral',                                      // 唯一标识
  name: 'Mistral',                                     // 显示名
  protocol: 'openai',                                  // 复用 openai adapter
  baseUrl: 'https://api.mistral.ai/v1',
  docsUrl: 'https://docs.mistral.ai',
  signupUrl: 'https://console.mistral.ai/api-keys/',
  freeTier: '可选：免费额度说明',
  suggestedModels: [
    'mistral-large-latest',
    'codestral-latest',
  ],
}
```

**怎么判断厂商兼容 OpenAI 协议？** 看官方文档是否提供 `/v1/chat/completions` 端点，请求/响应字段是 `messages[]` / `choices[].delta.content`。绝大多数国产厂商和开源推理框架（vLLM/Ollama/LM Studio）都兼容。

提交 PR 时请附带：
- ✅ Provider 官方 API 文档链接
- ✅ 你已亲测能跑通的截图
- ✅ 至少一个模型 ID

## 场景 B：厂商使用全新协议

在 `src/shared/providers/adapters/` 新增一个 adapter：

```ts
// src/shared/providers/adapters/yourprotocol.ts
import type { ProviderAdapter } from '../types';
import { ErrorCode } from '../types';

export const yourProtocolAdapter: ProviderAdapter = {
  id: 'yourprotocol',

  buildRequest(req, cfg) {
    return {
      url: `${cfg.baseUrl}/your-endpoint`,
      method: 'POST',
      headers: { /* ... */ },
      body: JSON.stringify({ /* ... */ }),
    };
  },

  async *parseStream(stream) {
    // 选用合适的解析器：
    //   sseLines  — 标准 SSE，每行 data: ...
    //   sseEvents — 带 event: 类型的 SSE
    //   readLines — 自己处理 NDJSON / JSON Array
    for await (const payload of sseLines(stream)) {
      // 解析为 StreamChunk
      yield { type: 'text', delta: '...' };
    }
    yield { type: 'done' };
  },

  mapError(status, body) {
    // 把厂商错误响应映射到 ErrorCode 枚举
    return { code: ErrorCode.UNKNOWN, message: body.slice(0, 200) };
  },
};
```

然后：

1. 在 `types.ts` 的 `ProtocolId` 加上新协议名
2. 在 `adapters/index.ts` 的 registry 注册
3. 在 `presets.ts` 加 preset
4. 在 `__tests__/yourprotocol.test.ts` 加单测

## 单元测试

每个 adapter 至少覆盖：

- ✅ `buildRequest` 返回正确的 url/headers/body
- ✅ `parseStream` 能正确处理典型流式响应
- ✅ `parseStream` 能跨 chunk 边界缓冲（用 `streamFromChunks`）
- ✅ `mapError` 能识别常见错误（401/429/404/context too long）

参考 `__tests__/openai.test.ts`。

## Checklist

PR 提交前请确认：

- [ ] preset / adapter 代码完成
- [ ] 单测全绿（`pnpm test`）
- [ ] 类型检查通过（`pnpm typecheck`）
- [ ] 在 Chrome 中亲测能跑通
- [ ] README 的 "支持的 Provider" 列表已更新（如果有）
- [ ] CHANGELOG.md 加一行
