<p align="right">
  <b>简体中文</b> · <a href="README_EN.md">English</a>
</p>

<h1 align="center">甪端 Luduan</h1>

<p align="center">
  <i>「日行一万八千里，晓四夷之语。」 ——《宋书·符瑞志》</i>
</p>

<p align="center">
  开源 · 免费 · 隐私优先的 AI 划词翻译浏览器插件
</p>

<p align="center">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-7C5CFF.svg"></a>
  <img alt="Manifest" src="https://img.shields.io/badge/manifest-V3-5B8DEF.svg">
  <img alt="Built with Vite" src="https://img.shields.io/badge/vite-5-646CFF.svg">
  <img alt="TypeScript" src="https://img.shields.io/badge/typescript-strict-3178C6.svg">
</p>

---

**甪端**是上古神兽，能"日行一万八千里、晓四夷之语"。这款插件以此为名，希望让你在浏览任何语言的网页时都能一望即解。

## ✨ 特性

- 🌐 **划词即译** — 选中任意文本，气泡按钮即刻出现，点击展开 AI 翻译卡片
- 🤖 **自由切换模型** — 内置 OpenAI / Claude / Gemini / DeepSeek / Kimi / 智谱 / Groq / OpenRouter / Ollama 等 10+ 厂商模板；自定义 Base URL 支持 OpenAI / Anthropic / Gemini 三种协议
- 🔑 **BYOK（自带 Key）** — 没有云端转发，请求直连模型厂商，Key 仅存于本地浏览器（当前明文存于 `chrome.storage.local`，AES-GCM 加密在路线图中）
- 💡 **多翻译风格** — 直译 / 意译 / 学术 / 口语，一键切换
- 🎨 **沉浸式 UI** — Monica 风格的卡片设计，毛玻璃 + 紫蓝渐变
- 🔒 **隐私零妥协** — 无遥测、无账号、无后端，源码可审计
- 🌏 **开源 MIT** — 欢迎贡献新 Provider、新语言、新功能

## 🚀 快速开始

### 安装

> 插件尚未上架，目前请通过开发者模式安装：

```bash
git clone https://github.com/J-Sparkle/luduan.git
cd luduan
pnpm install
pnpm build
```

1. 打开 `chrome://extensions/`
2. 开启右上角"开发者模式"
3. 点击"加载已解压的扩展程序"，选择 `luduan/dist` 目录

### 配置 AI 模型

首次安装会自动打开设置页。推荐三种 0 成本起步方式：

| Provider | 申请 | 优势 |
|---------|------|------|
| **Google Gemini** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | 每分钟 15 次免费 |
| **智谱 GLM-4-Flash** | [open.bigmodel.cn](https://open.bigmodel.cn/usercenter/apikeys) | 完全免费 |
| **Ollama 本地** | [ollama.com](https://ollama.com) | 离线，无需 Key |

配置完成后的流程：

1. 在设置页选择一个 Provider（或自定义协议）
2. 粘贴 API Key、确认模型名
3. 点击 **🔌 测试连接** — 通过后会**自动启用**该 Provider 并显示模型回复
4. 顶部出现绿色 **「✅ 已就绪」** 横幅，点击 **「关闭设置页」** 即可
5. 到任意网页选中文本，点击气泡按钮翻译

设置改动**实时保存**，无需重启浏览器或重新加载插件。

### 开发

```bash
pnpm dev        # 启动 Vite + HMR
pnpm test       # 运行单元测试
pnpm typecheck  # 类型检查
pnpm build      # 生成生产 dist/
```

`pnpm dev` 启动后，在 Chrome 加载 `dist/` 目录即可热更新。

## 🏗 架构

```
content script (Shadow DOM) ─┐
   ↓ chrome.runtime.connect()  ├─→ background SW ─→ Provider Adapter ─→ AI API
options page ────────────────┘                          ├─ openai
popup ───────────────────────                          ├─ anthropic
                                                       └─ gemini
                              chrome.storage.local
                              ├─ providers (含 API Key)
                              ├─ history
                              └─ wordbook
```

详细架构见 [docs/architecture.md](docs/architecture.md)。

## 🔌 添加新 Provider

新厂商如果支持 OpenAI 协议，只需在 `src/shared/providers/presets.ts` 加一项 preset 即可，欢迎 PR。如果是新协议，按 `ProviderAdapter` 接口实现一个 adapter 即可，详见 [docs/adding-provider.md](docs/adding-provider.md)。

## 🗺 路线图

下面这些功能在设计文档中已规划，欢迎贡献：

- 🔐 **API Key AES-GCM 加密** — 当前明文存储，目标改为设备密钥派生 + 加密落地
- 📚 **延伸阅读推荐** — 选中内容触发 Wikipedia / arXiv / SearXNG 等来源的相关阅读
- 📖 **生词本 + Anki 导出** — 收藏译文并导出复习
- 🌐 **整页翻译** — 工具栏一键，对照 / 替换两种模式
- 📑 **PDF 划词支持**
- 🧠 **按任务分配模型** — 翻译用快/便宜的，深度解析用强推理模型
- 🌏 **更多 UI 语言** — 当前仅中英

## 🤝 贡献

欢迎贡献！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 和 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

最容易上手的贡献方向：
- ✅ 添加新 AI 厂商 preset
- ✅ 翻译 UI 文案到新语言
- ✅ 改进 Prompt 模板
- ✅ Bug 修复

## 🔐 隐私

甪端的隐私模型很简单：**没有后端**。

- 所有 AI 请求从你的浏览器直接发往你配置的厂商
- API Key 当前**明文存于** `chrome.storage.local`（v0.x），AES-GCM 加密层在 [路线图](#-路线图) 中
- 翻译历史、生词本全部本地存储
- 零遥测、零分析

详见 [SECURITY.md](SECURITY.md)。

## 📜 许可证

[MIT](LICENSE) © Luduan Contributors

## 🙏 致谢

- 灵感来自 [Monica](https://monica.im)、[Immersive Translate](https://immersivetranslate.com)
- 神兽形象出自 [《宋书·符瑞志》](https://zh.wikisource.org/wiki/宋書/卷29) 与故宫太和殿前的甪端铜像
