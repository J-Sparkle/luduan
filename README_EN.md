<p align="right">
  <a href="README.md">简体中文</a> · <b>English</b>
</p>

<h1 align="center">Luduan 甪端</h1>

<p align="center">
  <i>"Travels eighteen thousand li a day, and understands the languages of all four directions." — Book of Song</i>
</p>

<p align="center">
  Open-source · Free · Privacy-first AI inline translator browser extension
</p>

<p align="center">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-7C5CFF.svg"></a>
  <img alt="Manifest" src="https://img.shields.io/badge/manifest-V3-5B8DEF.svg">
  <img alt="Built with Vite" src="https://img.shields.io/badge/vite-5-646CFF.svg">
  <img alt="TypeScript" src="https://img.shields.io/badge/typescript-strict-3178C6.svg">
</p>

---

**Luduan (甪端)** is a mythical Chinese beast said to travel eighteen thousand *li* a day and understand all the languages of the four directions. This extension carries the same spirit — letting you read any webpage in any language with a single text selection.

## ✨ Features

- 🌐 **Select-to-translate** — Select any text on a webpage; a bubble pops up; click it to open an AI translation card
- 🤖 **Bring any model** — Built-in templates for OpenAI / Claude / Gemini / DeepSeek / Kimi / GLM / Groq / OpenRouter / Ollama (10+ providers); custom Base URL supports OpenAI / Anthropic / Gemini protocols
- 🔑 **BYOK (Bring Your Own Key)** — No cloud relay. Requests go directly from your browser to your chosen provider. Keys are stored locally (currently as plaintext in `chrome.storage.local`; AES-GCM encryption is on the roadmap)
- 💡 **Multiple translation styles** — Literal / Natural / Academic / Casual, switch on the fly
- 🎨 **Beautiful UI** — Monica-inspired glass cards with violet/blue gradient
- 🔒 **Zero compromise on privacy** — No telemetry, no account, no backend, fully auditable
- 🌏 **MIT licensed** — Contributions welcome

## 🚀 Quick Start

### Install

> The extension is not yet on the Chrome Web Store. Install via developer mode for now:

```bash
git clone https://github.com/J-Sparkle/luduan.git
cd luduan
pnpm install
pnpm build
```

1. Open `chrome://extensions/`
2. Toggle **Developer mode** on (top right)
3. Click **Load unpacked** and select the `luduan/dist` directory

### Configure an AI model

The options page opens automatically on first install. Three zero-cost ways to get started:

| Provider | Get API Key | Why |
|----------|-------------|-----|
| **Google Gemini** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | 15 free requests / minute |
| **Zhipu GLM-4-Flash** | [open.bigmodel.cn](https://open.bigmodel.cn/usercenter/apikeys) | Completely free |
| **Ollama (local)** | [ollama.com](https://ollama.com) | Offline, no key needed |

What happens after you configure:

1. Pick a provider (or a custom protocol) on the options page
2. Paste your API key and confirm the model name
3. Click **🔌 Test connection** — on success the provider is **auto-enabled** and the model's reply is displayed
4. A green **"✅ Ready"** banner appears at the top; click **Close settings** to dismiss the tab
5. Select text on any page and click the bubble to translate

Settings are saved **in real time** — no need to restart the browser or reload the extension.

### Development

```bash
pnpm dev        # Start Vite + HMR
pnpm test       # Run unit tests
pnpm typecheck  # Type-check the codebase
pnpm build      # Produce production dist/
```

After `pnpm dev`, load the `dist/` folder in Chrome to get hot reload.

## 🏗 Architecture

```
content script (Shadow DOM) ─┐
   ↓ chrome.runtime.connect()  ├─→ background SW ─→ Provider Adapter ─→ AI API
options page ────────────────┘                          ├─ openai
popup ───────────────────────                          ├─ anthropic
                                                       └─ gemini
                              chrome.storage.local
                              ├─ providers (with API Key)
                              ├─ history
                              └─ wordbook
```

See [docs/architecture.md](docs/architecture.md) for details.

## 🔌 Adding a new Provider

If the provider speaks OpenAI's protocol, just add a preset in `src/shared/providers/presets.ts` — PRs welcome. For a brand-new protocol, implement the `ProviderAdapter` interface; see [docs/adding-provider.md](docs/adding-provider.md).

## 🗺 Roadmap

The following are planned and welcome contributions:

- 🔐 **AES-GCM encryption for API keys** — currently plaintext; goal is device-derived key + encryption at rest
- 📚 **Related reading suggestions** — Wikipedia / arXiv / SearXNG hits triggered by selected text
- 📖 **Wordbook + Anki export** — save translations and export for review
- 🌐 **Full-page translation** — toolbar one-click, side-by-side / replace modes
- 📑 **PDF selection support**
- 🧠 **Per-task model routing** — fast/cheap models for translation, reasoning models for deep analysis
- 🌏 **More UI languages** — Chinese & English only today

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

Easiest entry points:
- ✅ Add a new AI provider preset (a single TS file)
- ✅ Translate UI strings to a new language
- ✅ Improve prompt templates
- ✅ Bug fixes

## 🔐 Privacy

Luduan's privacy model is simple: **there is no backend**.

- All AI requests go directly from your browser to the provider you configured
- API keys are currently stored as **plaintext** in `chrome.storage.local` (v0.x); AES-GCM encryption is on the [roadmap](#-roadmap)
- Translation history and wordbook are stored locally
- Zero telemetry, zero analytics

See [SECURITY.md](SECURITY.md).

## 📜 License

[MIT](LICENSE) © Luduan Contributors

## 🙏 Credits

- Inspired by [Monica](https://monica.im) and [Immersive Translate](https://immersivetranslate.com)
- The mythical beast comes from the [Book of Song · Treatise on Auspicious Signs](https://en.wikipedia.org/wiki/Book_of_Song) and the bronze Luduan statues in front of the Hall of Supreme Harmony at the Forbidden City
