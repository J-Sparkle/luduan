# 贡献指南 · Contributing

感谢你愿意为甪端贡献代码！本文档帮你快速上手开发流程。

## 开发环境

- Node.js ≥ 18
- pnpm ≥ 9
- Chrome ≥ 120（用于加载未打包扩展）

```bash
git clone https://github.com/J-Sparkle/luduan.git
cd luduan
pnpm install
pnpm dev
```

`pnpm dev` 会启动 Vite + HMR；同时构建产物输出到 `dist/`。

**首次加载到 Chrome：**
1. `chrome://extensions/`
2. 开启右上角"开发者模式"
3. 加载已解压扩展程序 → 选 `dist/`

后续改动会自动热更新；如果改了 `manifest.ts` 或 background，需要手动点扩展卡片的刷新按钮。

## 提交规范

我们使用 **Conventional Commits**：

```
feat:     新功能
fix:      Bug 修复
docs:     文档变更
style:    代码格式
refactor: 重构（不改变功能）
test:     测试相关
chore:    构建/工具链
```

Scope 推荐：`adapter`, `content`, `popup`, `options`, `store`, `prompts`, `i18n`, `docs`。

示例：`feat(adapter): add Mistral provider preset`

## PR 流程

1. Fork → 新分支（`feat/xxx` 或 `fix/xxx`）
2. 写代码 + 单测 + 文档
3. `pnpm test && pnpm typecheck && pnpm build` 全绿
4. 提 PR 到 `main`，描述里说明动机和测试方式
5. 等 CI 通过 + 至少一位维护者 review

## 最容易上手的贡献方向

### 1. 添加新 AI 厂商 preset

如果厂商支持 OpenAI 协议，加一行到 `src/shared/providers/presets.ts`：

```ts
{
  key: 'mistral',
  name: 'Mistral',
  protocol: 'openai',
  baseUrl: 'https://api.mistral.ai/v1',
  signupUrl: 'https://console.mistral.ai/api-keys/',
  suggestedModels: ['mistral-large-latest', 'codestral-latest'],
}
```

不支持 OpenAI 协议的，新增一个 adapter，参考 `src/shared/providers/adapters/anthropic.ts`。

### 2. 翻译 UI 文案

`public/_locales/` 下新增语言目录，复制 `zh_CN/messages.json` 翻译即可。

### 3. 改进 Prompt

`src/shared/prompts.ts`。请附上对比测试案例。

## 代码风格

- TypeScript strict
- 函数命名 camelCase，类型/组件 PascalCase
- 单测放在 `__tests__/` 子目录，文件名 `*.test.ts`
- 避免引入新依赖；如必要，请在 PR 描述里说明理由

## Issue 类型

- **Bug**：使用 bug_report 模板，附复现步骤
- **新功能**：使用 feature_request 模板，先讨论再开 PR
- **新厂商**：使用 provider_request 模板，可以由你或他人实现

## 行为准则

参与本项目即代表你同意 [Code of Conduct](CODE_OF_CONDUCT.md)。

---

有任何疑问，欢迎在 Discussions 里发起讨论。
