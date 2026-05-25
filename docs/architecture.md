# 架构

## 全景图

```
┌─────────────── 浏览器 ───────────────┐
│                                        │
│  Web 页面 (任意 URL)                   │
│  ┌──────────────────────────────┐    │
│  │  Content Script (隔离世界)    │    │
│  │   ├─ 监听 mouseup → 选区     │    │
│  │   └─ Shadow DOM 渲染:        │    │
│  │      ├─ Bubble 气泡          │    │
│  │      └─ Card 翻译卡片         │    │
│  └────────┬─────────────────────┘    │
│           │ chrome.runtime.connect   │
│           ▼                            │
│  ┌──────────────────────────────┐    │
│  │  Background Service Worker   │    │
│  │   ├─ Port 路由 (luduan/chat) │    │
│  │   ├─ Provider 路由            │    │
│  │   └─ Adapter dispatch         │    │
│  └────────┬─────────────────────┘    │
│           │ fetch(直连)              │
└───────────┼──────────────────────────┘
            ▼
   AI 厂商 API (OpenAI / Claude / Gemini / DeepSeek / ...)
```

## 关键模块

### `src/shared/providers/`

抽象 `ProviderAdapter` 接口 + 三个内置实现 + SSE 解析。

| 文件 | 职责 |
|------|------|
| `types.ts` | `ProviderAdapter` / `ChatRequest` / `StreamChunk` / `ErrorCode` |
| `sse.ts` | `sseLines` (OpenAI/Gemini) + `sseEvents` (Anthropic) + 跨 chunk 缓冲 |
| `adapters/openai.ts` | OpenAI 协议，覆盖 DeepSeek/Moonshot/GLM 等 |
| `adapters/anthropic.ts` | Anthropic Messages API |
| `adapters/gemini.ts` | Gemini streamGenerateContent |
| `presets.ts` | 内置厂商模板（key/baseUrl/默认模型） |

每个 Adapter 三个核心方法：
- `buildRequest(req, cfg)` — 纯函数，构造 HTTP 请求
- `parseStream(stream)` — 流式响应 → 归一化 `StreamChunk`
- `mapError(status, body)` — HTTP 错误 → `ErrorCode`

### `src/shared/messaging/protocol.ts`

Background 端的 Port 处理器。Content 端用 `chrome.runtime.connect({ name: 'luduan/chat' })` 连接后发送 `ChatPortRequest`，background 流式回传 `ChatPortMessage`。

### `src/shared/store/providers.ts`

`chrome.storage.local` 上的轻量 KV 包装，存 `StoredProvider[]`。Key 字段未来会用 AES-GCM 加密（见 SECURITY.md）。

### `src/content/`

Shadow DOM 隔离的划词 UI：

- `mount.tsx` — 创建 host + shadowRoot + 注入 Tailwind CSS（`?inline`）
- `useSelection.ts` — `mouseup` 监听 + rAF debounce + 视口 rect
- `Bubble.tsx` — 32px 圆形气泡，定位在选区右上
- `Card.tsx` — 380px 翻译卡片，语言切换 / 流式渲染 / 朗读 / 复制 / 风格 / 模型徽标
- `useTranslateStream.ts` — 封装 Port 生命周期，把 chunks 累积成 React 状态

## 数据流（翻译一次）

```
mouseup
  → useSelection 计算 rect → setAnchor
  → ContentApp 渲染 Bubble
  → 用户点击 Bubble
  → setCard(anchor) → 渲染 Card
  → useTranslateStream 触发：
      chrome.runtime.connect('luduan/chat')
      port.postMessage({type:'translate', task})
  → background.handleChatPort:
      loadProviders → 选择 enabled provider
      getAdapter(protocol).buildRequest(...)
      fetch(...) → adapter.parseStream(resp.body)
      for chunk in stream:
        port.postMessage(chunk)
  → content useTranslateStream 累积 text
  → Card 流式渲染
```

## 设计原则

1. **Adapter 内无副作用** — buildRequest 是纯函数，便于测试和未来引入"中转代理"
2. **流式归一化** — 所有 provider 经过 `parseStream` 后输出统一 `StreamChunk`，UI 不感知 provider
3. **Shadow DOM 隔离** — 防止页面 CSS 污染翻译卡片；防止页面 JS 嗅探 React 状态
4. **No backend** — 所有逻辑跑在浏览器；BYOK 直连
5. **错误归一化** — `ErrorCode` 枚举 + 友好 message，便于 i18n
